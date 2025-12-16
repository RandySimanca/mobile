import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('avicola.db');

export const initDatabase = async () => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection TEXT NOT NULL,
        data TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lotes (
        id TEXT PRIMARY KEY,
        nombre TEXT,
        galpon_id TEXT,
        tipo_ave TEXT
      );
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database', error);
  }
};

export const getDB = () => db;
