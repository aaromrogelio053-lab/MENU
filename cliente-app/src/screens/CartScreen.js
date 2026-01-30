import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  obtenerCarrito,
  actualizarCantidadCarrito,
  limpiarCarrito,
} from '../services/firebaseService';

const CartScreen = ({ navigation }) => {
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  useEffect(() => {
    cargarCarrito();
    const unsubscribe = navigation.addListener('focus', () => {
      cargarCarrito();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarCarrito = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const carritoData = await obtenerCarrito(userId);
        setCarrito(carritoData);
      }
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      Alert.alert('Error', 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = async (platoId, nuevaCantidad) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const resultado = await actualizarCantidadCarrito(userId, platoId, nuevaCantidad);
      if (resultado.success) {
        setCarrito(resultado.carrito);
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
    }
  };

  const vaciarCarrito = () => {
    Alert.alert(
      'Vaciar Carrito',
      '¿Seguro que quieres eliminar todos los productos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, vaciar',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              await limpiarCarrito(userId);
              setCarrito([]);
              Alert.alert('✓', 'Carrito vaciado');
            } catch (error) {
              console.error('Error al vaciar carrito:', error);
            }
          },
        },
      ]
    );
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const irAPagar = () => {
    if (carrito.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos antes de continuar');
      return;
    }

    navigation.navigate('Checkout', {
      carrito: carrito,
      subtotal: calcularSubtotal(),
      metodoPago: metodoPago
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.itemPrice}>S/ {item.precio.toFixed(2)}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => actualizarCantidad(item.id, item.cantidad - 1)}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.cantidad}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => actualizarCantidad(item.id, item.cantidad + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemRight}>
        <Text style={styles.itemTotal}>S/ {(item.precio * item.cantidad).toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => actualizarCantidad(item.id, 0)}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  if (carrito.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega productos del menú</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyButtonText}>Ver Menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = calcularSubtotal();
  const delivery = 5;
  const total = subtotal + delivery;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity onPress={vaciarCarrito}>
          <Text style={styles.clearButton}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <FlatList
          data={carrito}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>💳 Método de Pago</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              metodoPago === 'efectivo' && styles.paymentOptionSelected
            ]}
            onPress={() => setMetodoPago('efectivo')}
          >
            <View style={styles.paymentContent}>
              <Text style={styles.paymentIcon}>💵</Text>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>Efectivo</Text>
                <Text style={styles.paymentSubtitle}>Paga al recibir tu pedido</Text>
              </View>
            </View>
            {metodoPago === 'efectivo' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              metodoPago === 'yape' && styles.paymentOptionSelected
            ]}
            onPress={() => setMetodoPago('yape')}
          >
            <View style={styles.paymentContent}>
              <Text style={styles.paymentIcon}>📱</Text>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>Yape</Text>
                <Text style={styles.paymentSubtitle}>Pago por transferencia</Text>
              </View>
            </View>
            {metodoPago === 'yape' && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          {metodoPago === 'yape' && (
            <View style={styles.yapeInfo}>
              <Text style={styles.yapeInfoText}>
                ℹ️ Te enviaremos el número de Yape después de confirmar tu pedido
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>S/ {subtotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery:</Text>
          <Text style={styles.totalValue}>S/ {delivery.toFixed(2)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelFinal}>Total:</Text>
          <Text style={styles.totalValueFinal}>S/ {total.toFixed(2)}</Text>
        </View>

        <Text style={styles.paymentMethod}>
          {metodoPago === 'yape' ? '📱 Yape' : '💵 Efectivo'}
        </Text>
        
        <TouchableOpacity
          style={styles.orderButton}
          onPress={irAPagar}
        >
          <Text style={styles.orderButtonText}>Ir a Pagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    fontSize: 28,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  imagePlaceholder: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemRight: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    fontSize: 20,
  },
  paymentSection: {
    margin: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  paymentOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 24,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  yapeInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  yapeInfoText: {
    fontSize: 13,
    color: '#1976D2',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  paymentMethod: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen;