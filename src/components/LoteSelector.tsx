import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import apiService from '../services/api-service';

interface Lote {
    id: string;
    nombre: string;
    tipo_ave: string;
    poblacion_actual: number;
}

interface LoteSelectorProps {
    onSelect: (lote: Lote) => void;
    selectedLoteId?: string;
}

export default function LoteSelector({ onSelect, selectedLoteId }: LoteSelectorProps) {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLote, setSelectedLote] = useState<Lote | null>(null);

    useEffect(() => {
        loadLotes();
    }, []);

    const loadLotes = async () => {
        setLoading(true);
        const response = await apiService.getLotes();
        if (response.success && response.data) {
            setLotes(response.data);
            if (selectedLoteId) {
                const found = response.data.find((l: Lote) => l.id === selectedLoteId);
                if (found) setSelectedLote(found);
            }
            // Cachear lotes
            await apiService.cacheMasterData({ lotes: response.data });
        } else {
            // Intentar cargar de caché
            const cached = await apiService.getCachedLotes();
            if (cached.length > 0) {
                setLotes(cached);
                if (selectedLoteId) {
                    const found = cached.find((l: Lote) => l.id === selectedLoteId);
                    if (found) setSelectedLote(found);
                }
            }
        }
        setLoading(false);
    };

    const handleSelect = (lote: Lote) => {
        setSelectedLote(lote);
        onSelect(lote);
        setModalVisible(false);
    };

    if (loading) {
        return <ActivityIndicator size="small" color="#3498db" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Seleccionar Lote:</Text>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.selectorText}>
                    {selectedLote ? `${selectedLote.nombre} (${selectedLote.tipo_ave})` : 'Toque para seleccionar un lote'}
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
                        <Text style={styles.modalTitle}>Seleccione un Lote</Text>

                        {lotes.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text>No hay lotes disponibles.</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.closeButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={lotes}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.loteItem,
                                            selectedLote?.id === item.id && styles.selectedItem
                                        ]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={styles.loteName}>{item.nombre}</Text>
                                        <Text style={styles.loteInfo}>{item.tipo_ave} - {item.poblacion_actual} aves</Text>
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
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2c3e50',
    },
    selector: {
        backgroundColor: '#fff',
        padding: 15,
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
    loteItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: '#e3f2fd',
    },
    loteName: {
        fontSize: 16,
        fontWeight: '600',
    },
    loteInfo: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    cancelButton: {
        marginTop: 15,
        padding: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#3498db',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
    }
});
