import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';

export default function AccountingSummaryScreen() {
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (selectedLote) {
            loadSummary();
        }
    }, [selectedLote]);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const response = await apiService.getResumenContable(selectedLote.id);
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading summary:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        if (selectedLote) {
            setRefreshing(true);
            loadSummary();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderExpenseRow = (label: string, amount: number) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{formatCurrency(amount)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Resumen Contable</Text>
                <LoteSelector
                    onSelect={setSelectedLote}
                    selectedLoteId={selectedLote?.id}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.loadingText}>Calculando resumen...</Text>
                </View>
            ) : summary ? (
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Tarjeta de Resultado (Cálculo del Éxito) */}
                    <View style={[
                        styles.card,
                        styles.resultCard,
                        summary.resumen.utilidad_neta >= 0 ? styles.profitCard : styles.lossCard
                    ]}>
                        <Text style={styles.resultTitle}>Cálculo del Éxito (Utilidad Neta)</Text>
                        <Text style={styles.resultValue}>{formatCurrency(summary.resumen.utilidad_neta)}</Text>
                        <Text style={styles.resultSub}>Margen: {summary.resumen.margen_porcentaje.toFixed(1)}%</Text>
                    </View>

                    {/* Tabla de Egresos */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="trending-down" size={20} color="#e74c3c" />
                            <Text style={styles.sectionTitle}>Registro de Inversión y Gastos</Text>
                        </View>
                        <View style={styles.tableCard}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Concepto</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Cant.</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Total</Text>
                            </View>
                            {summary.tablas.egresos.map((g: any) => (
                                <View key={g.id} style={styles.tableRow}>
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.tableCellMain}>{g.concepto}</Text>
                                        <Text style={styles.tableCellSub}>{new Date(g.fecha).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{g.cantidad}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>{formatCurrency(g.total)}</Text>
                                </View>
                            ))}
                            <View style={styles.tableFooter}>
                                <Text style={styles.footerLabel}>TOTAL EGRESOS</Text>
                                <Text style={styles.footerValue}>{formatCurrency(summary.resumen.total_egresos)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabla de Ingresos */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="trending-up" size={20} color="#2ecc71" />
                            <Text style={styles.sectionTitle}>Registro de Ventas (Ingresos)</Text>
                        </View>
                        <View style={styles.tableCard}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Producto</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Cant.</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Total</Text>
                            </View>
                            {summary.tablas.ingresos.map((v: any) => (
                                <View key={v.id} style={styles.tableRow}>
                                    <View style={{ flex: 1.5 }}>
                                        <Text style={styles.tableCellMain}>{v.producto}</Text>
                                        <Text style={styles.tableCellSub}>{new Date(v.fecha).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{v.cantidad}</Text>
                                    <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>{formatCurrency(v.total)}</Text>
                                </View>
                            ))}
                            <View style={styles.tableFooter}>
                                <Text style={styles.footerLabel}>TOTAL INGRESOS</Text>
                                <Text style={styles.footerValue}>{formatCurrency(summary.resumen.total_ingresos)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            ) : (
                <View style={styles.center}>
                    <Ionicons name="stats-chart-outline" size={64} color="#bdc3c7" />
                    <Text style={styles.emptyText}>Selecciona un lote para ver el resumen contable</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#7f8c8d',
    },
    emptyText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    resultCard: {
        alignItems: 'center',
        paddingVertical: 25,
    },
    profitCard: {
        backgroundColor: '#2ecc71',
    },
    lossCard: {
        backgroundColor: '#e74c3c',
    },
    resultTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '600',
    },
    resultValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    resultSub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    section: {
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginLeft: 8,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 10,
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    rowLabel: {
        color: '#7f8c8d',
        fontSize: 15,
    },
    rowValue: {
        color: '#2c3e50',
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f2f6',
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    tableCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f2f6',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#dfe4ea',
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#7f8c8d',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 14,
        color: '#2c3e50',
    },
    tableCellMain: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    tableCellSub: {
        fontSize: 11,
        color: '#95a5a6',
    },
    tableFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#f8f9fa',
    },
    footerLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    footerValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
});
