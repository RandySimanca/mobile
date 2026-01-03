import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import apiService from '../services/api-service';

export default function AdminUsuariosScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await apiService.getAllUsers();
            if (response.success && response.data) {
                setUsers(response.data);
            } else {
                Alert.alert('Error', response.error || 'No se pudieron cargar los usuarios');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const response = await apiService.approveUser(id);
            if (response.success) {
                Alert.alert('Éxito', 'Usuario aprobado correctamente');
                loadUsers();
            } else {
                Alert.alert('Error', response.error || 'No se pudo aprobar al usuario');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        Alert.alert(
            'Confirmar',
            '¿Estás seguro de rechazar a este usuario?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(id);
                        try {
                            const response = await apiService.rejectUser(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Usuario rechazado');
                                loadUsers();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo rechazar al usuario');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Error de conexión');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        setActionLoading(id);
        try {
            const response = await apiService.toggleUserStatus(id);
            if (response.success) {
                loadUsers();
            } else {
                Alert.alert('Error', response.error || 'No se pudo cambiar el estado');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (id: string, currentRole: string) => {
        Alert.alert(
            'Cambiar Rol',
            `Selecciona el nuevo rol para el usuario (Actual: ${currentRole})`,
            [
                { text: 'ADMIN', onPress: () => updateRole(id, 'ADMIN') },
                { text: 'GERENTE', onPress: () => updateRole(id, 'GERENTE') },
                { text: 'GALPONERO', onPress: () => updateRole(id, 'GALPONERO') },
                { text: 'CONTADOR', onPress: () => updateRole(id, 'CONTADOR') },
                { text: 'Cancelar', style: 'cancel' },
            ]
        );
    };

    const updateRole = async (id: string, newRole: string) => {
        setActionLoading(id);
        try {
            const response = await apiService.updateUserRole(id, newRole);
            if (response.success) {
                Alert.alert('Éxito', 'Rol actualizado correctamente');
                loadUsers();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el rol');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Eliminar Usuario',
            '¿Estás seguro de eliminar permanentemente a este usuario? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(id);
                        try {
                            const response = await apiService.deleteUser(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Usuario eliminado');
                                loadUsers();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo eliminar al usuario');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Error de conexión');
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const renderUserItem = ({ item }: { item: any }) => {
        const estado = item.estado || 'PENDIENTE';
        const isPending = estado === 'PENDIENTE';
        const isActive = estado === 'ACTIVO';

        return (
            <View style={styles.userCard}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.badgeContainer}>
                        <TouchableOpacity onPress={() => handleRoleChange(item.id, item.role)}>
                            <Text style={styles.roleBadge}>{item.role} ✎</Text>
                        </TouchableOpacity>
                        <Text style={[styles.statusBadge, styles[(item.estado || 'PENDIENTE').toLowerCase() as keyof typeof styles]]}>
                            {item.estado || 'PENDIENTE'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    {isPending ? (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => handleApprove(item.id)}
                                disabled={actionLoading === item.id}
                            >
                                <Text style={styles.actionButtonText}>Aprobar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleReject(item.id)}
                                disabled={actionLoading === item.id}
                            >
                                <Text style={styles.actionButtonText}>Rechazar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, isActive ? styles.deactivateButton : styles.activateButton]}
                            onPress={() => handleToggleStatus(item.id, item.estado)}
                            disabled={actionLoading === item.id}
                        >
                            <Text style={styles.actionButtonText}>
                                {isActive ? 'Desactivar' : 'Activar'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                    >
                        <Text style={styles.actionButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
                {actionLoading === item.id && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#27ae60" />
                <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#27ae60']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay usuarios registrados.</Text>
                    </View>
                }
            />
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
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden',
    },
    userInfo: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    userEmail: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 8,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    roleBadge: {
        backgroundColor: '#e1f5fe',
        color: '#0288d1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    activo: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
    },
    pendiente: {
        backgroundColor: '#fff3cd',
        color: '#856404',
    },
    rechazado: {
        backgroundColor: '#ffebee',
        color: '#c62828',
    },
    inactivo: {
        backgroundColor: '#eeeeee',
        color: '#616161',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
        paddingTop: 12,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    approveButton: {
        backgroundColor: '#2ecc71',
    },
    rejectButton: {
        backgroundColor: '#e67e22',
    },
    activateButton: {
        backgroundColor: '#3498db',
    },
    deactivateButton: {
        backgroundColor: '#95a5a6',
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
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
});
