// src/context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Agregar item al carrito
  const addToCart = (plato) => {
    setCartItems(prevItems => {
      // Verificar si el plato ya está en el carrito
      const existingItem = prevItems.find(item => item.id === plato.id);
      
      if (existingItem) {
        // Si ya existe, aumentar cantidad
        return prevItems.map(item =>
          item.id === plato.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        // Si no existe, agregarlo con cantidad 1
        return [...prevItems, { ...plato, cantidad: 1 }];
      }
    });
  };

  // Remover item del carrito
  const removeFromCart = (platoId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== platoId));
  };

  // Aumentar cantidad
  const increaseQuantity = (platoId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === platoId
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  // Disminuir cantidad
  const decreaseQuantity = (platoId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === platoId && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  // Limpiar carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular total de items
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.cantidad, 0);
  };

  // Calcular subtotal
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  // Calcular costo de delivery (ejemplo: S/3 fijo)
  const getDeliveryCost = () => {
    return cartItems.length > 0 ? 3.00 : 0;
  };

  // Calcular total
  const getTotal = () => {
    return getSubtotal() + getDeliveryCost();
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    getTotalItems,
    getSubtotal,
    getDeliveryCost,
    getTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};