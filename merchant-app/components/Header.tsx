import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '../style/myStyle';

export const Header: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={{ marginLeft: 15 }}>
        <Text style={styles.locationTitle}>Your location</Text>
        <Text style={styles.locationName}>The One Place Building</Text>
      </View>
    </View>
  );
};
