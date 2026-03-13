import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Slider from '@react-native-community/slider';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StepNav } from '../../../components/registration/StepNav';
import { step5Schema } from '../../../lib/registrationSchemas';
import { useRegistrationStore } from '../../../stores/registrationStore';
import { z } from 'zod';

type Step5Form = z.infer<typeof step5Schema>;

async function pickMultiple(): Promise<string[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') throw new Error('No permission');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets.length) return [];
  const uris: string[] = [];
  for (const asset of result.assets.slice(0, 5)) {
    try {
      const m = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1200 } }], {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      uris.push(m.uri);
    } catch {
      uris.push(asset.uri);
    }
  }
  return uris;
}

export default function Step5Screen() {
  const router = useRouter();
  const { formData, updateForm, setStep, merchantUserId } = useRegistrationStore();
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const {
    lat: paramLat,
    lon: paramLon,
    address: paramAddress,
    subdistrict: paramSubdistrict,
    district: paramDistrict,
    province: paramProvince,
    postalCode: paramPostalCode,
  } = useLocalSearchParams<{
    lat?: string;
    lon?: string;
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  }>();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step5Form>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      shop_photos: formData.shop_photos || [],
      address_line: formData.address_line || '',
      subdistrict: formData.subdistrict || '',
      district: formData.district || '',
      province: formData.province || '',
      postal_code: formData.postal_code || '',
      latitude: formData.latitude ?? 13.7563,
      longitude: formData.longitude ?? 100.5018,
      service_radius_km: formData.service_radius_km ?? 5,
    },
  });

  const shopPhotos = watch('shop_photos') || [];
  const radius = watch('service_radius_km') ?? 5;

  useEffect(() => {
    setStep(4);
  }, [setStep]);

  // sync map params into form when returning from location screens
  useEffect(() => {
    if (paramLat && paramLon) {
      const latNum = parseFloat(String(paramLat));
      const lonNum = parseFloat(String(paramLon));
      if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
        setValue('latitude', latNum);
        setValue('longitude', lonNum);
      }
    }
    if (paramAddress && !formData.address_line) {
      setValue('address_line', String(paramAddress));
    }
    if (paramSubdistrict && !formData.subdistrict) {
      setValue('subdistrict', String(paramSubdistrict));
    }
    if (paramDistrict && !formData.district) {
      setValue('district', String(paramDistrict));
    }
    if (paramProvince && !formData.province) {
      setValue('province', String(paramProvince));
    }
    if (paramPostalCode && !formData.postal_code) {
      const cleaned = String(paramPostalCode).replace(/\D/g, '').slice(0, 5);
      if (cleaned) {
        setValue('postal_code', cleaned);
      }
    }
  }, [
    paramLat,
    paramLon,
    paramAddress,
    paramSubdistrict,
    paramDistrict,
    paramProvince,
    paramPostalCode,
    setValue,
    formData.address_line,
    formData.subdistrict,
    formData.district,
    formData.province,
    formData.postal_code,
  ]);

  const addPhotos = async () => {
    if (shopPhotos.length >= 5) return;
    setLoadingPhotos(true);
    try {
      const newUris = await pickMultiple();
      const combined = [...shopPhotos, ...newUris].slice(0, 5);
      setValue('shop_photos', combined);
    } catch {
      //
    } finally {
      setLoadingPhotos(false);
    }
  };

  const removePhoto = (i: number) => {
    const next = shopPhotos.filter((_, idx) => idx !== i);
    setValue('shop_photos', next);
  };

  const onNext = handleSubmit(async (data) => {
    const nextForm = {
      ...formData,
      shop_photos: data.shop_photos,
      address_line: data.address_line,
      subdistrict: data.subdistrict,
      district: data.district,
      province: data.province,
      postal_code: data.postal_code,
      latitude: data.latitude,
      longitude: data.longitude,
      service_radius_km: data.service_radius_km,
    };
    updateForm(nextForm);
    setStep(6);
    router.push('/signup/onboarding/step-6');
  });

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.title}>รูปร้านและที่อยู่</Text>
          <Text style={s.subtitle}>ขั้นตอนที่ 4 จาก 8</Text>

          <View style={s.form}>
            <View style={s.field}>
              <TouchableOpacity
                style={s.mapButton}
                activeOpacity={0.85}
                onPress={() => router.push('/location/search')}
              >
                <View style={s.mapIconWrap}>
                  <Ionicons name="map-outline" size={20} color="#0E3A78" />
                </View>
                <View style={s.mapTextWrap}>
                  <Text style={s.mapTitle}>เลือกตำแหน่งจากแผนที่</Text>
                  <Text style={s.mapSubtitle} numberOfLines={1}>
                    ระบบจะใช้พิกัดจากแผนที่ในการจัดส่ง
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={s.field}>
              <Text style={s.label}>ที่อยู่ *</Text>
              <Controller
                control={control}
                name="address_line"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, s.textarea, errors.address_line && s.inputError]}
                    placeholder="เลขที่ ถนน ตำบล/แขวง"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                  />
                )}
              />
              {errors.address_line && (
                <Text style={s.error}>{errors.address_line.message}</Text>
              )}
            </View>

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>ตำบล/แขวง *</Text>
                <Controller
                  control={control}
                  name="subdistrict"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.subdistrict && s.inputError]}
                      placeholder="ตำบล/แขวง"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.subdistrict && (
                  <Text style={s.error}>{errors.subdistrict.message}</Text>
                )}
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>อำเภอ/เขต *</Text>
                <Controller
                  control={control}
                  name="district"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.district && s.inputError]}
                      placeholder="อำเภอ/เขต"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.district && (
                  <Text style={s.error}>{errors.district.message}</Text>
                )}
              </View>
            </View>

            <View style={s.row}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>จังหวัด *</Text>
                <Controller
                  control={control}
                  name="province"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.province && s.inputError]}
                      placeholder="จังหวัด"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.province && (
                  <Text style={s.error}>{errors.province.message}</Text>
                )}
              </View>
              <View style={[s.field, { flex: 0.6 }]}>
                <Text style={s.label}>รหัสไปรษณีย์ *</Text>
                <Controller
                  control={control}
                  name="postal_code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, errors.postal_code && s.inputError]}
                      placeholder="10110"
                      value={value}
                      onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 5))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {errors.postal_code && (
                  <Text style={s.error}>{errors.postal_code.message}</Text>
                )}
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>รูปร้าน (1-5 รูป) *</Text>
              <View style={s.photoGrid}>
                {shopPhotos.map((uri, i) => (
                  <View key={i} style={s.photoWrap}>
                    <Image source={{ uri }} style={s.photo} />
                    <TouchableOpacity
                      style={s.removePhoto}
                      onPress={() => removePhoto(i)}
                    >
                      <Text style={s.removeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {shopPhotos.length < 5 && (
                  <TouchableOpacity
                    style={s.addPhoto}
                    onPress={addPhotos}
                    disabled={loadingPhotos}
                  >
                    {loadingPhotos ? (
                      <ActivityIndicator size="small" color="#0E3A78" />
                    ) : (
                      <Text style={s.addPhotoText}>+ เพิ่มรูป</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              {errors.shop_photos && (
                <Text style={s.error}>{errors.shop_photos.message}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        <StepNav
          step={4}
          total={8}
          onBack={() => {
            setStep(3);
            router.replace('/signup/onboarding/step-3');
          }}
          onNext={onNext}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  form: { gap: 16 },
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrap: { position: 'relative' },
  photo: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addPhoto: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: { fontSize: 12, color: '#666' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  textarea: { height: 64, paddingTop: 12 },
  coordInput: { flex: 1 },
  slider: { width: '100%', height: 40 },
  inputError: { borderColor: '#E53935' },
  error: { fontSize: 12, color: '#E53935' },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    gap: 12,
  },
  mapIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTextWrap: { flex: 1 },
  mapTitle: { fontSize: 14, fontWeight: '700', color: '#0E3A78' },
  mapSubtitle: { fontSize: 12, color: '#1565C0', marginTop: 2 },
});
