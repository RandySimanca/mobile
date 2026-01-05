import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/api-service';

export default function EditarVentaScreen({ navigation, route }: any) {
    const { venta } = route.params;

    const [cantidad, setCantidad] = useState(venta.cantidad.toString());
    const [precioUnitario, setPrecioUnitario] = useState(venta.precio_unitario.toString());
    const [cliente, setCliente] = useState(venta.cliente);
    const [formaPago, setFormaPago] = useState(venta.forma_pago);
    const [observaciones, setObservaciones] = useState(venta.observaciones || '');
    const [abono, setAbono] = useState(venta.abono?.toString() || '0');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!cantidad || !precioUnitario || !cliente || !formaPago) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const cant = parseInt(cantidad);
        const precio = parseFloat(precioUnitario);
        const abonoVal = parseFloat(abono) || 0;

        if (isNaN(cant) || cant <= 0) {
            Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0');
            return;
        }

        if (isNaN(precio) || precio <= 0) {
            Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
            return;
        }

        const total = cant * precio;

        if (formaPago === 'CREDITO' && abonoVal > total) {
            Alert.alert('Error', 'El abono no puede ser mayor al total de la venta');
            return;
        }

        const data = {
            ...venta,
            cantidad: cant,
            precio_unitario: precio,
            total,
            abono: abonoVal,
            cliente,
            forma_pago: formaPago,
            observaciones: observaciones.trim() || null,
            lote_nombre: venta.lote_nombre // Asegurar que se mantenga
        };

        setLoading(true);
        try {
            const response = await apiService.updateVenta(venta.id, data);
            if (response.success) {
                Alert.alert('Éxito', 'Venta actualizada correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar la venta');
            }
        } catch (error) {
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
                <Text style={styles.title}>Editar Venta</Text>
                <Text style={styles.subtitle}>Lote: {venta.lote_nombre || 'N/A'}</Text>

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

                {formaPago === 'CREDITO' && (
                    <>
                        <Text style={styles.label}>Abono Inicial (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={abono}
                            onChangeText={setAbono}
                            placeholder="Ej: 50000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </>
                )}

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
                        <Text style={styles.buttonText}>Actualizar Venta</Text>
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
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 20,
        marginTop: 5,
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
        backgroundColor: '#3498db',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonDisabled: {
        backgroundColor: '#bdc3c7',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
