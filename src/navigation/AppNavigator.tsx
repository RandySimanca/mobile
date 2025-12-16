import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MortalidadScreen from '../screens/MortalidadScreen';
import AlimentoScreen from '../screens/AlimentoScreen';
import PosturaScreen from '../screens/PosturaScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
                <Stack.Screen name="Mortalidad" component={MortalidadScreen} />
                <Stack.Screen name="Alimento" component={AlimentoScreen} />
                <Stack.Screen name="Postura" component={PosturaScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
