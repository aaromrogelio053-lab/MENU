import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, signOut } from 'firebase/auth';
import { obtenerUsuario } from '../services/firebaseService';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const result = await obtenerUsuario(userId);
        if (result.success) {
          setUserData(result.data);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.multiRemove(['userId', 'userEmail', 'userName']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ icon, title, value, onPress, badge }) => (
    <TouchableOpacity 
      style={styles.infoCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoCardLeft}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
        </View>
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {onPress && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData?.nombre?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{userData?.nombre || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{userData?.email || ''}</Text>
      </View>

      {/* Información Personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <InfoCard
          icon="👤"
          title="Nombre completo"
          value={userData?.nombre}
        />
        
        <InfoCard
          icon="📧"
          title="Email"
          value={userData?.email}
        />
        
        <InfoCard
          icon="📱"
          title="Teléfono"
          value={userData?.telefono || 'No registrado'}
        />
        
        <InfoCard
          icon="📍"
          title="Dirección principal"
          value={userData?.direccion || 'No registrada'}
          badge="Editar"
          onPress={() => {
            Alert.alert(
              'Próximamente',
              'La edición de dirección estará disponible en la próxima actualización'
            );
          }}
        />
      </View>

      {/* Métodos de Pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métodos de Pago</Text>
        
        <InfoCard
          icon="💵"
          title="Efectivo"
          value="Pago al recibir el pedido"
          badge="Activo"
        />
        
        <InfoCard
          icon="💳"
          title="Yape"
          value="Disponible próximamente"
          badge="Próximamente"
        />
        
        <InfoCard
          icon="💳"
          title="Tarjeta de crédito/débito"
          value="Culqi - Próximamente"
          badge="Próximamente"
        />
      </View>

      {/* Opciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <InfoCard
          icon="🔔"
          title="Notificaciones"
          value="Próximamente"
          onPress={() => {
            Alert.alert(
              'Próximamente',
              'Las notificaciones push estarán disponibles en la próxima versión'
            );
          }}
        />
        
        <InfoCard
          icon="ℹ️"
          title="Ayuda y Soporte"
          value="Contacta con nosotros"
          onPress={() => {
            Alert.alert(
              'Soporte',
              'Para ayuda, contáctanos:\n\nEmail: admin@menuarequipa.com\nTeléfono: (Próximamente)'
            );
          }}
        />
      </View>

      {/* Botón Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Versión 1.0.0</Text>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#FF6B35',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFE0D6',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#FFE0D6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;