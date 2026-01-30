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
  where 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// ============================================
// USUARIOS
// ============================================

export const crearUsuario = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'usuarios', userId), {
      ...userData,
      createdAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
};

export const obtenerUsuario = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'usuarios', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'Usuario no encontrado' };
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return { success: false, error: error.message };
  }
};

export const actualizarUsuario = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
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

export const escucharMenuDelDia = (callback) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const unsubscribe = onSnapshot(
      doc(db, 'menus', hoy),
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

// ============================================
// CARRITO (FIRESTORE)
// ============================================

export const obtenerCarrito = async (userId) => {
  try {
    console.log('📖 Obteniendo carrito para usuario:', userId);
    const carritoRef = doc(db, 'carritos', userId);
    const carritoDoc = await getDoc(carritoRef);
    
    if (carritoDoc.exists()) {
      const data = carritoDoc.data();
      console.log('✓ Carrito obtenido:', data.items?.length || 0, 'items');
      return data.items || [];
    }
    console.log('⚠️ Carrito vacío');
    return [];
  } catch (error) {
    console.error('❌ Error al obtener carrito:', error);
    return [];
  }
};

export const agregarAlCarrito = async (userId, plato) => {
  try {
    console.log('➕ Agregando al carrito:', plato.nombre);
    const carritoRef = doc(db, 'carritos', userId);
    const carritoDoc = await getDoc(carritoRef);
    
    let items = [];
    
    if (carritoDoc.exists()) {
      items = carritoDoc.data().items || [];
    }
    
    const itemExistente = items.find(item => item.id === plato.id);
    
    if (itemExistente) {
      itemExistente.cantidad += 1;
      console.log('✓ Cantidad actualizada:', itemExistente.cantidad);
    } else {
      items.push({
        id: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        imagen: plato.imagen || null,
        cantidad: 1
      });
      console.log('✓ Producto agregado al carrito');
    }
    
    await setDoc(carritoRef, {
      userId: userId,
      items: items,
      updatedAt: Timestamp.now()
    });
    
    console.log('✓ Carrito guardado en Firestore');
    return { success: true, carrito: items };
  } catch (error) {
    console.error('❌ Error al agregar al carrito:', error);
    return { success: false, error: error.message };
  }
};

export const actualizarCantidadCarrito = async (userId, platoId, nuevaCantidad) => {
  try {
    console.log('🔄 Actualizando cantidad:', platoId, nuevaCantidad);
    const carritoRef = doc(db, 'carritos', userId);
    const carritoDoc = await getDoc(carritoRef);
    
    if (!carritoDoc.exists()) {
      console.error('❌ Carrito no encontrado');
      return { success: false, error: 'Carrito no encontrado' };
    }
    
    let items = carritoDoc.data().items || [];
    
    if (nuevaCantidad <= 0) {
      items = items.filter(item => item.id !== platoId);
      console.log('🗑️ Producto eliminado del carrito');
    } else {
      const item = items.find(i => i.id === platoId);
      if (item) {
        item.cantidad = nuevaCantidad;
        console.log('✓ Cantidad actualizada:', nuevaCantidad);
      }
    }
    
    await setDoc(carritoRef, {
      userId: userId,
      items: items,
      updatedAt: Timestamp.now()
    });
    
    console.log('✓ Carrito actualizado en Firestore');
    return { success: true, carrito: items };
  } catch (error) {
    console.error('❌ Error al actualizar cantidad:', error);
    return { success: false, error: error.message };
  }
};

export const limpiarCarrito = async (userId) => {
  try {
    console.log('🧹 Limpiando carrito');
    const carritoRef = doc(db, 'carritos', userId);
    await setDoc(carritoRef, {
      userId: userId,
      items: [],
      updatedAt: Timestamp.now()
    });
    
    console.log('✓ Carrito limpiado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al limpiar carrito:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PEDIDOS
// ============================================

export const crearPedido = async (pedidoData) => {
  try {
    console.log('📦 Creando pedido...');
    const pedidoRef = await addDoc(collection(db, 'pedidos'), {
      ...pedidoData,
      estado: 'pendiente',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      historialEstados: [
        {
          estado: 'pendiente',
          timestamp: Timestamp.now(),
          descripcion: 'Pedido creado, buscando repartidor disponible...'
        }
      ]
    });
    
    console.log('✓ Pedido creado con ID:', pedidoRef.id);
    return { success: true, pedidoId: pedidoRef.id };
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    return { success: false, error: error.message };
  }
};

export const obtenerPedidosUsuario = async (userId) => {
  try {
    const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
    const pedidos = [];
    
    pedidosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.clienteId === userId) {
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
    
    return { success: true, data: pedidos };
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return { success: false, error: error.message };
  }
};

export const escucharMisPedidos = (clienteId, callback) => {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const pedidos = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.clienteId === clienteId) {
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
        console.error('Error al escuchar pedidos:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al configurar listener:', error);
    return () => {};
  }
};

export const cancelarPedido = async (pedidoId, motivo = 'Cancelado por el cliente') => {
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
      canceladoPor: 'cliente',
      updatedAt: Timestamp.now(),
      historialEstados: [
        ...historialActual,
        {
          estado: 'cancelado',
          timestamp: Timestamp.now(),
          descripcion: motivo
        }
      ]
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    return { success: false, error: error.message };
  }
};

export const obtenerPedidoPorId = async (pedidoId) => {
  try {
    const pedidoDoc = await getDoc(doc(db, 'pedidos', pedidoId));
    if (pedidoDoc.exists()) {
      return {
        success: true,
        data: {
          id: pedidoDoc.id,
          ...pedidoDoc.data()
        }
      };
    } else {
      return {
        success: false,
        error: 'Pedido no encontrado'
      };
    }
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return {
      success: false,
      error: error.message
    };
  }
};