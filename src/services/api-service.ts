import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc, 
  runTransaction, 
  writeBatch,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  isNetworkError?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

class ApiService {
  private isOnline: boolean = true;
  private currentUser: any = null;

  constructor() {
    // Escuchar cambios en la autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Obtener rol y nombre desde la colección de usuarios
        const userDoc = await getDoc(doc(db, 'USUARIOS', user.uid));
        if (userDoc.exists()) {
          this.currentUser = { id: user.uid, ...userDoc.data() };
        }
      } else {
        this.currentUser = null;
      }
    });
  }

  // Gestión de autenticación
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Obtener datos adicionales del usuario
      const userDoc = await getDoc(doc(db, 'USUARIOS', user.uid));
      let userData = { role: 'GALPONERO', name: 'Usuario' }; // Default
      
      if (userDoc.exists()) {
        userData = userDoc.data() as any;
      }

      const authResponse: AuthResponse = {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          email: user.email || '',
          role: userData.role,
          name: userData.name
        }
      };

      await this.saveToken(authResponse.token);
      return { success: true, data: authResponse };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de autenticación' };
    }
  }

  async register(userData: { name: string; email: string; password: string; role: string }): Promise<ApiResponse<any>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // Crear documento de usuario con rol
      await setDoc(doc(db, 'USUARIOS', user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        estado: 'PENDIENTE',
        createdAt: new Date().toISOString()
      });

      return { success: true, data: { id: user.uid, ...userData } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error en el registro' };
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    await this.removeToken();
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error al guardar token:', error);
    }
  }

  private async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error al eliminar token:', error);
    }
  }

  // Métodos para Lotes
  async getLotes(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'LOTE'));
      const querySnapshot = await getDocs(q);
      const lotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: lotes };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getLote(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'LOTE', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Lote no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCachedLotes(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem('cached_lotes');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch(e) {
      return [];
    }
  }

  async cacheMasterData(data: any): Promise<void> {
    try {
      if (data.lotes) await AsyncStorage.setItem('cached_lotes', JSON.stringify(data.lotes));
    } catch (e) {
      console.error(e);
    }
  }

  async createLote(lote: any): Promise<ApiResponse<any>> {
    try {
      const data = {
        ...lote,
        poblacion_actual: lote.poblacion_actual ?? lote.poblacion_inicial,
        activo: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'LOTE'), data);
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateLote(id: string, lote: any): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'LOTE', id), lote);
      return { success: true, data: { id, ...lote } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async finalizeLote(id: string): Promise<ApiResponse<any>> {
    try {
      const data = {
        activo: false,
        fecha_finalizacion: new Date().toISOString()
      };
      await updateDoc(doc(db, 'LOTE', id), data);
      return { success: true, data: { id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteLote(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'LOTE', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Insumos
  async getInsumos(): Promise<ApiResponse<any[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, 'INSUMO'));
      const insumos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: insumos };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createInsumo(insumo: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'INSUMO'), insumo);
      return { success: true, data: { id: docRef.id, ...insumo } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteInsumo(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'INSUMO', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getInsumo(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'INSUMO', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Insumo no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateInsumo(id: string, insumo: any): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'INSUMO', id), insumo);
      return { success: true, data: { id, ...insumo } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Gastos (Con lógica de negocio)
  async createGasto(gasto: any): Promise<ApiResponse<any>> {
    try {
      // Usar transacción para asegurar consistencia
      await runTransaction(db, async (transaction) => {
        // 1. Crear el gasto
        const gastoRef = doc(collection(db, 'GASTOS'));
        transaction.set(gastoRef, {
          ...gasto,
          fecha_creacion: new Date().toISOString()
        });

        // 2. Si es compra de insumo, actualizar stock
        if (gasto.tipo_gasto === 'COMPRA_INSUMO' && gasto.insumo_id) {
          const insumoRef = doc(db, 'INSUMO', gasto.insumo_id);
          const insumoDoc = await transaction.get(insumoRef);
          
          if (!insumoDoc.exists()) {
            throw new Error('Insumo no encontrado');
          }

          const nuevoStock = (insumoDoc.data().stock_actual || 0) + Number(gasto.cantidad);
          const nuevoPrecio = Number(gasto.precio_unitario); // Actualizar precio con la última compra

          transaction.update(insumoRef, {
            stock_actual: nuevoStock,
            precio_unitario: nuevoPrecio
          });
        }
      });

      return { success: true, data: gasto };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGastos(loteId?: string): Promise<ApiResponse<any[]>> {
    try {
      let q;
      if (loteId) {
        q = query(collection(db, 'GASTOS'), where('lote_id', '==', loteId));
      } else {
        q = query(collection(db, 'GASTOS'));
      }
      const querySnapshot = await getDocs(q);
      const gastos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: gastos };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteGasto(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'GASTOS', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Ventas (Con lógica de negocio)
  async createVenta(venta: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Verificar lote y población
        const loteRef = doc(db, 'LOTE', venta.lote_id);
        const loteDoc = await transaction.get(loteRef);

        if (!loteDoc.exists()) {
          throw new Error('Lote no encontrado');
        }

        const loteData = loteDoc.data();
        const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;

        if (venta.cantidad > poblacionActual) {
          throw new Error(`No hay suficientes aves. Disponibles: ${poblacionActual}`);
        }

        // 2. Crear venta
        const ventaRef = doc(collection(db, 'VENTAS'));
        transaction.set(ventaRef, {
          ...venta,
          fecha_creacion: new Date().toISOString()
        });

        // 3. Actualizar población
        const nuevaPoblacion = poblacionActual - venta.cantidad;
        const updateData: any = { poblacion_actual: nuevaPoblacion };

        // 4. Finalizar si llega a 0
        if (nuevaPoblacion === 0) {
          updateData.activo = false;
          updateData.fecha_finalizacion = new Date().toISOString();
        }

        transaction.update(loteRef, updateData);
      });

      return { success: true, data: venta };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getVentas(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'VENTAS'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: ventas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Consumo (Con lógica de negocio)
  async createConsumoInsumo(consumo: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Verificar Insumo y Stock
        const insumoRef = doc(db, 'INSUMO', consumo.insumo_id);
        const insumoDoc = await transaction.get(insumoRef);

        if (!insumoDoc.exists()) {
          throw new Error('Insumo no encontrado');
        }

        const insumoData = insumoDoc.data();
        if (insumoData.stock_actual < consumo.cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${insumoData.stock_actual}`);
        }

        // 2. Crear registro de consumo
        const consumoRef = doc(collection(db, 'CONSUMO_INSUMO'));
        transaction.set(consumoRef, {
          ...consumo,
          fecha_creacion: new Date().toISOString()
        });

        // 3. Descontar stock
        transaction.update(insumoRef, {
          stock_actual: insumoData.stock_actual - consumo.cantidad
        });

        // 4. Generar Gasto Automático
        const gastoRef = doc(collection(db, 'GASTOS'));
        const costoTotal = consumo.cantidad * (insumoData.precio_unitario || 0);
        
        transaction.set(gastoRef, {
          fecha: consumo.fecha,
          concepto: `Consumo: ${insumoData.nombre_producto}`,
          categoria: 'ALIMENTACION', // O sanitarios, según tipo
          total: costoTotal,
          lote_id: consumo.lote_id,
          tipo_gasto: 'CONSUMO_LOTE',
          insumo_id: consumo.insumo_id,
          cantidad: consumo.cantidad,
          precio_unitario: insumoData.precio_unitario,
          fecha_creacion: new Date().toISOString()
        });
      });

      return { success: true, data: consumo };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Agrega este método en la clase ApiService, después de los métodos de Consumo

// Métodos para Registros Diarios de Producción
async createRegistroDiario(datos: {
  lote_id: string;
  fecha: string;
  mortalidad_dia: number;
  alimento_consumido_kg: number;
  observaciones: string | null;
}): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verificar que el lote existe
      const loteRef = doc(db, 'LOTE', datos.lote_id);
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists()) {
        throw new Error('Lote no encontrado');
      }

      const loteData = loteDoc.data();
      const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;

      // 2. Validar que hay suficientes aves
      if (datos.mortalidad_dia > poblacionActual) {
        throw new Error(`Mortalidad mayor a población actual. Disponibles: ${poblacionActual}`);
      }

      // 3. Crear registro diario
      const registroRef = doc(collection(db, 'REGISTRO_DIARIO_PRODUCCION'));
      transaction.set(registroRef, {
        ...datos,
        ownerId: this.currentUser?.id || null,
        fecha_creacion: new Date().toISOString()
      });

      // 4. Actualizar población del lote si hay mortalidad
      if (datos.mortalidad_dia > 0) {
        const nuevaPoblacion = poblacionActual - datos.mortalidad_dia;
        const updateData: any = { poblacion_actual: nuevaPoblacion };

        // Si la población llega a 0, finalizar el lote
        if (nuevaPoblacion === 0) {
          updateData.activo = false;
          updateData.fecha_finalizacion = new Date().toISOString();
        }

        transaction.update(loteRef, updateData);
      }
    });

    return { success: true, data: datos };
  } catch (error: any) {
    console.error('Error en createRegistroDiario:', error);
    return { 
      success: false, 
      error: error.message || 'Error al crear registro',
      isNetworkError: error.code === 'unavailable' || error.message.includes('network')
    };
  }
}

async getRegistrosDiarios(loteId?: string): Promise<ApiResponse<any[]>> {
  try {
    let q;
    if (loteId) {
      q = query(
        collection(db, 'REGISTRO_DIARIO_PRODUCCION'), 
        where('lote_id', '==', loteId),
        orderBy('fecha', 'desc')
      );
    } else {
      q = query(
        collection(db, 'REGISTRO_DIARIO_PRODUCCION'),
        orderBy('fecha', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const registros = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: registros };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async updateRegistroDiario(id: string, nuevosDatos: any): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener registro anterior
      const registroRef = doc(db, 'REGISTRO_DIARIO_PRODUCCION', id);
      const registroSnap = await transaction.get(registroRef);
      
      if (!registroSnap.exists()) {
        throw new Error('Registro no encontrado');
      }
      
      const registroAnterior = registroSnap.data();
      const loteId = nuevosDatos.lote_id || registroAnterior.lote_id;
      
      // 2. Obtener lote
      const loteRef = doc(db, 'LOTE', loteId);
      const loteSnap = await transaction.get(loteRef);
      
      if (!loteSnap.exists()) {
        throw new Error('Lote no encontrado');
      }
      
      const loteData = loteSnap.data();
      let poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
      
      // 3. Revertir mortalidad anterior
      poblacionActual += (registroAnterior.mortalidad_dia || 0);
      
      // 4. Validar nueva mortalidad
      const nuevaMortalidad = nuevosDatos.mortalidad_dia ?? registroAnterior.mortalidad_dia;
      if (nuevaMortalidad > poblacionActual) {
        throw new Error(`La nueva mortalidad excede la población. Disponibles: ${poblacionActual}`);
      }
      
      // 5. Aplicar nueva mortalidad
      const nuevaPoblacionFinal = poblacionActual - nuevaMortalidad;
      
      // 6. Actualizar lote
      const updateLoteData: any = { poblacion_actual: nuevaPoblacionFinal };
      if (nuevaPoblacionFinal === 0) {
        updateLoteData.activo = false;
        updateLoteData.fecha_finalizacion = new Date().toISOString();
      } else if (nuevaPoblacionFinal > 0 && !loteData.activo) {
        updateLoteData.activo = true;
        updateLoteData.fecha_finalizacion = null;
      }
      
      transaction.update(loteRef, updateLoteData);
      
      // 7. Actualizar registro
      transaction.update(registroRef, {
        ...nuevosDatos,
        fecha_modificacion: new Date().toISOString(),
        modificado_por: this.currentUser?.id || 'unknown'
      });
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en updateRegistroDiario:', error);
    return { success: false, error: error.message };
  }
}

async deleteRegistroDiario(id: string): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener registro
      const registroRef = doc(db, 'REGISTRO_DIARIO_PRODUCCION', id);
      const registroSnap = await transaction.get(registroRef);
      
      if (!registroSnap.exists()) {
        throw new Error('Registro no encontrado');
      }
      
      const registroData = registroSnap.data();
      
      // 2. Obtener lote
      const loteRef = doc(db, 'LOTE', registroData.lote_id);
      const loteSnap = await transaction.get(loteRef);
      
      if (loteSnap.exists()) {
        const loteData = loteSnap.data();
        const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
        
        // 3. Restaurar población
        const nuevaPoblacion = poblacionActual + (registroData.mortalidad_dia || 0);
        const updateLoteData: any = { poblacion_actual: nuevaPoblacion };
        
        if (nuevaPoblacion > 0 && !loteData.activo) {
          updateLoteData.activo = true;
          updateLoteData.fecha_finalizacion = null;
        }
        
        transaction.update(loteRef, updateLoteData);
      }
      
      // 4. Eliminar registro
      transaction.delete(registroRef);
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en deleteRegistroDiario:', error);
    return { success: false, error: error.message };
  }
}

  // Métodos para Fincas
  async getFincas(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'FINCA'));
      const querySnapshot = await getDocs(q);
      const fincas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: fincas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createFinca(finca: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'FINCA'), finca);
      return { success: true, data: { id: docRef.id, ...finca } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteFinca(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'FINCA', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Galpones
  async getGalpones(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'GALPON'));
      const querySnapshot = await getDocs(q);
      const galpones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: galpones };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGalponesPorFinca(fincaId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'GALPON'), where('finca_id', '==', fincaId));
      const querySnapshot = await getDocs(q);
      const galpones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: galpones };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createGalpon(galpon: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'GALPON'), galpon);
      return { success: true, data: { id: docRef.id, ...galpon } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteGalpon(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'GALPON', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Usuarios
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'USUARIOS'));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async approveUser(id: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { estado: 'ACTIVO' });
      return { success: true, data: { id, estado: 'ACTIVO' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async rejectUser(id: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { estado: 'RECHAZADO' });
      return { success: true, data: { id, estado: 'RECHAZADO' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async toggleUserStatus(id: string): Promise<ApiResponse<any>> {
    try {
        const userRef = doc(db, 'USUARIOS', id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentStatus = userDoc.data().estado;
            const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            await updateDoc(userRef, { estado: newStatus });
            return { success: true, data: { id, estado: newStatus } };
        }
        return { success: false, error: 'Usuario no encontrado' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { role });
      return { success: true, data: { id, role } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'USUARIOS', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Reportes y KPIs (Cálculo en cliente)
  async getRegistrosDiariosPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'), where('lote_id', '==', loteId));
      const querySnapshot = await getDocs(q);
      const registros = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: registros };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getVentasPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'VENTAS'), where('lote_id', '==', loteId));
      const querySnapshot = await getDocs(q);
      const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: ventas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getResumenGlobal(): Promise<ApiResponse<any>> {
    try {
      // 1. Obtener todas las ventas (Ingresos)
      const ventasSnap = await getDocs(collection(db, 'VENTAS'));
      const totalIngresos = ventasSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

      // 2. Obtener todos los gastos (Egresos) y clasificarlos
      const gastosSnap = await getDocs(collection(db, 'GASTOS'));
      
      let gastosOperativos = 0;      // Nómina, servicios, aseo, arriendo
      let inversionInsumos = 0;      // Compras que van a bodega
      let consumosRegistrados = 0;   // Solo para referencia (NO suma a egresos de caja)

      gastosSnap.docs.forEach(doc => {
        const data = doc.data();
        const total = data.total || 0;
        
        switch (data.tipo_gasto) {
          case 'GASTO_OPERATIVO':
            gastosOperativos += total;
            break;
          case 'COMPRA_INSUMO':
            inversionInsumos += total;
            break;
          case 'CONSUMO_LOTE':
            consumosRegistrados += total;  // NO se suma a egresos de caja
            break;
          default:
            // Por defecto, si no tiene tipo, lo tratamos como operativo para no perder datos
            gastosOperativos += total;
            break;
        }
      });

      const totalEgresosCaja = gastosOperativos + inversionInsumos;

      // 3. Obtener inventario actual (Activos)
      const insumosSnap = await getDocs(collection(db, 'INSUMO'));
      const valorInventario = insumosSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + ((data.stock_actual || 0) * (data.precio_unitario || 0));
      }, 0);

      // 4. Obtener datos operativos
      const lotesSnap = await getDocs(collection(db, 'LOTE'));
      const totalLotes = lotesSnap.size;
      const totalAves = lotesSnap.docs.reduce((sum, doc) => sum + (doc.data().poblacion_inicial || 0), 0);

      // Cálculos Financieros
      const cajaActual = totalIngresos - totalEgresosCaja;
      const patrimonioNeto = cajaActual + valorInventario;
      const utilidadOperativa = totalIngresos - gastosOperativos - consumosRegistrados;
      const margenOperativo = totalIngresos > 0 ? (utilidadOperativa / totalIngresos) * 100 : 0;

      return {
        success: true,
        data: {
          // Estado de Caja (Dinero Real)
          flujo_caja: {
            total_ingresos: totalIngresos,
            gastos_operativos: gastosOperativos,
            inversion_insumos: inversionInsumos,
            total_egresos_caja: totalEgresosCaja,
            caja_actual: cajaActual,
          },
          // Balance General (Activos)
          balance: {
            efectivo: cajaActual,
            inventario: valorInventario,
            activo_total: patrimonioNeto,
          },
          // Resultado Operativo
          resultado: {
            utilidad_operativa: utilidadOperativa,
            margen_operativo: margenOperativo,
            costo_consumos: consumosRegistrados,
          },
          // Operación
          resumen: {
            total_lotes: totalLotes,
            total_aves_inicial: totalAves
          }
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGlobalKPIs(): Promise<ApiResponse<any>> {
    try {
      // Obtener lotes activos
      const lotesSnapshot = await getDocs(query(collection(db, 'LOTE'), where('activo', '==', true)));
      const lotes = lotesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Obtener registros recientes para producción y mortalidad
      // Nota: En una app real, optimizaríamos estas queries para no traer todo
      const registrosSnapshot = await getDocs(collection(db, 'REGISTRO_DIARIO_PRODUCCION'));
      const registros = registrosSnapshot.docs.map(d => d.data());

      // Calcular KPIs
      const totalAves = lotes.reduce((sum: number, l: any) => sum + (l.poblacion_actual || 0), 0);
      
      // Producción hoy
      const hoyIso = new Date().toISOString().split('T')[0];
      const produccionHoy = registros
        .filter((r: any) => r.fecha && r.fecha.startsWith(hoyIso))
        .reduce((sum: number, r: any) => sum + (r.huevos_totales || 0), 0);

      return {
        success: true,
        data: {
          totalAves,
          lotesActivos: lotes.length,
          produccionHoy,
          mortalidadSemanal: 0 // Simplificado para el ejemplo
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos auxiliares para mantener compatibilidad
  // Métodos auxiliares para mantener compatibilidad
  async getPendingRecords(type: string) { 
    try {
      const jsonValue = await AsyncStorage.getItem(`pending_${type}`);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch(e) {
      return [];
    }
  }

  async savePendingRecord(type: string, data: any) {
    try {
      const current = await this.getPendingRecords(type);
      current.push(data);
      await AsyncStorage.setItem(`pending_${type}`, JSON.stringify(current));
    } catch (e) {
      console.error('Error saving pending record', e);
    }
  }

  async syncPendingData() { return { success: true }; }
  
  getConnectionStatus() {
    return this.isOnline;
  }

  async checkConnection() { 
    // TODO: Implement real connection check with NetInfo if needed
    this.isOnline = true; 
    return this.isOnline;
  }

  async getCurrentUser() {
  return this.currentUser;
}

async deleteVenta(id: string): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener los datos de la venta antes de eliminarla
      const ventaRef = doc(db, 'VENTAS', id);
      const ventaDoc = await transaction.get(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const ventaData = ventaDoc.data();
      const loteId = ventaData.lote_id;
      const cantidadVendida = ventaData.cantidad;

      // 2. Obtener el lote para restaurar la población
      const loteRef = doc(db, 'LOTE', loteId);
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists()) {
        throw new Error('Lote no encontrado');
      }

      const loteData = loteDoc.data();
      const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;

      // 3. Restaurar la población del lote
      const nuevaPoblacion = poblacionActual + cantidadVendida;
      const updateData: any = { poblacion_actual: nuevaPoblacion };

      // 4. Si el lote estaba inactivo y la población vuelve a ser mayor que 0, reactivarlo
      if (!loteData.activo && nuevaPoblacion > 0) {
        updateData.activo = true;
        updateData.fecha_finalizacion = null; // Limpiar la fecha de finalización
      }

      transaction.update(loteRef, updateData);

      // 5. Eliminar la venta
      transaction.delete(ventaRef);
    });

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    return { success: false, error: error.message };
  }
}

}

export default new ApiService();
