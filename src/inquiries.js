/**
 * Inquiry intake and admin dashboard.
 *
 * Security model
 * - Admin password lives in the `ADMIN_PASSWORD` Worker secret, never in code.
 * - Sessions are random 32-byte tokens; only their SHA-256 hash is stored, so a
 *   database leak does not hand over a usable session.
 * - The session cookie is HttpOnly + SameSite=Strict and signed with ADMIN_SECRET,
 *   so a forged expiry cannot be minted by editing the cookie.
 * - Login attempts are rate limited per client IP.
 */

const SESSION_COOKIE = 'zuohen_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_LOCK_MINUTES = 15;
const MAX_FIELD = 4000;

// ---------------------------------------------------------------- primitives

const encoder = new TextEncoder();

const toHex = buffer =>
  [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');

async function sha256Hex(value) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(String(value))));
}

/** Constant-time string comparison to avoid leaking a password via timing. */
function timingSafeEqual(a, b) {
  const left = encoder.encode(String(a));
  const right = encoder.encode(String(b));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=UTF-8', 'cache-control': 'no-store', ...headers },
  });

const html = (body, status = 200, headers = {}) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-store', ...headers },
  });

const clean = (value, max = MAX_FIELD) => String(value ?? '').trim().slice(0, max);

const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? '').trim());

/** Escape for HTML text/attribute contexts. */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    out[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return out;
}

/** Key used for rate limiting; a hash keeps raw IPs out of the database. */
async function clientKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  return sha256Hex(`zuohen-login:${ip}`);
}

// --------------------------------------------------------------- admin auth

async function sessionSignature(expiresAt, secret) {
  return sha256Hex(`${expiresAt}.${secret}`);
}

