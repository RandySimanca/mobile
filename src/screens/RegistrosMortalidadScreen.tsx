import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';

interface Registro {
    id: string;
    fecha: string;
    lote_id: string;
    mortalidad_dia: number;
    observaciones?: string;
    lote_nombre?: string; // Se puede obtener cruzando datos o guardándolo en el registro
}

export default function RegistrosMortalidadScreen({ navigation }: any) {
    const [registros, setRegistros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            cargarDatos();
        });
        cargarDatos();
        return unsubscribe;
    }, [navigation]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [user, resReg, resLotes] = await Promise.all([
                apiService.getCurrentUser(),
                apiService.getRegistrosDiarios(),
                apiService.getLotes()
            ]);

            setCurrentUser(user);

            if (resReg.success && resLotes.success) {
                const lotesMap = new Map(resLotes.data?.map(l => [l.id, l.nombre]));
                const dataConNombres = resReg.data?.map(r => ({
                    ...r,
                    lote_nombre: lotesMap.get(r.lote_id) || 'Lote desconocido'
                })) || [];
                setRegistros(dataConNombres);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudieron cargar los registros');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = () => {
        return currentUser?.role === 'ADMIN' || currentUser?.role === 'PROPIETARIO';
    };

    const handleEdit = (registro: any) => {
        navigation.navigate('EditarMortalidad', { registro });
    };

    const handleDelete = (registro: any) => {
        Alert.alert(
            'Confirmar eliminación',
            `¿Eliminar registro de ${registro.mortalidad_dia} aves del lote ${registro.lote_nombre}?\n\nEsto sumará ${registro.mortalidad_dia} aves de vuelta al lote.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteRegistroDiario(registro.id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Registro eliminado correctamente');
                                cargarDatos();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo eliminar');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar el registro');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.fecha}>
                    {new Date(item.fecha).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </Text>
                <Text style={styles.lote}>Lote: {item.lote_nombre}</Text>
                <Text style={styles.mortalidad}>Mortalidad: {item.mortalidad_dia} aves</Text>
                {item.observaciones && (
                    <View style={styles.obsContainer}>
                        <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                        <Text style={styles.observaciones}>{item.observaciones}</Text>
                    </View>
                )}
            </View>

            {isAdmin() && (
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
                        <Ionicons name="pencil-outline" size={22} color="#3498db" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
                        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={registros}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
                            <Text style={styles.emptyText}>No hay registros de mortalidad</Text>
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
    list: {
        padding: 10,
    },
    card: {
        backgroundColor: '#fff',
        marginBottom: 12,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
    },
    fecha: {
        fontSize: 12,
        color: '#95a5a6',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    lote: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    mortalidad: {
        fontSize: 16,
        color: '#e74c3c',
        fontWeight: '600',
    },
    obsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 6,
        gap: 5,
    },
    observaciones: {
        fontSize: 13,
        color: '#7f8c8d',
        fontStyle: 'italic',
        flex: 1,
    },
    actions: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        paddingLeft: 15,
        borderLeftWidth: 1,
        borderLeftColor: '#f0f0f0',
    },
    iconButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#95a5a6',
        fontWeight: '500',
    },
});
