import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJlNzQ5NGZiZC05MzFmLTRlM2ItYTU5Ni1iOWJhZjUwNmRkNzUiLCJpYXQiOjE3ODgyMDU5MzUsImtpZCI6IjJxR3Brck5QRVJ4Zkp6T1oyMXRvVVpwbmNBREtsbEszY3lqUHJvMzFvWjQiLCJyaWQiOiIxYjE5OGUwYS01MjU3LTQxNjEtODYwMC1kMzQwNzMxMzU1YzgifQ.fqVq-6VbeTdm_6RW3D6yPeH9FWb2JuHtUMofCSFJ5hE0GDJ9zznxEI2sYvaeUB9DahtrhxPQ-D3Pfo3MANIfBg';

/**
 * Native Turso Database Client (libsql / Serverless SQLite at Edge)
 * Database URL: libsql://gorepireo-gorepireo.aws-ap-south-1.turso.io
 * Region: AWS ap-south-1 (Mumbai)
 */
export const turso = createClient({
  url,
  authToken
});

export async function insertTursoRecord(tableName: string, record: Record<string, any>) {
  try {
    const cleanRec = { ...record };
    if (!cleanRec.id) {
      cleanRec.id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }
    const keys = Object.keys(cleanRec);
    const vals = Object.values(cleanRec).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
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
    const keys = Object.keys(updateData);
    const vals = Object.values(updateData).map(v => (v !== null && typeof v === 'object') ? JSON.stringify(v) : v);
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
