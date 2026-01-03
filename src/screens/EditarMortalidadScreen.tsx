import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';

export default function EditarMortalidadScreen({ route, navigation }: any) {
    const { registro } = route.params;
    const [mortalidad, setMortalidad] = useState(registro.mortalidad_dia.toString());
    const [observaciones, setObservaciones] = useState(registro.observaciones || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!mortalidad || isNaN(Number(mortalidad))) {
            Alert.alert('Error', 'Por favor ingrese una cantidad válida');
            return;
        }

        const mortalidadNum = Number(mortalidad);
        if (mortalidadNum < 0) {
            Alert.alert('Error', 'La cantidad no puede ser negativa');
            return;
        }

        setLoading(true);
        try {
            const datos = {
                mortalidad_dia: mortalidadNum,
                observaciones: observaciones.trim() || null
            };

            const response = await apiService.updateRegistroDiario(registro.id, datos);

            if (response.success) {
                Alert.alert('Éxito', 'Registro actualizado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el registro');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="create-outline" size={48} color="#3498db" />
                <Text style={styles.title}>Editar Registro</Text>
                <Text style={styles.subtitle}>Lote: {registro.lote_nombre}</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cantidad de Aves Muertas:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Ej: 5"
                        value={mortalidad}
                        onChangeText={setMortalidad}
                        editable={!loading}
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
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Actualizar Registro</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 5,
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
        color: '#2c3e50',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#3498db',
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
    cancelButton: {
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#7f8c8d',
        fontSize: 16,
    },
});
