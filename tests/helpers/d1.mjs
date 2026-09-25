import { DatabaseSync } from 'node:sqlite';

/**
 * Minimal D1-shaped wrapper over node:sqlite so worker modules can be
 * exercised against real SQL in tests (port of geo's tests/helpers/sqliteD1).
 */
export function createTestD1(database) {
  const statement = (sql, params) => ({
    bind: (...bound) => statement(sql, bound),
    all: async () => ({ results: database.prepare(sql).all(...params), success: true, meta: {} }),
    first: async () => {
      const rows = database.prepare(sql).all(...params);
      return rows[0] ?? null;
    },
    run: async () => {
      const info = database.prepare(sql).run(...params);
      // D1 reports rows affected in meta.changes; callers read last_row_id after inserts.
      return { success: true, meta: { last_row_id: Number(info.lastInsertRowid), changes: Number(info.changes) } };
    },
    raw: async () => [],
  });

  return {
    prepare: sql => statement(sql, []),
    batch: async () => [],
    exec: async script => {
      database.exec(script);
    },
    dump: async () => new ArrayBuffer(0),
  };
}
