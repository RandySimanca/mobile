import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type CreateVentaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'CreateVenta'>;

interface Props {
    navigation: CreateVentaScreenNavigationProp;
}

export default function CreateVentaScreen({ navigation }: Props) {
    const [loteId, setLoteId] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [cliente, setCliente] = useState('');
    const [formaPago, setFormaPago] = useState('CONTADO_EFECTIVO');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!loteId || !cantidad || !precioUnitario || !cliente || !formaPago) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const cant = parseInt(cantidad);
        const precio = parseFloat(precioUnitario);
        
        if (isNaN(cant) || cant <= 0) {
            Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0');
            return;
        }

        if (isNaN(precio) || precio <= 0) {
            Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
            return;
        }

        const total = cant * precio;

        const data = {
            lote_id: loteId,
            cantidad: cant,
            precio_unitario: precio,
            total,
            cliente,
            forma_pago: formaPago,
            fecha: new Date().toISOString(),
            observaciones: observaciones.trim() || null
        };

        setLoading(true);
        try {
            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createVenta(data);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('ventas', data);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('ventas', data);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Venta guardada localmente. Se sincronizará cuando haya conexión.'
                        : 'Venta registrada correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar la venta');
            }
        } catch (error) {
            console.error('Error inesperado:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const calcularTotal = () => {
        const cant = parseInt(cantidad);
        const precio = parseFloat(precioUnitario);
        if (!isNaN(cant) && !isNaN(precio) && cant > 0 && precio > 0) {
            return (cant * precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        }
        return '$0';
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Registrar Venta de Aves</Text>

                <Text style={styles.label}>Lote *</Text>
                <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                <Text style={styles.label}>Cantidad de Aves *</Text>
                <TextInput
                    style={styles.input}
                    value={cantidad}
                    onChangeText={setCantidad}
                    placeholder="Ej: 50"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Precio Unitario *</Text>
                <TextInput
                    style={styles.input}
                    value={precioUnitario}
                    onChangeText={setPrecioUnitario}
                    placeholder="Ej: 15000"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                />

                {cantidad && precioUnitario && (
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total de la venta:</Text>
                        <Text style={styles.totalValue}>{calcularTotal()}</Text>
                    </View>
                )}

                <Text style={styles.label}>Cliente *</Text>
                <TextInput
                    style={styles.input}
                    value={cliente}
                    onChangeText={setCliente}
                    placeholder="Nombre del cliente"
                    placeholderTextColor="#999"
                />

                <Text style={styles.label}>Forma de Pago *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formaPago}
                        onValueChange={(itemValue) => setFormaPago(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Contado (Efectivo)" value="CONTADO_EFECTIVO" />
                        <Picker.Item label="Contado (Transferencia)" value="CONTADO_TRANSFERENCIA" />
                        <Picker.Item label="Crédito" value="CREDITO" />
                    </Picker>
                </View>

                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    placeholder="Detalles adicionales..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Registrar Venta</Text>
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495e',
        marginBottom: 5,
        marginTop: 15,
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    totalContainer: {
        backgroundColor: '#e8f5e9',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    totalLabel: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 5,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    button: {
        backgroundColor: '#e67e22',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonDisabled: {
        backgroundColor: '#f39c12',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});