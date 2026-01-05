import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import { generateResumenGlobalPDF } from '../utils/pdfGenerator';

export default function GlobalSummaryScreen() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const response = await apiService.getResumenGlobal();
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading global summary:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadSummary();
    };

    const handleExportPDF = async () => {
        if (!summary) return;
        try {
            await generateResumenGlobalPDF(summary);
        } catch (error) {
            Alert.alert('Error', 'No se pudo generar el reporte PDF');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderRow = (label: string, amount: number, color?: string) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, color ? { color } : {}]}>{formatCurrency(amount)}</Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#27ae60" />
                <Text style={styles.loadingText}>Calculando resumen global...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Resumen Global</Text>
                    <Text style={styles.subtitle}>Estado contable de toda la granja</Text>
                </View>
                <TouchableOpacity onPress={handleExportPDF} style={styles.exportButton}>
                    <Ionicons name="download-outline" size={28} color="#27ae60" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {summary && (
                    <>
                        {/* Sección 1: Dinero Disponible (Destacado) */}
                        <View style={[
                            styles.card,
                            styles.highlightCard,
                            summary.flujo_caja.caja_actual < 0 ? styles.highlightCardNegative : null
                        ]}>
                            <Ionicons name="wallet" size={40} color="#fff" />
                            <Text style={styles.highlightLabel}>Dinero Disponible en Caja</Text>
                            <Text style={styles.highlightValue}>
                                {formatCurrency(summary.flujo_caja.caja_actual)}
                            </Text>
                            {summary.flujo_caja.caja_actual < 0 && (
                                <Text style={styles.warningText}>
                                    ⚠️ Caja en déficit
                                </Text>
                            )}
                            <Text style={styles.highlightSub}>
                                Este es el dinero real que tienes disponible actualmente
                            </Text>
                        </View>
                        {/* Sección 2: Flujo de Caja Detallado */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="cash-outline" size={20} color="#2ecc71" />
                                <Text style={styles.sectionTitle}>Movimiento de Dinero (Caja)</Text>
                            </View>
                            <View style={styles.card}>
                                {renderRow('Ventas de contado (efectivo recibido)', summary.flujo_caja.total_ingresos_contado, '#2ecc71')}
                                {renderRow('Ventas a crédito (pendiente cobro)', summary.flujo_caja.cuentas_por_cobrar, '#f39c12')}
                                {renderRow('Gastos operativos (Nómina, servicios...)', summary.flujo_caja.gastos_operativos, '#e74c3c')}
                                {renderRow('Compras de insumos', summary.flujo_caja.inversion_insumos, '#f39c12')}
                                <View style={styles.divider} />
                                {renderRow('Total que salió de caja', summary.flujo_caja.total_egresos_caja, '#e74c3c')}
                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>💵 Caja Actual</Text>
                                    <Text style={[styles.totalValue, {
                                        color: summary.flujo_caja.caja_actual >= 0 ? '#2ecc71' : '#e74c3c'
                                    }]}>
                                        {formatCurrency(summary.flujo_caja.caja_actual)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Sección 3: Inventario */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="cube-outline" size={20} color="#3498db" />
                                <Text style={styles.sectionTitle}>Inventario (Bodega)</Text>
                            </View>
                            <View style={styles.card}>
                                {renderRow('Valor de insumos en stock', summary.balance.inventario, '#3498db')}
                                <Text style={styles.infoText}>
                                    Este es el valor de lo que tienes guardado (alimento, medicinas, etc.)
                                </Text>
                            </View>
                        </View>

                        {/* Sección 4: ACTIVOS (Patrimonio) */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="business-outline" size={20} color="#34495e" />
                                <Text style={styles.sectionTitle}>ACTIVOS (Patrimonio)</Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.subSectionTitle}>Activos Corrientes</Text>
                                {renderRow('Efectivo en Caja', summary.balance.efectivo, '#2ecc71')}
                                {renderRow('Cuentas por Cobrar', summary.balance.cuentas_por_cobrar, '#f39c12')}
                                {renderRow('Inventarios (Insumos)', summary.balance.inventario, '#3498db')}
                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>TOTAL ACTIVOS</Text>
                                    <Text style={[styles.totalValue, {
                                        color: summary.balance.activo_total >= 0 ? '#2ecc71' : '#e74c3c'
                                    }]}>
                                        {formatCurrency(summary.balance.activo_total)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Sección 5: Rentabilidad */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="trending-up-outline" size={20} color="#9b59b6" />
                                <Text style={styles.sectionTitle}>Rentabilidad</Text>
                            </View>
                            <View style={styles.card}>
                                {renderRow('Utilidad Operativa', summary.resultado.utilidad_operativa,
                                    summary.resultado.utilidad_operativa >= 0 ? '#2ecc71' : '#e74c3c'
                                )}
                                <Text style={styles.infoText2}>
                                    Margen: {summary.resultado.margen_operativo.toFixed(1)}%
                                </Text>
                                <Text style={styles.infoText2}>
                                    (Ventas - Gastos Operativos - Consumos de Insumos)
                                </Text>
                            </View>
                        </View>

                        {/* Operación */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart-outline" size={20} color="#34495e" />
                                <Text style={styles.sectionTitle}>Operación</Text>
                            </View>
                            <View style={styles.card}>
                                {renderRow('Lotes Registrados', summary.resumen.total_lotes)}
                                {renderRow('Aves Iniciales (Total)', summary.resumen.total_aves_inicial)}
                            </View>
                        </View>
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exportButton: {
        padding: 8,
        backgroundColor: '#f0f9f4',
        borderRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
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
    highlightCard: {
        backgroundColor: '#27ae60',
        alignItems: 'center',
        paddingVertical: 30,
    },
    highlightCardNegative: {
        backgroundColor: '#e74c3c',
    },
    warningText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 5,
    },
    highlightLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    highlightValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    highlightSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 20,
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
        fontWeight: '600',
        color: '#95a5a6',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rowLabel: {
        color: '#7f8c8d',
        fontSize: 15,
        flex: 1,
        marginRight: 10,
    },
    rowValue: {
        color: '#2c3e50',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f2f6',
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
        marginRight: 10,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'right',
    },
    infoText: {
        fontSize: 12,
        color: '#7f8c8d',
        fontStyle: 'italic',
        marginTop: 10,
        textAlign: 'center',
    },
    infoText2: {
        fontSize: 11,
        color: '#95a5a6',
        fontStyle: 'italic',
        marginTop: 5,
        textAlign: 'center',
    },
});
