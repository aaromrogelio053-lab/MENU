// App.js - Archivo principal de la app
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <CartProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </CartProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}