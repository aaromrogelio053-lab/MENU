import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crearPedido, limpiarCarrito } from '../services/firebaseService';

export default function CheckoutScreen({ route, navigation }) {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ubicacionCoordenadas, setUbicacionCoordenadas] = useState(null);
  const [referencia, setReferencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');

  // Estados para datos persistentes del pedido
  const [carrito, setCarrito] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const costoDelivery = 5;
  const total = subtotal + costoDelivery;

  useEffect(() => {
    cargarDatosUsuario();
    cargarDatosIniciales();
  }, []);

  // Escuchar cambios en los parámetros de navegación
  useEffect(() => {
    if (route.params?.direccionSeleccionada) {
      setDireccion(route.params.direccionSeleccionada);
    }
    if (route.params?.coordenadas) {
      setUbicacionCoordenadas(route.params.coordenadas);
    }
  }, [route.params?.direccionSeleccionada, route.params?.coordenadas]);

  const cargarDatosIniciales = () => {
    // Cargar datos del pedido desde los parámetros de navegación
    if (route.params) {
      if (route.params.carrito) setCarrito(route.params.carrito);
      if (route.params.subtotal) setSubtotal(route.params.subtotal);
      if (route.params.metodoPago) setMetodoPago(route.params.metodoPago);
      if (route.params.direccionSeleccionada) setDireccion(route.params.direccionSeleccionada);
      if (route.params.coordenadas) setUbicacionCoordenadas(route.params.coordenadas);
    }
  };

  const cargarDatosUsuario = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      const nombre = await AsyncStorage.getItem('userName');
      const tel = await AsyncStorage.getItem('userPhone');
      
      if (id) setUserId(id);
      if (nombre) setUserName(nombre);
      if (tel) setTelefono(tel);
    } catch (error) {
      console.error('Error cargar datos usuario:', error);
    }
  };

  const abrirMapaPicker = () => {
    // Pasar TODOS los datos actuales al mapa para no perderlos
    navigation.navigate('MapPicker', {
      direccionInicial: direccion,
      // Pasar datos del pedido para mantenerlos
      carritoData: carrito,
      subtotalData: subtotal,
      metodoPagoData: metodoPago,
    });
  };

  const handleRealizarPedido = async () => {
    if (!direccion.trim()) {
      Alert.alert('Error', 'Por favor ingresa o selecciona tu dirección de entrega');
      return;
    }
    
    if (!telefono.trim() || telefono.length < 9) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido (mínimo 9 dígitos)');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar al usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    if (!carrito || carrito.length === 0) {
      Alert.alert('Error', 'No hay productos en el carrito');
      return;
    }

    setLoading(true);

    try {
      const pedidoData = {
        clienteId: userId,
        clienteNombre: userName || 'Cliente',
        clienteTelefono: telefono.trim(),
        items: carrito,
        subtotal: subtotal,
        costoDelivery: costoDelivery,
        total: total,
        direccion: direccion.trim(),
        coordenadas: ubicacionCoordenadas,
        referencia: referencia.trim(),
        metodoPago: metodoPago === 'yape' ? 'Yape' : 'Efectivo',
        notas: notas.trim(),
        estado: 'pendiente',
      };

      console.log('📦 Creando pedido:', pedidoData);

      const result = await crearPedido(pedidoData);
      
      if (result.success) {
        await limpiarCarrito(userId);
        
        Alert.alert(
          '¡Pedido Realizado! 🎉',
          `Tu pedido ha sido registrado correctamente.\n\nTotal: S/ ${total.toFixed(2)}\nMétodo de pago: ${metodoPago === 'yape' ? 'Yape' : 'Efectivo'}\n\nEstamos buscando un repartidor disponible...`,
          [
            {
              text: 'Ver Mis Pedidos',
              onPress: () => navigation.navigate('HomeTabs', { screen: 'Orders' })
            },
            {
              text: 'Volver al Inicio',
              onPress: () => navigation.navigate('HomeTabs', { screen: 'Home' })
            }
          ]
        );
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error al crear pedido:', error);
      Alert.alert('Error', 'No se pudo procesar tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Resumen del pedido</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
            </Text>
            <Text style={styles.summaryAmount}>S/ {total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.productsList}>
            {carrito.map((item, index) => (
              <View key={index} style={styles.productItem}>
                <Text style={styles.productQuantity}>{item.cantidad}x</Text>
                <Text style={styles.productName}>{item.nombre}</Text>
                <Text style={styles.productPrice}>S/ {(item.precio * item.cantidad).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Datos de entrega</Text>
          
          <TextInput
            mode="outlined"
            label="Dirección de entrega *"
            placeholder="Ej: Calle Juan Manuel Polar 530, Yanahuara"
            value={direccion}
            onChangeText={setDireccion}
            style={styles.input}
            multiline
            numberOfLines={2}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
          />

          <Button
            mode="outlined"
            onPress={abrirMapaPicker}
            style={styles.mapButton}
            icon="map-marker"
            textColor="#FF6B35"
          >
            {ubicacionCoordenadas ? 'Cambiar ubicación en mapa' : 'Seleccionar en mapa'}
          </Button>

          {ubicacionCoordenadas && (
            <View style={styles.coordsInfo}>
              <Text style={styles.coordsText}>
                ✓ Ubicación seleccionada en el mapa
              </Text>
            </View>
          )}

          <TextInput
            mode="outlined"
            label="Referencia (Opcional)"
            placeholder="Ej: Casa verde, portón negro, 3er piso"
            value={referencia}
            onChangeText={setReferencia}
            style={styles.input}
            multiline
            numberOfLines={2}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
          />

          <TextInput
            mode="outlined"
            label="Nombre completo"
            value={userName}
            onChangeText={setUserName}
            style={styles.input}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
          />

          <TextInput
            mode="outlined"
            label="Teléfono de contacto *"
            placeholder="987654321"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            maxLength={9}
            style={styles.input}
            left={<TextInput.Affix text="+51 " />}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas adicionales (opcional)</Text>
          <TextInput
            mode="outlined"
            label="Instrucciones especiales"
            placeholder="Ej: Sin cebolla, extra picante, llamar al llegar..."
            value={notas}
            onChangeText={setNotas}
            style={styles.input}
            multiline
            numberOfLines={3}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>S/ {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery</Text>
            <Text style={styles.priceValue}>S/ {costoDelivery.toFixed(2)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoText}>
              {metodoPago === 'yape' ? '📱 Pago con Yape' : '💵 Pago en Efectivo'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleRealizarPedido}
          loading={loading}
          disabled={loading}
          style={styles.orderButton}
          contentStyle={styles.orderButtonContent}
          buttonColor="#FF6B35"
        >
          Confirmar Pedido - S/ {total.toFixed(2)}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: '#fff', 
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { fontSize: 28, color: '#333' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  summaryBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF5F0', 
    padding: 16, 
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: { fontSize: 16, color: '#666' },
  summaryAmount: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  productsList: { marginTop: 8 },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productQuantity: { fontSize: 14, fontWeight: '600', color: '#666', width: 40 },
  productName: { flex: 1, fontSize: 14, color: '#333' },
  productPrice: { fontSize: 14, fontWeight: '600', color: '#FF6B35' },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  mapButton: { marginBottom: 12, borderColor: '#FF6B35' },
  coordsInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordsText: { fontSize: 13, color: '#2E7D32' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 16, color: '#666' },
  priceValue: { fontSize: 16, color: '#333' },
  divider: { marginVertical: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  paymentInfo: {
    backgroundColor: '#FFF5F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: { backgroundColor: '#fff', padding: 16, elevation: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  orderButton: { borderRadius: 8 },
  orderButtonContent: { paddingVertical: 8 },
  bottomPadding: { height: 16 },
});