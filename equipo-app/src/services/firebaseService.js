import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot,
  Timestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// ============================================
// PEDIDOS - REPARTIDOR
// ============================================

export const escucharPedidosDisponibles = (callback) => {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const pedidos = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Pedidos sin repartidor y no cancelados
          if (!data.repartidorId && data.estado !== 'cancelado') {
            pedidos.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Ordenar por fecha
        pedidos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        callback(pedidos);
      },
      (error) => {
        console.error('Error al escuchar pedidos disponibles:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
};

export const escucharMisPedidosRepartidor = (repartidorId, callback) => {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const pedidos = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Solo pedidos asignados a este repartidor y no completados
          if (data.repartidorId === repartidorId && 
              data.estado !== 'entregado' && 
              data.estado !== 'cancelado') {
            pedidos.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        pedidos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        callback(pedidos);
      },
      (error) => {
        console.error('Error al escuchar mis pedidos:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
};

export const aceptarPedido = async (pedidoId, repartidorId, repartidorNombre) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    
    // Verificar que el pedido no esté ya asignado
    if (pedidoData.repartidorId) {
      return { success: false, error: 'Este pedido ya fue asignado a otro repartidor' };
    }
    
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      repartidorId: repartidorId,
      repartidorNombre: repartidorNombre,
      estado: 'confirmado',
      aceptadoAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'confirmado',
          timestamp: Timestamp.now(),
          descripcion: `Pedido aceptado por ${repartidorNombre}`
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al aceptar pedido:', error);
    return { success: false, error: error.message };
  }
};

export const rechazarPedido = async (pedidoId, motivo = 'El restaurante no puede procesar este pedido') => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      estado: 'cancelado',
      canceladoAt: Timestamp.now(),
      motivoCancelacion: motivo,
      canceladoPor: 'restaurante',
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'cancelado',
          timestamp: Timestamp.now(),
          descripcion: `Pedido cancelado: ${motivo}`
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al rechazar pedido:', error);
    return { success: false, error: error.message };
  }
};

export const marcarEnPreparacion = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      estado: 'en_preparacion',
      preparacionAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'en_preparacion',
          timestamp: Timestamp.now(),
          descripcion: 'Pedido en preparación'
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al marcar en preparación:', error);
    return { success: false, error: error.message };
  }
};

export const marcarListo = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      estado: 'listo',
      listoAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'listo',
          timestamp: Timestamp.now(),
          descripcion: 'Pedido listo para entrega'
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al marcar listo:', error);
    return { success: false, error: error.message };
  }
};

export const marcarEnCamino = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      estado: 'en_camino',
      enCaminoAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'en_camino',
          timestamp: Timestamp.now(),
          descripcion: 'Repartidor en camino hacia el cliente'
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al marcar en camino:', error);
    return { success: false, error: error.message };
  }
};

export const marcarEntregado = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    await updateDoc(pedidoRef, {
      estado: 'entregado',
      entregadoAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'entregado',
          timestamp: Timestamp.now(),
          descripcion: 'Pedido entregado exitosamente al cliente'
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al marcar entregado:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PEDIDOS - ADMIN
// ============================================

export const escucharTodosPedidos = (callback) => {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const pedidos = [];
        snapshot.forEach((doc) => {
          pedidos.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        pedidos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        
        callback(pedidos);
      },
      (error) => {
        console.error('Error al escuchar todos los pedidos:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
};

export const actualizarEstadoPedido = async (pedidoId, nuevoEstado, motivo = '') => {
  try {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoDoc = await getDoc(pedidoRef);
    
    if (!pedidoDoc.exists()) {
      return { success: false, error: 'Pedido no encontrado' };
    }
    
    const pedidoData = pedidoDoc.data();
    const historialActual = pedidoData.historialEstados || [];
    
    const updateData = {
      estado: nuevoEstado,
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: nuevoEstado,
          timestamp: Timestamp.now(),
          descripcion: motivo || `Estado actualizado a ${nuevoEstado}`
        }
      ]
    };
    
    if (nuevoEstado === 'cancelado') {
      updateData.canceladoAt = Timestamp.now();
      updateData.motivoCancelacion = motivo || 'Cancelado por administrador';
      updateData.canceladoPor = 'admin';
    }
    
    await updateDoc(pedidoRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    return { success: false, error: error.message };
  }
};

export const obtenerEstadisticasHoy = async () => {
  try {
    const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let totalPedidos = 0;
    let totalVentas = 0;
    let pedidosActivos = 0;
    
    pedidosSnapshot.forEach((doc) => {
      const data = doc.data();
      const fechaPedido = data.createdAt?.toDate();
      
      if (fechaPedido && fechaPedido >= hoy) {
        totalPedidos++;
        if (data.estado !== 'cancelado') {
          totalVentas += data.total || 0;
        }
        if (data.estado !== 'entregado' && data.estado !== 'cancelado') {
          pedidosActivos++;
        }
      }
    });
    
    return {
      success: true,
      data: {
        totalPedidos,
        totalVentas,
        pedidosActivos
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// MENÚ
// ============================================

export const obtenerMenuDelDia = async () => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const menuDoc = await getDoc(doc(db, 'menus', hoy));
    
    if (menuDoc.exists()) {
      return {
        success: true,
        data: menuDoc.data()
      };
    } else {
      return {
        success: true,
        data: null
      };
    }
  } catch (error) {
    console.error('Error al obtener menú:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const escucharMenuDelDia = (fecha, callback) => {
  try {
    const unsubscribe = onSnapshot(
      doc(db, 'menus', fecha),
      (doc) => {
        if (doc.exists()) {
          callback(doc.data());
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error al escuchar menú:', error);
        callback(null);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al configurar listener de menú:', error);
    return () => {};
  }
};

export const crearMenu = async (fecha, platos) => {
  try {
    await setDoc(doc(db, 'menus', fecha), {
      fecha: fecha,
      platos: platos,
      disponibles: platos.length,
      createdAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al crear menú:', error);
    return { success: false, error: error.message };
  }
};

export const actualizarMenu = async (fecha, platos) => {
  try {
    const menuRef = doc(db, 'menus', fecha);
    await updateDoc(menuRef, {
      platos: platos,
      disponibles: platos.length,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar menú:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// USUARIOS
// ============================================

export const obtenerRepartidoresDisponibles = async () => {
  try {
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    const repartidores = [];
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rol === 'repartidor') {
        repartidores.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return { success: true, data: repartidores };
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    return { success: false, error: error.message };
  }
};