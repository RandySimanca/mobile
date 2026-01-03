import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import apiService from '../services/api-service';

interface Galpon {
    id: string;
    nombre: string;
    capacidad_max: number;
    finca_id: string;
}

interface GalponSelectorProps {
    fincaId: string;
    onSelect: (galpon: Galpon) => void;
    selectedGalponId?: string;
}

export default function GalponSelector({ fincaId, onSelect, selectedGalponId }: GalponSelectorProps) {
    const [galpones, setGalpones] = useState<Galpon[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGalpon, setSelectedGalpon] = useState<Galpon | null>(null);

    useEffect(() => {
        if (fincaId) {
            loadGalpones();
        } else {
            setGalpones([]);
            setSelectedGalpon(null);
        }
    }, [fincaId]);

    const loadGalpones = async () => {
        setLoading(true);
        const response = await apiService.getGalponesPorFinca(fincaId);
        if (response.success && response.data) {
            setGalpones(response.data);
            if (selectedGalponId) {
                const found = response.data.find((g: Galpon) => g.id === selectedGalponId);
                if (found) setSelectedGalpon(found);
            }
        } else {
            // Intentar cargar de caché
            const cached = await apiService.getCachedGalpones(fincaId);
            if (cached.length > 0) {
                setGalpones(cached);
                if (selectedGalponId) {
                    const found = cached.find((g: Galpon) => g.id === selectedGalponId);
                    if (found) setSelectedGalpon(found);
                }
            }
        }
        setLoading(false);
    };

    const handleSelect = (galpon: Galpon) => {
        setSelectedGalpon(galpon);
        onSelect(galpon);
        setModalVisible(false);
    };

    if (!fincaId) {
        return (
            <View style={styles.container}>
                <Text style={styles.label}>Galpón:</Text>
                <View style={[styles.selector, styles.disabled]}>
                    <Text style={styles.disabledText}>Primero seleccione una finca</Text>
                </View>
            </View>
        );
    }

    if (loading) {
        return <ActivityIndicator size="small" color="#3498db" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Galpón:</Text>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>
                    {selectedGalpon ? selectedGalpon.nombre : 'Seleccionar Galpón'}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccione un Galpón</Text>

                        {galpones.length === 0 ? (
                            <Text style={styles.emptyText}>No hay galpones en esta finca.</Text>
                        ) : (
                            <FlatList
                                data={galpones}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.item,
                                            selectedGalpon?.id === item.id && styles.selectedItem
                                        ]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={styles.itemName}>{item.nombre}</Text>
                                        <Text style={styles.itemInfo}>Capacidad: {item.capacidad_max} aves</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#2c3e50',
    },
    selector: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectorText: {
        fontSize: 16,
        color: '#34495e',
    },
    disabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
    },
    disabledText: {
        color: '#95a5a6',
        fontStyle: 'italic',
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
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: '#e3f2fd',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemInfo: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#7f8c8d',
    },
    cancelButton: {
        marginTop: 15,
        padding: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#e74c3c',
        fontSize: 16,
    }
});
