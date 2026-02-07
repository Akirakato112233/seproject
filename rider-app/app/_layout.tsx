import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { DeliveryProvider } from "../context/DeliveryContext";

function RootLayoutNav() {
  return <Slot />;
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
