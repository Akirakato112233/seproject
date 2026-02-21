import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Define User type
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
    const [isDevMode, setIsDevMode] = useState(false);

    // Load token and user from AsyncStorage on app start
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
                const savedUser = await AsyncStorage.getItem(USER_KEY);

                if (savedToken && savedUser) {
                    setToken(savedToken);
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                    console.log('Auth loaded from storage:', JSON.stringify(parsedUser));
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
            await AsyncStorage.setItem(TOKEN_KEY, newToken);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
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

    const setDevMode = (value: boolean) => {
        console.log('DEV MODE:', value ? 'ON' : 'OFF');
        setIsDevMode(value);
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

