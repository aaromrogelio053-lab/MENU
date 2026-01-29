// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


// Importar pantallas
import SelectRoleScreen from '../screens/SelectRoleScreen';
import RepartidorLoginScreen from '../screens/repartidor/RepartidorLoginScreen';
import RepartidorHomeScreen from '../screens/repartidor/RepartidorHomeScreen';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminMenuScreen from '../screens/admin/AdminMenuScreen';
import AdminPedidosScreen from '../screens/admin/AdminPedidosScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SelectRole"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="SelectRole" 
          component={SelectRoleScreen}
        />
        <Stack.Screen 
          name="RepartidorLogin" 
          component={RepartidorLoginScreen}
        />
        <Stack.Screen 
          name="RepartidorHome" 
          component={RepartidorHomeScreen}
        />
        <Stack.Screen 
          name="AdminLogin" 
          component={AdminLoginScreen}
        />
        <Stack.Screen 
          name="AdminHome" 
          component={AdminHomeScreen}
        />
        <Stack.Screen 
          name="AdminMenu" 
          component={AdminMenuScreen}
        />
        <Stack.Screen 
          name="AdminPedidos" 
          component={AdminPedidosScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}