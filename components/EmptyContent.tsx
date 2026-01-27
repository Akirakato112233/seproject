import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';

export const EmptyContent: React.FC = () => (
  <View style={styles.emptyContent}>
    <Ionicons name="search" size={60} color="#F0F0F0" />
    <Text style={styles.emptyText}>รายการร้านค้าจะแสดงที่นี่</Text>
  </View>
);
