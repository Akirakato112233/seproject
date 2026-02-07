// seproject/rider-app/app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // DEV: เข้าแอปด้านในก่อน
  return <Redirect href="/(tabs)" />;
}