async function createSession(env) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  await env.NEWS_DB
    .prepare('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?1, ?2)')
    .bind(await sha256Hex(token), expiresAt)
    .run();
  const signature = await sessionSignature(expiresAt, env.ADMIN_SECRET || env.ADMIN_PASSWORD || '');
  return `${SESSION_COOKIE}=${token}.${expiresAt}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

/** Returns true when the request carries a valid, unexpired session. */
async function isAuthenticated(request, env) {
  if (!env.NEWS_DB) return false;
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return false;

  const [token, expiresAt, signature] = raw.split('.');
  if (!token || !expiresAt || !signature) return false;
  if (Number(expiresAt) * 1000 < Date.now()) return false;

  const expected = await sessionSignature(expiresAt, env.ADMIN_SECRET || env.ADMIN_PASSWORD || '');
  if (!timingSafeEqual(signature, expected)) return false;

  const row = await env.NEWS_DB
    .prepare('SELECT token_hash FROM admin_sessions WHERE token_hash = ?1 AND expires_at > ?2')
    .bind(await sha256Hex(token), String(Math.floor(Date.now() / 1000)))
    .first();
  return Boolean(row);
}

async function destroySession(request, env) {
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (raw && env.NEWS_DB) {
    const token = raw.split('.')[0];
    if (token) {
      await env.NEWS_DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?1').bind(await sha256Hex(token)).run();
    }
  }
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/** Simple per-IP login throttle backed by D1. */
async function loginThrottle(env, key) {
  const row = await env.NEWS_DB
    .prepare('SELECT attempts, locked_until FROM login_attempts WHERE ip_hash = ?1')
    .bind(key)
    .first();
  if (!row) return { locked: false, attempts: 0 };
  if (row.locked_until && new Date(`${row.locked_until}Z`).getTime() > Date.now()) {
    return { locked: true, attempts: row.attempts };
  }
  return { locked: false, attempts: row.attempts || 0 };
}

async function recordFailure(env, key) {
  await env.NEWS_DB
    .prepare(
      `INSERT INTO login_attempts (ip_hash, attempts, first_attempt_at, locked_until)
       VALUES (?1, 1, CURRENT_TIMESTAMP, NULL)
       ON CONFLICT(ip_hash) DO UPDATE SET
         attempts = attempts + 1,
         locked_until = CASE
           WHEN attempts + 1 >= ?2 THEN datetime('now', '+${LOGIN_LOCK_MINUTES} minutes')
           ELSE locked_until END`,
    )
    .bind(key, MAX_LOGIN_ATTEMPTS)
    .run();
}

async function clearFailures(env, key) {
  await env.NEWS_DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?1').bind(key).run();
}

// ------------------------------------------------------------------ styling

const ADMIN_STYLE = `
:root{--ink:#0b1113;--ink-2:#131b1e;--steel:#24343a;--lime:#c8f135;--lime-deep:#a9d418;
--teal:#0d6b60;--cream:#f2f5f4;--line:#dee5e3;--muted:#5d7075;--white:#fff}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
font-family:'DM Sans','Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--teal);text-decoration:none}
h1,h2,h3{font-family:'Space Grotesk','DM Sans',sans-serif;letter-spacing:-.03em;margin:0}
button{font:inherit;cursor:pointer}
.wrap{width:min(1240px,calc(100% - 40px));margin:auto}
.admin-bar{background:#101a1d;border-bottom:1px solid var(--steel);color:#fff;
position:sticky;top:0;z-index:10}
.admin-bar-inner{min-height:60px;display:flex;align-items:center;gap:18px}
.admin-brand{display:flex;align-items:center;gap:9px;font:700 16px 'Space Grotesk';letter-spacing:.05em;color:#fff}
.admin-brand i{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;
background:var(--lime);color:var(--ink);font-style:normal}
.admin-brand small{color:var(--lime);font-weight:400}
.admin-bar nav{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:13px;font-weight:600}
.admin-bar nav a{color:#c3d2d2}
.admin-bar nav a:hover,.admin-bar nav a.active{color:var(--lime)}
.login-shell{min-height:100vh;display:grid;place-items:center;padding:40px 20px;
background:linear-gradient(112deg,#0b1113,#15252a 55%,#0d1b20);position:relative;overflow:hidden}
.login-shell:before{content:'';position:absolute;inset:0;pointer-events:none;
background:radial-gradient(ellipse at 88% 12%,#c8f13520 0 20%,transparent 60%),
repeating-linear-gradient(90deg,#ffffff07 0 1px,transparent 1px 72px)}
.login-card{position:relative;width:min(400px,100%);background:#fff;border-radius:14px;
padding:38px 34px;box-shadow:0 28px 64px #0b11134d}
.login-card h1{font-size:27px;margin-bottom:8px}
.login-card p{color:var(--muted);font-size:13.5px;line-height:1.6;margin:0 0 24px}
.login-card label{display:block;font-size:11px;font-weight:700;letter-spacing:.09em;
color:var(--teal);text-transform:uppercase;margin-bottom:8px}
.login-card input{width:100%;border:1px solid #d5dee0;background:#f7f9f9;border-radius:8px;
padding:14px;outline:0;font-size:14px}
.login-card input:focus{border-color:var(--lime);background:#fff;box-shadow:0 0 0 3px #c8f13533}
.login-card button{width:100%;margin-top:18px;border:0;border-radius:8px;padding:15px;
background:var(--lime);color:var(--ink);font-weight:700;font-size:14px}
.login-card button:hover{background:var(--lime-deep)}
.alert{border-radius:8px;padding:12px 14px;font-size:13px;margin-bottom:18px;line-height:1.5}
.alert.error{background:#fdecea;border:1px solid #f5c6c0;color:#a3241a}
.alert.ok{background:#eaf7e6;border:1px solid #c3e3b9;color:#2c6b1f}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin:26px 0}
.stat{background:#fff;border:1px solid var(--line);border-radius:11px;padding:18px 20px}
.stat b{display:block;font:600 27px 'Space Grotesk';color:var(--ink)}
.stat span{font-size:10.5px;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;font-weight:700}
.stat.is-new b{color:var(--teal)}
.panel{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;margin-bottom:30px}
.panel-head{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;
justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.panel-head h2{font-size:19px}
.panel-head form{display:flex;gap:8px;flex-wrap:wrap}
.panel-head input,.panel-head select{border:1px solid var(--line);border-radius:7px;
padding:9px 12px;font-size:13px;outline:0;background:#fff}
.panel-head input:focus,.panel-head select:focus{border-color:var(--lime);box-shadow:0 0 0 3px #c8f1352e}
.btn{border:1px solid var(--line);background:#fff;border-radius:7px;padding:9px 14px;
font-size:12.5px;font-weight:700;color:var(--ink)}
.btn:hover{border-color:var(--ink)}
.btn.primary{background:var(--ink);border-color:var(--ink);color:var(--lime)}
.btn.primary:hover{background:var(--ink-2)}
.btn.link{border:0;background:none;color:var(--teal);padding:0;font-size:12.5px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:13px 14px;font-size:13px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:#f7f9f8;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;
color:var(--muted);font-weight:700;white-space:nowrap}
tbody tr:hover{background:#fafcfb}
tbody tr:last-child td{border-bottom:0}
td.mono{font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap;font-size:12px}
.badge{display:inline-block;border-radius:5px;padding:4px 9px;font-size:10.5px;font-weight:700;
letter-spacing:.04em;text-transform:uppercase}
.badge.New{background:#c8f13533;color:#5a7a00}
.badge.InProgress{background:#e4eefb;color:#1f4e8c}
.badge.Quoted{background:#eae4fb;color:#4b3392}
.badge.Won{background:#e2f6e6;color:#1f6b34}
.badge.Closed{background:#eceff0;color:#5d7075}
.msg{max-width:420px;color:var(--muted);line-height:1.55;white-space:pre-wrap;word-break:break-word}
.contact-line{display:block;color:var(--ink);font-weight:600}
.contact-line small{display:block;color:var(--muted);font-weight:400;font-size:11.5px;margin-top:2px}
.row-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px}
.row-actions select{border:1px solid var(--line);border-radius:6px;padding:6px 9px;font-size:12px}
.empty{padding:44px 22px;text-align:center;color:var(--muted);font-size:14px}
.pager{display:flex;gap:8px;align-items:center;justify-content:center;padding:18px;
border-top:1px solid var(--line);font-size:12.5px;color:var(--muted)}
.pager a,.pager span{padding:7px 12px;border:1px solid var(--line);border-radius:6px;font-weight:700}
.pager a:hover{border-color:var(--ink)}
.detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0}
.detail-grid div{padding:14px 16px;border-bottom:1px solid var(--line);border-right:1px solid var(--line)}
.detail-grid div:nth-child(2n){border-right:0}
.detail-grid b{display:block;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;
color:var(--muted);margin-bottom:5px}
.note-area{width:100%;border:1px solid var(--line);border-radius:8px;padding:12px;
font-size:13px;outline:0;resize:vertical;background:#fbfcfb}
.note-area:focus{border-color:var(--lime);background:#fff}
@media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}
.detail-grid{grid-template-columns:1fr}.detail-grid div{border-right:0}}
@media(max-width:640px){.stats{grid-template-columns:1fr}
.panel{overflow-x:auto}table{min-width:760px}}
`;

const adminShell = (title, active, body) => `<!doctype html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} | ZOHEN Admin</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap">
<style>${ADMIN_STYLE}</style></head><body>
<header class="admin-bar"><div class="wrap admin-bar-inner">
<a class="admin-brand" href="/admin"><i>⚡</i>ZOHEN<small>ADMIN</small></a>
<nav>
<a class="${active === 'inquiries' ? 'active' : ''}" href="/admin">Inquiries</a>
<a href="/" target="_blank" rel="noopener">View site ↗</a>
<form method="post" action="/admin/logout" style="margin:0">
<button class="btn link" type="submit" style="color:#c3d2d2">Sign out</button></form>
</nav></div></header>${body}</body></html>`;

// ------------------------------------------------------------------- views

const STATUSES = ['New', 'In progress', 'Quoted', 'Won', 'Closed'];
const statusClass = status => String(status || 'New').replace(/\s+/g, '');

function loginPage(message = '', kind = 'error') {
  const alert = message ? `<p class="alert ${kind}">${esc(message)}</p>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Admin sign in | ZOHEN</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap">
<style>${ADMIN_STYLE}</style></head><body>
<main class="login-shell"><form class="login-card" method="post" action="/admin/login">
<h1>Admin sign in</h1><p>Enter the administrator password to view submitted inquiries.</p>
${alert}
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Sign in</button>
</form></main></body></html>`;
}

function inquiriesPage({ rows, total, page, pageSize, status, query, counts }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const q = new URLSearchParams();
  if (status && status !== 'all') q.set('status', status);
  if (query) q.set('q', query);

  const statusOptions = ['all', ...STATUSES]
    .map(value => `<option value="${esc(value)}"${value === status ? ' selected' : ''}>${
      value === 'all' ? 'All statuses' : esc(value)}</option>`).join('');

  const body = rows.length
    ? rows.map(row => `<tr>
<td class="mono">#${row.id}<br>${esc(String(row.created_at || '').slice(0, 16))}</td>
<td><span class="contact-line">${esc(row.name)}
<small>${esc(row.company || 'No company')}${row.country ? ` · ${esc(row.country)}` : ''}</small></span></td>
<td><span class="contact-line"><a href="mailto:${esc(row.email)}">${esc(row.email)}</a>
<small>${row.phone ? esc(row.phone) : 'No phone'}</small></span></td>
<td><span class="tag" style="font-size:10.5px;color:var(--teal);font-weight:700">${esc(row.category || 'General')}</span>
<small style="display:block;color:var(--muted);font-size:11.5px;margin-top:3px">${
  esc([row.power, row.quantity, row.market].filter(Boolean).join(' · ') || 'No spec given')}</small></td>
<td><p class="msg">${esc(row.message || '—')}</p></td>
<td><span class="badge ${statusClass(row.status)}">${esc(row.status)}</span>
<form method="post" action="/admin/status" class="row-actions">
<input type="hidden" name="id" value="${row.id}">
<input type="hidden" name="return" value="${esc(`/admin?${q.toString()}`)}">
<select name="status">${STATUSES.map(s =>
  `<option${s === row.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>
<button class="btn" type="submit">Save</button></form></td>
</tr>`).join('')
    : '<tr><td colspan="6" class="empty">No inquiries match this filter yet.</td></tr>';

  const pager = pages > 1 ? `<div class="pager">
${page > 1 ? `<a href="/admin?${new URLSearchParams({ ...Object.fromEntries(q), page: String(page - 1) })}">← Prev</a>` : ''}
<span>Page ${page} of ${pages}</span>
${page < pages ? `<a href="/admin?${new URLSearchParams({ ...Object.fromEntries(q), page: String(page + 1) })}">Next →</a>` : ''}
</div>` : '';

  return adminShell('Inquiries', 'inquiries', `<main class="wrap" style="padding:26px 0 60px">
<h1 style="font-size:30px;margin-bottom:6px">Inquiries</h1>
<p style="color:var(--muted);font-size:14px;margin:0">Submissions from the public site inquiry forms.</p>
<section class="stats">
<div class="stat is-new"><b>${counts.total}</b><span>Total</span></div>
<div class="stat is-new"><b>${counts.New || 0}</b><span>New</span></div>
<div class="stat"><b>${counts['In progress'] || 0}</b><span>In progress</span></div>
<div class="stat"><b>${counts.Quoted || 0}</b><span>Quoted</span></div>
<div class="stat"><b>${counts.Won || 0}</b><span>Won</span></div>
</section>
<section class="panel"><div class="panel-head">
<h2>${total} ${total === 1 ? 'record' : 'records'}</h2>
<form method="get" action="/admin">
<input type="search" name="q" value="${esc(query)}" placeholder="Search name, email, company, message…">
<select name="status">${statusOptions}</select>
<button class="btn primary" type="submit">Filter</button>
<a class="btn" href="/admin/export.csv">Export CSV</a>
</form></div>
<table><thead><tr><th>Received</th><th>Contact</th><th>Email / Phone</th>
<th>Interest</th><th>Message</th><th>Status</th></tr></thead>
<tbody>${body}</tbody></table>${pager}</section></main>`);
}

// ------------------------------------------------------------------ routing

/** POST /api/inquiries — public endpoint used by every inquiry form. */
export async function handleInquirySubmit(request, env) {
  if (!env.NEWS_DB) return json({ ok: false, error: 'Inquiry storage is not configured.' }, 503);
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  let payload;
  const contentType = request.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      payload = Object.fromEntries(await request.formData());
    }
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Hidden honeypot: real users never fill this. Report success so bots do not retry.
  if (clean(payload._company_url)) return json({ ok: true, id: null });

  const name = clean(payload.name, 200);
  const email = clean(payload.email, 200);
  if (!name) return json({ ok: false, error: 'Please enter your name.' }, 400);
  if (!isEmail(email)) return json({ ok: false, error: 'Please enter a valid business email.' }, 400);

  const record = {
    name,
    email,
    company: clean(payload.company, 200),
    phone: clean(payload.phone, 60),
    country: clean(payload.country || payload.market, 120),
    category: clean(payload.category, 120),
    product: clean(payload.product, 300),
    power: clean(payload.power, 120),
    standard: clean(payload.standard, 120),
    quantity: clean(payload.quantity, 120),
    market: clean(payload.market, 120),
    message: clean(payload.message, 4000),
    source_path: clean(payload.source_path, 300),
    user_agent: clean(request.headers.get('User-Agent'), 300),
  };

  try {
    const result = await env.NEWS_DB.prepare(
      `INSERT INTO inquiries (name,email,company,phone,country,category,product,power,standard,quantity,market,message,source_path,user_agent)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)`,
    ).bind(
      record.name, record.email, record.company, record.phone, record.country, record.category,
      record.product, record.power, record.standard, record.quantity, record.market, record.message,
      record.source_path, record.user_agent,
    ).run();
    return json({ ok: true, id: result.meta?.last_row_id ?? null });
  } catch {
    return json({ ok: false, error: 'Could not save your inquiry. Please email us instead.' }, 500);
  }
}

/** Admin routes: /admin, /admin/login, /admin/logout, /admin/status, /admin/export.csv */
export async function handleAdmin(request, env, url) {
  if (!env.NEWS_DB) return html('<h1>Admin is not configured</h1>', 503);

  const path = url.pathname.replace(/\/+$/, '') || '/admin';

  if (path === '/admin/login') {
    if (request.method === 'GET') return html(loginPage());
    if (request.method !== 'POST') return html(loginPage('Method not allowed.'), 405);

    const form = await request.formData();
    const password = String(form.get('password') || '');
    const expected = env.ADMIN_PASSWORD;
    if (!expected) return html(loginPage('ADMIN_PASSWORD secret is not set on this Worker.'), 503);

    const key = await clientKey(request);
    const throttle = await loginThrottle(env, key);
    if (throttle.locked) {
      return html(loginPage(`Too many failed attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`), 429);
    }

    if (!timingSafeEqual(await sha256Hex(password), await sha256Hex(expected))) {
      await recordFailure(env, key);
      return html(loginPage('Incorrect password.'), 401);
    }

    await clearFailures(env, key);
    return html('', 303, { location: '/admin', 'set-cookie': await createSession(env) });
  }

  if (path === '/admin/logout') {
    return html('', 303, { location: '/admin/login', 'set-cookie': await destroySession(request, env) });
  }

  if (!(await isAuthenticated(request, env))) {
    return html('', 303, { location: '/admin/login' });
  }

  if (path === '/admin/status' && request.method === 'POST') {
    const form = await request.formData();
    const id = Number(form.get('id'));
    const status = clean(form.get('status'), 40);
    const back = clean(form.get('return'), 300);
    if (Number.isInteger(id) && STATUSES.includes(status)) {
      await env.NEWS_DB.prepare(
        'UPDATE inquiries SET status = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2',
      ).bind(status, id).run();
    }
    return html('', 303, { location: back.startsWith('/admin') ? back : '/admin' });
  }

  if (path === '/admin/export.csv') {
    const { results } = await env.NEWS_DB.prepare(
      'SELECT * FROM inquiries ORDER BY created_at DESC',
    ).all();
    const columns = ['id', 'created_at', 'name', 'email', 'company', 'phone', 'country', 'category',
      'product', 'power', 'standard', 'quantity', 'market', 'message', 'source_path', 'status'];
    const cell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [columns.join(','), ...results.map(row => columns.map(col => cell(row[col])).join(','))].join('\r\n');
    return new Response(`\ufeff${csv}`, {
      headers: {
        'content-type': 'text/csv; charset=UTF-8',
        'content-disposition': `attachment; filename="zohen-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
        'cache-control': 'no-store',
      },
    });
  }

  if (path === '/admin') {
    const status = clean(url.searchParams.get('status') || 'all', 40);
    const query = clean(url.searchParams.get('q') || '', 200);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = 25;

    const where = [];
    const binds = [];
    if (status !== 'all' && STATUSES.includes(status)) {
      where.push('status = ?');
      binds.push(status);
    }
    if (query) {
      where.push('(name LIKE ? OR email LIKE ? OR company LIKE ? OR message LIKE ? OR product LIKE ?)');
      const like = `%${query}%`;
      binds.push(like, like, like, like, like);
    }
    const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';

    const [listResult, countRow, statsResult] = await Promise.all([
      env.NEWS_DB.prepare(`SELECT * FROM inquiries${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .bind(...binds, pageSize, (page - 1) * pageSize).all(),
      env.NEWS_DB.prepare(`SELECT COUNT(*) AS total FROM inquiries${clause}`).bind(...binds).first(),
      env.NEWS_DB.prepare('SELECT status, COUNT(*) AS count FROM inquiries GROUP BY status').all(),
    ]);

    const counts = { total: 0 };
    for (const row of statsResult.results || []) {
      counts[row.status] = row.count;
      counts.total += row.count;
    }

    return html(inquiriesPage({
      rows: listResult.results || [],
      total: countRow?.total ?? 0,
      page, pageSize, status, query, counts,
    }));
  }

  return html('<h1>Not found</h1>', 404);
}

/** Drops expired sessions and stale throttle rows. Safe to run opportunistically. */
export async function cleanupExpired(env) {
  if (!env.NEWS_DB) return;
  const now = String(Math.floor(Date.now() / 1000));
  await env.NEWS_DB.batch([
    env.NEWS_DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?1').bind(now),
    env.NEWS_DB.prepare("DELETE FROM login_attempts WHERE locked_until IS NOT NULL AND locked_until < datetime('now','-1 day')").bind(),
  ]);
}
