import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

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
    // Cargar usuario guardado al inicio
    loadStoredUser();

    // Escuchar cambios de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        };
        setUser(userData);
        
        // Guardar en AsyncStorage para persistencia
        await AsyncStorage.setItem('userId', firebaseUser.uid);
        await AsyncStorage.setItem('userEmail', firebaseUser.email);
      } else {
        setUser(null);
        // Limpiar AsyncStorage si no hay usuario
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('userEmail');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadStoredUser = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (userId && userEmail) {
        setUser({ uid: userId, email: userEmail });
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};