// src/screens/SelectRoleScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function SelectRoleScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenido al</Text>
          <Text style={styles.title}>Panel de Equipo</Text>
          <Text style={styles.description}>Selecciona tu rol para continuar</Text>
        </View>

        {/* Botones de rol */}
        <View style={styles.rolesContainer}>
          {/* Botón Repartidor */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => navigation.navigate('RepartidorLogin')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8BC34A', '#689F38']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.roleIcon}>🚴</Text>
              <Text style={styles.roleName}>REPARTIDOR</Text>
              <Text style={styles.roleDescription}>
                Gestiona tus entregas y rutas
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón Admin */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => navigation.navigate('AdminLogin')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B35', '#E85D2A']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.roleIcon}>👔</Text>
              <Text style={styles.roleName}>ADMINISTRADOR</Text>
              <Text style={styles.roleDescription}>
                Gestiona menús, pedidos y equipo
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Versión 1.0.0 • Menú Arequipa
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  rolesContainer: {
    gap: 16,
    flex: 1,
  },
  roleCard: {
    width: '100%',
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    maxHeight: 200,
  },
  roleGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  roleName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 1,
  },
  roleDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});