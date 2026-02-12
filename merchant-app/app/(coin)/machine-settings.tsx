import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useMachines } from '../../context/MachineContext';

export default function MachineSettingsScreen() {
  const router = useRouter();
  const { machines, updateMachineConfig, toggleMachineEnabled, removeMachine } = useMachines();
  const [editMachineId, setEditMachineId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editCycleTime, setEditCycleTime] = useState('');

  const editMachine = editMachineId ? machines.find((m) => m.id === editMachineId) : null;

  const openEdit = (id: string) => {
    const machine = machines.find((m) => m.id === id);
    if (!machine) return;
    setEditMachineId(id);
    setEditPrice(machine.price);
    setEditCapacity(machine.capacity);
    setEditCycleTime(machine.cycleTime);
  };

  const saveEdit = () => {
    if (!editMachineId) return;
    updateMachineConfig(editMachineId, {
      price: editPrice,
      capacity: editCapacity,
      cycleTime: editCycleTime,
    });
    setEditMachineId(null);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>ตั้งค่าเครื่องซักผ้า</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {machines.map((machine) => (
          <View
            key={machine.id}
            style={[s.card, !machine.enabled && s.cardDisabled]}
          >
            <View style={s.cardTop}>
              <TouchableOpacity style={s.cardLeft} onPress={() => openEdit(machine.id)} activeOpacity={0.7}>
                <View style={[s.machineIcon, machine.enabled ? s.machineIconActive : s.machineIconInactive]}>
                  <Ionicons
                    name={machine.type === 'washer' ? 'shirt-outline' : 'flame-outline'}
                    size={20}
                    color={machine.enabled ? Colors.white : Colors.textMuted}
                  />
                </View>
                <View>
                  <Text style={s.machineId}>{machine.id}</Text>
                  <Text style={s.machineSub}>
                    {machine.type === 'washer' ? 'Washer' : 'Dryer'} • {machine.capacity}kg
                  </Text>
                </View>
              </TouchableOpacity>
              <Switch
                value={machine.enabled}
                onValueChange={() => toggleMachineEnabled(machine.id)}
                trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                thumbColor={machine.enabled ? Colors.primaryBlue : '#94a3b8'}
              />
            </View>
            <TouchableOpacity style={s.cardBottom} onPress={() => openEdit(machine.id)} activeOpacity={0.7}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>ราคา/รอบ</Text>
                <Text style={s.detailValue}>฿{machine.price}</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>ความจุ</Text>
                <Text style={s.detailValue}>{machine.capacity} kg</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>เวลา/รอบ</Text>
                <Text style={s.detailValue}>{machine.cycleTime} นาที</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editMachineId != null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditMachineId(null)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditMachineId(null)}
        >
          <TouchableOpacity
            style={s.editSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.editHeader}>
              <TouchableOpacity onPress={() => setEditMachineId(null)} style={s.editClose}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.editTitle}>แก้ไข {editMachine?.id}</Text>
              <View style={s.editClose} />
            </View>

            <Text style={s.inputLabel}>ราคาต่อรอบ (฿)</Text>
            <TextInput
              style={s.input}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="number-pad"
            />

            <Text style={s.inputLabel}>ความจุ (kg)</Text>
            <TextInput
              style={s.input}
              value={editCapacity}
              onChangeText={setEditCapacity}
              keyboardType="number-pad"
            />

            <Text style={s.inputLabel}>เวลาต่อรอบ (นาที)</Text>
            <TextInput
              style={s.input}
              value={editCycleTime}
              onChangeText={setEditCycleTime}
              keyboardType="number-pad"
            />

            <TouchableOpacity style={s.saveBtn} onPress={saveEdit} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => {
                if (editMachineId) {
                  removeMachine(editMachineId);
                  setEditMachineId(null);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={s.deleteBtnText}>ลบเครื่องนี้</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cardBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardDisabled: { opacity: 0.5 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  machineIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineIconActive: { backgroundColor: Colors.primaryBlue },
  machineIconInactive: { backgroundColor: '#e2e8f0' },
  machineId: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  machineSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 12,
    gap: 16,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  editClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  editTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
});
