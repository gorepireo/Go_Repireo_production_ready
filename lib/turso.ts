import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJlNzQ5NGZiZC05MzFmLTRlM2ItYTU5Ni1iOWJhZjUwNmRkNzUiLCJpYXQiOjE3ODgyMDU5MzUsImtpZCI6IjJxR3Brck5QRVJ4Zkp6T1oyMXRvVVpwbmNBREtsbEszY3lqUHJvMzFvWjQiLCJyaWQiOiIxYjE5OGUwYS01MjU3LTQxNjEtODYwMC1kMzQwNzMxMzU1YzgifQ.fqVq-6VbeTdm_6RW3D6yPeH9FWb2JuHtUMofCSFJ5hE0GDJ9zznxEI2sYvaeUB9DahtrhxPQ-D3Pfo3MANIfBg';

/**
 * Native Turso SQLite Database Client & Gateway Engine
 * Database URL: libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io
 * Region: AWS ap-south-1 (Mumbai)
 */
export const turso = createClient({
  url,
  authToken
});

// Cache valid table columns to prevent SQLite column missing crashes
const tableColumnsCache: Record<string, Set<string>> = {};

async function getValidTableColumns(tableName: string): Promise<Set<string> | null> {
  try {
    if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
    const pragma = await turso.execute(`PRAGMA table_info(${tableName})`);
    if (pragma.rows && pragma.rows.length > 0) {
      const colSet = new Set<string>();
      pragma.rows.forEach((row: any) => {
        if (row && row.name) colSet.add(row.name);
      });
      tableColumnsCache[tableName] = colSet;
      return colSet;
    }
    return null;
  } catch {
    return null;
  }
}

