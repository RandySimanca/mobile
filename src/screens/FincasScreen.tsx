import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import apiService from '../services/api-service';

export default function FincasScreen({ navigation }: any) {
    const [fincas, setFincas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [propietario, setPropietario] = useState('');
    const [direccion, setDireccion] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFincas();
    }, []);

    const loadFincas = async () => {
        setLoading(true);
        const response = await apiService.getFincas();
        if (response.success && response.data) {
            setFincas(response.data);
            // Guardar en caché para uso offline
            await apiService.cacheMasterData({ fincas: response.data });
        } else {
            // Si falla la red, intentar cargar de caché
            const cached = await apiService.getCachedFincas();
            if (cached.length > 0) {
                setFincas(cached);
            }
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!nombre || !propietario) {
            Alert.alert('Error', 'Nombre y Propietario son obligatorios');
            return;
        }

        setSaving(true);
        try {
            const datos = {
                nombre,
                propietario,
                direccion
            };

            if (!apiService.getConnectionStatus()) {
                await apiService.savePendingRecord('fincas', datos);
                Alert.alert('Modo Offline', 'Sin conexión. La finca se guardó localmente y se sincronizará cuando tengas red.');
                setModalVisible(false);
                setNombre('');
                setPropietario('');
                setDireccion('');
                return;
            }

            const response = await apiService.createFinca(datos);
            if (response.success) {
                Alert.alert('Éxito', 'Finca creada correctamente');
                setModalVisible(false);
                setNombre('');
                setPropietario('');
                setDireccion('');
                loadFincas();
            } else {
                Alert.alert('Error', response.error || 'No se pudo crear la finca');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Confirmar eliminación',
            '¿Estás seguro de que deseas eliminar esta finca? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await apiService.deleteFinca(id);
                        if (response.success) {
                            Alert.alert('Éxito', 'Finca eliminada correctamente');
                            loadFincas();
                        } else {
                            Alert.alert('Error', response.error || 'No se pudo eliminar la finca');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.fincaName}>{item.nombre}</Text>
                    <Text style={styles.fincaPropietario}>Propietario: {item.propietario}</Text>
                </View>
                <Text style={styles.fincaUbicacion}>{item.direccion || 'Sin dirección'}</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
            >
                <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={fincas}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay fincas registradas.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nueva Finca</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Finca La Esperanza"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Propietario:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Juan Pérez"
                                value={propietario}
                                onChangeText={setPropietario}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Dirección:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Km 5 Vía al Mar"
                                value={direccion}
                                onChangeText={setDireccion}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
                                onPress={handleCreate}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        marginBottom: 5,
    },
    fincaName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    fincaPropietario: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    fincaUbicacion: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    deleteButton: {
        padding: 10,
        marginLeft: 10,
    },
    deleteButtonText: {
        fontSize: 20,
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
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#95a5a6',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#2c3e50',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#34495e',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#ecf0f1',
    },
    saveButton: {
        backgroundColor: '#3498db',
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.7,
    }
});
