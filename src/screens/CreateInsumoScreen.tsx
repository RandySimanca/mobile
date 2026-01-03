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
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/api-service';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type CreateInsumoScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Insumos'>;

interface Props {
    navigation: CreateInsumoScreenNavigationProp;
}

export default function CreateInsumoScreen({ navigation }: Props) {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('ALIMENTO');
    const [stock, setStock] = useState('');
    const [stockMinimo, setStockMinimo] = useState('');
    const [unidadMedida, setUnidadMedida] = useState('KG');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        try {
            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createInsumo(data);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('insumos', data);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('insumos', data);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Producto guardado localmente. Se sincronizará al recuperar conexión.'
                        : 'Insumo creado correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo crear el insumo');
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
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Alimento Iniciación"
                    placeholderTextColor="#999"
                    value={nombre}
                    onChangeText={setNombre}
                />

                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipo}
                        onValueChange={(itemValue) => setTipo(itemValue)}
                        style={styles.picker}
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
                        <Text style={styles.label}>Stock Inicial *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#999"
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
                            placeholderTextColor="#999"
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
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={precioUnitario}
                    onChangeText={setPrecioUnitario}
                />

                <Text style={styles.label}>Unidad de Medida *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={unidadMedida}
                        onValueChange={(itemValue) => setUnidadMedida(itemValue)}
                        style={styles.picker}
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
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Crear Producto</Text>
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
        backgroundColor: '#fff',
        color: '#2c3e50',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 8,
        overflow: 'hidden',
    },
    picker: {
        color: '#2c3e50',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
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