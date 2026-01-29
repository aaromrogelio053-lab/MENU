import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { escucharPedidosUsuario } from '../services/firebaseService';

const OrdersScreen = ({ navigation }) => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'activos', 'completados'

  useEffect(() => {
    let unsubscribe;

    const cargarPedidos = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          unsubscribe = escucharPedidosUsuario(userId, (pedidosActualizados) => {
            setPedidos(pedidosActualizados);
            setLoading(false);
            setRefreshing(false);
          });
        }
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    cargarPedidos();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      'pendiente': {
        label: 'Pendiente',
        color: '#FFA726',
        icon: '⏳',
        mensaje: 'Esperando confirmación del restaurante'
      },
      'confirmado': {
        label: 'Confirmado',
        color: '#42A5F5',
        icon: '✓',
        mensaje: 'El restaurante confirmó tu pedido'
      },
      'en_preparacion': {
        label: 'En Preparación',
        color: '#66BB6A',
        icon: '👨‍🍳',
        mensaje: 'Tu pedido está siendo preparado'
      },
      'listo': {
        label: 'Listo',
        color: '#26A69A',
        icon: '📦',
        mensaje: 'Tu pedido está listo para entrega'
      },
      'en_camino': {
        label: 'En Camino',
        color: '#7E57C2',
        icon: '🚴',
        mensaje: 'El repartidor está en camino'
      },
      'entregado': {
        label: 'Entregado',
        color: '#66BB6A',
        icon: '✅',
        mensaje: '¡Pedido entregado! Buen provecho'
      },
      'cancelado': {
        label: 'Cancelado',
        color: '#EF5350',
        icon: '❌',
        mensaje: 'Este pedido fue cancelado'
      }
    };
    
    return estados[estado] || estados['pendiente'];
  };

  const getPedidosFiltrados = () => {
    if (filtro === 'activos') {
      return pedidos.filter(p => 
        p.estado !== 'entregado' && p.estado !== 'cancelado'
      );
    } else if (filtro === 'completados') {
      return pedidos.filter(p => 
        p.estado === 'entregado' || p.estado === 'cancelado'
      );
    }
    return pedidos;
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const minutos = Math.floor(diferencia / 60000);
    
    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  const calcularTiempoEstimado = (pedido) => {
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      return null;
    }
    
    if (pedido.estado === 'en_camino') {
      return '10-15 min';
    } else if (pedido.estado === 'listo') {
      return '5-10 min';
    } else if (pedido.estado === 'en_preparacion') {
      return '15-25 min';
    } else if (pedido.estado === 'confirmado') {
      return '20-30 min';
    } else if (pedido.estado === 'pendiente') {
      return '30-40 min';
    }
    
    return null;
  };

  const renderPedido = ({ item }) => {
    const estadoInfo = getEstadoInfo(item.estado);
    const tiempoEstimado = calcularTiempoEstimado(item);
    const cantidadItems = item.items?.reduce((sum, i) => sum + i.cantidad, 0) || 0;

    return (
      <TouchableOpacity
        style={styles.pedidoCard}
        onPress={() => {
          Alert.alert(
            `Pedido #${item.id.slice(-6).toUpperCase()}`,
            `Estado: ${estadoInfo.label}\n${estadoInfo.mensaje}\n\nProductos:\n${item.items?.map(i => `• ${i.cantidad}x ${i.nombre}`).join('\n')}\n\nTotal: S/ ${item.total.toFixed(2)}\nMétodo de pago: ${item.metodoPago || 'Efectivo'}${item.motivoCancelacion ? `\n\nMotivo de cancelación:\n${item.motivoCancelacion}` : ''}`
          );
        }}
      >
        {/* Header del pedido */}
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoHeaderLeft}>
            <Text style={styles.pedidoId}>#{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.pedidoFecha}>{formatearFecha(item.createdAt)}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.color }]}>
            <Text style={styles.estadoIcon}>{estadoInfo.icon}</Text>
            <Text style={styles.estadoText}>{estadoInfo.label}</Text>
          </View>
        </View>

        {/* Info del pedido */}
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoMensaje}>{estadoInfo.mensaje}</Text>
          
          {tiempoEstimado && (
            <View style={styles.tiempoContainer}>
              <Text style={styles.tiempoIcon}>⏱️</Text>
              <Text style={styles.tiempoText}>
                Tiempo estimado: <Text style={styles.tiempoValue}>{tiempoEstimado}</Text>
              </Text>
            </View>
          )}

          {item.motivoCancelacion && (
            <View style={styles.motivoCancelacion}>
              <Text style={styles.motivoCancelacionText}>
                Motivo: {item.motivoCancelacion}
              </Text>
            </View>
          )}

          <View style={styles.pedidoDetalles}>
            <View style={styles.detalleItem}>
              <Text style={styles.detalleLabel}>Productos:</Text>
              <Text style={styles.detalleValue}>{cantidadItems} items</Text>
            </View>
            <View style={styles.detalleItem}>
              <Text style={styles.detalleLabel}>Total:</Text>
              <Text style={styles.detalleValueTotal}>S/ {item.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.pedidoPago}>
            <Text style={styles.pedidoPagoText}>
              Pago: {item.metodoPago === 'Yape' ? '📱' : '💵'} {item.metodoPago || 'Efectivo'}
            </Text>
          </View>

          {item.repartidorNombre && item.estado !== 'cancelado' && (
            <View style={styles.repartidorInfo}>
              <Text style={styles.repartidorText}>
                🚴 Repartidor: <Text style={styles.repartidorNombre}>{item.repartidorNombre}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Progreso visual */}
        {item.estado !== 'cancelado' && item.estado !== 'entregado' && (
          <View style={styles.progresoContainer}>
            <View style={styles.progresoBarContainer}>
              <View 
                style={[
                  styles.progresoBar, 
                  { 
                    width: getPorcentajeProgreso(item.estado),
                    backgroundColor: estadoInfo.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progresoText}>
              {getTextoProgreso(item.estado)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getPorcentajeProgreso = (estado) => {
    const progresos = {
      'pendiente': '20%',
      'confirmado': '40%',
      'en_preparacion': '60%',
      'listo': '80%',
      'en_camino': '90%',
      'entregado': '100%',
    };
    return progresos[estado] || '0%';
  };

  const getTextoProgreso = (estado) => {
    const textos = {
      'pendiente': 'Esperando confirmación',
      'confirmado': 'Confirmado → Preparación',
      'en_preparacion': 'Preparando → Listo',
      'listo': 'Listo → En camino',
      'en_camino': 'En camino → Entrega',
    };
    return textos[estado] || '';
  };

  const pedidosFiltrados = getPedidosFiltrados();
  const contadores = {
    todos: pedidos.length,
    activos: pedidos.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado').length,
    completados: pedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8BC34A" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'todos' && styles.filtroButtonActive]}
          onPress={() => setFiltro('todos')}
        >
          <Text style={[styles.filtroText, filtro === 'todos' && styles.filtroTextActive]}>
            Todos ({contadores.todos})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'activos' && styles.filtroButtonActive]}
          onPress={() => setFiltro('activos')}
        >
          <Text style={[styles.filtroText, filtro === 'activos' && styles.filtroTextActive]}>
            ✓ Activos ({contadores.activos})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'completados' && styles.filtroButtonActive]}
          onPress={() => setFiltro('completados')}
        >
          <Text style={[styles.filtroText, filtro === 'completados' && styles.filtroTextActive]}>
            Completados ({contadores.completados})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>
            {filtro === 'activos' 
              ? 'No tienes pedidos activos' 
              : filtro === 'completados'
              ? 'Aún no tienes pedidos completados'
              : 'No has realizado ningún pedido'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.emptyButtonText}>Ver Menú</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          renderItem={renderPedido}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8BC34A']}
            />
          }
        />
      )}
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filtrosContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filtroButtonActive: {
    backgroundColor: '#8BC34A',
  },
  filtroText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filtroTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 15,
  },
  pedidoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pedidoHeaderLeft: {
    flex: 1,
  },
  pedidoId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoFecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  estadoIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  estadoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pedidoInfo: {
    marginBottom: 10,
  },
  pedidoMensaje: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  tiempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  tiempoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tiempoText: {
    fontSize: 13,
    color: '#E65100',
  },
  tiempoValue: {
    fontWeight: 'bold',
  },
  motivoCancelacion: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  motivoCancelacionText: {
    fontSize: 13,
    color: '#C62828',
  },
  pedidoDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detalleItem: {
    flex: 1,
  },
  detalleLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detalleValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detalleValueTotal: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  pedidoPago: {
    marginTop: 5,
  },
  pedidoPagoText: {
    fontSize: 13,
    color: '#666',
  },
  repartidorInfo: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  repartidorText: {
    fontSize: 13,
    color: '#2E7D32',
  },
  repartidorNombre: {
    fontWeight: 'bold',
  },
  progresoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progresoBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progresoBar: {
    height: '100%',
    borderRadius: 3,
  },
  progresoText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  emptyButton: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrdersScreen;