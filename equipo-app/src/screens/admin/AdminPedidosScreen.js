// src/screens/admin/AdminPedidosScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconButton, Chip, Button } from 'react-native-paper';
import { 
  obtenerTodosPedidos, 
  escucharTodosPedidos,
  actualizarEstadoPedido
} from '../../services/firebaseService';

export default function AdminPedidosScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    cargarDatos();
    
    // Escuchar cambios en tiempo real de pedidos
    const unsubscribePedidos = escucharTodosPedidos((pedidosActualizados) => {
      setPedidos(pedidosActualizados);
      setLoading(false);
    });

    return () => {
      unsubscribePedidos();
    };
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Cargar pedidos
    const resultPedidos = await obtenerTodosPedidos();
    if (resultPedidos.success) {
      setPedidos(resultPedidos.data);
    } else {
      console.error('Error cargar pedidos:', resultPedidos.error);
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const result = await actualizarEstadoPedido(pedidoId, nuevoEstado);
      if (result.success) {
        Alert.alert('Éxito', 'Estado del pedido actualizado correctamente');
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el estado');
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el estado');
    }
  };

  const cancelarPedido = (pedidoId, clienteNombre) => {
    Alert.alert(
      'Cancelar pedido',
      `¿Seguro que deseas cancelar el pedido de ${clienteNombre}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await actualizarEstadoPedido(pedidoId, 'cancelado');
              if (result.success) {
                Alert.alert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente');
              } else {
                Alert.alert('Error', result.error || 'No se pudo cancelar el pedido');
              }
            } catch (error) {
              console.error('Error al cancelar pedido:', error);
              Alert.alert('Error', 'Ocurrió un error al cancelar el pedido');
            }
          }
        }
      ]
    );
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      pendiente: { label: 'Pendiente', color: '#FFA726', icon: '⏳' },
      confirmado: { label: 'Confirmado', color: '#42A5F5', icon: '✓' },
      en_preparacion: { label: 'En Preparación', color: '#AB47BC', icon: '👨‍🍳' },
      en_camino: { label: 'En Camino', color: '#66BB6A', icon: '🚴' },
      entregado: { label: 'Entregado', color: '#26A69A', icon: '✓' },
      cancelado: { label: 'Cancelado', color: '#EF5350', icon: '✗' }
    };
    return estados[estado] || estados.pendiente;
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'todos') return true;
    if (filtro === 'activos') return ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'].includes(p.estado);
    return p.estado === filtro;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Pedidos</Text>
        <IconButton icon="refresh" size={24} onPress={onRefresh} />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContent}
        >
          <Chip
            selected={filtro === 'todos'}
            onPress={() => setFiltro('todos')}
            style={styles.filtroChip}
          >
            Todos ({pedidos.length})
          </Chip>
          <Chip
            selected={filtro === 'activos'}
            onPress={() => setFiltro('activos')}
            style={styles.filtroChip}
          >
            Activos ({pedidos.filter(p => ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'].includes(p.estado)).length})
          </Chip>
          <Chip
            selected={filtro === 'pendiente'}
            onPress={() => setFiltro('pendiente')}
            style={styles.filtroChip}
          >
            Pendientes ({pedidos.filter(p => p.estado === 'pendiente').length})
          </Chip>
          <Chip
            selected={filtro === 'en_camino'}
            onPress={() => setFiltro('en_camino')}
            style={styles.filtroChip}
          >
            En Camino ({pedidos.filter(p => p.estado === 'en_camino').length})
          </Chip>
        </ScrollView>
      </View>

      {/* Lista de pedidos */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pedidosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay pedidos para mostrar</Text>
          </View>
        ) : (
          pedidosFiltrados.map((pedido) => {
            const estadoInfo = getEstadoInfo(pedido.estado);
            return (
              <Card key={pedido.id} style={styles.pedidoCard}>
                <Card.Content>
                  {/* Header */}
                  <View style={styles.pedidoHeader}>
                    <View>
                      <Text style={styles.pedidoId}>#{pedido.id.substring(0, 8)}</Text>
                      <Text style={styles.pedidoHora}>
                        🕐 {pedido.createdAt?.toDate ? 
                          new Date(pedido.createdAt.toDate()).toLocaleTimeString('es-PE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'Hoy'}
                      </Text>
                    </View>

                    <Chip
                      icon={() => <Text>{estadoInfo.icon}</Text>}
                      style={[styles.estadoChip, { backgroundColor: estadoInfo.color + '20' }]}
                      textStyle={{ color: estadoInfo.color, fontWeight: '600' }}
                    >
                      {estadoInfo.label}
                    </Chip>
                  </View>

                  {/* Info cliente */}
                  <View style={styles.clienteInfo}>
                    <Text style={styles.clienteNombre}>
                      👤 {pedido.clienteNombre || 'Cliente'}
                    </Text>
                    <Text style={styles.clienteTelefono}>
                      📞 {pedido.clienteTelefono || 'Sin teléfono'}
                    </Text>
                    <Text style={styles.clienteDireccion}>
                      📍 {typeof pedido.direccion === 'object' 
                        ? (pedido.direccion.direccion || 'Sin dirección')
                        : (pedido.direccion || 'Sin dirección')}
                    </Text>
                    {typeof pedido.direccion === 'object' && pedido.direccion.referencia && (
                      <Text style={styles.clienteReferencia}>
                        🏠 Ref: {pedido.direccion.referencia}
                      </Text>
                    )}
                  </View>

                  {/* Items */}
                  <View style={styles.itemsContainer}>
                    {pedido.items && pedido.items.map((item, idx) => (
                      <Text key={idx} style={styles.item}>
                        • {item.cantidad}x {item.nombre} - S/ {(item.precio * item.cantidad).toFixed(2)}
                      </Text>
                    ))}
                  </View>

                  {/* Notas */}
                  {pedido.notas && pedido.notas.trim() !== "" && (
                    <View style={styles.notasContainer}>
                      <Text style={styles.notasLabel}>📝 Notas:</Text>
                      <Text style={styles.notasTexto}>{pedido.notas}</Text>
                    </View>
                  )}

                  {/* Costo de delivery */}
                  {pedido.costoDelivery > 0 && (
                    <View style={styles.deliveryContainer}>
                      <Text style={styles.deliveryLabel}>🚴 Delivery:</Text>
                      <Text style={styles.deliveryCosto}>S/ {pedido.costoDelivery.toFixed(2)}</Text>
                    </View>
                  )}

                  {/* Repartidor */}
                  {pedido.repartidorNombre && (
                    <View style={styles.repartidorContainer}>
                      <Text style={styles.repartidorLabel}>🚴 Repartidor:</Text>
                      <Text style={styles.repartidorNombre}>{pedido.repartidorNombre}</Text>
                    </View>
                  )}

                  {/* Total y método de pago */}
                  <View style={styles.footer}>
                    <View>
                      <Text style={styles.metodoPago}>💳 {pedido.metodoPago || 'Efectivo'}</Text>
                    </View>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.total}>
                        S/ {((pedido.subtotal || 0) + (pedido.costoDelivery || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={styles.acciones}>
                    {pedido.estado === 'pendiente' && (
                      <>
                        <Button
                          mode="contained"
                          onPress={() => cambiarEstado(pedido.id, 'confirmado')}
                          style={styles.botonConfirmar}
                          buttonColor="#42A5F5"
                        >
                          ✓ Confirmar
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => cancelarPedido(pedido.id, pedido.clienteNombre || 'este cliente')}
                          style={styles.botonCancelar}
                          textColor="#EF5350"
                        >
                          ✗ Cancelar
                        </Button>
                      </>
                    )}

                    {pedido.estado === 'confirmado' && (
                      <Button
                        mode="contained"
                        onPress={() => cambiarEstado(pedido.id, 'en_preparacion')}
                        buttonColor="#AB47BC"
                      >
                        👨‍🍳 Marcar en Preparación
                      </Button>
                    )}

                    {pedido.estado === 'en_preparacion' && !pedido.repartidorId && (
                      <View style={styles.esperandoContainer}>
                        <Text style={styles.esperandoText}>
                          ⏳ Esperando que un repartidor acepte...
                        </Text>
                      </View>
                    )}

                    {pedido.estado === 'en_camino' && (
                      <Button
                        mode="contained"
                        onPress={() => cambiarEstado(pedido.id, 'entregado')}
                        buttonColor="#26A69A"
                      >
                        ✓ Marcar como Entregado
                      </Button>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: 70,
  },
  filtrosContent: {
    padding: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filtroChip: {
    marginRight: 8,
    height: 36,
  },
  content: {
    flex: 1,
  },
  pedidoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
  },
  pedidoHeader: {
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
  estadoChip: {
    height: 32,
  },
  clienteInfo: {
    marginBottom: 12,
    gap: 4,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clienteTelefono: {
    fontSize: 14,
    color: '#666',
  },
  clienteDireccion: {
    fontSize: 14,
    color: '#666',
  },
  clienteReferencia: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  itemsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  item: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  notasContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notasLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notasTexto: {
    fontSize: 14,
    color: '#666',
  },
  repartidorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  repartidorLabel: {
    fontSize: 14,
    color: '#666',
  },
  repartidorNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  deliveryCosto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  metodoPago: {
    fontSize: 14,
    color: '#666',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  acciones: {
    gap: 8,
  },
  botonConfirmar: {
    borderRadius: 8,
  },
  botonCancelar: {
    borderRadius: 8,
    borderColor: '#EF5350',
  },
  esperandoContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  esperandoText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});