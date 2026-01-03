import React, { useState } from 'react';
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
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';

interface Lote {
  id: string;
  nombre: string;
  tipo_ave: string;
  poblacion_actual: number;
  codigo?: string;
  poblacion_inicial?: number;
  fecha_ingreso?: string;
  raza?: string;
  galpon?: string;
  activo?: boolean;
}

export default function MortalidadScreen({ navigation }: any) {
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [mortalidad, setMortalidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedLote) {
      Alert.alert('Error', 'Por favor seleccione un lote');
      return;
    }

    if (!mortalidad || isNaN(Number(mortalidad))) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }

    const mortalidadNum = Number(mortalidad);
    if (mortalidadNum < 0) {
      Alert.alert('Error', 'La cantidad no puede ser negativa');
      return;
    }

    if (mortalidadNum === 0) {
      Alert.alert('Advertencia', 'La mortalidad es 0. ¿Desea continuar?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => guardarRegistro(mortalidadNum) }
      ]);
      return;
    }

    await guardarRegistro(mortalidadNum);
  };

  const guardarRegistro = async (mortalidadNum: number) => {
    setLoading(true);

    try {
      const datos = {
        lote_id: selectedLote!.id,
        fecha: new Date().toISOString(),
        mortalidad_dia: mortalidadNum,
        alimento_consumido_kg: 0,
        observaciones: observaciones.trim() || null
      };

      console.log('Guardando registro:', datos);

      const isOnline = await apiService.getConnectionStatus();
      console.log('Estado de conexión:', isOnline);

      let response;
      let isOfflineMode = false;

      if (isOnline) {
        try {
          response = await apiService.createRegistroDiario(datos);
          
          if (!response || !response.success) {
            if (response?.isNetworkError) {
              console.log('Error de red, guardando localmente...');
              await apiService.savePendingRecord('registros_diario', datos);
              isOfflineMode = true;
            } else {
              throw new Error(response?.error || 'Error desconocido del servidor');
            }
          }
        } catch (networkError) {
          console.log('Excepción de red, guardando localmente:', networkError);
          await apiService.savePendingRecord('registros_diario', datos);
          isOfflineMode = true;
        }
      } else {
        console.log('Sin conexión, guardando localmente...');
        await apiService.savePendingRecord('registros_diario', datos);
        isOfflineMode = true;
      }

      if (isOfflineMode || (response && response.success)) {
        Alert.alert(
          isOfflineMode ? 'Guardado Local' : 'Éxito',
          isOfflineMode 
            ? 'Registro guardado localmente. Se sincronizará al recuperar conexión.' 
            : 'Registro de mortalidad guardado correctamente',
          [
            {
              text: 'OK',
              onPress: () => {
                setMortalidad('');
                setObservaciones('');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error('No se pudo guardar el registro');
      }

    } catch (error: any) {
      console.error('Error en handleSave:', error);
      
      try {
        const datos = {
          lote_id: selectedLote!.id,
          fecha: new Date().toISOString(),
          mortalidad_dia: mortalidadNum,
          alimento_consumido_kg: 0,
          observaciones: observaciones.trim() || null
        };
        
        await apiService.savePendingRecord('registros_diario', datos);
        
        Alert.alert(
          'Guardado Local',
          'No se pudo conectar con el servidor. El registro se guardó localmente y se sincronizará más tarde.',
          [
            {
              text: 'OK',
              onPress: () => {
                setMortalidad('');
                setObservaciones('');
                navigation.goBack();
              }
            }
          ]
        );
      } catch (localError) {
        console.error('Error al guardar localmente:', localError);
        Alert.alert(
          'Error',
          `No se pudo guardar el registro: ${error.message || 'Error desconocido'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoteSelect = (lote: Lote) => {
    console.log('Lote seleccionado:', lote);
    setSelectedLote(lote);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <LoteSelector
          selectedLoteId={selectedLote?.id}
          onSelect={handleLoteSelect}
        />

        {selectedLote && (
          <View style={styles.loteInfo}>
            <Text style={styles.infoText}>
              Lote: {selectedLote.nombre}
            </Text>
            <Text style={styles.infoText}>
              Tipo: {selectedLote.tipo_ave}
            </Text>
            <Text style={styles.infoText}>
              Población actual: {selectedLote.poblacion_actual} aves
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cantidad de Aves Muertas:</Text>
          <TextInput
            style={styles.input}
            value={mortalidad}
            onChangeText={setMortalidad}
            keyboardType="numeric"
            placeholder="Ingrese cantidad"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observaciones:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            numberOfLines={4}
            placeholder="Ingrese observaciones (opcional)"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (loading || !selectedLote) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading || !selectedLote}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar Registro</Text>
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
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
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#e74c3c',
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