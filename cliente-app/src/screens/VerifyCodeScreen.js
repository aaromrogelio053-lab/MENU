// src/screens/VerifyCodeScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyCodeScreen({ route, navigation }) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleCodeChange = (text, index) => {
    // Solo permitir números
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Si presiona backspace y el campo está vacío, ir al anterior
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      // Aquí irá la lógica de verificación con Firebase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Código verificado:', verificationCode);
      
      // NUEVO: Guardar datos del usuario en AsyncStorage
      // Por ahora usamos el teléfono como userId temporal
      // Cuando implementes Firebase Auth, aquí irá el user.uid real
      const userId = `user_${phoneNumber}`; // ID temporal basado en teléfono
      
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userPhone', phoneNumber);
      
      console.log('Usuario guardado:', userId);
      
      // Navegar a la pantalla principal
      navigation.replace('Home');
      
    } catch (error) {
      console.error('Error al verificar código:', error);
      Alert.alert('Error', 'Código incorrecto. Intenta nuevamente.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    Alert.alert(
      'Reenviar código',
      '¿Deseas que te enviemos un nuevo código?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reenviar',
          onPress: async () => {
            // Aquí irá la lógica para reenviar el código
            Alert.alert('Código reenviado', 'Hemos enviado un nuevo código a tu teléfono');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verificación</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a
          </Text>
          <Text style={styles.phoneNumber}>+51 {phoneNumber}</Text>
        </View>

        {/* Código de verificación */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              mode="outlined"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.codeInput}
              outlineStyle={styles.codeInputOutline}
              textColor="#000"
              disabled={loading}
            />
          ))}
        </View>

        {/* Botón verificar */}
        <Button
          mode="contained"
          onPress={handleVerify}
          loading={loading}
          disabled={loading || code.join('').length !== 6}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Verificar
        </Button>

        {/* Reenviar código */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>¿No recibiste el código?</Text>
          <TouchableOpacity onPress={handleResendCode} disabled={loading}>
            <Text style={styles.resendButton}>Reenviar</Text>
          </TouchableOpacity>
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
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 50,
    height: 60,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  codeInputOutline: {
    borderWidth: 2,
    borderRadius: 12,
  },
  button: {
    marginBottom: 24,
    backgroundColor: '#FF6B35',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendButton: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});