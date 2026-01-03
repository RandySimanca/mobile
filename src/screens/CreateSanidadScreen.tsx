import React, { useState } from 'react';
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
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type CreateSanidadScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Sanidad'>;

interface Props {
    navigation: CreateSanidadScreenNavigationProp;
}

export default function CreateSanidadScreen({ navigation }: Props) {
    const [loteId, setLoteId] = useState('');
    const [actividad, setActividad] = useState('');
    const [producto, setProducto] = useState('');
    const [dosis, setDosis] = useState('');
    const [viaAplicacion, setViaAplicacion] = useState('');
    const [edadSugerida, setEdadSugerida] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!loteId || !actividad || !producto) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const data = {
            lote_id: loteId,
            actividad,
            producto,
            dosis,
            via_aplicacion: viaAplicacion,
            edad_sugerida_dias: parseInt(edadSugerida || '0'),
            aplicado: false,
        };

        setLoading(true);
        try {
            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createProgramaSanitario(data);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('sanidad', data);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('sanidad', data);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Actividad guardada localmente. Se sincronizará al recuperar conexión.'
                        : 'Actividad programada correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo programar la actividad');
            }
        } catch (error) {
            console.error('Error inesperado:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.label}>Lote *</Text>
                <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                <Text style={styles.label}>Actividad / Vacuna *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Vacunación Newcastle"
                    value={actividad}
                    onChangeText={setActividad}
                />

                <Text style={styles.label}>Producto *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Vacuna NC-B1"
                    value={producto}
                    onChangeText={setProducto}
                />

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Dosis</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 0.5 ml"
                            value={dosis}
                            onChangeText={setDosis}
                        />
                    </View>
                    <View style={[styles.flex1, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Edad (Días)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 15"
                            keyboardType="numeric"
                            value={edadSugerida}
                            onChangeText={setEdadSugerida}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Vía de Aplicación</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Ocular, Oral, Inyectable..."
                    value={viaAplicacion}
                    onChangeText={setViaAplicacion}
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Programar Actividad</Text>
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
        marginBottom: 20,
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
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#3498db',
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
