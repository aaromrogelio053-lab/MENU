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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
// CARRITO
// ============================================

export const obtenerCarrito = async (userId) => {
  try {
    const carritoStr = await AsyncStorage.getItem(`carrito_${userId}`);
    return carritoStr ? JSON.parse(carritoStr) : [];
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    return [];
  }
};

export const agregarAlCarrito = async (userId, plato) => {
  try {
    const carrito = await obtenerCarrito(userId);
    
    const index = carrito.findIndex(item => item.id === plato.id);
    
    if (index !== -1) {
      carrito[index].cantidad += 1;
    } else {
      carrito.push({
        id: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        imagen: plato.imagen || '',
        cantidad: 1
      });
    }
    
    await AsyncStorage.setItem(`carrito_${userId}`, JSON.stringify(carrito));
    return { success: true, carrito };
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return { success: false, error: error.message };
  }
};

export const actualizarCantidadCarrito = async (userId, platoId, cantidad) => {
  try {
    const carrito = await obtenerCarrito(userId);
    const index = carrito.findIndex(item => item.id === platoId);
    
    if (index !== -1) {
      if (cantidad <= 0) {
        carrito.splice(index, 1);
      } else {
        carrito[index].cantidad = cantidad;
      }
      
      await AsyncStorage.setItem(`carrito_${userId}`, JSON.stringify(carrito));
      return { success: true, carrito };
    }
    
    return { success: false, error: 'Item no encontrado' };
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    return { success: false, error: error.message };
  }
};

export const limpiarCarrito = async (userId) => {
  try {
    await AsyncStorage.removeItem(`carrito_${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PEDIDOS
// ============================================

export const crearPedido = async (pedidoData) => {
  try {
    const pedidoRef = await addDoc(collection(db, 'pedidos'), {
      ...pedidoData,
      estado: 'pendiente',
      createdAt: Timestamp.now(),
      historialEstados: [
        {
          estado: 'pendiente',
          timestamp: Timestamp.now(),
          descripcion: 'Pedido creado, esperando confirmación del restaurante'
        }
      ]
    });
    
    return { 
      success: true, 
      pedidoId: pedidoRef.id 
    };
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return { 
      success: false, 
      error: error.message 
    };
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
    
    // Ordenar por fecha (más recientes primero)
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

export const escucharPedidosUsuario = (userId, callback) => {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'pedidos'),
      (snapshot) => {
        const pedidos = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.clienteId === userId) {
            pedidos.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Ordenar por fecha (más recientes primero)
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