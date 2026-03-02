import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const DEV_MODE_KEY = 'auth_dev_mode';

// Define User type (backend ส่ง id, บางที่ใช้ _id)
interface UserData {
    _id?: string;
    id?: string;
    email: string;
    displayName: string;
    phone?: string;
    address?: string;
    balance?: number;
}

interface AuthContextType {
    user: UserData | null;
    token: string | null;
    loading: boolean;
    isDevMode: boolean;
    setDevMode: (value: boolean) => void;
    login: (token: string, user: UserData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    isDevMode: false,
    setDevMode: () => { },
    login: async () => { },
    logout: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    // Dev move: ใช้แอปได้โดยไม่ต้อง login ก่อน (เปิดเป็น true ไว้ก่อน)
    const [isDevMode, setIsDevMode] = useState(false);

    // Load token, user, and dev mode from AsyncStorage on app start
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const [savedToken, savedUser, savedDevMode] = await Promise.all([
                    AsyncStorage.getItem(TOKEN_KEY),
                    AsyncStorage.getItem(USER_KEY),
                    AsyncStorage.getItem(DEV_MODE_KEY),
                ]);

                if (savedToken && savedUser) {
                    const parsed = JSON.parse(savedUser);
                    setToken(savedToken);
                    setUser({ ...parsed, _id: parsed._id ?? parsed.id });
                    console.log('Auth loaded from storage');
                }
                if (savedDevMode === 'true') {
                    setIsDevMode(true);
                }
            } catch (error) {
                console.error('Error loading auth:', error);
            } finally {
                setLoading(false);
            }
        };
        loadAuth();
    }, []);

    const login = async (newToken: string, userData: UserData) => {
        try {
            // ปกติ backend ส่ง id, เก็บเป็น _id เพื่อให้ effectiveRiderId ใช้ได้
            const normalized = { ...userData, _id: userData._id ?? userData.id };
            await AsyncStorage.setItem(TOKEN_KEY, newToken);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalized));
            setToken(newToken);
            setUser(normalized);
            console.log('Auth saved to storage');
        } catch (error) {
            console.error('Error saving auth:', error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
            console.log('Auth cleared');
        } catch (error) {
            console.error('Error clearing auth:', error);
        }
    };

    const setDevMode = async (value: boolean) => {
        console.log('DEV MODE:', value ? 'ON' : 'OFF');
        setIsDevMode(value);
        try {
            await AsyncStorage.setItem(DEV_MODE_KEY, value ? 'true' : 'false');
        } catch (e) {
            console.error('Error saving dev mode:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, isDevMode, setDevMode, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

