import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { AuthResponse } from '../services/api-service';

interface User {
    id: string;
    email: string;
    role: string;
    name: string;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Verificar si hay una sesión guardada al iniciar la app
    useEffect(() => {
        checkStoredAuth();
    }, []);

    const checkStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('auth_token');
            const storedUser = await AsyncStorage.getItem('auth_user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await apiService.login(email, password);

            if (response.success && response.data) {
                const { token: authToken, user: userData } = response.data;

                // Guardar en AsyncStorage
                await AsyncStorage.setItem('auth_token', authToken);
                await AsyncStorage.setItem('auth_user', JSON.stringify(userData));

                // Actualizar estado
                setToken(authToken);
                setUser(userData);

                return { success: true };
            } else {
                return { success: false, error: response.error || 'Error de autenticación' };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error de conexión'
            };
        }
    };

    const logout = async () => {
        try {
            // Limpiar AsyncStorage
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');

            // Limpiar estado
            setToken(null);
            setUser(null);

            // Limpiar token del servicio API
            await apiService.logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                isAuthenticated: !!token && !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
