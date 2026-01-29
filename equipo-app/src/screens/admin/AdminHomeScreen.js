// src/screens/admin/AdminHomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconButton, Badge, Chip } from 'react-native-paper';
import { 
  escucharTodosPedidos,
  obtenerEstadisticasHoy,
  obtenerRepartidoresDisponibles,
  actualizarEstadoPedido
} from '../../services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminHomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [repartidores, setRepartidores] = useState([]);
  
  // Estadísticas
  const [stats, setStats] = useState({
    pedidosHoy: 0,
    ventasHoy: 0,
    pedidosPendientes: 0,
    repartidoresActivos: 0,
    platosVendidos: 0,
    promedioEntrega: 0
  });

  useEffect(() => {
    cargarDatos();
    
    // Escuchar pedidos en tiempo real
    const unsubscribePedidos = escucharTodosPedidos((pedidos) => {
      // Filtrar solo pendientes y ordenar por más recientes
      const pendientes = pedidos
        .filter(p => p.estado === 'pendiente')
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 5); // Solo los últimos 5
      
      setPedidosPendientes(pendientes);
      
      // Calcular estadísticas
      calcularEstadisticas(pedidos);
    });

    return () => {
      unsubscribePedidos();
    };
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Cargar repartidores
    const resultRepartidores = await obtenerRepartidoresDisponibles();
    if (resultRepartidores.success) {
      setRepartidores(resultRepartidores.data);
    }
    
    setLoading(false);
  };

  const calcularEstadisticas = (todosPedidos) => {
    // Filtrar pedidos de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pedidosHoy = todosPedidos.filter(p => {
      if (!p.createdAt?.toDate) return false;
      const pedidoDate = p.createdAt.toDate();
      return pedidoDate >= hoy;
    });

    // Calcular estadísticas
    const totalPedidos = pedidosHoy.length;
    const pendientes = todosPedidos.filter(p => p.estado === 'pendiente').length;
    
    let ventasTotal = 0;
    let platosTotal = 0;
    
    pedidosHoy.forEach(pedido => {
      const subtotal = pedido.subtotal || 0;
      const delivery = pedido.costoDelivery || 0;
      ventasTotal += (subtotal + delivery);
      
      if (pedido.items) {
        pedido.items.forEach(item => {
          platosTotal += item.cantidad || 0;
        });
      }
    });

    setStats({
      pedidosHoy: totalPedidos,
      ventasHoy: ventasTotal,
      pedidosPendientes: pendientes,
      repartidoresActivos: repartidores.length,
      platosVendidos: platosTotal,
      promedioEntrega: totalPedidos > 0 ? 28 : 0 // Promedio estimado
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const handleCerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('adminLoggedIn');
      await AsyncStorage.removeItem('adminEmail');
      navigation.replace('SelectRole');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Panel de Control 👔</Text>
          <Text style={styles.title}>Dashboard Admin</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-PE', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleCerrarSesion}>
          <IconButton icon="logout" iconColor="#FF6B35" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Accesos rápidos */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.menuCard]}
            onPress={() => navigation.navigate('AdminMenu')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Menú del Día</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.pedidosCard]}
            onPress={() => navigation.navigate('AdminPedidos')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionTitle}>Pedidos</Text>
            {stats.pedidosPendientes > 0 && (
              <Badge style={styles.actionBadge}>{stats.pedidosPendientes}</Badge>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.repartidoresCard]}
            onPress={() => {
              // TODO: Navegar a gestión de repartidores
              alert('Próximamente: Gestión de repartidores');
            }}
          >
            <Text style={styles.actionIcon}>🚴</Text>
            <Text style={styles.actionTitle}>Repartidores</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.statsCard]}
            onPress={() => {
              // TODO: Navegar a estadísticas
              alert('Próximamente: Estadísticas detalladas');
            }}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>Estadísticas</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas del día */}
        <Text style={styles.sectionTitle}>📈 Resumen de Hoy</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pedidosHoy}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>S/ {stats.ventasHoy.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Ventas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.platosVendidos}</Text>
            <Text style={styles.statLabel}>Platos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.repartidoresActivos}</Text>
            <Text style={styles.statLabel}>Repartidores</Text>
          </View>
        </View>

        {/* Pedidos pendientes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⏳ Pedidos Pendientes</Text>
          {stats.pedidosPendientes > 0 && (
            <Chip style={styles.pendingChip}>
              {stats.pedidosPendientes}
            </Chip>
          )}
        </View>

        {pedidosPendientes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
          </View>
        ) : (
          pedidosPendientes.map((pedido) => {
            const total = (pedido.subtotal || 0) + (pedido.costoDelivery || 0);
            const direccionTexto = typeof pedido.direccion === 'object' 
              ? pedido.direccion.direccion 
              : pedido.direccion;
            
            return (
              <Card key={pedido.id} style={styles.pedidoCard}>
                <Card.Content>
                  <View style={styles.pedidoHeader}>
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
                    
                    <TouchableOpacity 
                      style={styles.verButton}
                      onPress={() => navigation.navigate('AdminPedidos')}
                    >
                      <Text style={styles.verButtonText}>Ver detalles →</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.pedidoInfo}>
                    <Text style={styles.pedidoCliente}>👤 {pedido.clienteNombre || 'Cliente'}</Text>
                    <Text style={styles.pedidoTelefono}>📞 {pedido.clienteTelefono || 'Sin teléfono'}</Text>
                    <Text style={styles.pedidoDireccion}>📍 {direccionTexto || 'Sin dirección'}</Text>
                  </View>

                  <View style={styles.pedidoFooter}>
                    <Text style={styles.pedidoItems}>
                      {pedido.items ? pedido.items.length : 0} items
                    </Text>
                    <Text style={styles.pedidoTotal}>S/ {total.toFixed(2)}</Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}

        {/* Estado de repartidores */}
        {repartidores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🚴 Repartidores Registrados</Text>
            <Card style={styles.repartidoresCard}>
              <Card.Content>
                {repartidores.map((repartidor, index) => (
                  <View 
                    key={repartidor.id} 
                    style={[
                      styles.repartidorRow,
                      index < repartidores.length - 1 && styles.repartidorRowBorder
                    ]}
                  >
                    <View style={styles.repartidorInfo}>
                      <Text style={styles.repartidorNombre}>
                        {repartidor.nombre || 'Repartidor'}
                      </Text>
                      <Text style={styles.repartidorEstado}>
                        {repartidor.estado === 'disponible' ? '🟢 Disponible' : '🔵 Ocupado'}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
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
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    position: 'relative',
  },
  menuCard: {
    backgroundColor: '#FFF3E0',
  },
  pedidosCard: {
    backgroundColor: '#E3F2FD',
  },
  repartidoresCard: {
    backgroundColor: '#E8F5E9',
  },
  statsCard: {
    backgroundColor: '#F3E5F5',
  },
  actionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B35',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  pendingChip: {
    backgroundColor: '#FF6B35',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  pedidoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
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
  verButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 13,
  },
  pedidoInfo: {
    marginBottom: 12,
    gap: 4,
  },
  pedidoCliente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pedidoTelefono: {
    fontSize: 14,
    color: '#666',
  },
  pedidoDireccion: {
    fontSize: 14,
    color: '#666',
  },
  pedidoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pedidoItems: {
    fontSize: 14,
    color: '#666',
  },
  pedidoTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  repartidorRow: {
    paddingVertical: 12,
  },
  repartidorRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  repartidorInfo: {
    gap: 4,
  },
  repartidorNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  repartidorEstado: {
    fontSize: 14,
    color: '#666',
  },
  bottomPadding: {
    height: 20,
  },
});