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

type Props = NativeStackScreenProps<RootDrawerParamList, 'EditInsumo'>;

export default function EditInsumoScreen({ route, navigation }: Props) {
    const { insumoId } = route.params;
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('ALIMENTO');
    const [stock, setStock] = useState('');
    const [stockMinimo, setStockMinimo] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('KG');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInsumo();
    }, []);

    const loadInsumo = async () => {
        try {
            const response = await apiService.getInsumo(insumoId);
            if (response.success && response.data) {
                const item = response.data as any;
                setNombre(item.nombre_producto);
                setTipo(item.tipo);
                setStock(item.stock_actual.toString());
                setStockMinimo(item.stock_minimo.toString());
                setUnidadMedida(item.unidad_medida);
                setPrecioUnitario(item.precio_unitario.toString());
            } else {
                Alert.alert('Error', 'No se pudo cargar la información del insumo');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!nombre || !stock || !unidadMedida || !precioUnitario) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const data = {
            nombre_producto: nombre,
            tipo,
            stock_actual: parseFloat(stock),
            stock_minimo: parseFloat(stockMinimo || '0'),
            unidad_medida: unidadMedida,
            precio_unitario: parseFloat(precioUnitario),
        };

        setSaving(true);
        try {
            const response = await apiService.updateInsumo(insumoId, data);
            if (response.success) {
                Alert.alert('Éxito', 'Insumo actualizado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el insumo');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#27ae60" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Alimento Iniciación"
                    value={nombre}
                    onChangeText={setNombre}
                />

                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipo}
                        onValueChange={(itemValue) => setTipo(itemValue)}
                    >
                        <Picker.Item label="Alimento" value="ALIMENTO" />
                        <Picker.Item label="Medicamento" value="MEDICAMENTO" />
                        <Picker.Item label="Vacuna" value="VACUNA" />
                        <Picker.Item label="Limpieza" value="DESINFECTANTE" />
                        <Picker.Item label="Otro" value="OTRO" />
                    </Picker>
                </View>

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Stock Actual *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={stock}
                            onChangeText={setStock}
                        />
                    </View>
                    <View style={[styles.flex1, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Stock Mínimo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={stockMinimo}
                            onChangeText={setStockMinimo}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Precio Unitario *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: 50000"
                    keyboardType="numeric"
                    value={precioUnitario}
                    onChangeText={setPrecioUnitario}
                />

                <Text style={styles.label}>Unidad de Medida *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={unidadMedida}
                        onValueChange={(itemValue) => setUnidadMedida(itemValue)}
                    >
                        <Picker.Item label="Kilogramos (KG)" value="KG" />
                        <Picker.Item label="Bultos (B)" value="B" />
                        <Picker.Item label="Gramos (G)" value="G" />
                        <Picker.Item label="Litros (L)" value="L" />
                        <Picker.Item label="Mililitros (ML)" value="ML" />
                        <Picker.Item label="Unidades (UND)" value="UND" />
                        <Picker.Item label="Dosis" value="DOSIS" />
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
