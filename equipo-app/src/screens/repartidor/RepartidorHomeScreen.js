import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  escucharPedidosDisponibles,
  escucharMisPedidosRepartidor,
  aceptarPedido,
  rechazarPedidoRepartidor,
  marcarEnCamino,
  marcarEntregado,
  actualizarDisponibilidadRepartidor,
  obtenerDisponibilidadRepartidor,
} from '../../services/firebaseService';

export default function RepartidorHomeScreen({ navigation }) {
  const [tabActivo, setTabActivo] = useState('disponibles');
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);
  const [repartidorId, setRepartidorId] = useState(null);
  const [repartidorNombre, setRepartidorNombre] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarDatosRepartidor();
  }, []);

  useEffect(() => {
    if (!repartidorId) return;

    const unsubscribeDisponibles = escucharPedidosDisponibles((pedidos) => {
      console.log('📦 Pedidos disponibles:', pedidos.length);
      setPedidosDisponibles(pedidos);
    });

    const unsubscribeMisPedidos = escucharMisPedidosRepartidor(repartidorId, (pedidos) => {
      console.log('🚚 Mis pedidos:', pedidos.length);
      setMisPedidos(pedidos);
    });

    return () => {
      unsubscribeDisponibles();
      unsubscribeMisPedidos();
    };
  }, [repartidorId]);

  const cargarDatosRepartidor = async () => {
    try {
      const id = await AsyncStorage.getItem('repartidorId');
      const nombre = await AsyncStorage.getItem('userName');
      
      console.log('👤 Cargando datos del repartidor:', id, nombre);
      
      if (id) {
        setRepartidorId(id);
        setRepartidorNombre(nombre || 'Repartidor');
        
        console.log('📖 Obteniendo disponibilidad...');
        const result = await obtenerDisponibilidadRepartidor(id);
        if (result.success) {
          console.log('✓ Disponibilidad cargada:', result.disponible);
          setDisponible(result.disponible);
        } else {
          console.error('❌ Error al obtener disponibilidad:', result.error);
        }
      } else {
        console.error('❌ No se encontró repartidorId en AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del repartidor:', error);
    }
  };

  const toggleDisponibilidad = async () => {
    if (!repartidorId) {
      Alert.alert('Error', 'No se pudo identificar al repartidor');
      return;
    }

    try {
      console.log('🔄 Cambiando disponibilidad...');
      const nuevoEstado = !disponible;
      
      const result = await actualizarDisponibilidadRepartidor(repartidorId, nuevoEstado);
      
      if (result.success) {
        setDisponible(nuevoEstado);
        console.log('✓ Disponibilidad cambiada a:', nuevoEstado);
        Alert.alert(
          nuevoEstado ? '✓ Ahora estás disponible' : '✓ Ahora estás NO disponible',
          nuevoEstado 
            ? 'Podrás recibir nuevos pedidos automáticamente' 
            : 'No recibirás nuevos pedidos hasta que te marques como disponible'
        );
      } else {
        console.error('❌ Error en resultado:', result.error);
        Alert.alert('Error', 'No se pudo actualizar tu disponibilidad: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error al cambiar disponibilidad:', error);
      Alert.alert('Error', 'Ocurrió un error al cambiar tu disponibilidad: ' + error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosRepartidor();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAceptarPedido = async (pedido) => {
    if (!disponible) {
      Alert.alert(
        'No disponible',
        'Debes marcarte como DISPONIBLE antes de aceptar pedidos',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Marcarme disponible',
            onPress: toggleDisponibilidad
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Aceptar Pedido',
      `¿Aceptar pedido de ${pedido.clienteNombre}?\n\nTotal: S/ ${pedido.total?.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            const result = await aceptarPedido(pedido.id, repartidorId, repartidorNombre);
            if (result.success) {
              Alert.alert('✓ Pedido Aceptado', 'El pedido fue asignado a ti');
            } else {
              Alert.alert('Error', result.error || 'No se pudo aceptar el pedido');
            }
          }
        }
      ]
    );
  };

  const handleRechazarPedido = async (pedido) => {
    Alert.alert(
      'Rechazar Pedido',
      `¿Seguro que quieres rechazar este pedido de ${pedido.clienteNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            const result = await rechazarPedidoRepartidor(pedido.id, repartidorId);
            if (result.success) {
              Alert.alert('✓ Pedido Rechazado', 'El pedido fue removido de tu lista');
            } else {
              Alert.alert('Error', 'No se pudo rechazar el pedido');
            }
          }
        }
      ]
    );
  };

  const handleLlamar = (telefono) => {
    if (!telefono) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }
    
    const numeroLimpio = telefono.replace(/\D/g, '');
    const url = `tel:${numeroLimpio}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede realizar la llamada');
        }
      })
      .catch((err) => console.error('Error al intentar llamar:', err));
  };

  const handleWhatsApp = async (telefono) => {
    if (!telefono) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }
    
    let numeroLimpio = telefono.replace(/\D/g, '');
    
    if (numeroLimpio.startsWith('51')) {
      numeroLimpio = numeroLimpio;
    } else if (numeroLimpio.length === 9) {
      numeroLimpio = '51' + numeroLimpio;
    }
    
    const mensaje = 'Hola! Soy tu repartidor. Estoy en camino con tu pedido 🛵';
    const url = `whatsapp://send?phone=${numeroLimpio}&text=${encodeURIComponent(mensaje)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp no disponible',
          'WhatsApp no está instalado en este dispositivo',
          [
            {
              text: 'Instalar WhatsApp',
              onPress: () => {
                const storeUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                  : 'https://play.google.com/store/apps/details?id=com.whatsapp';
                Linking.openURL(storeUrl);
              }
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const handleVerMapa = (direccion) => {
    if (!direccion) {
      Alert.alert('Error', 'No hay dirección disponible');
      return;
    }
    
    const direccionCompleta = direccion.includes('Arequipa') 
      ? direccion 
      : `${direccion}, Arequipa, Perú`;
    
    const encodedAddress = encodeURIComponent(direccionCompleta);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`
    });
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => console.error('Error al abrir mapa:', err));
  };

  const handleIniciarEntrega = async (pedidoId) => {
    Alert.alert(
      'Iniciar Entrega',
      '¿El pedido está listo y vas en camino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, en camino',
          onPress: async () => {
            const result = await marcarEnCamino(pedidoId);
            if (result.success) {
              Alert.alert('✓', 'Pedido marcado como "En camino"');
            } else {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            }
          }
        }
      ]
    );
  };

  const handleMarcarEntregado = async (pedidoId) => {
    Alert.alert(
      'Confirmar Entrega',
      '¿El pedido fue entregado al cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, entregado',
          onPress: async () => {
            const result = await marcarEntregado(pedidoId);
            if (result.success) {
              Alert.alert('✓ Entregado', 'Pedido completado exitosamente');
            } else {
              Alert.alert('Error', 'No se pudo marcar como entregado');
            }
          }
        }
      ]
    );
  };

  const renderPedidoDisponible = ({ item }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <View>
          <Text style={styles.pedidoCliente}>👤 {item.clienteNombre || 'Cliente'}</Text>
          <Text style={styles.pedidoFecha}>
            {item.createdAt?.toDate().toLocaleString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <Text style={styles.pedidoTotal}>S/ {item.total?.toFixed(2)}</Text>
      </View>

      <View style={styles.pedidoInfo}>
        <Text style={styles.infoLabel}>📍 Dirección:</Text>
        <Text style={styles.infoText}>{item.direccion || 'No especificada'}</Text>
        
        {item.referencia ? (
          <>
            <Text style={styles.infoLabel}>📌 Referencia:</Text>
            <Text style={styles.infoText}>{item.referencia}</Text>
          </>
        ) : null}

        <Text style={styles.infoLabel}>📞 Teléfono:</Text>
        <Text style={styles.infoText}>{item.clienteTelefono || 'No disponible'}</Text>

        <Text style={styles.infoLabel}>🍽️ Productos:</Text>
        {item.items?.map((producto, index) => (
          <Text key={index} style={styles.productoItem}>
            • {producto.cantidad}x {producto.nombre}
          </Text>
        ))}

        <Text style={styles.infoLabel}>💳 Pago:</Text>
        <Text style={styles.infoText}>{item.metodoPago || 'Efectivo'}</Text>
      </View>

      <View style={styles.pedidoActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAceptarPedido(item)}
        >
          <Text style={styles.actionButtonText}>✓ Aceptar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRechazarPedido(item)}
        >
          <Text style={styles.actionButtonText}>✕ Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMiPedido = ({ item }) => {
    const estadoConfig = {
      confirmado: { color: '#2196F3', texto: 'Confirmado', icono: '✓' },
      en_preparacion: { color: '#FF9800', texto: 'En Preparación', icono: '👨‍🍳' },
      listo: { color: '#4CAF50', texto: 'Listo', icono: '✓' },
      en_camino: { color: '#9C27B0', texto: 'En Camino', icono: '🚚' },
    };

    const config = estadoConfig[item.estado] || { color: '#666', texto: item.estado, icono: '•' };

    return (
      <View style={styles.pedidoCard}>
        <View style={styles.pedidoHeader}>
          <View>
            <Text style={styles.pedidoCliente}>👤 {item.clienteNombre || 'Cliente'}</Text>
            <View style={[styles.estadoBadge, { backgroundColor: config.color }]}>
              <Text style={styles.estadoTexto}>{config.icono} {config.texto}</Text>
            </View>
          </View>
          <Text style={styles.pedidoTotal}>S/ {item.total?.toFixed(2)}</Text>
        </View>

        <View style={styles.pedidoInfo}>
          <Text style={styles.infoLabel}>📍 Dirección:</Text>
          <Text style={styles.infoText}>{item.direccion || 'No especificada'}</Text>
          
          {item.referencia ? (
            <>
              <Text style={styles.infoLabel}>📌 Referencia:</Text>
              <Text style={styles.infoText}>{item.referencia}</Text>
            </>
          ) : null}

          <Text style={styles.infoLabel}>📞 Teléfono:</Text>
          <Text style={styles.infoText}>{item.clienteTelefono || 'No disponible'}</Text>

          <Text style={styles.infoLabel}>🍽️ Productos:</Text>
          {item.items?.map((producto, index) => (
            <Text key={index} style={styles.productoItem}>
              • {producto.cantidad}x {producto.nombre}
            </Text>
          ))}

          <Text style={styles.infoLabel}>💳 Pago:</Text>
          <Text style={styles.infoText}>{item.metodoPago || 'Efectivo'}</Text>

          {item.notas ? (
            <>
              <Text style={styles.infoLabel}>📝 Notas:</Text>
              <Text style={styles.infoText}>{item.notas}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.pedidoActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleLlamar(item.clienteTelefono)}
          >
            <Text style={styles.actionButtonText}>📞 Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => handleWhatsApp(item.clienteTelefono)}
          >
            <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => handleVerMapa(item.direccion)}
          >
            <Text style={styles.actionButtonText}>🗺️ Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ BOTÓN INICIAR ENTREGA (cuando estado = listo o confirmado) */}
        {(item.estado === 'listo' || item.estado === 'confirmado') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={() => handleIniciarEntrega(item.id)}
          >
            <Text style={styles.actionButtonText}>🚚 Iniciar Entrega</Text>
          </TouchableOpacity>
        )}

        {/* ✅ BOTÓN MARCAR ENTREGADO (cuando estado = en_camino) */}
        {item.estado === 'en_camino' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleMarcarEntregado(item.id)}
          >
            <Text style={styles.actionButtonText}>✓ Marcar Entregado</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Repartidor</Text>
          <Text style={styles.headerSubtitle}>{repartidorNombre}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.disponibilidadButton,
            disponible ? styles.disponibleButton : styles.noDisponibleButton
          ]}
          onPress={toggleDisponibilidad}
        >
          <Text style={styles.disponibilidadText}>
            {disponible ? '✓ Disponible' : '✕ No Disponible'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pedidosDisponibles.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{misPedidos.length}</Text>
          <Text style={styles.statLabel}>En Proceso</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {misPedidos.filter(p => p.estado === 'en_camino').length}
          </Text>
          <Text style={styles.statLabel}>En Camino</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'disponibles' && styles.tabActivo]}
          onPress={() => setTabActivo('disponibles')}
        >
          <Text style={[styles.tabText, tabActivo === 'disponibles' && styles.tabTextoActivo]}>
            📦 Disponibles ({pedidosDisponibles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActivo === 'misPedidos' && styles.tabActivo]}
          onPress={() => setTabActivo('misPedidos')}
        >
          <Text style={[styles.tabText, tabActivo === 'misPedidos' && styles.tabTextoActivo]}>
            🚚 Mis Pedidos ({misPedidos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tabActivo === 'disponibles' ? pedidosDisponibles : misPedidos}
        renderItem={tabActivo === 'disponibles' ? renderPedidoDisponible : renderMiPedido}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {tabActivo === 'disponibles' ? '📦' : '🚚'}
            </Text>
            <Text style={styles.emptyText}>
              {tabActivo === 'disponibles'
                ? disponible 
                  ? 'No hay pedidos disponibles'
                  : 'Activa tu disponibilidad para ver pedidos'
                : 'No tienes pedidos asignados'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  disponibilidadButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
  },
  disponibleButton: {
    backgroundColor: '#4CAF50',
  },
  noDisponibleButton: {
    backgroundColor: '#F44336',
  },
  disponibilidadText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActivo: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextoActivo: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
  },
  pedidoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pedidoCliente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoFecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pedidoTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  estadoTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pedidoInfo: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  productoItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginVertical: 2,
  },
  pedidoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  callButton: {
    backgroundColor: '#2196F3',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  mapButton: {
    backgroundColor: '#FF9800',
  },
  deliveryButton: {
    backgroundColor: '#9C27B0',
    width: '100%',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});