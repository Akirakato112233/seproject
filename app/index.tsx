import React, { useState, useMemo } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../style/myStyle';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomSheet,
  FilterRow,
  MainFilterModal,
  SearchBar,
  FilterChips,
  Header,
  LaundryShopList,
  PriceSelector,
} from '../components';
import { useShops } from '../hooks/useShops';
export default function SearchScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMainModalVisible, setMainModalVisible] = useState(false);

  const [filters, setFilters] = useState({
    open: true,
    type: 'coin',
    nearMe: false,
    rating: 0,
    price: 0,
    promo: false,
    delivery: 'Any',
  });

  // เรียกข้อมูลจาก API (หรือใช้ mock data ถ้า backend ยังไม่พร้อม)
  // เปลี่ยน useMockData เป็น false เมื่อ backend พร้อมแล้ว
  const { shops, loading, error } = useShops({
    filters: {
      type: filters.type !== 'coin' ? filters.type : undefined,
      rating: filters.rating > 0 ? filters.rating : undefined,
      price: filters.price > 0 ? filters.price : undefined,
      delivery: filters.delivery !== 'Any' ? filters.delivery : undefined,
      nearMe: filters.nearMe,
      promo: filters.promo,
      open: filters.open,
    },
    useMockData: false, // เปลี่ยนเป็น false เมื่อ backend พร้อม
  });

  // กรองร้านตาม filters (ถ้า backend ไม่ได้ filter ให้)
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      // Filter by type - กรองตามประเภทที่เลือก
      if (shop.type !== filters.type) {
        return false;
      }

      // Filter by rating
      if (filters.rating > 0 && shop.rating < filters.rating) {
        return false;
      }

      // Filter by price
      if (filters.price > 0 && shop.priceLevel !== filters.price) {
        return false;
      }

      // Filter by delivery fee
      if (filters.delivery !== 'Any') {
        const maxFee = parseInt(filters.delivery.replace(/\D/g, ''));
        if (shop.deliveryFee > maxFee) {
          return false;
        }
      }

      return true;
    });
  }, [shops, filters]);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <SearchBar />
      <FilterChips
        filters={filters}
        setFilters={setFilters}
        setActiveModal={setActiveModal}
        setMainModalVisible={setMainModalVisible}
      />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1d4685" />
          <Text style={{ marginTop: 10, color: '#666' }}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={{ marginTop: 10, color: '#666', textAlign: 'center' }}>
            {error}
          </Text>
          <Text style={{ marginTop: 5, color: '#999', fontSize: 12, textAlign: 'center' }}>
            กำลังใช้ข้อมูลตัวอย่าง
          </Text>
        </View>
      ) : (
        <LaundryShopList shops={filteredShops} />
      )}

      {/* --- Modals --- */}
      <MainFilterModal
        visible={isMainModalVisible}
        onClose={() => setMainModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
      />

      <BottomSheet
        visible={activeModal === 'type'}
        title="Laundry Type"
        onClose={() => setActiveModal(null)}
        onReset={() => setFilters({ ...filters, type: 'coin' })}
        onApply={() => setActiveModal(null)}
      >
        <FilterRow
          icon={<MaterialCommunityIcons name="washing-machine" size={24} />}
          label="Coin Laundry"
          selected={filters.type === 'coin'}
          onPress={() => setFilters({ ...filters, type: 'coin' })}
        />
        <FilterRow
          icon={<Ionicons name="layers-outline" size={24} />}
          label="Full-service Laundry"
          selected={filters.type === 'full'}
          onPress={() => setFilters({ ...filters, type: 'full' })}
        />
      </BottomSheet>

      <BottomSheet
        visible={activeModal === 'rating'}
        title="Rating"
        onClose={() => setActiveModal(null)}
        onReset={() => setFilters({ ...filters, rating: 0 })}
        onApply={() => setActiveModal(null)}
      >
        {[5, 4, 3, 2].map((star) => (
          <FilterRow
            key={star}
            label={`${star} Stars & Above`}
            selected={filters.rating === star}
            onPress={() => setFilters({ ...filters, rating: star })}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={activeModal === 'price'}
        title="Price"
        onClose={() => setActiveModal(null)}
        onReset={() => setFilters({ ...filters, price: 0 })}
        onApply={() => setActiveModal(null)}
      >
        <PriceSelector
          selectedPrice={filters.price}
          onSelect={(price) => setFilters({ ...filters, price })}
        />
      </BottomSheet>

      <BottomSheet
        visible={activeModal === 'delivery'}
        title="Delivery Fee"
        onClose={() => setActiveModal(null)}
        onReset={() => setFilters({ ...filters, delivery: 'Any' })}
        onApply={() => setActiveModal(null)}
      >
        {['Any', 'Less than ฿ 10', 'Less than ฿ 20', 'Less than ฿ 30'].map((fee) => (
          <FilterRow
            key={fee}
            label={fee}
            selected={filters.delivery === fee}
            onPress={() => setFilters({ ...filters, delivery: fee })}
          />
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

