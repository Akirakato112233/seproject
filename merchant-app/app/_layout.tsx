import { Slot } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { OrdersProvider } from '../context/OrdersContext';
import { ServicesProvider } from '../context/ServicesContext';

function RootLayoutNav() {
  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OrdersProvider>
        <ServicesProvider>
          <RootLayoutNav />
        </ServicesProvider>
      </OrdersProvider>
    </AuthProvider>
  );
}