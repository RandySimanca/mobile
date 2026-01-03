import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';

export default function AlimentoScreen({ navigation }: any) {
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [insumos, setInsumos] = useState<any[]>([]);
    const [selectedInsumoId, setSelectedInsumoId] = useState('');
    const [gramsPerBird, setGramsPerBird] = useState('100'); // gramos por ave
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingInsumos, setLoadingInsumos] = useState(true);

    useEffect(() => {
        loadAlimentos();
    }, []);

    const loadAlimentos = async () => {
        try {
            const response = await apiService.getInsumos();
            if (response.success && response.data) {
                // Filtrar solo insumos de tipo ALIMENTO
                const alimentos = response.data.filter((i: any) => i.tipo === 'ALIMENTO');
                setInsumos(alimentos);
                if (alimentos.length > 0) {
                    setSelectedInsumoId(alimentos[0].id);
                }
            }
        } catch (error) {
            console.error('Error al cargar alimentos:', error);
        } finally {
            setLoadingInsumos(false);
        }
    };

    // Calcular cantidad total de alimento en kg
    const calcularAlimentoTotal = () => {
        if (!selectedLote || !gramsPerBird) return 0;
        const grams = Number(gramsPerBird);
        const totalGrams = grams * selectedLote.poblacion_actual;
        const totalKg = totalGrams / 1000; // Convertir gramos a kg
        return totalKg;
    };

    const handleSave = async () => {
        if (!selectedLote) {
            Alert.alert('Error', 'Por favor seleccione un lote');
            return;
        }
        if (!selectedInsumoId) {
            Alert.alert('Error', 'Por favor seleccione el tipo de alimento del inventario');
            return;
        }
        if (!gramsPerBird || isNaN(Number(gramsPerBird))) {
            Alert.alert('Error', 'Por favor seleccione la cantidad por ave');
            return;
        }

        const cantidad = calcularAlimentoTotal();
        
        if (cantidad <= 0) {
            Alert.alert('Error', 'La cantidad debe ser mayor a 0');
            return;
        }

        setLoading(true);
        try {
            const selectedInsumo = insumos.find(i => i.id === selectedInsumoId);

            // Verificar stock disponible
            if (selectedInsumo && cantidad > selectedInsumo.stock_actual) {
                Alert.alert(
                    'Stock Insuficiente',
                    `Necesitas ${cantidad.toFixed(2)} kg pero solo hay ${selectedInsumo.stock_actual} ${selectedInsumo.unidad_medida} disponibles.\n¿Desea continuar de todas formas?`,
                    [
                        { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
                        { text: 'Continuar', onPress: () => procesarGuardado(selectedInsumo, cantidad) }
                    ]
                );
                return;
            }

            await procesarGuardado(selectedInsumo, cantidad);
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al procesar el registro');
            setLoading(false);
        }
    };

    const procesarGuardado = async (selectedInsumo: any, cantidad: number) => {
        try {
            const grams = Number(gramsPerBird);
            const detalle = `${grams}g por ave × ${selectedLote.poblacion_actual} aves = ${cantidad.toFixed(2)} kg`;
            
            // 1. Datos para el registro diario (KPIs)
            const datosRegistro = {
                lote_id: selectedLote.id,
                fecha: new Date().toISOString(),
                mortalidad_dia: 0,
                alimento_consumido_kg: cantidad,
                observaciones: observaciones.trim() 
                    ? `${detalle}. ${observaciones}` 
                    : detalle
            };

            // 2. Datos para el consumo de insumo (Contabilidad e Inventario)
            const datosConsumo = {
                lote_id: selectedLote.id,
                insumo_id: selectedInsumoId,
                cantidad: cantidad,
                unidad_medida: selectedInsumo?.unidad_medida || 'KG',
                fecha: new Date().toISOString(),
                observaciones: `${detalle}${observaciones.trim() ? '. ' + observaciones : ''}`,
            };

            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                // Intentar guardar ambos en el servidor
                const [resReg, resCons] = await Promise.all([
                    apiService.createRegistroDiario(datosRegistro),
                    apiService.createConsumoInsumo(datosConsumo)
                ]);

                if (resReg.success && resCons.success) {
                    Alert.alert('Éxito', `Se registraron ${cantidad.toFixed(2)} kg de alimento consumido`);
                    navigation.goBack();
                } else {
                    const errorMsg = resReg.error || resCons.error || 'Ocurrió un problema al guardar los datos';
                    Alert.alert('Error', errorMsg);
                }
            } else {
                // Guardar localmente
                await Promise.all([
                    apiService.savePendingRecord('registros_diario', datosRegistro),
                    apiService.savePendingRecord('consumo_insumos', datosConsumo)
                ]);
                Alert.alert('Guardado Local', 'Los datos se sincronizarán cuando haya conexión');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al procesar el registro');
        } finally {
            setLoading(false);
        }
    };

    const selectedInsumo = insumos.find(i => i.id === selectedInsumoId);
    const totalKg = calcularAlimentoTotal();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <LoteSelector onSelect={setSelectedLote} selectedLoteId={selectedLote?.id} />

                {selectedLote && (
                    <View style={styles.loteInfo}>
                        <View style={styles.infoRow}>
                            <Ionicons name="apps-outline" size={18} color="#3498db" />
                            <Text style={styles.infoText}>Lote: {selectedLote.nombre}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="people-outline" size={18} color="#3498db" />
                            <Text style={styles.infoText}>
                                Población: {selectedLote.poblacion_actual} aves
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo de Alimento (Inventario):</Text>
                    <View style={styles.pickerContainer}>
                        {loadingInsumos ? (
                            <ActivityIndicator size="small" color="#27ae60" style={{ padding: 15 }} />
                        ) : insumos.length === 0 ? (
                            <Text style={styles.noInsumosText}>
                                No hay alimentos en el inventario. Agrégalos primero.
                            </Text>
                        ) : (
                            <Picker
                                selectedValue={selectedInsumoId}
                                onValueChange={(itemValue) => setSelectedInsumoId(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Seleccione el alimento" value="" />
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

                    {selectedInsumo && (
                        <View style={styles.stockInfo}>
                            <Ionicons name="cube-outline" size={16} color="#27ae60" />
                            <Text style={styles.stockText}>
                                Stock disponible: {selectedInsumo.stock_actual} {selectedInsumo.unidad_medida}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cantidad de Alimento por Ave:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={gramsPerBird}
                            onValueChange={(itemValue) => setGramsPerBird(itemValue)}
                            style={styles.picker}
                            enabled={!loading && selectedLote !== null}
                        >
                            <Picker.Item label="50 gramos por ave" value="50" />
                            <Picker.Item label="100 gramos por ave" value="100" />
                            <Picker.Item label="150 gramos por ave" value="150" />
                            <Picker.Item label="200 gramos por ave" value="200" />
                            <Picker.Item label="250 gramos por ave" value="250" />
                            <Picker.Item label="300 gramos por ave" value="300" />
                        </Picker>
                    </View>
                </View>

                {selectedLote && gramsPerBird && (
                    <View style={styles.calculationCard}>
                        <View style={styles.calculationHeader}>
                            <Ionicons name="calculator-outline" size={20} color="#27ae60" />
                            <Text style={styles.calculationTitle}>Cálculo Automático</Text>
                        </View>
                        <View style={styles.calculationDetail}>
                            <Text style={styles.calculationText}>
                                {gramsPerBird}g/ave × {selectedLote.poblacion_actual} aves
                            </Text>
                            <Text style={styles.calculationResult}>
                                = {totalKg.toFixed(2)} kg
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.totalLabel}>Total de Alimento a Suministrar:</Text>
                        <Text style={styles.totalValue}>{totalKg.toFixed(2)} kg</Text>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observaciones:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Detalles adicionales..."
                        placeholderTextColor="#999"
                        value={observaciones}
                        onChangeText={setObservaciones}
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (loading || !selectedLote || !selectedInsumoId) && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading || !selectedLote || !selectedInsumoId}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Registrar Consumo de Alimento</Text>
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
    loteInfo: {
        backgroundColor: '#e8f4f8',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: '500',
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
        color: '#2c3e50',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    picker: {
        color: '#2c3e50',
    },
    noInsumosText: {
        padding: 15,
        color: '#e74c3c',
        textAlign: 'center',
        fontWeight: '500',
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#d4edda',
        borderRadius: 6,
    },
    stockText: {
        fontSize: 13,
        color: '#155724',
        fontWeight: '500',
    },
    calculationCard: {
        backgroundColor: '#f0fdf4',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#27ae60',
    },
    calculationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    calculationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    calculationDetail: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    calculationText: {
        fontSize: 15,
        color: '#2c3e50',
        marginBottom: 4,
    },
    calculationResult: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    divider: {
        height: 1,
        backgroundColor: '#27ae60',
        marginVertical: 10,
        opacity: 0.3,
    },
    totalLabel: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 5,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#27ae60',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});