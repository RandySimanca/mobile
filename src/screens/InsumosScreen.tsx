import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import apiService from '../services/api-service';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type InsumosScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Insumos'>;

interface Props {
    navigation: InsumosScreenNavigationProp;
}

export default function InsumosScreen({ navigation }: Props) {
    const [insumos, setInsumos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'GERENTE';

    const loadInsumos = async () => {
        setLoading(true);
        try {
            const response = await apiService.getInsumos();
            if (response.success && response.data) {
                setInsumos(response.data);
            } else {
                Alert.alert('Error', response.error || 'No se pudieron cargar los insumos');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadInsumos();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadInsumos();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Eliminar Insumo',
            '¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteInsumo(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Insumo eliminado correctamente');
                                loadInsumos();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo eliminar el insumo');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Error desconocido');
                        }
                    }
                }
            ]
        );
    };

    const renderInsumoItem = ({ item }: { item: any }) => (
        <View style={styles.insumoCard}>
            <View style={styles.insumoInfo}>
                <Text style={styles.insumoNombre}>{item.nombre_producto}</Text>
                <Text style={styles.insumoTipo}>{item.tipo}</Text>
                <Text style={styles.insumoStock}>
                    Stock: <Text style={item.stock_actual <= item.stock_minimo ? styles.lowStock : styles.normalStock}>
                        {item.stock_actual} {item.unidad_medida}
                    </Text>
                </Text>
                <Text style={styles.insumoPrecio}>
                    Precio Unit: <Text style={styles.precioText}>${item.precio_unitario?.toLocaleString() || '0'}</Text>
                </Text>
                <Text style={styles.insumoTotal}>
                    Inversión Total: <Text style={styles.totalText}>${((item.stock_actual || 0) * (item.precio_unitario || 0)).toLocaleString()}</Text>
                </Text>
            </View>
            <View style={styles.insumoBadge}>
                <Text style={styles.badgeText}>{item.tipo}</Text>
            </View>
            {isAdmin && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('EditInsumo', { insumoId: item.id })}
                    >
                        <Ionicons name="pencil" size={20} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#27ae60" />
                <Text style={styles.loadingText}>Cargando inventario...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={insumos}
                renderItem={renderInsumoItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27ae60']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay insumos registrados.</Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateInsumo')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    insumoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actions: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    actionButton: {
        padding: 8,
        marginLeft: 5,
    },
    insumoInfo: {
        flex: 1,
    },
    insumoNombre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    insumoTipo: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    insumoStock: {
        fontSize: 15,
        color: '#34495e',
    },
    normalStock: {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    lowStock: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    insumoPrecio: {
        fontSize: 14,
        color: '#34495e',
        marginTop: 2,
    },
    precioText: {
        color: '#2c3e50',
        fontWeight: 'bold',
    },
    insumoTotal: {
        fontSize: 14,
        color: '#27ae60',
        marginTop: 2,
    },
    totalText: {
        color: '#27ae60',
        fontWeight: 'bold',
    },
    insumoBadge: {
        backgroundColor: '#e1f5fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#0288d1',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 10,
        color: '#7f8c8d',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#95a5a6',
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#27ae60',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
    },
});
