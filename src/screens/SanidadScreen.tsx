import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type SanidadScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Sanidad'>;

interface Props {
    navigation: SanidadScreenNavigationProp;
}

export default function SanidadScreen({ navigation }: Props) {
    const [loteId, setLoteId] = useState('');
    const [calendario, setCalendario] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadCalendario = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await apiService.getCalendarioSanitario(id);
            if (response.success && response.data) {
                setCalendario(response.data);
            } else {
                Alert.alert('Error', response.error || 'No se pudo cargar el calendario');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (loteId) {
            loadCalendario(loteId);
        }
    }, [loteId]);

    const onRefresh = () => {
        if (loteId) {
            setRefreshing(true);
            loadCalendario(loteId);
        }
    };

    const handleAplicar = async (item: any) => {
        Alert.alert(
            'Confirmar Aplicación',
            `¿Deseas registrar la aplicación de ${item.producto} para ${item.actividad}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        const data = {
                            lote_id: loteId,
                            programa_sanitario_id: item.id,
                            fecha_aplicacion: new Date().toISOString(),
                            producto: item.producto,
                            dosis: item.dosis,
                            via_aplicacion: item.via_aplicacion,
                            responsable: 'Usuario Móvil',
                        };

                        try {
                            setLoading(true);
                            let response;
                            const isOnline = apiService.getConnectionStatus();

                            // Buscar si el producto existe en el inventario para registrar el gasto
                            const insumosRes = await apiService.getInsumos();
                            let selectedInsumo = null;
                            if (insumosRes.success && insumosRes.data) {
                                // Busqueda por nombre (insensible a mayúsculas/minúsculas)
                                selectedInsumo = insumosRes.data.find((i: any) =>
                                    i.nombre_producto.toLowerCase().includes(item.producto.toLowerCase()) ||
                                    item.producto.toLowerCase().includes(i.nombre_producto.toLowerCase())
                                );
                            }

                            if (isOnline) {
                                response = await apiService.createAplicacionSanitaria(data);

                                // Si encontramos el insumo, registramos el consumo
                                if (selectedInsumo) {
                                    await apiService.createConsumoInsumo({
                                        lote_id: loteId,
                                        insumo_id: selectedInsumo.id,
                                        cantidad: 1, // Por defecto 1 unidad/dosis si no se especifica
                                        unidad_medida: selectedInsumo.unidad_medida,
                                        fecha: new Date().toISOString(),
                                        observaciones: `Aplicación sanitaria: ${item.actividad}`,
                                    });
                                }
                            } else {
                                await apiService.savePendingRecord('aplicaciones_sanitarias', data);
                                if (selectedInsumo) {
                                    await apiService.savePendingRecord('consumo_insumos', {
                                        lote_id: loteId,
                                        insumo_id: selectedInsumo.id,
                                        cantidad: 1,
                                        unidad_medida: selectedInsumo.unidad_medida,
                                        fecha: new Date().toISOString(),
                                        observaciones: `Aplicación sanitaria: ${item.actividad}`,
                                    });
                                }
                                response = { success: true, offline: true };
                            }

                            if (response.success) {
                                const isOffline = (response as any).offline;
                                Alert.alert('Éxito', isOffline ? 'Guardado localmente' : 'Aplicación y gasto registrados');
                                loadCalendario(loteId);
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo registrar');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Error desconocido');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderCalendarioItem = ({ item }: { item: any }) => (
        <View style={[styles.card, item.aplicado ? styles.cardAplicado : styles.cardPendiente]}>
            <View style={styles.cardHeader}>
                <Text style={styles.actividad}>{item.actividad}</Text>
                <Text style={[styles.statusBadge, item.aplicado ? styles.badgeAplicado : styles.badgePendiente]}>
                    {item.aplicado ? 'Aplicado' : 'Pendiente'}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.infoText}><Text style={styles.bold}>Producto:</Text> {item.producto}</Text>
                <Text style={styles.infoText}><Text style={styles.bold}>Dosis:</Text> {item.dosis}</Text>
                <Text style={styles.infoText}><Text style={styles.bold}>Vía:</Text> {item.via_aplicacion}</Text>
                <Text style={styles.infoText}><Text style={styles.bold}>Edad Sugerida:</Text> {item.edad_sugerida_dias} días</Text>
            </View>

            {!item.aplicado && (
                <TouchableOpacity style={styles.aplicarButton} onPress={() => handleAplicar(item)}>
                    <Text style={styles.aplicarButtonText}>Registrar Aplicación</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.selectorContainer}>
                <Text style={styles.label}>Selecciona un Lote:</Text>
                <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#27ae60" />
                </View>
            ) : (
                <FlatList
                    data={calendario}
                    renderItem={renderCalendarioItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27ae60']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {loteId ? 'No hay actividades programadas para este lote.' : 'Selecciona un lote para ver su calendario sanitario.'}
                            </Text>
                        </View>
                    }
                />
            )}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateSanidad')}
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
    selectorContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 8,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardPendiente: {
        borderLeftWidth: 5,
        borderLeftColor: '#f1c40f',
    },
    cardAplicado: {
        borderLeftWidth: 5,
        borderLeftColor: '#2ecc71',
        opacity: 0.8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    actividad: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    badgePendiente: {
        backgroundColor: '#fff3cd',
        color: '#856404',
    },
    badgeAplicado: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
    },
    cardBody: {
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#34495e',
    },
    bold: {
        fontWeight: 'bold',
    },
    aplicarButton: {
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    aplicarButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#95a5a6',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#3498db',
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
