// src/screens/repartidor/RepartidorHomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, IconButton, Badge } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  escucharPedidosDisponibles,
  escucharMisPedidosRepartidor,
  aceptarPedido,
  rechazarPedido,
  marcarEnCamino,
  marcarEntregado
} from '../../services/firebaseService';

export default function RepartidorHomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [tabActiva, setTabActiva] = useState('disponibles');
  const [repartidorId, setRepartidorId] = useState(null);
  const [repartidorNombre, setRepartidorNombre] = useState('');
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);

  useEffect(() => {
    cargarDatosRepartidor();
  }, []);

  useEffect(() => {
    if (!repartidorId) return;

    const unsubscribeDisponibles = escucharPedidosDisponibles((pedidos) => {
      setPedidosDisponibles(pedidos);
    });

    const unsubscribeMisPedidos = escucharMisPedidosRepartidor(repartidorId, (pedidos) => {
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
      const nombre = await AsyncStorage.getItem('repartidorNombre');
      
      if (id) {
        setRepartidorId(id);
        setRepartidorNombre(nombre || 'Repartidor');
      }
    } catch (error) {
      console.error('Error cargar datos repartidor:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleAceptarPedido = async (pedidoId) => {
    if (!repartidorId) {
      Alert.alert('Error', 'No se pudo identificar al repartidor');
      return;
    }

    Alert.alert(
      'Aceptar Pedido',
      '¿Quieres aceptar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Aceptar',
          onPress: async () => {
            try {
              const result = await aceptarPedido(pedidoId, repartidorId, repartidorNombre);
              if (result.success) {
                Alert.alert('¡Éxito!', 'Pedido aceptado correctamente');
              } else {
                Alert.alert('Error', result.error || 'No se pudo aceptar el pedido');
              }
            } catch (error) {
              console.error('Error al aceptar pedido:', error);
              Alert.alert('Error', 'Ocurrió un error al aceptar el pedido');
            }
          }
        }
      ]
    );
  };

  const handleRechazarPedido = (pedidoId) => {
    Alert.alert(
      'Rechazar Pedido',
      '¿Seguro que quieres rechazar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            setPedidosDisponibles(prev => prev.filter(p => p.id !== pedidoId));
          }
        }
      ]
    );
  };

  const handleMarcarEnCamino = async (pedidoId) => {
    try {
      const result = await marcarEnCamino(pedidoId);
      if (result.success) {
        Alert.alert('¡Listo!', 'Pedido marcado como "En Camino"');
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error al marcar en camino:', error);
      Alert.alert('Error', 'Ocurrió un error');
    }
  };

  const handleMarcarEntregado = async (pedidoId) => {
    Alert.alert(
      'Confirmar Entrega',
      '¿El pedido fue entregado al cliente?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Entregado',
          onPress: async () => {
            try {
              const result = await marcarEntregado(pedidoId);
              if (result.success) {
                Alert.alert('¡Excelente!', '¡Pedido entregado con éxito! 🎉');
              } else {
                Alert.alert('Error', result.error || 'No se pudo actualizar el estado');
              }
            } catch (error) {
              console.error('Error al marcar entregado:', error);
              Alert.alert('Error', 'Ocurrió un error');
            }
          }
        }
      ]
    );
  };

  // ✅ NUEVA FUNCIÓN: Llamar al cliente
  const handleLlamar = (telefono) => {
    if (!telefono) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    // Limpiar el teléfono (quitar espacios, guiones, etc.)
    const telefonoLimpio = telefono.replace(/[^0-9+]/g, '');
    const url = `tel:${telefonoLimpio}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede realizar llamadas en este dispositivo');
        }
      })
      .catch((err) => {
        console.error('Error al abrir teléfono:', err);
        Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono');
      });
  };

  // ✅ NUEVA FUNCIÓN: Abrir WhatsApp
  const handleWhatsApp = (telefono) => {
    if (!telefono) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    // Limpiar el teléfono y asegurarse que tenga el código de país
    let telefonoLimpio = telefono.replace(/[^0-9]/g, '');
    
    // Si el teléfono empieza con 51 (Perú), lo dejamos
    // Si empieza con 9, le agregamos 51
    if (telefonoLimpio.startsWith('9') && telefonoLimpio.length === 9) {
      telefonoLimpio = '51' + telefonoLimpio;
    }
    
    const mensaje = encodeURIComponent('Hola, soy tu repartidor de Menú Arequipa. Estoy en camino con tu pedido 🚴');
    const url = `whatsapp://send?phone=${telefonoLimpio}&text=${mensaje}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert(
            'WhatsApp no disponible',
            '¿Deseas instalar WhatsApp?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Sí',
                onPress: () => {
                  const playStoreUrl = 'market://details?id=com.whatsapp';
                  Linking.openURL(playStoreUrl);
                }
              }
            ]
          );
        }
      })
      .catch((err) => {
        console.error('Error al abrir WhatsApp:', err);
        Alert.alert('Error', 'No se pudo abrir WhatsApp');
      });
  };

  // ✅ NUEVA FUNCIÓN: Abrir Google Maps
  const handleVerMapa = (pedido) => {
    const direccionTexto = typeof pedido.direccion === 'object' 
      ? pedido.direccion.direccion 
      : pedido.direccion;

    if (!direccionTexto) {
      Alert.alert('Error', 'No hay dirección disponible');
      return;
    }

    // Formatear dirección para Google Maps
    const direccionFormateada = `${direccionTexto}, Arequipa, Perú`;
    const direccionEncoded = encodeURIComponent(direccionFormateada);
    
    // URLs para diferentes plataformas
    const scheme = Platform.select({
      ios: 'maps:', // Apple Maps en iOS
      android: 'google.navigation:' // Google Maps en Android
    });
    
    const url = Platform.select({
      ios: `${scheme}q=${direccionEncoded}`,
      android: `${scheme}q=${direccionEncoded}&mode=d` // mode=d para modo conducción
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${direccionEncoded}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Si no hay app de mapas, abrir en navegador
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error al abrir mapa:', err);
        Alert.alert('Error', 'No se pudo abrir el mapa');
      });
  };

  const calcularTotales = () => {
    const disponiblesCount = pedidosDisponibles.length;
    const enCaminoCount = misPedidos.filter(p => p.estado === 'en_camino').length;
    const listoCount = misPedidos.filter(p => p.estado === 'confirmado' || p.estado === 'listo').length;
    const totalHoy = misPedidos.reduce((sum, p) => {
      const subtotal = p.subtotal || 0;
      const delivery = p.costoDelivery || 0;
      return sum + subtotal + delivery;
    }, 0);

    return { disponiblesCount, enCaminoCount, listoCount, totalHoy };
  };

  const totales = calcularTotales();

  const renderPedidoDisponible = (pedido) => {
    const direccionTexto = typeof pedido.direccion === 'object' 
      ? pedido.direccion.direccion 
      : pedido.direccion;
    const referencia = typeof pedido.direccion === 'object' 
      ? pedido.direccion.referencia 
      : '';
    const total = (pedido.subtotal || 0) + (pedido.costoDelivery || 0);

    return (
      <Card key={pedido.id} style={styles.card}>
        <Card.Content>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.pedidoId}>#{pedido.id.substring(0, 8)}</Text>
              <Text style={styles.pedidoHora}>
                🕐 {pedido.createdAt?.toDate ? 
                  new Date(pedido.createdAt.toDate()).toLocaleTimeString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'Ahora'}
              </Text>
            </View>
            <Chip style={styles.nuevoChip} textStyle={styles.nuevoText}>
              🆕 Nuevo
            </Chip>
          </View>

          {/* Cliente */}
          <View style={styles.clienteInfo}>
            <Text style={styles.clienteNombre}>👤 {pedido.clienteNombre || 'Cliente'}</Text>
            <Text style={styles.clienteTelefono}>📞 {pedido.clienteTelefono || 'Sin teléfono'}</Text>
          </View>

          {/* Dirección */}
          <View style={styles.direccionContainer}>
            <Text style={styles.direccionIcon}>📍</Text>
            <View style={styles.direccionTexto}>
              <Text style={styles.direccion}>{direccionTexto || 'Sin dirección'}</Text>
              {referencia && (
                <Text style={styles.referencia}>Ref: {referencia}</Text>
              )}
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsTitle}>Pedido:</Text>
            {pedido.items && pedido.items.map((item, index) => (
              <Text key={index} style={styles.item}>
                • {item.cantidad}x {item.nombre}
              </Text>
            ))}
          </View>

          {/* Total */}
          <View style={styles.paymentContainer}>
            <Text style={styles.metodoPago}>💳 {pedido.metodoPago || 'Efectivo'}</Text>
            <Text style={styles.total}>S/ {total.toFixed(2)}</Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rechazarButton}
              onPress={() => handleRechazarPedido(pedido.id)}
            >
              <Text style={styles.rechazarButtonText}>✗ Rechazar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.aceptarButton}
              onPress={() => handleAceptarPedido(pedido.id)}
            >
              <Text style={styles.aceptarButtonText}>✓ Aceptar Pedido</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMiPedido = (pedido) => {
    const direccionTexto = typeof pedido.direccion === 'object' 
      ? pedido.direccion.direccion 
      : pedido.direccion;
    const referencia = typeof pedido.direccion === 'object' 
      ? pedido.direccion.referencia 
      : '';
    const total = (pedido.subtotal || 0) + (pedido.costoDelivery || 0);

    const esListo = pedido.estado === 'confirmado' || pedido.estado === 'listo';
    const esEnCamino = pedido.estado === 'en_camino';

    return (
      <Card key={pedido.id} style={styles.card}>
        <Card.Content>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.pedidoId}>#{pedido.id.substring(0, 8)}</Text>
            </View>
            
            <Chip
              style={[
                styles.estadoChip,
                esListo && styles.listoChip,
                esEnCamino && styles.enCaminoChip
              ]}
              textStyle={styles.estadoText}
            >
              {esListo && '📦 Listo'}
              {esEnCamino && '🚴 En Camino'}
            </Chip>
          </View>

          {/* Cliente */}
          <View style={styles.clienteInfo}>
            <Text style={styles.clienteNombre}>👤 Cliente</Text>
            <Text style={styles.clienteTelefono}>📞 {pedido.clienteTelefono || 'Sin teléfono'}</Text>
          </View>

          {/* ✅ BOTONES DE CONTACTO ARREGLADOS */}
          <View style={styles.contactoContainer}>
            <TouchableOpacity
              style={styles.contactoButton}
              onPress={() => handleLlamar(pedido.clienteTelefono)}
            >
              <Text style={styles.contactoButtonText}>📞 Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactoButtonWhatsApp}
              onPress={() => handleWhatsApp(pedido.clienteTelefono)}
            >
              <Text style={styles.contactoButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Dirección */}
          <View style={styles.direccionContainer}>
            <Text style={styles.direccionIcon}>📍</Text>
            <View style={styles.direccionTexto}>
              <Text style={styles.direccion}>{direccionTexto || 'Sin dirección'}</Text>
              {referencia && (
                <Text style={styles.referencia}>Ref: {referencia}</Text>
              )}
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsTitle}>Pedido:</Text>
            {pedido.items && pedido.items.map((item, index) => (
              <Text key={index} style={styles.item}>
                • {item.cantidad}x {item.nombre}
              </Text>
            ))}
          </View>

          {/* Total */}
          <View style={styles.paymentContainer}>
            <Text style={styles.metodoPago}>💳 {pedido.metodoPago || 'efectivo'}</Text>
            <Text style={styles.total}>S/ {total.toFixed(2)}</Text>
          </View>

          {/* Botones de acción según estado */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => handleVerMapa(pedido)}
            >
              <Text style={styles.mapButtonText}>🗺️ Ver Mapa</Text>
            </TouchableOpacity>

            {esListo && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleMarcarEnCamino(pedido.id)}
              >
                <Text style={styles.startButtonText}>Iniciar Entrega</Text>
              </TouchableOpacity>
            )}

            {esEnCamino && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleMarcarEntregado(pedido.id)}
              >
                <Text style={styles.completeButtonText}>✓ Entregado</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola {repartidorNombre}! 🚴</Text>
          <Text style={styles.title}>Tus Entregas</Text>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('SelectRole')}>
          <IconButton icon="logout" iconColor="#FF6B35" size={24} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totales.disponiblesCount}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totales.enCaminoCount}</Text>
          <Text style={styles.statLabel}>En Camino</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>S/ {totales.totalHoy.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tabActiva === 'disponibles' && styles.tabActiva]}
          onPress={() => setTabActiva('disponibles')}
        >
          <Text style={[styles.tabText, tabActiva === 'disponibles' && styles.tabTextActiva]}>
            📋 Disponibles
          </Text>
          {totales.disponiblesCount > 0 && (
            <Badge style={styles.badge}>{totales.disponiblesCount}</Badge>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActiva === 'mis_pedidos' && styles.tabActiva]}
          onPress={() => setTabActiva('mis_pedidos')}
        >
          <Text style={[styles.tabText, tabActiva === 'mis_pedidos' && styles.tabTextActiva]}>
            📦 Mis Pedidos
          </Text>
          {misPedidos.length > 0 && (
            <Badge style={styles.badge}>{misPedidos.length}</Badge>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tabActiva === 'disponibles' ? (
          pedidosDisponibles.length > 0 ? (
            pedidosDisponibles.map(renderPedidoDisponible)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No hay pedidos disponibles</Text>
              <Text style={styles.emptyText}>
                Los nuevos pedidos aparecerán aquí
              </Text>
            </View>
          )
        ) : (
          misPedidos.length > 0 ? (
            misPedidos.map(renderMiPedido)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No tienes pedidos asignados</Text>
              <Text style={styles.emptyText}>
                Acepta pedidos disponibles para empezar
              </Text>
            </View>
          )
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  tabActiva: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActiva: {
    color: '#4CAF50',
  },
  badge: {
    backgroundColor: '#4CAF50',
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pedidoId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoHora: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  nuevoChip: {
    backgroundColor: '#FFF3E0',
    height: 32,
  },
  nuevoText: {
    fontWeight: '600',
    color: '#F57C00',
  },
  estadoChip: {
    height: 32,
  },
  listoChip: {
    backgroundColor: '#FFF3E0',
  },
  enCaminoChip: {
    backgroundColor: '#E8F5E9',
  },
  estadoText: {
    fontWeight: '600',
  },
  clienteInfo: {
    marginBottom: 12,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clienteTelefono: {
    fontSize: 14,
    color: '#666',
  },
  contactoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  contactoButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactoButtonWhatsApp: {
    flex: 1,
    backgroundColor: '#25D366',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  direccionContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  direccionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  direccionTexto: {
    flex: 1,
  },
  direccion: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  referencia: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  item: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metodoPago: {
    fontSize: 14,
    color: '#666',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  aceptarButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  aceptarButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  rechazarButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  rechazarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF5350',
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 16,
  },
});