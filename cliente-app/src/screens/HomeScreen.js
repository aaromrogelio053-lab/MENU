// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Badge, Card, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerMenuDelDia, agregarAlCarrito, obtenerCarrito } from '../services/firebaseService';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platos, setPlatos] = useState([]);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar nombre del usuario
      const nombre = await AsyncStorage.getItem('userName');
      setUserName(nombre || 'Usuario');

      // Cargar menú del día desde Firebase
      const resultMenu = await obtenerMenuDelDia();
      if (resultMenu.success && resultMenu.data && resultMenu.data.platos) {
        // Filtrar solo platos disponibles
        const platosDisponibles = resultMenu.data.platos.filter(p => p.disponible);
        setPlatos(platosDisponibles);
      } else {
        setPlatos([]);
      }

      // Cargar carrito
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const carritoData = await obtenerCarrito(userId);
        setCarrito(carritoData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const handleAgregarAlCarrito = async (plato) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.error('No hay userId');
        return;
      }

      await agregarAlCarrito(userId, plato);
      console.log('Agregado al carrito:', plato.nombre);
      
      // Actualizar contador del carrito
      const carritoActualizado = await obtenerCarrito(userId);
      setCarrito(carritoActualizado);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    }
  };

  const platosFiltrados = platos.filter(plato =>
    plato.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItemsCarrito = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Cargando menú...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola! 👋</Text>
          <Text style={styles.title}>Menú de Hoy</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {totalItemsCarrito > 0 && (
            <Badge style={styles.badge}>{totalItemsCarrito}</Badge>
          )}
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar platos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#FF6B35"
        />
      </View>

      {/* Lista de platos */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {platosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No hay platos disponibles</Text>
            <Text style={styles.emptyText}>
              El menú de hoy aún no está disponible.{'\n'}
              Vuelve más tarde.
            </Text>
            <Button
              mode="contained"
              onPress={onRefresh}
              style={styles.refreshButton}
              buttonColor="#FF6B35"
            >
              Actualizar
            </Button>
          </View>
        ) : (
          platosFiltrados.map((plato) => (
            <Card key={plato.id} style={styles.platoCard}>
              <Card.Content style={styles.platoContent}>
                <Image
                  source={{ uri: plato.imagen || 'https://via.placeholder.com/100' }}
                  style={styles.platoImagen}
                />

                <View style={styles.platoInfo}>
                  <Text style={styles.platoNombre}>{plato.nombre}</Text>
                  <Text style={styles.platoDescripcion} numberOfLines={2}>
                    {plato.descripcion}
                  </Text>
                  <View style={styles.platoFooter}>
                    <Text style={styles.platoPrecio}>S/ {plato.precio.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.agregarButton}
                      onPress={() => handleAgregarAlCarrito(plato)}
                    >
                      <Text style={styles.agregarButtonText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
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
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartIcon: {
    fontSize: 28,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6B35',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
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
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  refreshButton: {
    borderRadius: 8,
  },
  platoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  platoContent: {
    flexDirection: 'row',
  },
  platoImagen: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  platoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  platoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  platoDescripcion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  platoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platoPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  agregarButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  agregarButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
});