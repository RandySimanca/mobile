import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión Avícola</Text>
            <View style={styles.buttonContainer}>
                <Button title="Mortalidad" onPress={() => navigation.navigate('Mortalidad')} />
                <Button title="Alimento" onPress={() => navigation.navigate('Alimento')} />
                <Button title="Postura" onPress={() => navigation.navigate('Postura')} />
            </View>
            <Button title="Sincronizar" onPress={() => console.log('Sync')} color="green" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 30,
        fontWeight: 'bold',
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
        marginBottom: 30,
    },
});
