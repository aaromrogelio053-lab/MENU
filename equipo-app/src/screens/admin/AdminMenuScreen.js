// src/screens/admin/AdminMenuScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconButton, Button, TextInput, Switch, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { 
  obtenerMenuDelDia, 
  crearMenu,
  subirImagenPlato,
  escucharMenuDelDia 
} from '../../services/firebaseService';

export default function AdminMenuScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [platosHoy, setPlatosHoy] = useState([]);
  const [fechaHoy, setFechaHoy] = useState('');
  
  // Formulario nuevo plato
  const [nuevoPlato, setNuevoPlato] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'Principal',
    imagen: null // URL de la imagen
  });

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaHoy(hoy);
    cargarMenu(hoy);

    const unsubscribe = escucharMenuDelDia(hoy, (result) => {
      if (result.success && result.data && result.data.platos) {
        setPlatosHoy(result.data.platos);
      } else {
        setPlatosHoy([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const cargarMenu = async (fecha) => {
    setLoading(true);
    const result = await obtenerMenuDelDia();
    
    if (result.success && result.data && result.data.platos) {
      setPlatosHoy(result.data.platos);
    } else {
      setPlatosHoy([]);
    }
    
    setLoading(false);
  };

  const seleccionarImagen = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permisos para acceder a tus fotos');
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        
        // Subir imagen a Firebase Storage
        const uploadResult = await subirImagenPlato(
          result.assets[0].uri, 
          nuevoPlato.nombre || 'plato'
        );
        
        if (uploadResult.success) {
          setNuevoPlato({ ...nuevoPlato, imagen: uploadResult.url });
          Alert.alert('¡Éxito!', 'Imagen cargada correctamente');
        } else {
          Alert.alert('Error', 'No se pudo subir la imagen');
        }
        
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'Ocurrió un error al seleccionar la imagen');
      setUploadingImage(false);
    }
  };

  const guardarMenuEnFirebase = async (platosActualizados) => {
    try {
      const result = await crearMenu(fechaHoy, platosActualizados);
      if (result.success) {
        console.log('Menú guardado exitosamente');
        return true;
      } else {
        console.error('Error al guardar menú:', result.error);
        Alert.alert('Error', 'No se pudo guardar el menú');
        return false;
      }
    } catch (error) {
      console.error('Error al guardar menú:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar');
      return false;
    }
  };

  const toggleDisponibilidad = async (platoId) => {
    const platosActualizados = platosHoy.map(p => 
      p.id === platoId ? { ...p, disponible: !p.disponible } : p
    );
    
    setPlatosHoy(platosActualizados);
    await guardarMenuEnFirebase(platosActualizados);
  };

  const eliminarPlato = (platoId, nombre) => {
    Alert.alert(
      'Eliminar plato',
      `¿Seguro que deseas eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const platosActualizados = platosHoy.filter(p => p.id !== platoId);
            setPlatosHoy(platosActualizados);
            
            const success = await guardarMenuEnFirebase(platosActualizados);
            if (success) {
              Alert.alert('Éxito', 'Plato eliminado correctamente');
            }
          }
        }
      ]
    );
  };

  const agregarPlato = async () => {
    if (!nuevoPlato.nombre || !nuevoPlato.precio) {
      Alert.alert('Error', 'Completa el nombre y precio del plato');
      return;
    }

    const precio = parseFloat(nuevoPlato.precio);

    if (isNaN(precio) || precio <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    const plato = {
      id: Date.now().toString(),
      nombre: nuevoPlato.nombre.trim(),
      descripcion: nuevoPlato.descripcion.trim(),
      precio: precio,
      disponible: true,
      categoria: nuevoPlato.categoria,
      imagen: nuevoPlato.imagen || 'https://via.placeholder.com/150/FF6B35/FFFFFF?text=Plato',
      createdAt: new Date().toISOString()
    };

    const platosActualizados = [...platosHoy, plato];
    setPlatosHoy(platosActualizados);
    
    const success = await guardarMenuEnFirebase(platosActualizados);
    
    if (success) {
      setNuevoPlato({ 
        nombre: '', 
        descripcion: '', 
        precio: '', 
        categoria: 'Principal',
        imagen: null
      });
      setMostrarFormulario(false);
      Alert.alert('¡Éxito!', 'Plato agregado al menú correctamente');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando menú...</Text>
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
        <Text style={styles.headerTitle}>Gestión de Menú</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info del día */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>📅 Menú de Hoy</Text>
            <Text style={styles.infoDate}>
              {new Date().toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <View style={styles.infoStats}>
              <Text style={styles.infoStat}>{platosHoy.length} platos</Text>
              <Text style={styles.infoStat}>
                {platosHoy.filter(p => p.disponible).length} disponibles
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Botón agregar plato */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <Text style={styles.addButtonText}>
            {mostrarFormulario ? '✕ Cancelar' : '+ Agregar Plato'}
          </Text>
        </TouchableOpacity>

        {/* Formulario nuevo plato */}
        {mostrarFormulario && (
          <Card style={styles.formCard}>
            <Card.Content>
              <Text style={styles.formTitle}>Nuevo Plato</Text>

              {/* Imagen */}
              <View style={styles.imagenSection}>
                <Text style={styles.label}>Imagen del plato:</Text>
                
                {nuevoPlato.imagen ? (
                  <View style={styles.imagenPreview}>
                    <Image 
                      source={{ uri: nuevoPlato.imagen }} 
                      style={styles.imagenPreviewImg}
                    />
                    <TouchableOpacity
                      style={styles.cambiarImagenButton}
                      onPress={seleccionarImagen}
                      disabled={uploadingImage}
                    >
                      <Text style={styles.cambiarImagenText}>
                        {uploadingImage ? 'Subiendo...' : 'Cambiar imagen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.subirImagenButton}
                    onPress={seleccionarImagen}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color="#4CAF50" />
                    ) : (
                      <>
                        <Text style={styles.subirImagenIcon}>📷</Text>
                        <Text style={styles.subirImagenText}>Subir imagen</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                mode="outlined"
                label="Nombre del plato *"
                value={nuevoPlato.nombre}
                onChangeText={(text) => setNuevoPlato({ ...nuevoPlato, nombre: text })}
                style={styles.input}
              />

              <TextInput
                mode="outlined"
                label="Descripción"
                value={nuevoPlato.descripcion}
                onChangeText={(text) => setNuevoPlato({ ...nuevoPlato, descripcion: text })}
                style={styles.input}
                multiline
                numberOfLines={2}
              />

              <TextInput
                mode="outlined"
                label="Precio (S/) *"
                value={nuevoPlato.precio}
                onChangeText={(text) => setNuevoPlato({ ...nuevoPlato, precio: text })}
                keyboardType="decimal-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Categoría:</Text>
              <View style={styles.categorias}>
                {['Principal', 'Entrada', 'Postre', 'Bebida'].map(cat => (
                  <Chip
                    key={cat}
                    selected={nuevoPlato.categoria === cat}
                    onPress={() => setNuevoPlato({ ...nuevoPlato, categoria: cat })}
                    style={styles.categoriaChip}
                  >
                    {cat}
                  </Chip>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={agregarPlato}
                style={styles.submitButton}
                buttonColor="#4CAF50"
                disabled={uploadingImage}
              >
                Agregar al Menú
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Lista de platos */}
        <Text style={styles.sectionTitle}>Platos del Menú</Text>

        {platosHoy.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No hay platos en el menú</Text>
            <Text style={styles.emptyText}>
              Agrega platos para que aparezcan en la app de clientes
            </Text>
          </View>
        ) : (
          platosHoy.map((plato) => (
            <Card key={plato.id} style={styles.platoCard}>
              <Card.Content>
                <View style={styles.platoContent}>
                  <Image
                    source={{ uri: plato.imagen || 'https://via.placeholder.com/80' }}
                    style={styles.platoImagen}
                  />

                  <View style={styles.platoInfo}>
                    <Text style={styles.platoNombre}>{plato.nombre}</Text>
                    <Text style={styles.platoDescripcion}>{plato.descripcion}</Text>
                    <View style={styles.platoMeta}>
                      <Text style={styles.platoCategoria}>{plato.categoria}</Text>
                    </View>
                  </View>

                  <View style={styles.platoAcciones}>
                    <Text style={styles.platoPrecio}>S/ {plato.precio.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.platoControles}>
                  <View style={styles.disponibilidad}>
                    <Text style={styles.disponibilidadLabel}>Disponible:</Text>
                    <Switch
                      value={plato.disponible}
                      onValueChange={() => toggleDisponibilidad(plato.id)}
                      color="#4CAF50"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.botonEliminar}
                    onPress={() => eliminarPlato(plato.id, plato.nombre)}
                  >
                    <Text style={styles.botonEliminarText}>🗑️ Eliminar</Text>
                  </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#FFF3E0',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  infoStats: {
    flexDirection: 'row',
    gap: 16,
  },
  infoStat: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  imagenSection: {
    marginBottom: 16,
  },
  imagenPreview: {
    alignItems: 'center',
    gap: 12,
  },
  imagenPreviewImg: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  cambiarImagenButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cambiarImagenText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  subirImagenButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subirImagenIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  subirImagenText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoriaChip: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  platoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  platoContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  platoImagen: {
    width: 80,
    height: 80,
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
  platoMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  platoCategoria: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  platoAcciones: {
    alignItems: 'flex-end',
  },
  platoPrecio: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  platoControles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  disponibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disponibilidadLabel: {
    fontSize: 14,
    color: '#666',
  },
  botonEliminar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  botonEliminarText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});