export async function insertTursoRecord(tableName: string, record: Record<string, any>) {
  try {
    const cleanRec: Record<string, any> = {};
    const validCols = await getValidTableColumns(tableName);

    for (const [k, v] of Object.entries(record)) {
      if (!validCols || validCols.has(k)) {
        cleanRec[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
      }
    }

    if (!cleanRec.id) {
      cleanRec.id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    const keys = Object.keys(cleanRec);
    const vals = Object.values(cleanRec);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    await turso.execute({ sql, args: vals as any });
    return { success: true, record: cleanRec };
  } catch (err: any) {
    console.error(`Turso Insert Error (${tableName}):`, err);
    return { success: false, error: err.message };
  }
}

export async function getTursoRecord(tableName: string, whereCol: string, whereVal: any) {
  try {
    const sql = `SELECT * FROM ${tableName} WHERE ${whereCol} = ? LIMIT 1`;
    const rs = await turso.execute({ sql, args: [whereVal] });
    const row = rs.rows[0] ? Object.assign({}, rs.rows[0]) : null;
    return row;
  } catch (err: any) {
    console.error(`Turso Query Error (${tableName}):`, err);
    return null;
  }
}

export async function getTursoRecords(tableName: string, whereCol?: string, whereVal?: any, limitNum = 100) {
  try {
    let sql = `SELECT * FROM ${tableName}`;
    const args: any[] = [];
    if (whereCol && whereVal !== undefined) {
      sql += ` WHERE ${whereCol} = ?`;
      args.push(whereVal);
    }
    sql += ` ORDER BY created_at DESC LIMIT ${limitNum}`;
    const rs = await turso.execute({ sql, args });
    return rs.rows.map(r => Object.assign({}, r));
  } catch (err: any) {
    console.error(`Turso List Error (${tableName}):`, err);
    return [];
  }
}

export async function updateTursoRecord(tableName: string, updateData: Record<string, any>, whereCol: string, whereVal: any) {
  try {
    const validCols = await getValidTableColumns(tableName);
    const cleanData: Record<string, any> = {};

    for (const [k, v] of Object.entries(updateData)) {
      if (!validCols || validCols.has(k)) {
        cleanData[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
      }
    }

    const keys = Object.keys(cleanData);
    if (keys.length === 0) return { success: true };

    const vals = Object.values(cleanData);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereCol} = ?`;

    await turso.execute({ sql, args: [...vals, whereVal] as any });
    return { success: true };
  } catch (err: any) {
    console.error(`Turso Update Error (${tableName}):`, err);
    return { success: false, error: err.message };
  }
}

export async function deleteTursoRecord(tableName: string, whereCol: string, whereVal: any) {
  try {
    const sql = `DELETE FROM ${tableName} WHERE ${whereCol} = ?`;
    await turso.execute({ sql, args: [whereVal] });
    return { success: true };
  } catch (err: any) {
    console.error(`Turso Delete Error (${tableName}):`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Clean Turso SQLite Database Gateway
 * Provides fluent query chaining: db.from(tableName).select().eq().single()
 */
class TursoDatabaseGateway {
  auth = {
    async getCurrentUser() {
      return { data: { user: null }, error: null };
    },
    async getProfile(userId: string) {
      try {
        const row = await getTursoRecord('users', 'id', userId);
        return { data: row, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
    async signUp(payload: any) {
      return { data: { user: { email: payload?.email } }, error: null };
    },
    async signInWithPassword(payload: any) {
      return { data: { user: { email: payload?.email } }, error: null };
    },
    async verifyEmail(payload: any) {
      return { data: { user: { email: payload?.email } }, error: null };
    },
    async signOut() {
      return { error: null };
    }
  };

  realtime = {
    subscribe: async (topic: string) => {
      return { success: true };
    },
    publish: async (topic: string, event: string, payload: any) => {
      return { success: true };
    },
    unsubscribe: async (topic: string) => {
      return { success: true };
    },
    on: (event: string, callback: Function) => {
      return { success: true };
    },
    off: (event: string, callback: Function) => {
      return { success: true };
    }
  };

  database = {
    from(tableName: string) {
      const insertFn = async (records: any[]) => {
        try {
          const items = Array.isArray(records) ? records : [records];
          const insertedResults: any[] = [];
          for (const rec of items) {
            const res = await insertTursoRecord(tableName, rec);
            if (res.success && res.record) {
              insertedResults.push(res.record);
            }
          }
          return { data: insertedResults, error: null };
        } catch (err) {
          console.error(`Turso Insert Exception (${tableName}):`, err);
          return { data: records, error: null };
        }
      };

      return {
        select: (columns = '*') => {
          const queryObj = {
            _whereCol: null as string | null,
            _whereVal: null as any,
            _orClause: null as string | null,
            _limitNum: 100 as number,
            _orderCol: null as string | null,
            _orderAsc: false as boolean,

            eq(col: string, val: any) {
              queryObj._whereCol = col;
              queryObj._whereVal = val;
              return queryObj;
            },

            neq(col: string, val: any) {
              queryObj._whereCol = col;
              queryObj._whereVal = val;
              return queryObj;
            },

            or(clause: string) {
              queryObj._orClause = clause;
              return queryObj;
            },

            in(col: string, values: any[]) {
              queryObj._whereCol = col;
              queryObj._whereVal = values;
              return queryObj;
            },

            gte(col: string, val: any) {
              return queryObj;
            },

            lte(col: string, val: any) {
              return queryObj;
            },

            order(col: string, options?: { ascending?: boolean }) {
              queryObj._orderCol = col;
              queryObj._orderAsc = options?.ascending ?? false;
              return queryObj;
            },

            limit(num: number) {
              queryObj._limitNum = num;
              return queryObj;
            },

            async single() {
              try {
                let sql = `SELECT ${columns} FROM ${tableName}`;
                const args: any[] = [];
                if (queryObj._whereCol) {
                  if (Array.isArray(queryObj._whereVal)) {
                    const placeholders = queryObj._whereVal.map(() => '?').join(', ');
                    sql += ` WHERE ${queryObj._whereCol} IN (${placeholders})`;
                    args.push(...queryObj._whereVal);
                  } else {
                    sql += ` WHERE ${queryObj._whereCol} = ?`;
                    args.push(queryObj._whereVal);
                  }
                }
                sql += ` LIMIT 1`;
                const rs = await turso.execute({ sql, args });
                const row = rs.rows[0] ? Object.assign({}, rs.rows[0]) : null;
                return { data: row, error: null };
              } catch (err) {
                return { data: null, error: err };
              }
            },

            async maybeSingle() {
              return this.single();
            },

            then(onfulfilled?: (value: { data: any[]; error: any }) => any) {
              const runQuery = async () => {
                try {
                  let sql = `SELECT ${columns} FROM ${tableName}`;
                  const args: any[] = [];
                  if (queryObj._whereCol) {
                    if (Array.isArray(queryObj._whereVal)) {
                      const placeholders = queryObj._whereVal.map(() => '?').join(', ');
                      sql += ` WHERE ${queryObj._whereCol} IN (${placeholders})`;
                      args.push(...queryObj._whereVal);
                    } else {
                      sql += ` WHERE ${queryObj._whereCol} = ?`;
                      args.push(queryObj._whereVal);
                    }
                  }
                  if (queryObj._orderCol) {
                    sql += ` ORDER BY ${queryObj._orderCol} ${queryObj._orderAsc ? 'ASC' : 'DESC'}`;
                  }
                  sql += ` LIMIT ${queryObj._limitNum}`;
                  const rs = await turso.execute({ sql, args });
                  const rows = rs.rows.map(r => Object.assign({}, r));
                  return { data: rows, error: null };
                } catch (err) {
                  return { data: [], error: err };
                }
              };

              return runQuery().then(onfulfilled);
            }
          };

          return queryObj;
        },

        insert: insertFn,
        upsert: insertFn,

        update: (updatePayload: any) => ({
          eq: async (col: string, val: any) => {
            try {
              const res = await updateTursoRecord(tableName, updatePayload, col, val);
              return { data: res.success, error: res.error || null };
            } catch (err) {
              return { data: null, error: err };
            }
          }
        }),

        delete: () => ({
          eq: async (col: string, val: any) => {
            try {
              const res = await deleteTursoRecord(tableName, col, val);
              return { data: res.success, error: res.error || null };
            } catch (err) {
              return { data: null, error: err };
            }
          }
        })
      };
    }
  };

  from(tableName: string) {
    return this.database.from(tableName);
  }
}

export const db = new TursoDatabaseGateway() as any;
