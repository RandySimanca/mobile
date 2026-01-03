// import * as SQLite from 'react-native-sqlite-storage';
// Mock para desarrollo sin dependencia real
interface SQLiteDatabase {
  executeSql: (sql: string, params?: any[], success?: (tx: any, results: any) => void, error?: (tx: any, error: any) => void) => Promise<any>;
}

interface SQLiteStatic {
  openDatabase: (config: { name: string; location: string }) => Promise<SQLiteDatabase>;
}

const SQLite: SQLiteStatic = {
  openDatabase: async (config: { name: string; location: string }) => {
    // Mock para desarrollo - en producción usar react-native-sqlite-storage real
    return Promise.resolve({
      executeSql: async (sql: string, params: any[] = []) => {
        // Mock implementation - en producción esto se conectará a SQLite real
        console.log('SQLite Mock:', sql, params);
        return {
          rows: {
            length: 0,
            item: (index: number) => ({})
          }
        };
      }
    } as SQLiteDatabase);
  }
};

// Interfaces para sincronización
export interface PendingSync {
  id: string;
  tabla: string;
  datos: any;
  fecha_creacion: string;
  sincronizado: boolean;
}

export interface RegistroDiarioOffline {
  id?: string;
  lote_id: string;
  fecha: string;
  mortalidad_dia: number;
  alimento_consumido_kg: number;
  peso_promedio_g?: number;
  huevos_totales?: number;
  observaciones?: string;
  pendiente_sync?: boolean;
}

export interface ConsumoInsumoOffline {
  id?: string;
  lote_id: string;
  insumo_id: string;
  cantidad_consumida: number;
  costo_total_lote: number;
  fecha_consumo: string;
  aplicado_por: string;
  pendiente_sync?: boolean;
}

export interface AplicacionSanitariaOffline {
  id?: string;
  programa_sanitario_id: string;
  lote_id: string;
  fecha_aplicacion: string;
  cantidad_aplicada: number;
  costo_aplicacion: number;
  aplicado_por: string;
  observaciones?: string;
  pendiente_sync?: boolean;
}

