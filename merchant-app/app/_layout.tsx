import { Slot } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { OrdersProvider } from '../context/OrdersContext';
import { ServicesProvider } from '../context/ServicesContext';
import { ShopProvider } from '../context/ShopContext';

function RootLayoutNav() {
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ShopProvider>
        <OrdersProvider>
          <ServicesProvider>
            <RootLayoutNav />
          </ServicesProvider>
        </OrdersProvider>
      </ShopProvider>
    </AuthProvider>
  );
}