import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type VentasScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Ventas'>;

interface Props {
    navigation: VentasScreenNavigationProp;
}

export default function VentasScreen({ navigation }: Props) {
    const [ventas, setVentas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadVentas();
            loadCurrentUser();
        });
        loadVentas();
        loadCurrentUser();
        return unsubscribe;
    }, [navigation]);

    const loadCurrentUser = async () => {
        try {
            const user = await apiService.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error al cargar usuario:', error);
        }
    };

    const loadVentas = async () => {
        setLoading(true);
        try {
            const response = await apiService.getVentas();
            if (response.success && response.data) {
                setVentas(response.data);
            } else {
                Alert.alert('Error', response.error || 'No se pudieron cargar las ventas');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVenta = (venta: any) => {
        Alert.alert(
            'Confirmar Eliminación',
            `¿Está seguro de eliminar la venta de ${venta.cantidad} aves a ${venta.cliente}?\n\nLa población del lote será restaurada automáticamente.`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deleteVenta(venta.id)
                }
            ]
        );
    };

    const deleteVenta = async (ventaId: string) => {
        try {
            const response = await apiService.deleteVenta(ventaId);
            if (response.success) {
                Alert.alert('Éxito', 'Venta eliminada correctamente');
                loadVentas();
            } else {
                Alert.alert('Error', response.error || 'No se pudo eliminar la venta');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error al eliminar la venta');
        }
    };

    const isAdmin = () => {
        return currentUser?.role === 'ADMIN' || currentUser?.role === 'PROPIETARIO';
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.dateText}>{new Date(item.fecha).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.totalText}>${item.total.toLocaleString('es-CO')}</Text>
                    {isAdmin() && (
                        <TouchableOpacity
                            onPress={() => handleDeleteVenta(item)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Text style={styles.label}>Cliente:</Text>
                    <Text style={styles.value}>{item.cliente}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Cantidad:</Text>
                    <Text style={styles.value}>{item.cantidad} aves</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Precio Unit:</Text>
                    <Text style={styles.value}>${item.precio_unitario.toLocaleString('es-CO')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Pago:</Text>
                    <Text style={[styles.value, styles.paymentBadge, {
                        backgroundColor: item.forma_pago === 'CREDITO' ? '#fff3cd' : '#d4edda'
                    }]}>
                        {item.forma_pago === 'CONTADO_EFECTIVO' ? 'Contado (Efectivo)' :
                            item.forma_pago === 'CONTADO_TRANSFERENCIA' ? 'Contado (Transf.)' :
                                item.forma_pago === 'CREDITO' ? 'Crédito' : item.forma_pago || 'N/A'}
                    </Text>
                </View>
                {item.observaciones ? (
                    <View style={styles.obsContainer}>
                        <Ionicons name="information-circle-outline" size={16} color="#95a5a6" />
                        <Text style={styles.obsText}>{item.observaciones}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#e67e22" style={styles.loader} />
            ) : (
                <FlatList
                    data={ventas}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="cart-outline" size={64} color="#bdc3c7" />
                            <Text style={styles.emptyText}>No hay ventas registradas.</Text>
                            <Text style={styles.emptySubtext}>Toca el botón + para registrar una venta</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateVenta')}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loader: {
        flex: 1,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
        marginBottom: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    deleteButton: {
        padding: 5,
    },
    cardBody: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    paymentBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
    },
    obsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 5,
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 6,
        marginTop: 5,
    },
    obsText: {
        flex: 1,
        fontSize: 13,
        color: '#6c757d',
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#e67e22',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#7f8c8d',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#95a5a6',
        marginTop: 5,
    },
});