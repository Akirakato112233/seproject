import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';

export const SearchBar: React.FC = () => (
  <View style={styles.searchSection}>
    <View style={styles.searchBar}>
      <Ionicons name="menu-outline" size={24} color="#666" />
      <TextInput placeholder=" " style={styles.searchInput} />
      <Ionicons name="search-outline" size={22} color="#666" />
    </View>
  </View>
);