class SyncService {
  private db: SQLiteDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB() {
    try {
      this.db = await SQLite.openDatabase({
        name: 'avicola_offline.db',
        location: 'default',
      });
      
      await this.createTables();
    } catch (error) {
      console.error('Error al inicializar base de datos:', error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    const queries = [
      // Tabla de registros diarios pendientes de sincronización
      `CREATE TABLE IF NOT EXISTS registros_diario (
        id TEXT PRIMARY KEY,
        lote_id TEXT NOT NULL,
        fecha TEXT NOT NULL,
        mortalidad_dia INTEGER NOT NULL,
        alimento_consumido_kg REAL NOT NULL,
        peso_promedio_g REAL,
        huevos_totales INTEGER,
        observaciones TEXT,
        pendiente_sync INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de consumo de insumos pendiente
      `CREATE TABLE IF NOT EXISTS consumo_insumos (
        id TEXT PRIMARY KEY,
        lote_id TEXT NOT NULL,
        insumo_id TEXT NOT NULL,
        cantidad_consumida REAL NOT NULL,
        costo_total_lote REAL NOT NULL,
        fecha_consumo TEXT NOT NULL,
        aplicado_por TEXT NOT NULL,
        pendiente_sync INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de aplicaciones sanitarias pendientes
      `CREATE TABLE IF NOT EXISTS aplicaciones_sanitarias (
        id TEXT PRIMARY KEY,
        programa_sanitario_id TEXT NOT NULL,
        lote_id TEXT NOT NULL,
        fecha_aplicacion TEXT NOT NULL,
        cantidad_aplicada REAL NOT NULL,
        costo_aplicacion REAL NOT NULL,
        aplicado_por TEXT NOT NULL,
        observaciones TEXT,
        pendiente_sync INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla general de sincronización
      `CREATE TABLE IF NOT EXISTS pending_sync (
        id TEXT PRIMARY KEY,
        tabla TEXT NOT NULL,
        datos TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        sincronizado INTEGER DEFAULT 0
      )`,

      // Tabla para caché de datos maestros
      `CREATE TABLE IF NOT EXISTS cache_lotes (
        id TEXT PRIMARY KEY,
        galpon_id TEXT NOT NULL,
        tipo_ave TEXT NOT NULL,
        fecha_ingreso TEXT NOT NULL,
        poblacion_inicial INTEGER NOT NULL,
        poblacion_actual INTEGER NOT NULL,
        activo INTEGER NOT NULL,
        ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS cache_insumos (
        id TEXT PRIMARY KEY,
        nombre_producto TEXT NOT NULL,
        tipo_insumo TEXT NOT NULL,
        stock_actual REAL NOT NULL,
        unidad_medida TEXT NOT NULL,
        precio_promedio REAL NOT NULL,
        proveedor TEXT NOT NULL,
        ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.executeSQL(query);
    }
  }

  private async executeSQL(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.executeSql(
        sql,
        params,
        (_: any, results: any) => resolve(results),
        (_: any, error: any) => reject(error)
      );
    });
  }

  // Métodos para registros diarios
  async saveRegistroDiario(registro: RegistroDiarioOffline): Promise<string> {
    const id = registro.id || this.generateId();
    
    await this.executeSQL(
      `INSERT OR REPLACE INTO registros_diario 
       (id, lote_id, fecha, mortalidad_dia, alimento_consumido_kg, peso_promedio_g, huevos_totales, observaciones, pendiente_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        registro.lote_id,
        registro.fecha,
        registro.mortalidad_dia,
        registro.alimento_consumido_kg,
        registro.peso_promedio_g || null,
        registro.huevos_totales || null,
        registro.observaciones || null
      ]
    );

    // Agregar a tabla de sincronización
    await this.addToPendingSync('registros_diario', { id, ...registro });

    return id;
  }

  async getRegistrosDiariosPendientes(): Promise<RegistroDiarioOffline[]> {
    const results = await this.executeSQL(
      'SELECT * FROM registros_diario WHERE pendiente_sync = 1 ORDER BY fecha_creacion'
    );

    return this.rowsToArray(results).map(row => ({
      ...row,
      pendiente_sync: Boolean(row.pendiente_sync)
    }));
  }

  async markRegistroDiarioSynced(id: string): Promise<void> {
    await this.executeSQL(
      'UPDATE registros_diario SET pendiente_sync = 0 WHERE id = ?',
      [id]
    );

    await this.removeFromPendingSync('registros_diario', id);
  }

  // Métodos para consumo de insumos
  async saveConsumoInsumo(consumo: ConsumoInsumoOffline): Promise<string> {
    const id = consumo.id || this.generateId();
    
    await this.executeSQL(
      `INSERT OR REPLACE INTO consumo_insumos 
       (id, lote_id, insumo_id, cantidad_consumida, costo_total_lote, fecha_consumo, aplicado_por, pendiente_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        consumo.lote_id,
        consumo.insumo_id,
        consumo.cantidad_consumida,
        consumo.costo_total_lote,
        consumo.fecha_consumo,
        consumo.aplicado_por
      ]
    );

    await this.addToPendingSync('consumo_insumos', { id, ...consumo });

    return id;
  }

  async getConsumosInsumosPendientes(): Promise<ConsumoInsumoOffline[]> {
    const results = await this.executeSQL(
      'SELECT * FROM consumo_insumos WHERE pendiente_sync = 1 ORDER BY fecha_creacion'
    );

    return this.rowsToArray(results).map(row => ({
      ...row,
      pendiente_sync: Boolean(row.pendiente_sync)
    }));
  }

  async markConsumoInsumoSynced(id: string): Promise<void> {
    await this.executeSQL(
      'UPDATE consumo_insumos SET pendiente_sync = 0 WHERE id = ?',
      [id]
    );

    await this.removeFromPendingSync('consumo_insumos', id);
  }

  // Métodos para aplicaciones sanitarias
  async saveAplicacionSanitaria(aplicacion: AplicacionSanitariaOffline): Promise<string> {
    const id = aplicacion.id || this.generateId();
    
    await this.executeSQL(
      `INSERT OR REPLACE INTO aplicaciones_sanitarias 
       (id, programa_sanitario_id, lote_id, fecha_aplicacion, cantidad_aplicada, costo_aplicacion, aplicado_por, observaciones, pendiente_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        aplicacion.programa_sanitario_id,
        aplicacion.lote_id,
        aplicacion.fecha_aplicacion,
        aplicacion.cantidad_aplicada,
        aplicacion.costo_aplicacion,
        aplicacion.aplicado_por,
        aplicacion.observaciones || null
      ]
    );

    await this.addToPendingSync('aplicaciones_sanitarias', { id, ...aplicacion });

    return id;
  }

  async getAplicacionesSanitariasPendientes(): Promise<AplicacionSanitariaOffline[]> {
    const results = await this.executeSQL(
      'SELECT * FROM aplicaciones_sanitarias WHERE pendiente_sync = 1 ORDER BY fecha_creacion'
    );

    return this.rowsToArray(results).map(row => ({
      ...row,
      pendiente_sync: Boolean(row.pendiente_sync)
    }));
  }

  async markAplicacionSanitariaSynced(id: string): Promise<void> {
    await this.executeSQL(
      'UPDATE aplicaciones_sanitarias SET pendiente_sync = 0 WHERE id = ?',
      [id]
    );

    await this.removeFromPendingSync('aplicaciones_sanitarias', id);
  }

  // Métodos de sincronización general
  private async addToPendingSync(tabla: string, datos: any): Promise<void> {
    const id = this.generateId();
    await this.executeSQL(
      'INSERT INTO pending_sync (id, tabla, datos) VALUES (?, ?, ?)',
      [id, tabla, JSON.stringify(datos)]
    );
  }

  private async removeFromPendingSync(tabla: string, registroId: string): Promise<void> {
    await this.executeSQL(
      "DELETE FROM pending_sync WHERE tabla = ? AND JSON_EXTRACT(datos, '$.id') = ?",
      [tabla, registroId]
    );
  }

  async getAllPendingSync(): Promise<PendingSync[]> {
    const results = await this.executeSQL(
      'SELECT * FROM pending_sync WHERE sincronizado = 0 ORDER BY fecha_creacion'
    );

    return this.rowsToArray(results).map(row => ({
      ...row,
      datos: JSON.parse(row.datos),
      sincronizado: Boolean(row.sincronizado)
    }));
  }

  async markSyncCompleted(id: string): Promise<void> {
    await this.executeSQL(
      'UPDATE pending_sync SET sincronizado = 1 WHERE id = ?',
      [id]
    );
  }

  // Métodos para caché de datos maestros
  async cacheLotes(lotes: any[]): Promise<void> {
    await this.executeSQL('DELETE FROM cache_lotes');
    
    for (const lote of lotes) {
      await this.executeSQL(
        `INSERT INTO cache_lotes 
         (id, galpon_id, tipo_ave, fecha_ingreso, poblacion_inicial, poblacion_actual, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          lote.id,
          lote.galpon_id,
          lote.tipo_ave,
          lote.fecha_ingreso,
          lote.poblacion_inicial,
          lote.poblacion_actual,
          lote.activo ? 1 : 0
        ]
      );
    }
  }

  async getCachedLotes(): Promise<any[]> {
    const results = await this.executeSQL('SELECT * FROM cache_lotes ORDER BY ultima_actualizacion DESC');
    return this.rowsToArray(results).map(row => ({
      ...row,
      activo: Boolean(row.activo)
    }));
  }

  async cacheInsumos(insumos: any[]): Promise<void> {
    await this.executeSQL('DELETE FROM cache_insumos');
    
    for (const insumo of insumos) {
      await this.executeSQL(
        `INSERT INTO cache_insumos 
         (id, nombre_producto, tipo_insumo, stock_actual, unidad_medida, precio_promedio, proveedor)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          insumo.id,
          insumo.nombre_producto,
          insumo.tipo_insumo,
          insumo.stock_actual,
          insumo.unidad_medida,
          insumo.precio_promedio,
          insumo.proveedor
        ]
      );
    }
  }

  async getCachedInsumos(): Promise<any[]> {
    const results = await this.executeSQL('SELECT * FROM cache_insumos ORDER BY nombre_producto');
    return this.rowsToArray(results);
  }

  // Utilidades
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private rowsToArray(results: any): any[] {
    const rows = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  }

  async getPendingCount(): Promise<number> {
    const results = await this.executeSQL(
      'SELECT COUNT(*) as count FROM pending_sync WHERE sincronizado = 0'
    );
    return results.rows.item(0).count;
  }

  async clearSyncedData(): Promise<void> {
    await this.executeSQL('DELETE FROM pending_sync WHERE sincronizado = 1');
    await this.executeSQL('DELETE FROM registros_diario WHERE pendiente_sync = 0');
    await this.executeSQL('DELETE FROM consumo_insumos WHERE pendiente_sync = 0');
    await this.executeSQL('DELETE FROM aplicaciones_sanitarias WHERE pendiente_sync = 0');
  }
}

export default new SyncService();
