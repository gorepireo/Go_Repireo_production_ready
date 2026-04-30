'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  shop_id: string;
  quantity: number;
  category?: string;
}

interface CartContextType {
  cart: CartItem[];
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  total: 0,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Handle Hydration: Only load from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('repireo_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
  }, []);

  // Persist to localStorage whenever cart changes (only after mount)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('repireo_cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const addItem = (product: any) => {
    setCart(curr => {
      const existing = curr.find(i => i.id === product.id);
      if (existing) {
        return curr.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...curr, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setCart(curr => curr.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // If not mounted, return a hidden container or a simple fragment 
  // to keep the layout consistent without triggering a mismatch.
  if (!mounted) {
    return (
      <CartContext.Provider value={{ cart: [], addItem, removeItem, clearCart, total: 0 }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);