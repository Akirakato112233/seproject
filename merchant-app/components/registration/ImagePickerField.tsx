import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MAX_SIZE = 1024 * 1024; // 1MB

interface ImagePickerFieldProps {
  label: string;
  value?: string;
  onChange: (uri: string) => void;
  error?: string;
  useCamera?: boolean;
}

export function ImagePickerField({
  label,
  value,
  onChange,
  error,
  useCamera,
}: ImagePickerFieldProps) {
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    await compressAndSet(result.assets[0].uri);
  };

  const capture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    await compressAndSet(result.assets[0].uri);
  };

  const compressAndSet = async (uri: string) => {
    setLoading(true);
    try {
      const info = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const resized = await ImageManipulator.manipulateAsync(
        info.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      onChange(resized.uri);
    } catch (e) {
      onChange(uri);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        {value ? (
          <View style={s.previewWrap}>
            <Image source={{ uri: value }} style={s.preview} />
            <TouchableOpacity
              style={s.changeBtn}
              onPress={useCamera ? capture : pick}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0E3A78" />
              ) : (
                <Text style={s.changeText}>เปลี่ยน</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.uploadBtn, error && s.uploadError]}
            onPress={useCamera ? capture : pick}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0E3A78" />
            ) : (
              <Text style={s.uploadText}>
                {useCamera ? 'ถ่ายรูป' : 'อัปโหลดรูป'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center' },
  previewWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 80, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  changeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
  },
  changeText: { fontSize: 14, color: '#0E3A78', fontWeight: '600' },
  uploadBtn: {
    height: 80,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  uploadError: { borderColor: '#E53935' },
  uploadText: { fontSize: 14, color: '#666' },
  error: { fontSize: 12, color: '#E53935' },
});
