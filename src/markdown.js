const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

export function renderMarkdown(markdown = '') {
  const lines = markdown.replace(/^---[\s\S]*?---\s*/u, '').split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = false;

  const inline = value => escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="nofollow">$1</a>');
  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) { html.push('</ul>'); list = false; }
  };

  for (const line of lines) {
    if (/^\s*$/.test(line)) { flushParagraph(); closeList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html.push(`<h${level}>${inline(heading[2])}</h${level}>`); continue; }
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) { flushParagraph(); if (!list) { html.push('<ul>'); list = true; } html.push(`<li>${inline(item[1])}</li>`); continue; }
    closeList();
    paragraph.push(line.trim());
  }
  flushParagraph(); closeList();
  return html.join('\n');
}

export function parseMarkdown(markdown = '') {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const metadata = {};
  const body = match ? match[2] : markdown;
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const item = line.match(/^([\w-]+):\s*["']?(.*?)["']?\s*$/);
      if (item) metadata[item[1]] = item[2];
    }
  }
  return { metadata, body };
}
