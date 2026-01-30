import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, TextInput } from 'react-native-paper';

export default function MapPickerScreen({ route, navigation }) {
  const { direccionInicial, carritoData, subtotalData, metodoPagoData } = route.params || {};
  
  const [region, setRegion] = useState({
    latitude: -16.409047,
    longitude: -71.537451,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  
  const [markerPosition, setMarkerPosition] = useState({
    latitude: -16.409047,
    longitude: -71.537451,
  });
  
  const [direccionTexto, setDireccionTexto] = useState(direccionInicial || '');
  const [loading, setLoading] = useState(true);
  const [buscandoDireccion, setBuscandoDireccion] = useState(false);

  useEffect(() => {
    obtenerUbicacionActual();
  }, []);

  const obtenerUbicacionActual = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permisos de ubicación para ayudarte');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (!direccionInicial) {
        obtenerDireccionDesdeCoords(location.coords.latitude, location.coords.longitude);
      }
      
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    } finally {
      setLoading(false);
    }
  };

  const obtenerDireccionDesdeCoords = async (lat, lng) => {
    try {
      setBuscandoDireccion(true);
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (result && result.length > 0) {
        const address = result[0];
        const direccion = `${address.street || ''} ${address.streetNumber || ''}, ${address.district || address.city || ''}, Arequipa`.trim();
        setDireccionTexto(direccion);
      }
    } catch (error) {
      console.error('Error obteniendo dirección:', error);
    } finally {
      setBuscandoDireccion(false);
    }
  };

  const buscarDireccion = async () => {
    if (!direccionTexto.trim()) {
      Alert.alert('Error', 'Ingresa una dirección para buscar');
      return;
    }

    try {
      setBuscandoDireccion(true);
      const query = direccionTexto.includes('Arequipa') 
        ? direccionTexto 
        : `${direccionTexto}, Arequipa, Perú`;
      
      const results = await Location.geocodeAsync(query);
      
      if (results && results.length > 0) {
        const newRegion = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        
        setRegion(newRegion);
        setMarkerPosition({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
      } else {
        Alert.alert('No encontrado', 'No se pudo encontrar esa dirección en Arequipa');
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
      Alert.alert('Error', 'No se pudo buscar la dirección');
    } finally {
      setBuscandoDireccion(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    await obtenerDireccionDesdeCoords(latitude, longitude);
  };

  const confirmarUbicacion = () => {
    if (!direccionTexto.trim()) {
      Alert.alert('Error', 'Ingresa o selecciona una dirección válida');
      return;
    }

    // ✅ CAMBIO AQUÍ: Usar replace en lugar de navigate para no acumular pantallas
    navigation.replace('Checkout', {
      direccionSeleccionada: direccionTexto,
      coordenadas: markerPosition,
      carrito: carritoData,
      subtotal: subtotalData,
      metodoPago: metodoPagoData,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
        <View style={{ width: 40 }} />
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={markerPosition}
          draggable
          onDragEnd={async (e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setMarkerPosition({ latitude, longitude });
            await obtenerDireccionDesdeCoords(latitude, longitude);
          }}
        />
      </MapView>

      <View style={styles.bottomSheet}>
        <Text style={styles.instruction}>
          📍 Arrastra el marcador o toca en el mapa para seleccionar tu ubicación
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            mode="outlined"
            label="Dirección"
            value={direccionTexto}
            onChangeText={setDireccionTexto}
            style={styles.input}
            multiline
            numberOfLines={2}
            outlineColor="#E0E0E0"
            activeOutlineColor="#FF6B35"
            right={
              buscandoDireccion ? (
                <TextInput.Icon icon={() => <ActivityIndicator size={20} color="#FF6B35" />} />
              ) : null
            }
          />
          <Button
            mode="contained"
            onPress={buscarDireccion}
            style={styles.searchButton}
            buttonColor="#2196F3"
            disabled={buscandoDireccion}
          >
            🔍 Buscar
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={confirmarUbicacion}
          style={styles.confirmButton}
          buttonColor="#FF6B35"
        >
          Confirmar Ubicación
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
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
  map: { flex: 1 },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  instruction: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
  searchContainer: { marginBottom: 16 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  searchButton: { borderRadius: 8 },
  confirmButton: { borderRadius: 8, paddingVertical: 4 },
});