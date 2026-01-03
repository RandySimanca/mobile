import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import FincaSelector from '../components/FincaSelector';
import apiService from '../services/api-service';

export default function GalponesScreen({ navigation }: any) {
    const [galpones, setGalpones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFinca, setSelectedFinca] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [nombre, setNombre] = useState('');
    const [capacidad, setCapacidad] = useState('');
    const [tipoAve, setTipoAve] = useState<'ENGORDE' | 'PONEDORA'>('ENGORDE');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedFinca) {
            loadGalpones();
        } else {
            setGalpones([]);
        }
    }, [selectedFinca]);

    const loadGalpones = async () => {
        setLoading(true);
        const response = await apiService.getGalponesPorFinca(selectedFinca.id);
        if (response.success && response.data) {
            setGalpones(response.data);
            // Nota: No cacheamos galpones individuales aquí para no sobreescribir la caché completa
            // La caché completa se descarga en el Home
        } else {
            // Si falla la red, intentar cargar de caché
            const cached = await apiService.getCachedGalpones(selectedFinca.id);
            if (cached.length > 0) {
                setGalpones(cached);
            }
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!nombre || !capacidad || !selectedFinca) {
            Alert.alert('Error', 'Por favor complete todos los campos');
            return;
        }

        setSaving(true);
        try {
            const datos = {
                nombre,
                capacidad_max: Number(capacidad),
                tipo_ave_principal: tipoAve,
                finca_id: selectedFinca.id
            };

            if (!apiService.getConnectionStatus()) {
                await apiService.savePendingRecord('galpones', datos);
                Alert.alert('Modo Offline', 'Sin conexión. El galpón se guardó localmente y se sincronizará cuando tengas red.');
                setModalVisible(false);
                setNombre('');
                setCapacidad('');
                return;
            }

            const response = await apiService.createGalpon(datos);

            if (response.success) {
                Alert.alert('Éxito', 'Galpón creado correctamente');
                setModalVisible(false);
                setNombre('');
                setCapacidad('');
                loadGalpones();
            } else {
                Alert.alert('Error', response.error || 'No se pudo crear el galpón');
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
            '¿Estás seguro de que deseas eliminar este galpón? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await apiService.deleteGalpon(id);
                        if (response.success) {
                            Alert.alert('Éxito', 'Galpón eliminado correctamente');
                            loadGalpones();
                        } else {
                            Alert.alert('Error', response.error || 'No se pudo eliminar el galpón');
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
                    <Text style={styles.galponName}>{item.nombre}</Text>
                    <Text style={styles.galponType}>{item.tipo_ave_principal}</Text>
                </View>
                <Text style={styles.galponInfo}>Capacidad: {item.capacidad_max} aves</Text>
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
            <View style={styles.header}>
                <FincaSelector onSelect={setSelectedFinca} />
            </View>

            {!selectedFinca ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Seleccione una finca para ver sus galpones.</Text>
                </View>
            ) : loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
            ) : (
                <FlatList
                    data={galpones}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay galpones en esta finca.</Text>
                        </View>
                    }
                />
            )}

            {selectedFinca && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nuevo Galpón</Text>
                        <Text style={styles.modalSubtitle}>Finca: {selectedFinca?.nombre}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre del Galpón:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Galpón 1"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tipo de Ave Principal:</Text>
                            <View style={styles.typeButtons}>
                                <TouchableOpacity
                                    style={[styles.typeButton, tipoAve === 'ENGORDE' && styles.typeButtonActive]}
                                    onPress={() => setTipoAve('ENGORDE')}
                                >
                                    <Text style={[styles.typeButtonText, tipoAve === 'ENGORDE' && styles.typeButtonTextActive]}>Engorde</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeButton, tipoAve === 'PONEDORA' && styles.typeButtonActive]}
                                    onPress={() => setTipoAve('PONEDORA')}
                                >
                                    <Text style={[styles.typeButtonText, tipoAve === 'PONEDORA' && styles.typeButtonTextActive]}>Ponedora</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Capacidad Máxima (Aves):</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 1000"
                                keyboardType="numeric"
                                value={capacidad}
                                onChangeText={setCapacidad}
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
    header: {
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
    galponName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    galponInfo: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    galponType: {
        fontSize: 12,
        color: '#3498db',
        fontWeight: 'bold',
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#95a5a6',
        textAlign: 'center',
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
        marginBottom: 5,
        textAlign: 'center',
        color: '#2c3e50',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 20,
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
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    typeButtonActive: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    typeButtonText: {
        color: '#7f8c8d',
        fontWeight: 'bold',
    },
    typeButtonTextActive: {
        color: '#fff',
    }
});
