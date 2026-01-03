import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';

export default function ConsumoInsumosScreen({ navigation }: any) {
    const [loteId, setLoteId] = useState('');
    const [insumos, setInsumos] = useState<any[]>([]);
    const [insumoId, setInsumoId] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingInsumos, setLoadingInsumos] = useState(true);

    useEffect(() => {
        loadInsumos();
    }, []);

    const loadInsumos = async () => {
        try {
            const response = await apiService.getInsumos();
            if (response.success && response.data) {
                setInsumos(response.data);
            }
        } catch (error) {
            console.error('Error al cargar insumos:', error);
        } finally {
            setLoadingInsumos(false);
        }
    };

    const handleSubmit = async () => {
        if (!loteId || !insumoId || !cantidad) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const selectedInsumo = insumos.find(i => i.id === insumoId);

        const data = {
            lote_id: loteId,
            insumo_id: insumoId,
            cantidad: parseFloat(cantidad),
            unidad_medida: selectedInsumo?.unidad_medida || '',
            fecha: new Date().toISOString(),
            observaciones,
        };

        setLoading(true);
        try {
            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createConsumoInsumo(data);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('consumo_insumos', data);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('consumo_insumos', data);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Registro guardado localmente. Se sincronizará cuando haya conexión.'
                        : 'Consumo registrado correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar el consumo');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.label}>Lote *</Text>
                <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                <Text style={styles.label}>Insumo *</Text>
                <View style={styles.pickerContainer}>
                    {loadingInsumos ? (
                        <ActivityIndicator size="small" color="#27ae60" />
                    ) : (
                        <Picker
                            selectedValue={insumoId}
                            onValueChange={(itemValue) => setInsumoId(itemValue)}
                        >
                            <Picker.Item label="Selecciona un insumo" value="" />
                            {insumos.map((insumo) => (
                                <Picker.Item
                                    key={insumo.id}
                                    label={`${insumo.nombre_producto} (${insumo.stock_actual} ${insumo.unidad_medida})`}
                                    value={insumo.id}
                                />
                            ))}
                        </Picker>
                    )}
                </View>

                <Text style={styles.label}>Cantidad *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: 50"
                    keyboardType="numeric"
                    value={cantidad}
                    onChangeText={setCantidad}
                />

                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Notas adicionales..."
                    multiline
                    numberOfLines={4}
                    value={observaciones}
                    onChangeText={setObservaciones}
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Registrar Consumo</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        color: '#000',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: '#27ae60',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: '#95a5a6',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
