import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';
import { generateVentaPDF } from '../utils/pdfGenerator';
import { useNavigation } from '@react-navigation/native';

type FilterType = 'TODO' | 'VENTAS' | 'POSTURA' | 'ALIMENTO' | 'MORTALIDAD';

export default function RegistrosHistoryScreen() {
    const navigation = useNavigation<any>();
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [registros, setRegistros] = useState<any[]>([]);
    const [filteredRegistros, setFilteredRegistros] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('TODO');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await apiService.getCurrentUser();
            setCurrentUser(user);
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (selectedLote) {
            loadRegistros();
        } else {
            setRegistros([]);
            setFilteredRegistros([]);
        }
    }, [selectedLote]);

    useEffect(() => {
        applyFilter();
    }, [activeFilter, registros]);

    const isAdmin = () => {
        return currentUser?.role === 'ADMIN' || currentUser?.role === 'PROPIETARIO';
    };

    const applyFilter = () => {
        if (activeFilter === 'TODO') {
            setFilteredRegistros(registros);
            return;
        }

        const filtered = registros.filter(reg => {
            const filter = activeFilter as string;
            if (filter === 'MORTALIDAD') return reg.mortalidad_dia > 0;
            if (filter === 'POSTURA') return reg.huevos_totales > 0;
            if (filter === 'ALIMENTO') return reg.alimento_consumido_kg > 0;
            if (filter === 'VENTAS') return reg.tipo_registro === 'VENTA';
            return true;
        });
        setFilteredRegistros(filtered);
    };

    const loadRegistros = async () => {
        setLoading(true);
        try {
            const [respRegistros, respVentas, pendingRecords] = await Promise.all([
                apiService.getRegistrosDiariosPorLote(selectedLote.id),
                apiService.getVentasPorLote(selectedLote.id),
                apiService.getPendingRecords('ventas') // Ajustado para usar el tipo correcto
            ]);

            if (respRegistros.success && respVentas.success) {
                const registrosData = (respRegistros.data || []).map(r => ({
                    ...r,
                    tipo_registro: 'DIARIO',
                    lote_nombre: selectedLote.nombre
                }));
                const ventasData = (respVentas.data || []).map(v => ({
                    ...v,
                    tipo_registro: 'VENTA',
                    lote_nombre: selectedLote.nombre
                }));

                // Filtrar registros pendientes para este lote
                const pendingData = (pendingRecords || [])
                    .filter((p: any) => p.lote_id === selectedLote.id)
                    .map((p: any) => ({
                        ...p,
                        tipo_registro: 'VENTA', // Por ahora solo ventas pendientes en este flujo
                        isPending: true,
                        lote_nombre: selectedLote.nombre
                    }));

                const combined = [...registrosData, ...ventasData, ...pendingData].sort((a, b) =>
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                );

                setRegistros(combined);
            } else {
                Alert.alert('Error', 'No se pudieron cargar todos los datos');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        if (item.tipo_registro === 'VENTA') {
            navigation.navigate('EditarVenta', { venta: item });
        } else if (item.mortalidad_dia > 0) {
            navigation.navigate('EditarMortalidad', { registro: item });
        } else {
            Alert.alert('Info', 'La edición para este tipo de registro aún no está disponible.');
        }
    };

    const handleDelete = (item: any) => {
        const isVenta = item.tipo_registro === 'VENTA';
        const title = isVenta ? 'Eliminar Venta' : 'Eliminar Registro';
        const message = isVenta
            ? `¿Estás seguro de eliminar la venta de ${item.cantidad} aves? Se restaurará la población del lote.`
            : `¿Estás seguro de eliminar este registro?`;

        Alert.alert(title, message, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = isVenta
                            ? await apiService.deleteVenta(item.id)
                            : await apiService.deleteRegistroDiario(item.id);

                        if (response.success) {
                            Alert.alert('Éxito', 'Registro eliminado correctamente');
                            loadRegistros();
                        } else {
                            Alert.alert('Error', response.error || 'No se pudo eliminar');
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Ocurrió un error inesperado');
                    }
                }
            }
        ]);
    };

    const handleInvoice = async (venta: any) => {
        try {
            await generateVentaPDF(venta);
        } catch (error) {
            Alert.alert('Error', 'No se pudo generar la factura');
        }
    };

    const renderItem = ({ item }: any) => {
        const isMortalidad = activeFilter === 'MORTALIDAD' || (item.mortalidad_dia > 0 && item.tipo_registro === 'DIARIO');
        const isPostura = activeFilter === 'POSTURA' || (item.huevos_totales > 0 && item.tipo_registro === 'DIARIO');
        const isAlimento = activeFilter === 'ALIMENTO' || (item.alimento_consumido_kg > 0 && item.tipo_registro === 'DIARIO');
        const isVenta = item.tipo_registro === 'VENTA';

        return (
            <View style={[styles.card, isVenta && styles.highlightedCardVenta]}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.dateText}>{new Date(item.fecha).toLocaleDateString()}</Text>
                        {isVenta && (
                            <View style={[styles.badge, styles.badgeVenta]}>
                                <Text style={styles.badgeText}>VENTA</Text>
                            </View>
                        )}
                        {item.isPending && (
                            <View style={[styles.badge, styles.badgePending]}>
                                <Text style={styles.badgeText}>PENDIENTE</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerActions}>
                        {isVenta && !item.isPending && (
                            <TouchableOpacity onPress={() => handleInvoice(item)} style={styles.actionIcon}>
                                <Ionicons name="document-text-outline" size={22} color="#27ae60" />
                            </TouchableOpacity>
                        )}
                        {isAdmin() && !item.isPending && (
                            <>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionIcon}>
                                    <Ionicons name="pencil-outline" size={22} color="#3498db" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionIcon}>
                                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {isVenta ? (
                        <>
                            <View style={[styles.row, styles.highlightedRowVenta]}>
                                <Text style={styles.highlightedLabelVenta}>Cantidad:</Text>
                                <Text style={styles.highlightedValueVenta}>{item.cantidad} aves</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Cliente:</Text>
                                <Text style={styles.value}>{item.cliente}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Total:</Text>
                                <Text style={styles.value}>${item.total?.toLocaleString()}</Text>
                            </View>
                            {item.abono > 0 && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Abono:</Text>
                                    <Text style={[styles.value, { color: '#27ae60' }]}>${item.abono?.toLocaleString()}</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            {(activeFilter === 'TODO' || isMortalidad) && item.mortalidad_dia > 0 && (
                                <View style={[styles.row, isMortalidad && styles.highlightedRow]}>
                                    <Text style={[styles.label, isMortalidad && styles.highlightedLabel]}>Mortalidad:</Text>
                                    <Text style={[styles.value, isMortalidad && styles.highlightedValue]}>{item.mortalidad_dia} aves</Text>
                                </View>
                            )}
                            {(activeFilter === 'TODO' || isAlimento) && item.alimento_consumido_kg > 0 && (
                                <View style={[styles.row, isAlimento && styles.highlightedRow]}>
                                    <Text style={[styles.label, isAlimento && styles.highlightedLabel]}>Alimento:</Text>
                                    <Text style={[styles.value, isAlimento && styles.highlightedValue]}>{item.alimento_consumido_kg} kg</Text>
                                </View>
                            )}
                            {(activeFilter === 'TODO' || isPostura) && item.huevos_totales > 0 && (
                                <View style={[styles.row, isPostura && styles.highlightedRow]}>
                                    <Text style={[styles.label, isPostura && styles.highlightedLabel]}>Postura:</Text>
                                    <Text style={[styles.value, isPostura && styles.highlightedValue]}>{item.huevos_totales} huevos</Text>
                                </View>
                            )}
                        </>
                    )}

                    {item.observaciones ? (
                        <View style={styles.observations}>
                            <Text style={styles.obsLabel}>Obs:</Text>
                            <Text style={styles.obsText}>{item.observaciones}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    const FilterTab = ({ type, label }: { type: FilterType, label: string }) => (
        <TouchableOpacity
            style={[styles.filterTab, activeFilter === type && styles.activeFilterTab]}
            onPress={() => setActiveFilter(type)}
        >
            <Text style={[styles.filterTabText, activeFilter === type && styles.activeFilterTabText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.selectorContainer}>
                <LoteSelector onSelect={setSelectedLote} />
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterTab type="TODO" label="Todo" />
                        <FilterTab type="MORTALIDAD" label="Mortalidad" />
                        <FilterTab type="POSTURA" label="Postura" />
                        <FilterTab type="ALIMENTO" label="Alimento" />
                        <FilterTab type="VENTAS" label="Ventas" />
                    </ScrollView>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredRegistros}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {selectedLote
                                    ? activeFilter === 'TODO'
                                        ? 'No hay registros para este lote.'
                                        : `No hay registros de ${activeFilter.toLowerCase()} para este lote.`
                                    : 'Seleccione un lote para ver su historial.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    selectorContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    loader: {
        flex: 1,
    },
    listContent: {
        padding: 15,
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
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
        marginBottom: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        padding: 5,
        marginLeft: 10,
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    cardBody: {
        gap: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    observations: {
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#f9f9f9',
    },
    obsLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#95a5a6',
    },
    obsText: {
        fontSize: 13,
        color: '#34495e',
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#95a5a6',
        textAlign: 'center',
    },
    filterContainer: {
        marginTop: 10,
        flexDirection: 'row',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    activeFilterTab: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    filterTabText: {
        fontSize: 13,
        color: '#7f8c8d',
        fontWeight: '600',
    },
    activeFilterTabText: {
        color: '#fff',
    },
    highlightedRow: {
        backgroundColor: '#ebf5fb',
        padding: 8,
        borderRadius: 8,
        marginVertical: 2,
    },
    highlightedLabel: {
        color: '#2980b9',
        fontWeight: 'bold',
    },
    highlightedValue: {
        color: '#2980b9',
        fontSize: 16,
        fontWeight: 'bold',
    },
    highlightedCardVenta: {
        borderColor: '#e67e22',
        borderWidth: 1,
    },
    highlightedRowVenta: {
        backgroundColor: '#fef5e7',
        padding: 8,
        borderRadius: 8,
        marginVertical: 2,
    },
    highlightedLabelVenta: {
        color: '#d35400',
        fontWeight: 'bold',
    },
    highlightedValueVenta: {
        color: '#d35400',
        fontSize: 16,
        fontWeight: 'bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    badgeVenta: {
        backgroundColor: '#e67e22',
    },
    badgePending: {
        backgroundColor: '#95a5a6',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
