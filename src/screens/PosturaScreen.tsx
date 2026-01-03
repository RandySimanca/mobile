import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';

export default function PosturaScreen({ navigation }: any) {
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [huevos, setHuevos] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedLote) {
            Alert.alert('Error', 'Por favor seleccione un lote');
            return;
        }
        if (selectedLote.tipo_ave !== 'PONEDORA') {
            Alert.alert('Error', 'Este lote no es de tipo PONEDORA');
            return;
        }
        if (!huevos || isNaN(Number(huevos))) {
            Alert.alert('Error', 'Por favor ingrese una cantidad válida');
            return;
        }

        setLoading(true);
        try {
            const datos = {
                lote_id: selectedLote.id,
                fecha: new Date().toISOString(),
                mortalidad_dia: 0,
                alimento_consumido_kg: 0,
                huevos_totales: Number(huevos),
                observaciones: observaciones
            };

            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createRegistroDiario(datos);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('registros_diario', datos);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('registros_diario', datos);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Registro guardado localmente. Se sincronizará al recuperar conexión.'
                        : 'Registro de postura guardado correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo guardar el registro');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <LoteSelector onSelect={setSelectedLote} />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Huevos Totales Recolectados:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Ej: 150"
                        value={huevos}
                        onChangeText={setHuevos}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observaciones:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Detalles adicionales..."
                        value={observaciones}
                        onChangeText={setObservaciones}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Guardar Registro</Text>
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
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2c3e50',
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#f39c12',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
