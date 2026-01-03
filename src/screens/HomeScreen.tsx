import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api-service';

const { width } = Dimensions.get('window');

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';
import { userInfo } from 'node:os';

type HomeScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Home'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState({
        totalAves: 0,
        mortalidadSemanal: 0,
        produccionHoy: 0,
        lotesActivos: 0
    });

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkPendingRecords();
            loadDashboardStats();
        });
        checkPendingRecords();
        loadDashboardStats();
        return unsubscribe;
    }, [navigation]);

    const loadDashboardStats = async () => {
        try {
            const response = await apiService.getGlobalKPIs();
            if (response.success && response.data) {
                setStats({
                    totalAves: response.data.totalAves,
                    mortalidadSemanal: response.data.mortalidadSemanal,
                    produccionHoy: response.data.produccionHoy,
                    lotesActivos: response.data.lotesActivos
                });
            } else {
                // Fallback a datos cacheados si falla el API (offline)
                const lotes = await apiService.getCachedLotes();
                const total = lotes.reduce((acc: number, curr: any) => acc + (curr.poblacion_actual || 0), 0);
                setStats(prev => ({
                    ...prev,
                    totalAves: total,
                    lotesActivos: lotes.length
                }));
            }
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const checkPendingRecords = async () => {
        const pending = await apiService.getPendingRecords();
        setPendingCount(pending.length);
    };

    const handleSync = async () => {
        if (pendingCount === 0) {
            Alert.alert('Sincronización', 'No hay datos pendientes por sincronizar.');
            return;
        }

        setSyncing(true);
        try {
            const response = await apiService.syncPendingData();
            if (response.success) {
                Alert.alert('Éxito', 'Sincronización completada.');
                checkPendingRecords();
            } else {
                Alert.alert('Error', response.error || 'Error al sincronizar');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setSyncing(false);
        }
    };

    const StatCard = ({ title, value, unit, color }: any) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statTitle}>{title}</Text>
            <View style={styles.statValueContainer}>
                <Text style={styles.statValue}>{value}</Text>
                {unit && <Text style={styles.statUnit}>{unit}</Text>}
            </View>
        </View>
    );

    const ActionButton = ({ title, icon, onPress, color }: any) => (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
            <Text style={styles.actionButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Hola,</Text>
                    <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
                </View>

                {pendingCount > 0 && (
                    <TouchableOpacity style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
                        {syncing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.syncText}>Sincronizar {pendingCount} registros pendientes</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen del Negocio</Text>
                    <View style={styles.statsGrid}>
                        <StatCard title="Población Total" value={stats.totalAves} unit="aves" color="#3498db" />
                        <StatCard title="Lotes Activos" value={stats.lotesActivos} color="#2ecc71" />
                        <StatCard title="Producción Hoy" value={stats.produccionHoy} unit="huevos" color="#f1c40f" />
                        <StatCard title="Mortalidad (7d)" value={stats.mortalidadSemanal} unit="aves" color="#e74c3c" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
                    <View style={styles.actionsGrid}>
                        <ActionButton title="Mortalidad" color="#e74c3c" onPress={() => navigation.navigate('Mortalidad')} />
                        <ActionButton title="Alimento" color="#3498db" onPress={() => navigation.navigate('Alimento')} />
                        <ActionButton title="Postura" color="#f1c40f" onPress={() => navigation.navigate('Postura')} />
                        <ActionButton title="Consumo" color="#e67e22" onPress={() => navigation.navigate('ConsumoInsumos')} />
                    </View>
                </View>

                <View style={styles.performanceSection}>
                    <Text style={styles.sectionTitle}>Rendimiento</Text>
                    <View style={styles.performancePlaceholder}>
                        <View style={styles.chartCircle}>
                            <Text style={styles.chartPercent}>92%</Text>
                            <Text style={styles.chartLabel}>Eficiencia</Text>
                        </View>
                        <View style={styles.performanceDetails}>
                            <Text style={styles.perfText}>Producción estable</Text>
                            <Text style={styles.perfSubtext}>+2.5% vs semana anterior</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        padding: 25,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    welcomeText: {
        fontSize: 18,
        color: '#7f8c8d',
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    syncBanner: {
        backgroundColor: '#2ecc71',
        margin: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    syncText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#fff',
        width: (width - 50) / 2,
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    statTitle: {
        fontSize: 12,
        color: '#7f8c8d',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 5,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statUnit: {
        fontSize: 12,
        color: '#95a5a6',
        marginLeft: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: (width - 50) / 2,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
        elevation: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    performanceSection: {
        paddingHorizontal: 20,
        marginTop: 25,
    },
    performancePlaceholder: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    chartCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 8,
        borderColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartPercent: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    chartLabel: {
        fontSize: 8,
        color: '#7f8c8d',
    },
    performanceDetails: {
        marginLeft: 20,
    },
    perfText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    perfSubtext: {
        fontSize: 14,
        color: '#2ecc71',
        marginTop: 2,
    },
});
