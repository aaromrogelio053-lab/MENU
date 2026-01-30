import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { escucharMisPedidos, cancelarPedido } from '../services/firebaseService';

export default function OrdersScreen({ navigation }) {
  const [pedidosTodos, setPedidosTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabActivo, setTabActivo] = useState('activos'); // 'activos' o 'historial'
  const [paginaActual, setPaginaActual] = useState(1);
  
  const PEDIDOS_POR_PAGINA = 10;
  let unsubscribe = null;

  useEffect(() => {
    cargarPedidos();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Resetear página cuando cambia de tab
  useEffect(() => {
    setPaginaActual(1);
  }, [tabActivo]);

  const cargarPedidos = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        unsubscribe = escucharMisPedidos(userId, (pedidosActualizados) => {
          setPedidosTodos(pedidosActualizados);
          setLoading(false);
          setRefreshing(false);
        });
      } else {
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarPedidos();
  };

  // Mapear estados internos a estados simplificados
  const getEstadoSimplificado = (estado) => {
    const mapeo = {
      'pendiente': 'pendiente',
      'confirmado': 'confirmado',
      'en_preparacion': 'confirmado',
      'listo': 'confirmado',
      'en_camino': 'confirmado',
      'entregado': 'entregado',
      'cancelado': 'cancelado',
    };
    return mapeo[estado] || 'pendiente';
  };

  // Filtrar pedidos según tab activo
  const getPedidosFiltrados = () => {
    if (tabActivo === 'activos') {
      // Pedidos activos: pendiente + confirmado
      return pedidosTodos.filter(pedido => {
        const estadoSimple = getEstadoSimplificado(pedido.estado);
        return estadoSimple === 'pendiente' || estadoSimple === 'confirmado';
      });
    } else {
      // Historial: entregado + cancelado
      return pedidosTodos.filter(pedido => {
        const estadoSimple = getEstadoSimplificado(pedido.estado);
        return estadoSimple === 'entregado' || estadoSimple === 'cancelado';
      });
    }
  };

  // Obtener pedidos de la página actual
  const getPedidosPaginados = () => {
    const pedidosFiltrados = getPedidosFiltrados();
    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const fin = inicio + PEDIDOS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, fin);
  };

  // Calcular total de páginas
  const getTotalPaginas = () => {
    const pedidosFiltrados = getPedidosFiltrados();
    return Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
  };

  const handleCancelarPedido = (pedidoId, estadoActual) => {
    const estadoSimple = getEstadoSimplificado(estadoActual);
    
    if (estadoSimple !== 'pendiente' && estadoSimple !== 'confirmado') {
      Alert.alert('No se puede cancelar', 'Este pedido ya no se puede cancelar');
      return;
    }

    Alert.alert(
      'Cancelar Pedido',
      '¿Estás seguro de que quieres cancelar este pedido?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelarPedido(pedidoId, 'Cancelado por el cliente');
            if (result.success) {
              Alert.alert('✓', 'Pedido cancelado');
            } else {
              Alert.alert('Error', 'No se pudo cancelar el pedido');
            }
          },
        },
      ]
    );
  };

  const getEstadoConfig = (estado, estadoSimplificado) => {
    // Configuración visual según estado simplificado
    const configSimple = {
      pendiente: { 
        color: '#FF9800', 
        texto: 'Pendiente', 
        icono: '⏳',
        descripcion: 'Esperando confirmación del restaurante'
      },
      confirmado: { 
        color: '#2196F3', 
        texto: 'Confirmado', 
        icono: '✓',
        descripcion: getDescripcionConfirmado(estado)
      },
      entregado: { 
        color: '#4CAF50', 
        texto: 'Entregado', 
        icono: '✓',
        descripcion: 'Pedido entregado exitosamente'
      },
      cancelado: { 
        color: '#F44336', 
        texto: 'Cancelado', 
        icono: '✕',
        descripcion: 'Pedido cancelado'
      },
    };

    return configSimple[estadoSimplificado] || { 
      color: '#666', 
      texto: estado, 
      icono: '•',
      descripcion: ''
    };
  };

  const getDescripcionConfirmado = (estadoInterno) => {
    const descripciones = {
      'confirmado': 'El restaurante confirmó tu pedido',
      'en_preparacion': 'Tu pedido se está preparando',
      'listo': 'Tu pedido está listo para entrega',
      'en_camino': 'El repartidor va hacia ti',
    };
    return descripciones[estadoInterno] || 'Pedido en proceso';
  };

  const renderPedido = ({ item }) => {
    const estadoSimplificado = getEstadoSimplificado(item.estado);
    const estadoConfig = getEstadoConfig(item.estado, estadoSimplificado);
    const puedeCancel = estadoSimplificado === 'pendiente' || estadoSimplificado === 'confirmado';

    return (
      <View style={styles.pedidoCard}>
        <View style={styles.pedidoHeader}>
          <View>
            <Text style={styles.pedidoId}>#{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.pedidoFecha}>
              {item.createdAt?.toDate().toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.pedidoRight}>
            <Text style={styles.pedidoTotal}>S/ {item.total?.toFixed(2)}</Text>
            <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.color }]}>
              <Text style={styles.estadoTexto}>
                {estadoConfig.icono} {estadoConfig.texto}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pedidoBody}>
          <Text style={styles.estadoDescripcion}>{estadoConfig.descripcion}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Dirección:</Text>
            <Text style={styles.infoText}>{item.direccion}</Text>
          </View>

          {item.referencia ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📌 Referencia:</Text>
              <Text style={styles.infoText}>{item.referencia}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🍽️ Productos:</Text>
          </View>
          {item.items?.map((producto, index) => (
            <View key={index} style={styles.productoRow}>
              <Text style={styles.productoText}>
                {producto.cantidad}x {producto.nombre}
              </Text>
              <Text style={styles.productoPrice}>
                S/ {(producto.precio * producto.cantidad).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💳 Pago:</Text>
            <Text style={styles.infoText}>{item.metodoPago}</Text>
          </View>

          {item.repartidorNombre && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🚚 Repartidor:</Text>
              <Text style={styles.infoText}>{item.repartidorNombre}</Text>
            </View>
          )}

          {item.notas ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📝 Notas:</Text>
              <Text style={styles.infoText}>{item.notas}</Text>
            </View>
          ) : null}
        </View>

        {puedeCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelarPedido(item.id, item.estado)}
          >
            <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  const pedidosPaginados = getPedidosPaginados();
  const totalPaginas = getTotalPaginas();
  const pedidosActivos = pedidosTodos.filter(p => {
    const est = getEstadoSimplificado(p.estado);
    return est === 'pendiente' || est === 'confirmado';
  }).length;
  const pedidosHistorial = pedidosTodos.filter(p => {
    const est = getEstadoSimplificado(p.estado);
    return est === 'entregado' || est === 'cancelado';
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'activos' && styles.tabActivo]}
          onPress={() => setTabActivo('activos')}
        >
          <Text style={[styles.tabText, tabActivo === 'activos' && styles.tabTextoActivo]}>
            🔥 Activos ({pedidosActivos})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tabActivo === 'historial' && styles.tabActivo]}
          onPress={() => setTabActivo('historial')}
        >
          <Text style={[styles.tabText, tabActivo === 'historial' && styles.tabTextoActivo]}>
            📜 Historial ({pedidosHistorial})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE PEDIDOS */}
      <FlatList
        data={pedidosPaginados}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {tabActivo === 'activos' ? '📦' : '📜'}
            </Text>
            <Text style={styles.emptyTitle}>
              {tabActivo === 'activos' ? 'No tienes pedidos activos' : 'No hay historial'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tabActivo === 'activos' 
                ? 'Realiza tu primer pedido desde el menú' 
                : 'Aquí aparecerán tus pedidos completados'}
            </Text>
            {tabActivo === 'activos' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.emptyButtonText}>Ver Menú</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* PAGINACIÓN */}
      {totalPaginas > 1 && (
        <View style={styles.paginacionContainer}>
          <TouchableOpacity
            style={[styles.paginacionButton, paginaActual === 1 && styles.paginacionButtonDisabled]}
            onPress={() => setPaginaActual(prev => Math.max(1, prev - 1))}
            disabled={paginaActual === 1}
          >
            <Text style={[styles.paginacionButtonText, paginaActual === 1 && styles.paginacionButtonTextDisabled]}>
              ← Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.paginacionInfo}>
            <Text style={styles.paginacionText}>
              Página {paginaActual} de {totalPaginas}
            </Text>
            <Text style={styles.paginacionSubtext}>
              ({getPedidosFiltrados().length} pedidos)
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.paginacionButton, paginaActual === totalPaginas && styles.paginacionButtonDisabled]}
            onPress={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaActual === totalPaginas}
          >
            <Text style={[styles.paginacionButtonText, paginaActual === totalPaginas && styles.paginacionButtonTextDisabled]}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

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
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
    padding: 15,
  },
  pedidoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pedidoId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoFecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pedidoRight: {
    alignItems: 'flex-end',
  },
  pedidoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pedidoBody: {
    marginTop: 8,
  },
  estadoDescripcion: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  infoRow: {
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  productoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingLeft: 16,
  },
  productoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productoPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
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
  paginacionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 4,
  },
  paginacionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  paginacionButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  paginacionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginacionButtonTextDisabled: {
    color: '#999',
  },
  paginacionInfo: {
    alignItems: 'center',
  },
  paginacionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  paginacionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});