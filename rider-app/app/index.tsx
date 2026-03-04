// seproject/rider-app/app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { token, isDevMode, loading } = useAuth();

    if (loading) return null;

    // ถ้า login แล้วหรืออยู่ใน dev mode ไปหน้าหลัก
    if (token || isDevMode) {
        return <Redirect href="/(tabs)" />;
    }

    // ยังไม่ได้ login → ไปหน้า create-account
    return <Redirect href="/create-account" />;
}
