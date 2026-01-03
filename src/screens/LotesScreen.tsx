import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiService from '../services/api-service';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type LotesScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Lotes'>;

interface Props {
    navigation: LotesScreenNavigationProp;
}

export default function LotesScreen({ navigation }: Props) {
    const [lotes, setLotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFinalized, setShowFinalized] = useState(false);
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'GERENTE';

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadLotes();
        });
        return unsubscribe;
    }, [navigation]);

    const loadLotes = async () => {
        setLoading(true);
        const response = await apiService.getLotes();
        if (response.success && response.data) {
            setLotes(response.data);
            // Guardar en caché
            await apiService.cacheMasterData({ lotes: response.data });
        } else {
            // Intentar cargar de caché
            const cached = await apiService.getCachedLotes();
            if (cached.length > 0) {
                setLotes(cached);
            }
        }
        setLoading(false);
    };

    const handleFinalize = async (id: string) => {
        Alert.alert(
            'Finalizar Lote',
            '¿Estás seguro de que deseas finalizar este lote? El galpón quedará libre y el lote pasará al historial.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    onPress: async () => {
                        try {
                            const response = await apiService.finalizeLote(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Lote finalizado correctamente');
                                loadLotes();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo finalizar el lote');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Error desconocido');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Eliminar Lote',
            '¿Estás seguro de que deseas eliminar este lote? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteLote(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Lote eliminado correctamente');
                                loadLotes();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo eliminar el lote');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Error desconocido');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => (
        <View style={[styles.loteCard, !item.activo && styles.inactiveCard]}>
            <View style={styles.loteHeader}>
                <View>
                    <Text style={styles.loteName}>{item.nombre}</Text>
                    {!item.activo && <Text style={styles.finalizedDate}>Finalizado: {new Date(item.fecha_finalizacion).toLocaleDateString()}</Text>}
                </View>
                <Text style={[styles.typeBadge, item.tipo_ave === 'PONEDORA' ? styles.ponedora : styles.engorde]}>
                    {item.tipo_ave}
                </Text>
            </View>
            <View style={styles.loteDetails}>
                <Text style={styles.detailText}>Población: {item.poblacion_actual} / {item.poblacion_inicial}</Text>
                <Text style={styles.detailText}>Finca: {item.finca_nombre || 'N/A'}</Text>
                <Text style={styles.detailText}>Galpón: {item.galpon_nombre || 'N/A'}</Text>
            </View>
            {isAdmin && (
                <View style={styles.actions}>
                    {item.activo && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.finalizeButton]}
                            onPress={() => handleFinalize(item.id)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="#27ae60" />
                            <Text style={styles.finalizeText}>Finalizar</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('EditLote', { loteId: item.id })}
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

    const filteredLotes = lotes.filter(l => showFinalized ? !l.activo : l.activo);

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, !showFinalized && styles.activeTab]}
                    onPress={() => setShowFinalized(false)}
                >
                    <Text style={[styles.filterTabText, !showFinalized && styles.activeTabText]}>Activos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, showFinalized && styles.activeTab]}
                    onPress={() => setShowFinalized(true)}
                >
                    <Text style={[styles.filterTabText, showFinalized && styles.activeTabText]}>Finalizados</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredLotes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {showFinalized ? 'No hay lotes finalizados.' : 'No hay lotes activos.'}
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateLote')}
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
    loader: {
        flex: 1,
    },
    listContent: {
        padding: 15,
        paddingBottom: 80,
    },
    loteCard: {
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
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 5,
    },
    actionButton: {
        padding: 8,
        marginLeft: 15,
    },
    loteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    loteName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    ponedora: {
        backgroundColor: '#f39c12',
    },
    engorde: {
        backgroundColor: '#3498db',
    },
    loteDetails: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    detailText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#2ecc71',
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
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#95a5a6',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#e8f6ef',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
    },
    activeTabText: {
        color: '#27ae60',
    },
    inactiveCard: {
        opacity: 0.8,
        backgroundColor: '#f9f9f9',
    },
    finalizedDate: {
        fontSize: 12,
        color: '#e67e22',
        marginTop: 2,
        fontWeight: 'bold',
    },
    finalizeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f6ef',
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    finalizeText: {
        fontSize: 12,
        color: '#27ae60',
        fontWeight: 'bold',
        marginLeft: 4,
    },
});
