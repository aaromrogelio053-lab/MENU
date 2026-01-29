// src/screens/CheckoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, RadioButton, TextInput, Divider } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import { crearPedido } from '../services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen({ navigation }) {
  const { cartItems, getSubtotal, getDeliveryCost, getTotal, clearCart } = useCart();
  
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      const phone = await AsyncStorage.getItem('userPhone');
      
      if (id) {
        setUserId(id);
        console.log('✅ userId cargado:', id);
      }
      
      if (phone) {
        setTelefono(phone);
      }
    } catch (error) {
      console.error('Error cargar datos usuario:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!direccion.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu dirección de entrega');
      return;
    }
    
    if (!telefono.trim() || telefono.length < 9) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar al usuario. Por favor inicia sesión nuevamente.');
      return;
    }

    setLoading(true);

    try {
      const pedidoData = {
        clienteId: userId,  // ← AHORA USA EL userId DE ASYNCSTORAGE
        clienteNombre: 'Cliente',
        clienteTelefono: telefono,
        items: cartItems,
        direccion: {
          direccion: direccion,
          referencia: referencia,
        },
        metodoPago: metodoPago,
        notas: notas,
        subtotal: getSubtotal(),
        costoDelivery: getDeliveryCost(),
        estado: 'pendiente',
        repartidorId: null,
        repartidorNombre: null,
        repartidorTelefono: null
      };

      console.log('📦 Creando pedido con clienteId:', userId);

      const result = await crearPedido(pedidoData);
      
      if (result.success) {
        clearCart();
        
        Alert.alert(
          '¡Pedido realizado!',
          `Tu pedido #${result.id.slice(-6)} ha sido recibido. Te contactaremos pronto.`,
          [
            {
              text: 'Ver mis pedidos',
              onPress: () => navigation.navigate('Orders')
            },
            {
              text: 'Volver al inicio',
              onPress: () => navigation.navigate('Home')
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
          <IconButton icon="arrow-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Resumen del pedido</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              {cartItems.length} {cartItems.length === 1 ? 'plato' : 'platos'}
            </Text>
            <Text style={styles.summaryAmount}>S/ {getTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Datos de entrega</Text>
          
          <TextInput
            mode="outlined"
            label="Dirección de entrega *"
            placeholder="Ej: Av. Ejercito 123, Yanahuara"
            value={direccion}
            onChangeText={setDireccion}
            style={styles.input}
            multiline
            numberOfLines={2}
          />

          <TextInput
            mode="outlined"
            label="Referencia"
            placeholder="Ej: Casa verde, portón negro"
            value={referencia}
            onChangeText={setReferencia}
            style={styles.input}
            multiline
            numberOfLines={2}
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
            left={<TextInput.Affix text="+51" />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Método de pago</Text>
          
          <TouchableOpacity style={styles.paymentOption} onPress={() => setMetodoPago('efectivo')}>
            <RadioButton value="efectivo" status={metodoPago === 'efectivo' ? 'checked' : 'unchecked'} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Efectivo</Text>
              <Text style={styles.paymentDescription}>Paga al recibir tu pedido</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => setMetodoPago('yape')}>
            <RadioButton value="yape" status={metodoPago === 'yape' ? 'checked' : 'unchecked'} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Yape</Text>
              <Text style={styles.paymentDescription}>Te enviaremos el número</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => setMetodoPago('plin')}>
            <RadioButton value="plin" status={metodoPago === 'plin' ? 'checked' : 'unchecked'} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Plin</Text>
              <Text style={styles.paymentDescription}>Te enviaremos el número</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.paymentOption} onPress={() => setMetodoPago('transferencia')}>
            <RadioButton value="transferencia" status={metodoPago === 'transferencia' ? 'checked' : 'unchecked'} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Transferencia bancaria</Text>
              <Text style={styles.paymentDescription}>Te enviaremos los datos</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas adicionales (opcional)</Text>
          <TextInput
            mode="outlined"
            label="Instrucciones especiales"
            placeholder="Ej: Sin cebolla, extra picante..."
            value={notas}
            onChangeText={setNotas}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>S/ {getSubtotal().toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery</Text>
            <Text style={styles.priceValue}>S/ {getDeliveryCost().toFixed(2)}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>S/ {getTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={loading || !userId}
          style={styles.orderButton}
          contentStyle={styles.orderButtonContent}
          buttonColor="#FF6B35"
        >
          Realizar pedido - S/ {getTotal().toFixed(2)}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF5F0', padding: 16, borderRadius: 8 },
  summaryText: { fontSize: 16, color: '#666' },
  summaryAmount: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  paymentInfo: { flex: 1, marginLeft: 8 },
  paymentTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  paymentDescription: { fontSize: 14, color: '#666', marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 16, color: '#666' },
  priceValue: { fontSize: 16, color: '#333' },
  divider: { marginVertical: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  footer: { backgroundColor: '#fff', padding: 16, elevation: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  orderButton: { borderRadius: 8 },
  orderButtonContent: { paddingVertical: 8 },
  bottomPadding: { height: 16 },
});