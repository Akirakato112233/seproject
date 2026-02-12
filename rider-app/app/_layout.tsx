import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { DeliveryProvider } from "../context/DeliveryContext";

function RootLayoutNav() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeliveryProvider>
        <RootLayoutNav />
      </DeliveryProvider>
    </AuthProvider>
  );
}
