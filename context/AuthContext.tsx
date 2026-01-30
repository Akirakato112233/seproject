import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../services/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isDevMode: boolean;
    setDevMode: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isDevMode: false,
    setDevMode: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDevMode, setIsDevMode] = useState(false);

    useEffect(() => {
        try {
            // Listen to auth state changes (Firebase modular SDK syntax)
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
                setLoading(false);
                console.log('Auth state changed:', user?.email || 'No user');
            }, (error) => {
                // Handle auth errors
                console.error('Auth error:', error);
                setLoading(false);
            });

            // Cleanup subscription
            return () => unsubscribe();
        } catch (error) {
            console.error('Firebase auth initialization error:', error);
            setLoading(false);
        }
    }, []);

    const setDevMode = (value: boolean) => {
        console.log('DEV MODE:', value ? 'ON' : 'OFF');
        setIsDevMode(value);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isDevMode, setDevMode }}>
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
