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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootDrawerParamList, 'EditLote'>;

export default function EditLoteScreen({ route, navigation }: Props) {
    const { loteId } = route.params;
    const [nombre, setNombre] = useState('');
    const [tipoAve, setTipoAve] = useState('PONEDORA');
    const [poblacionInicial, setPoblacionInicial] = useState('');
    const [poblacionActual, setPoblacionActual] = useState('');
    const [fincaId, setFincaId] = useState('');
    const [galponId, setGalponId] = useState('');
    const [precioCompraUnitario, setPrecioCompraUnitario] = useState('');
    const [fincas, setFincas] = useState<any[]>([]);
    const [galpones, setGalpones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [loteRes, fincasRes, galponesRes] = await Promise.all([
                apiService.getLote(loteId),
                apiService.getFincas(),
                apiService.getGalpones(),
            ]);

            if (loteRes.success && loteRes.data) {
                const lote = loteRes.data;
                setNombre(lote.nombre);
                setTipoAve(lote.tipo_ave);
                setPoblacionInicial(lote.poblacion_inicial.toString());
                setPoblacionActual(lote.poblacion_actual.toString());
                setFincaId(lote.finca_id);
                setGalponId(lote.galpon_id);
                setPrecioCompraUnitario(lote.precio_compra_unitario?.toString() || '0');
            }

            if (fincasRes.success) setFincas(fincasRes.data || []);
            if (galponesRes.success) setGalpones(galponesRes.data || []);

        } catch (error) {
            Alert.alert('Error', 'No se pudo cargar la información del lote');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!nombre || !poblacionInicial || !fincaId || !galponId) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const data = {
            nombre,
            tipo_ave: tipoAve,
            poblacion_inicial: parseInt(poblacionInicial),
            poblacion_actual: parseInt(poblacionActual || poblacionInicial),
            finca_id: fincaId,
            galpon_id: galponId,
            precio_compra_unitario: parseFloat(precioCompraUnitario || '0'),
        };

        setSaving(true);
        try {
            const response = await apiService.updateLote(loteId, data);
            if (response.success) {
                Alert.alert('Éxito', 'Lote actualizado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el lote');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.label}>Nombre del Lote *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Lote 01 - 2024"
                    value={nombre}
                    onChangeText={setNombre}
                />

                <Text style={styles.label}>Tipo de Ave *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipoAve}
                        onValueChange={(itemValue) => setTipoAve(itemValue)}
                    >
                        <Picker.Item label="Ponedora" value="PONEDORA" />
                        <Picker.Item label="Engorde" value="ENGORDE" />
                    </Picker>
                </View>

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Población Inicial *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={poblacionInicial}
                            onChangeText={setPoblacionInicial}
                        />
                    </View>
                    <View style={[styles.flex1, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Población Actual</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={poblacionActual}
                            onChangeText={setPoblacionActual}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Precio Compra por Ave ($)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={precioCompraUnitario}
                    onChangeText={setPrecioCompraUnitario}
                />

                <Text style={styles.label}>Finca *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={fincaId}
                        onValueChange={(itemValue) => setFincaId(itemValue)}
                    >
                        <Picker.Item label="Seleccione una finca" value="" />
                        {fincas.map((f) => (
                            <Picker.Item key={f.id} label={f.nombre} value={f.id} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Galpón *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={galponId}
                        onValueChange={(itemValue) => setGalponId(itemValue)}
                    >
                        <Picker.Item label="Seleccione un galpón" value="" />
                        {galpones
                            .filter((g) => g.finca_id === fincaId)
                            .map((g) => (
                                <Picker.Item key={g.id} label={`Galpón ${g.nombre}`} value={g.id} />
                            ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Guardar Cambios</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: '#000',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 8,
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
