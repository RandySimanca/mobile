import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';

export default function GastosScreen() {
    const [loteId, setLoteId] = useState('');
    const [concepto, setConcepto] = useState('');
    const [categoria, setCategoria] = useState('GASTO');
    const [cantidad, setCantidad] = useState('1');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [insumoId, setInsumoId] = useState('');
    const [tipoGasto, setTipoGasto] = useState<'COMPRA_INSUMO' | 'GASTO_OPERATIVO'>('GASTO_OPERATIVO');
    const [insumos, setInsumos] = useState<any[]>([]);
    const [gastos, setGastos] = useState<any[]>([]);
    const [lotesMap, setLotesMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadGastos();
        loadInsumos();
        loadLotes();
    }, [loteId]);

    const loadLotes = async () => {
        const response = await apiService.getLotes();
        if (response.success && response.data) {
            const map: Record<string, string> = {};
            response.data.forEach(l => map[l.id] = l.nombre);
            setLotesMap(map);
        }
    };

    const loadInsumos = async () => {
        try {
            const response = await apiService.getInsumos();
            if (response.success) {
                setInsumos(response.data || []);
            }
        } catch (error) {
            console.error('Error loading insumos:', error);
        }
    };

    const loadGastos = async () => {
        setLoadingList(true);
        try {
            const response = await apiService.getGastos(loteId || undefined);
            if (response.success) {
                setGastos(response.data || []);
            }
        } catch (error) {
            console.error('Error loading gastos:', error);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSave = async () => {
        if (!concepto || !precioUnitario || !cantidad) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const total = parseFloat(cantidad) * parseFloat(precioUnitario);
        const data = {
            lote_id: loteId || null,
            fecha: new Date().toISOString(),
            concepto,
            categoria: tipoGasto === 'COMPRA_INSUMO' ? 'INVERSION' : 'GASTO',
            cantidad: parseFloat(cantidad),
            precio_unitario: parseFloat(precioUnitario),
            total,
            proveedor,
            metodo_pago: metodoPago,
            insumo_id: insumoId || null,
            tipo_gasto: tipoGasto,
        };

        setLoading(true);
        try {
            const response = await apiService.createGasto(data);
            if (response.success) {
                Alert.alert('Éxito', 'Gasto registrado correctamente');
                setConcepto('');
                setPrecioUnitario('');
                setCantidad('1');
                setProveedor('');
                setInsumoId('');
                setShowForm(false);
                loadGastos();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar el gasto');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirmar',
            '¿Estás seguro de eliminar este registro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteGasto(id);
                            if (response.success) {
                                loadGastos();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar');
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderGastoItem = ({ item }: { item: any }) => (
        <View style={styles.gastoCard}>
            <View style={styles.gastoInfo}>
                <Text style={styles.gastoConcepto}>{item.concepto}</Text>
                <Text style={styles.gastoMeta}>
                    {new Date(item.fecha).toLocaleDateString()} • {item.categoria}
                    {item.lote_id && lotesMap[item.lote_id] ? ` • ${lotesMap[item.lote_id]}` : ''}
                </Text>
                <Text style={styles.gastoDetalle}>
                    {item.cantidad} x {formatCurrency(item.precio_unitario)}
                </Text>
            </View>
            <View style={styles.gastoRight}>
                <Text style={styles.gastoTotal}>{formatCurrency(item.total)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Egresos (Gastos e Inversión)</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowForm(!showForm)}
                >
                    <Ionicons name={showForm ? "close" : "add"} size={24} color="#fff" />
                    <Text style={styles.addButtonText}>{showForm ? "Cancelar" : "Nuevo Registro"}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <ScrollView style={styles.form}>
                    <Text style={styles.label}>Tipo de Registro *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={tipoGasto}
                            onValueChange={(v: any) => setTipoGasto(v)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Gasto Operativo (Nómina, Servicios...)" value="GASTO_OPERATIVO" />
                            <Picker.Item label="Compra de Insumo (Entrada a Bodega)" value="COMPRA_INSUMO" />
                        </Picker>
                    </View>

                    {tipoGasto === 'COMPRA_INSUMO' ? (
                        <>
                            <Text style={styles.label}>Insumo a Comprar *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={insumoId}
                                    onValueChange={(v) => {
                                        setInsumoId(v);
                                        const insumo = insumos.find(i => i.id === v);
                                        if (insumo) setConcepto(`Compra: ${insumo.nombre_producto}`);
                                    }}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Seleccione un insumo..." value="" />
                                    {insumos.map(i => (
                                        <Picker.Item key={i.id} label={`${i.nombre_producto} (${i.tipo})`} value={i.id} />
                                    ))}
                                </Picker>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Lote (Opcional)</Text>
                            <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                            <Text style={styles.label}>Concepto *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Pago de nómina, Arriendo..."
                                placeholderTextColor="#999"
                                value={concepto}
                                onChangeText={setConcepto}
                            />
                        </>
                    )}

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Cantidad *</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                                value={cantidad}
                                onChangeText={setCantidad}
                            />
                        </View>
                        <View style={[styles.flex1, { marginLeft: 10 }]}>
                            <Text style={styles.label}>Costo Unitario *</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#999"
                                value={precioUnitario}
                                onChangeText={setPrecioUnitario}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Proveedor (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre del proveedor"
                        placeholderTextColor="#999"
                        value={proveedor}
                        onChangeText={setProveedor}
                    />

                    <Text style={styles.label}>Método de Pago</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={metodoPago}
                            onValueChange={(v) => setMetodoPago(v)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Efectivo" value="EFECTIVO" />
                            <Picker.Item label="Transferencia" value="TRANSFERENCIA" />
                            <Picker.Item label="Crédito" value="CREDITO" />
                        </Picker>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Registro</Text>}
                    </TouchableOpacity>
                </ScrollView>
            )}

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Historial de Egresos</Text>
                {loadingList ? (
                    <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={gastos}
                        renderItem={renderGastoItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={<Text style={styles.emptyText}>No hay registros para mostrar</Text>}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addButton: { backgroundColor: '#27ae60', flexDirection: 'row', padding: 8, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
    form: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9', color: '#2c3e50' },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
    picker: { color: '#2c3e50' },
    row: { flexDirection: 'row' },
    flex1: { flex: 1 },
    saveButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    listSection: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginBottom: 15 },
    gastoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
    gastoInfo: { flex: 1 },
    gastoConcepto: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    gastoMeta: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    gastoDetalle: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
    gastoRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    gastoTotal: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
    emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 40, fontStyle: 'italic' },
});