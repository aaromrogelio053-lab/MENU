import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const repartidorId = await AsyncStorage.getItem('repartidorId');
      const adminLoggedIn = await AsyncStorage.getItem('adminLoggedIn');
      const repartidorNombre = await AsyncStorage.getItem('repartidorNombre');
      const adminEmail = await AsyncStorage.getItem('adminEmail');
      
      if (repartidorId) {
        setUser({ 
          id: repartidorId, 
          role: 'repartidor',
          nombre: repartidorNombre 
        });
      } else if (adminLoggedIn === 'true') {
        setUser({ 
          role: 'admin',
          email: adminEmail
        });
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = () => {
    loadStoredUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};