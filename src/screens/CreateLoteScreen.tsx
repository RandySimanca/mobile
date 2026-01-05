import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import FincaSelector from '../components/FincaSelector';
import GalponSelector from '../components/GalponSelector';
import apiService from '../services/api-service';

export default function CreateLoteScreen({ navigation }: any) {
    const [nombre, setNombre] = useState('');
    const [tipoAve, setTipoAve] = useState('ENGORDE');
    const [poblacionInicial, setPoblacionInicial] = useState('');
    const [precioCompraUnitario, setPrecioCompraUnitario] = useState('');
    const [selectedFinca, setSelectedFinca] = useState<any>(null);
    const [selectedGalpon, setSelectedGalpon] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nombre || !poblacionInicial || !precioCompraUnitario || !selectedFinca || !selectedGalpon) {
            Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
            return;
        }

        setLoading(true);
        try {
            const datos = {
                nombre,
                tipo_ave: tipoAve as any,
                poblacion_inicial: Number(poblacionInicial),
                precio_compra_unitario: Number(precioCompraUnitario),
                finca_id: selectedFinca.id,
                finca_nombre: selectedFinca.nombre,
                galpon_id: selectedGalpon.id,
                galpon_nombre: selectedGalpon.nombre,
                fecha_ingreso: new Date().toISOString()
            };

            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createLote(datos);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('lotes', datos);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('lotes', datos);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Lote guardado localmente. Se sincronizará al recuperar conexión.'
                        : 'Lote creado correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo crear el lote');
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
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre del Lote:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Lote A-2025"
                        value={nombre}
                        onChangeText={setNombre}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo de Ave:</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={[styles.radioButton, tipoAve === 'ENGORDE' && styles.radioSelected]}
                            onPress={() => setTipoAve('ENGORDE')}
                        >
                            <Text style={[styles.radioText, tipoAve === 'ENGORDE' && styles.radioTextSelected]}>Engorde</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.radioButton, tipoAve === 'PONEDORA' && styles.radioSelected]}
                            onPress={() => setTipoAve('PONEDORA')}
                        >
                            <Text style={[styles.radioText, tipoAve === 'PONEDORA' && styles.radioTextSelected]}>Ponedora</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Población Inicial:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Ej: 500"
                        value={poblacionInicial}
                        onChangeText={setPoblacionInicial}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Precio Compra por Ave ($):</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Ej: 2500"
                        value={precioCompraUnitario}
                        onChangeText={setPrecioCompraUnitario}
                    />
                </View>

                <FincaSelector onSelect={setSelectedFinca} />

                <GalponSelector
                    fincaId={selectedFinca?.id}
                    onSelect={setSelectedGalpon}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Crear Lote</Text>
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
        color: '#000',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    radioButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    radioSelected: {
        backgroundColor: '#3498db',
        borderColor: '#3498db',
    },
    radioText: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    radioTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#2ecc71',
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
