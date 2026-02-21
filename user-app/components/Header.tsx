import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { styles } from '../style/myStyle';
import { useLocation } from '../context/LocationContext';

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentLocation } = useLocation();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ marginLeft: 15, flex: 1, flexDirection: 'row', alignItems: 'center' }}
        onPress={() => router.push('/location/search')}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>Deliver to</Text>
          <Text style={styles.locationName} numberOfLines={1}>
            {currentLocation ? currentLocation.name : 'Select location'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#333" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );
};
