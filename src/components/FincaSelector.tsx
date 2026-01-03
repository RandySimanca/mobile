import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import apiService from '../services/api-service';

interface Finca {
    id: string;
    nombre: string;
    ubicacion: string;
}

interface FincaSelectorProps {
    onSelect: (finca: Finca) => void;
    selectedFincaId?: string;
}

export default function FincaSelector({ onSelect, selectedFincaId }: FincaSelectorProps) {
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFinca, setSelectedFinca] = useState<Finca | null>(null);

    useEffect(() => {
        loadFincas();
    }, []);

    const loadFincas = async () => {
        setLoading(true);
        const response = await apiService.getFincas();
        if (response.success && response.data) {
            setFincas(response.data);
            if (selectedFincaId) {
                const found = response.data.find((f: Finca) => f.id === selectedFincaId);
                if (found) setSelectedFinca(found);
            }
            // Cachear fincas
            await apiService.cacheMasterData({ fincas: response.data });
        } else {
            // Intentar cargar de caché
            const cached = await apiService.getCachedFincas();
            if (cached.length > 0) {
                setFincas(cached);
                if (selectedFincaId) {
                    const found = cached.find((f: Finca) => f.id === selectedFincaId);
                    if (found) setSelectedFinca(found);
                }
            }
        }
        setLoading(false);
    };

    const handleSelect = (finca: Finca) => {
        setSelectedFinca(finca);
        onSelect(finca);
        setModalVisible(false);
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#3498db" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Finca:</Text>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>
                    {selectedFinca ? selectedFinca.nombre : 'Seleccionar Finca'}
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
                        <Text style={styles.modalTitle}>Seleccione una Finca</Text>

                        <FlatList
                            data={fincas}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        selectedFinca?.id === item.id && styles.selectedItem
                                    ]}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={styles.itemName}>{item.nombre}</Text>
                                    <Text style={styles.itemInfo}>{item.ubicacion}</Text>
                                </TouchableOpacity>
                            )}
                        />

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
