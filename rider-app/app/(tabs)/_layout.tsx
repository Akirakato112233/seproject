import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,

        // สีตาม Figma (น้ำเงินเข้ม + เทาอ่อน)
        tabBarActiveTintColor: "#0E3A78",
        tabBarInactiveTintColor: "#94A3B8",

        // ตัวหนังสือ
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
          marginTop: isIOS ? 2 : 0,
        },

        // ระยะไอคอน/ปุ่ม
        tabBarIconStyle: {
          marginTop: isIOS ? 2 : 6,
        },
        tabBarItemStyle: {
          paddingVertical: isIOS ? 4 : 6,
        },

        // กล่อง Tab bar (โค้ง + เงาแบบ Figma)
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: isIOS ? 12 : 10,

          height: isIOS ? 86 : 78,
          paddingTop: 10,
          paddingBottom: isIOS ? 18 : 14,

          borderTopWidth: 0,
          borderRadius: 22,
          backgroundColor: "#FFFFFF",

          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="home-outline"
              size={focused ? 28 : 26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="earning"
        options={{
          title: "Earning",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="cash-outline"
              size={focused ? 28 : 26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="wallet-outline"
              size={focused ? 28 : 26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="person-outline"
              size={focused ? 28 : 26}
              color={color}
            />
          ),
        }}
      />

      {/* ซ่อนหน้าที่ไม่ควรเป็นแท็บ (ถ้ามีไฟล์อยู่ใน (tabs)) */}
      <Tabs.Screen name="active" options={{ href: null }} />
    </Tabs>
  );
}
