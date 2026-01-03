import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import CustomDrawerContent from '../components/CustomDrawerContent';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MortalidadScreen from '../screens/MortalidadScreen';
import AlimentoScreen from '../screens/AlimentoScreen';
import PosturaScreen from '../screens/PosturaScreen';
import LotesScreen from '../screens/LotesScreen';
import CreateLoteScreen from '../screens/CreateLoteScreen';
import FincasScreen from '../screens/FincasScreen';
import GalponesScreen from '../screens/GalponesScreen';
import RegistrosHistoryScreen from '../screens/RegistrosHistoryScreen';
import AdminUsuariosScreen from '../screens/AdminUsuariosScreen';
import InsumosScreen from '../screens/InsumosScreen';
import ConsumoInsumosScreen from '../screens/ConsumoInsumosScreen';
import SanidadScreen from '../screens/SanidadScreen';
import CreateInsumoScreen from '../screens/CreateInsumoScreen';
import CreateSanidadScreen from '../screens/CreateSanidadScreen';
import VentasScreen from '../screens/VentasScreen';
import CreateVentaScreen from '../screens/CreateVentaScreen';
import AccountingSummaryScreen from '../screens/AccountingSummaryScreen';
import EditInsumoScreen from '../screens/EditInsumoScreen';
import EditLoteScreen from '../screens/EditLoteScreen';
import GlobalSummaryScreen from '../screens/GlobalSummaryScreen';
import GastosScreen from '../screens/GastosScreen';
import RegistrosMortalidadScreen from '../screens/RegistrosMortalidadScreen';
import EditarMortalidadScreen from '../screens/EditarMortalidadScreen';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type RootDrawerParamList = {
    Home: undefined;
    Lotes: undefined;
    Fincas: undefined;
    Galpones: undefined;
    Insumos: undefined;
    RegistrosHistory: undefined;
    Sanidad: undefined;
    Mortalidad: undefined;
    Alimento: undefined;
    Postura: undefined;
    CreateLote: undefined;
    ConsumoInsumos: undefined;
    AdminUsuarios: undefined;
    CreateInsumo: undefined;
    CreateSanidad: undefined;
    Ventas: undefined;
    CreateVenta: undefined;
    AccountingSummary: undefined;
    EditInsumo: { insumoId: string };
    EditLote: { loteId: string };
    GlobalSummary: undefined;
    Gastos: undefined;
    RegistrosMortalidad: undefined;
    EditarMortalidad: { registro: any };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Stack para usuarios NO autenticados
function AuthStack() {
    return (
        <Stack.Navigator id="auth" screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: 'Crear Cuenta' }}
            />
        </Stack.Navigator>
    );
}

// Drawer para usuarios autenticados
function MainDrawer() {
    return (
        <Drawer.Navigator
            id="main"
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: '#2c3e50',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                drawerActiveTintColor: '#2ecc71',
                drawerInactiveTintColor: '#7f8c8d',
                drawerLabelStyle: {
                    marginLeft: 10,
                    fontSize: 16,
                }
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Dashboard',
                    drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Lotes"
                component={LotesScreen}
                options={{
                    title: 'Gestión de Lotes',
                    drawerIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Fincas"
                component={FincasScreen}
                options={{
                    title: 'Fincas',
                    drawerIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Galpones"
                component={GalponesScreen}
                options={{
                    title: 'Galpones',
                    drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Insumos"
                component={InsumosScreen}
                options={{
                    title: 'Inventario',
                    drawerIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="RegistrosHistory"
                component={RegistrosHistoryScreen}
                options={{
                    title: 'Historial',
                    drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Sanidad"
                component={SanidadScreen}
                options={{
                    title: 'Sanidad',
                    drawerIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} />
                }}
            />
            {/* Pantallas que no están en el menú principal pero necesitan estar en el stack/drawer */}
            <Drawer.Screen
                name="Mortalidad"
                component={MortalidadScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Registrar Mortalidad' }}
            />
            <Drawer.Screen
                name="RegistrosMortalidad"
                component={RegistrosMortalidadScreen}
                options={{
                    title: 'Historial Mortalidad',
                    drawerIcon: ({ color, size }) => <Ionicons name="skull-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="EditarMortalidad"
                component={EditarMortalidadScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Mortalidad' }}
            />
            <Drawer.Screen
                name="Alimento"
                component={AlimentoScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Alimento' }}
            />
            <Drawer.Screen
                name="Postura"
                component={PosturaScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Postura' }}
            />
            <Drawer.Screen
                name="CreateLote"
                component={CreateLoteScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Nuevo Lote' }}
            />
            <Drawer.Screen
                name="ConsumoInsumos"
                component={ConsumoInsumosScreen}
                options={{ drawerItemStyle: { display: 'none' }, title: 'Consumo' }}
            />
            <Drawer.Screen
                name="AdminUsuarios"
                component={AdminUsuariosScreen}
                options={{
                    title: 'Usuarios',
                    drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="CreateInsumo"
                component={CreateInsumoScreen}
                options={{
                    title: 'Nuevo Insumo',
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="CreateSanidad"
                component={CreateSanidadScreen}
                options={{
                    title: 'Programar Sanidad',
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="Ventas"
                component={VentasScreen}
                options={{
                    title: 'Ventas',
                    drawerIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="CreateVenta"
                component={CreateVentaScreen}
                options={{
                    title: 'Nueva Venta',
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="AccountingSummary"
                component={AccountingSummaryScreen}
                options={{
                    title: 'Resumen Contable',
                    drawerIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="EditInsumo"
                component={EditInsumoScreen}
                options={{
                    title: 'Editar Insumo',
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="EditLote"
                component={EditLoteScreen}
                options={{
                    title: 'Editar Lote',
                    drawerItemStyle: { display: 'none' },
                }}
            />
            <Drawer.Screen
                name="GlobalSummary"
                component={GlobalSummaryScreen}
                options={{
                    title: 'Resumen Global',
                    drawerIcon: ({ color, size }) => <Ionicons name="globe-outline" size={size} color={color} />
                }}
            />
            <Drawer.Screen
                name="Gastos"
                component={GastosScreen}
                options={{
                    title: 'Gastos e Inversión',
                    drawerIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />
                }}
            />
        </Drawer.Navigator>
    );
}

export default function AppNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainDrawer /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
});
