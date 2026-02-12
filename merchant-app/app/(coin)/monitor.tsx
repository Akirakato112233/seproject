import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const shopAvatarImg = require('../../assets/images/shop-avatar.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useMachines, type Machine, type MachineStatus, type WashMode, type WaterTemp } from '../../context/MachineContext';

type FilterKey = 'all' | 'available' | 'running' | 'finished';

const STATUS_LABEL: Record<MachineStatus, string> = {
  available: 'ว่าง',
  running: 'กำลังทำงาน',
  finished: 'เสร็จสิ้น',
  offline: 'Offline',
};

function formatCountdown(seconds: number): { time: string; label: string } {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 1) {
    return { time: `${m}m ${s}s`, label: 'LEFT' };
  }
  return { time: `${s}s`, label: 'LEFT' };
}

export default function LiveMonitorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ openAdd?: string }>();
  const { machines, addMachine, startMachine, skipMachine, collectMachine, todayRevenue } = useMachines();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const selectedMachineIdRef = useRef<string | null>(null);
  const [selectedWashMode, setSelectedWashMode] = useState<WashMode>('Normal');
  const [selectedWaterTemp, setSelectedWaterTemp] = useState<WaterTemp>('Cold');
  const [runningMachine, setRunningMachine] = useState<Machine | null>(null);
  const [finishedMachine, setFinishedMachine] = useState<Machine | null>(null);
  const [collectedAmount, setCollectedAmount] = useState<number | null>(null);
  const [addMachineVisible, setAddMachineVisible] = useState(false);
  const [newMachineId, setNewMachineId] = useState('');
  const [newMachineType, setNewMachineType] = useState<'washer' | 'dryer'>('washer');
  const [newCapacity, setNewCapacity] = useState('12');
  const [newPrice, setNewPrice] = useState('40');
  const [newCycleTime, setNewCycleTime] = useState('45 minutes');

  // เปิด add machine modal อัตโนมัติถ้ามา param openAdd=1 จากหน้าหลัก
  useEffect(() => {
    if (params.openAdd === '1') {
      setAddMachineVisible(true);
    }
  }, [params.openAdd]);

  const filteredMachines = useMemo(() => {
    if (filter === 'all') return machines;
    return machines.filter((m) => m.status === filter);
  }, [filter, machines]);

  const counts = useMemo(
    () => ({
      all: machines.length,
      available: machines.filter((m) => m.status === 'available').length,
      running: machines.filter((m) => m.status === 'running').length,
      finished: machines.filter((m) => m.status === 'finished').length,
    }),
    [machines]
  );

  const occupancy = machines.length > 0
    ? Math.round((counts.running / machines.length) * 100)
    : 0;
  const revenueChange = 0;

  const handleBack = () => router.back();
  const handleAddMachine = () => setAddMachineVisible(true);
  const closeAddMachine = () => {
    setAddMachineVisible(false);
    setNewMachineId('');
    setNewMachineType('washer');
    setNewCapacity('12');
    setNewPrice('40');
    setNewCycleTime('45 minutes');
    setAddMachineError('');
  };
  const [addMachineError, setAddMachineError] = useState('');

  const handleSubmitAddMachine = () => {
    const id = newMachineId.trim();
    if (!id) {
      setAddMachineError('กรุณากรอก Machine ID');
      return;
    }
    // เช็คซ้ำ
    const isDuplicate = machines.some((m) => m.id === id);
    if (isDuplicate) {
      setAddMachineError(`Machine ID "${id}" มีอยู่แล้ว`);
      return;
    }
    setAddMachineError('');
    const newMachine: Machine = {
      id,
      name: id,
      status: 'available',
      type: newMachineType,
      capacity: newCapacity,
      price: newPrice,
      cycleTime: '45',
      enabled: true,
      program: 'Ready',
    };
    addMachine(newMachine);
    closeAddMachine();
  };
  const handleSystem = () => router.push('/(coin)/settings');

  // กดเครื่อง Available (สีฟ้า) → เปิด modal ให้กดเริ่ม
  // กดเครื่อง Finished (สีเขียว) → เปิด modal รับเงิน
  const onMachinePress = (machine: Machine) => {
    if (machine.status === 'available') {
      setSelectedMachine(machine);
      selectedMachineIdRef.current = machine.id;
      setSelectedWashMode('Normal');
      setSelectedWaterTemp('Cold');
    } else if (machine.status === 'finished') {
      setFinishedMachine(machine);
      setCollectedAmount(null);
    }
  };

  const closeStartModal = () => {
    setSelectedMachine(null);
    selectedMachineIdRef.current = null;
  };

  // กด Start Machine → เปลี่ยนสถานะจาก ว่าง → กำลังทำงาน ทันที
  const onStartMachinePress = () => {
    const machineId = selectedMachineIdRef.current || selectedMachine?.id;
    if (!machineId) return;

    // ปิด modal + เปลี่ยน filter ถ้าจำเป็น
    closeStartModal();
    if (filter === 'available') {
      setFilter('all');
    }

    // เปลี่ยนสถานะผ่าน context (ใช้ cycleTime ของเครื่องนั้น + โหมด/อุณหภูมิที่เลือก)
    startMachine(machineId, selectedWashMode, selectedWaterTemp);
  };

  const filterButtons: { key: FilterKey; label: string; count: number; icon: string }[] = [
    { key: 'all', label: 'All', count: counts.all, icon: 'list' },
    { key: 'available', label: 'Available', count: counts.available, icon: 'checkmark-circle' },
    { key: 'running', label: 'Running', count: counts.running, icon: 'time' },
    { key: 'finished', label: 'Ready', count: counts.finished, icon: 'checkmark-done' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="shirt-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.headerTitle}>Live Monitor</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.shopName}>ร้านsukhai</Text>
          <Image source={shopAvatarImg} style={s.avatar} />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {filterButtons.map(({ key, label, count, icon }) => {
          const isActive = filter === key;
          const iconColor = isActive
            ? Colors.white
            : key === 'running'
              ? '#eab308'
              : key === 'finished'
                ? Colors.successGreen
                : Colors.primaryBlue;
          return (
            <TouchableOpacity
              key={key}
              style={[s.filterBtn, isActive && s.filterBtnActive]}
              onPress={() => setFilter(key)}
              activeOpacity={0.7}
            >
              <Ionicons name={icon as any} size={16} color={iconColor} />
              <Text style={[s.filterText, isActive && s.filterTextActive, !isActive && key === 'running' && s.filterTextRunning, !isActive && key === 'finished' && s.filterTextReady]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* OCCUPANCY & TODAY'S REVENUE */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>OCCUPANCY</Text>
          <Text style={s.summaryValue}>{occupancy}%</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>TODAY'S REVENUE</Text>
          <Text style={s.summaryValue}>฿{todayRevenue}</Text>
          <Text style={s.revenueChangeNegative}>{revenueChange}%</Text>
        </View>
      </View>

      {/* Washers section */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>WASHERS (W-01 TO W-08)</Text>
        <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="filter-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.machineGrid}>
          {filteredMachines.map((machine, index) => {
            const countdown = machine.status === 'running' ? formatCountdown(machine.secondsLeft ?? 0) : null;
            return (
              <TouchableOpacity
                key={`${machine.id}-${machine.status}-${index}`}
                style={s.machineCard}
                onPress={() => onMachinePress(machine)}
                activeOpacity={0.8}
              >
                <View style={s.cardTopRow}>
                  <View style={[s.statusBadge, s[`statusBadge_${machine.status}` as keyof typeof s] as object]}>
                    <Text style={[s.machineStatusLabel, s[`status_${machine.status}` as keyof typeof s] as object]}>
                      {STATUS_LABEL[machine.status]}
                    </Text>
                  </View>
                  <Text style={s.machineIdLabel}>{machine.id}</Text>
                </View>
                <View style={s.machineCircleWrap}>
                  {machine.status === 'running' && countdown && (
                    <View style={[s.circle, s.circleRunning]}>
                      <Ionicons name="time" size={16} color="#fff" style={s.circleClockIcon} />
                      <Text style={s.circleTimeText}>{countdown.time}</Text>
                      <Text style={s.circleLabelText}>{countdown.label}</Text>
                    </View>
                  )}
                {machine.status === 'available' && (
                  <View style={[s.circle, s.circleDashed]}>
                    <Ionicons name="add" size={32} color={Colors.primaryBlue} />
                  </View>
                )}
                {machine.status === 'finished' && (
                  <View style={[s.circle, s.circleFinished]}>
                    <Ionicons name="checkmark" size={28} color={Colors.white} />
                    <Text style={s.circleReadyText}>READY</Text>
                  </View>
                )}
                {machine.status === 'offline' && (
                  <View style={[s.circle, s.circleOffline]}>
                    <Ionicons name="construct-outline" size={28} color={Colors.textMuted} />
                  </View>
                )}
                </View>
                <View style={s.machineMeta}>
                  <Text style={s.machineMetaText}>
                    {machine.status === 'offline' ? 'Maintenance' : `${machine.capacity}kg${machine.program ? ` • ${machine.program}` : ''}`}
                  </Text>
                  <View style={s.machineMetaIcon}>
                    {machine.status === 'running' && (
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={(e) => { e.stopPropagation(); setRunningMachine(machine); }}
                      >
                        <Ionicons name="settings-outline" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    {machine.status === 'available' && <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />}
                    {machine.status === 'finished' && <Ionicons name="notifications-outline" size={16} color={Colors.textMuted} />}
                    {machine.status === 'offline' && <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem}>
          <Ionicons name="grid-outline" size={24} color={Colors.primaryBlue} />
          <Text style={[s.navLabel, s.navLabelActive]}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addButton} onPress={handleAddMachine} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={handleSystem}>
          <Ionicons name="settings-outline" size={24} color={Colors.textMuted} />
          <Text style={s.navLabel}>System</Text>
        </TouchableOpacity>
      </View>

      {/* Modal เลือกเครื่อง + Start Machine (กดปุ่มสีฟ้าแล้วถามจะเริ่มเลยมั้ย) */}
      <Modal
        visible={selectedMachine != null}
        transparent
        animationType="fade"
        onRequestClose={closeStartModal}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={closeStartModal}
        >
          <TouchableOpacity
            style={s.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHeader}>
              <View style={s.modalHeaderLeft}>
                <View style={s.modalMachineIcon}>
                  <Ionicons name="shirt-outline" size={24} color={Colors.primaryBlue} />
                </View>
                <Text style={s.modalTitle}>WIT CONCEPT {selectedMachine?.name}</Text>
              </View>
              <View style={s.modalJustNowRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={s.modalJustNow}>Just now</Text>
              </View>
            </View>

            <View style={s.modalRow}>
              <Ionicons name="document-text-outline" size={20} color={Colors.primaryBlue} />
              <View>
                <Text style={s.modalRowTitle}>Wash & Fold Service</Text>
                <Text style={s.modalRowSub}>{selectedMachine?.capacity ?? ''}kg • ฿{selectedMachine?.price ?? ''}/cycle</Text>
              </View>
            </View>
            <View style={s.modalRow}>
              <Ionicons name="time-outline" size={20} color={Colors.primaryBlue} />
              <View>
                <Text style={s.modalRowTitle}>Washing Time</Text>
                <Text style={s.modalRowSub}>{selectedMachine?.cycleTime ?? '45'} MIN</Text>
              </View>
            </View>

            {/* Wash Mode */}
            <Text style={s.modalSectionLabel}>Wash Mode</Text>
            <View style={s.optionRow}>
              {(['Quick', 'Normal', 'Heavy Duty', 'Delicate'] as WashMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[s.optionChip, selectedWashMode === mode && s.optionChipActive]}
                  onPress={() => setSelectedWashMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optionChipText, selectedWashMode === mode && s.optionChipTextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Water Temperature */}
            <Text style={s.modalSectionLabel}>Water Temperature</Text>
            <View style={s.optionRow}>
              {(['Cold', 'Warm', 'Hot'] as WaterTemp[]).map((temp) => {
                const tempIcon = temp === 'Cold' ? 'snow-outline' : temp === 'Warm' ? 'water-outline' : 'flame-outline';
                const tempColor = temp === 'Cold' ? '#3b82f6' : temp === 'Warm' ? '#f59e0b' : '#ef4444';
                return (
                  <TouchableOpacity
                    key={temp}
                    style={[s.optionChip, selectedWaterTemp === temp && { ...s.optionChipActive, borderColor: tempColor, backgroundColor: tempColor }]}
                    onPress={() => setSelectedWaterTemp(temp)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={tempIcon as any} size={14} color={selectedWaterTemp === temp ? Colors.white : tempColor} />
                    <Text style={[s.optionChipText, { marginLeft: 4 }, selectedWaterTemp === temp && s.optionChipTextActive]}>{temp}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={s.startMachineBtn}
              onPress={onStartMachinePress}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={s.startMachineBtnText}>Start Machine</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add New IoT Machine - สไลด์ขึ้นจากล่างเมื่อกดปุ่ม + */}
      <Modal
        visible={addMachineVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddMachine}
      >
        <TouchableOpacity
          style={s.sheetOverlay}
          activeOpacity={1}
          onPress={closeAddMachine}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={s.sheetWrap}
          >
            <TouchableOpacity
              style={s.addMachineSheet}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={s.sheetHeader}>
                <TouchableOpacity onPress={closeAddMachine} style={s.sheetClose}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.sheetTitle}>Add New IoT Machine</Text>
                <View style={s.sheetClose} />
              </View>

              <View style={s.sheetContent}>
                <Text style={s.sheetSectionTitle}>Machine Details</Text>
                <Text style={s.sheetSectionSub}>Fill in the details to register a new unit to the laundry network</Text>

                <Text style={s.inputLabel}>Machine ID</Text>
                <TextInput
                  style={[s.input, addMachineError ? s.inputError : null]}
                  placeholder="e.g., WM-102"
                  placeholderTextColor={Colors.textMuted}
                  value={newMachineId}
                  onChangeText={(t) => { setNewMachineId(t); setAddMachineError(''); }}
                />
                {addMachineError ? <Text style={s.errorText}>{addMachineError}</Text> : null}

                <Text style={s.inputLabel}>Machine Type</Text>
                <View style={s.typeRow}>
                  <TouchableOpacity
                    style={[s.typeBtn, newMachineType === 'washer' && s.typeBtnActive]}
                    onPress={() => setNewMachineType('washer')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="shirt-outline" size={20} color={newMachineType === 'washer' ? Colors.white : Colors.textSecondary} />
                    <Text style={[s.typeBtnText, newMachineType === 'washer' && s.typeBtnTextActive]}>Washer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.typeBtn, newMachineType === 'dryer' && s.typeBtnActive]}
                    onPress={() => setNewMachineType('dryer')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flame-outline" size={20} color={newMachineType === 'dryer' ? Colors.white : Colors.textSecondary} />
                    <Text style={[s.typeBtnText, newMachineType === 'dryer' && s.typeBtnTextActive]}>Dryer</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.rowTwo}>
                  <View style={s.halfField}>
                    <Text style={s.inputLabel}>Capacity (kg)</Text>
                    <TextInput
                      style={s.input}
                      value={newCapacity}
                      onChangeText={setNewCapacity}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={s.halfField}>
                    <Text style={s.inputLabel}>Price per cycle</Text>
                    <View style={s.priceWrap}>
                      <TextInput
                        style={[s.input, s.priceInput]}
                        value={newPrice}
                        onChangeText={setNewPrice}
                        keyboardType="number-pad"
                      />
                      <Text style={s.priceSuffix}>฿</Text>
                    </View>
                  </View>
                </View>

                <Text style={s.inputLabel}>Estimated cycle time</Text>
                <TouchableOpacity style={s.dropdown}>
                  <Text style={s.dropdownText}>{newCycleTime}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={s.addMachineBtn} onPress={handleSubmitAddMachine} activeOpacity={0.8}>
                  <Text style={s.addMachineBtnText}>Add Machine</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Running Machine Options Modal (กดฟันเฟือง) */}
      <Modal
        visible={runningMachine != null}
        transparent
        animationType="fade"
        onRequestClose={() => setRunningMachine(null)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setRunningMachine(null)}
        >
          <TouchableOpacity
            style={s.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHeader}>
              <View style={s.modalHeaderLeft}>
                <View style={s.modalMachineIcon}>
                  <Ionicons name="settings-outline" size={24} color={Colors.primaryBlue} />
                </View>
                <Text style={s.modalTitle}>{runningMachine?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setRunningMachine(null)}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={s.modalRow}>
              <Ionicons name="shirt-outline" size={20} color={Colors.primaryBlue} />
              <View>
                <Text style={s.modalRowTitle}>Mode: {runningMachine?.washMode ?? runningMachine?.program}</Text>
                <Text style={s.modalRowSub}>{runningMachine?.waterTemp ? `Water: ${runningMachine.waterTemp}` : ''} • {runningMachine?.capacity}kg</Text>
              </View>
            </View>
            <View style={s.modalRow}>
              <Ionicons name="time-outline" size={20} color="#eab308" />
              <View>
                <Text style={s.modalRowTitle}>Time Remaining</Text>
                <Text style={s.modalRowSub}>
                  {runningMachine?.secondsLeft != null
                    ? `${Math.floor(runningMachine.secondsLeft / 60)}m ${runningMachine.secondsLeft % 60}s`
                    : '—'}
                </Text>
              </View>
            </View>

            {/* Skip button */}
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => {
                if (runningMachine) {
                  skipMachine(runningMachine.id);
                  setRunningMachine(null);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="play-skip-forward" size={20} color={Colors.white} />
              <Text style={s.skipBtnText}>Skip — จบรอบทันที</Text>
            </TouchableOpacity>

            {/* Cancel — just close */}
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setRunningMachine(null)}
              activeOpacity={0.8}
            >
              <Text style={s.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Finished Machine — รับเงิน Modal */}
      <Modal
        visible={finishedMachine != null}
        transparent
        animationType="fade"
        onRequestClose={() => setFinishedMachine(null)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setFinishedMachine(null)}
        >
          <TouchableOpacity
            style={s.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {collectedAmount == null ? (
              <>
                <View style={s.modalHeader}>
                  <View style={s.modalHeaderLeft}>
                    <View style={[s.modalMachineIcon, { backgroundColor: '#dcfce7' }]}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.successGreen} />
                    </View>
                    <Text style={s.modalTitle}>{finishedMachine?.name} — เสร็จสิ้น</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFinishedMachine(null)}>
                    <Ionicons name="close" size={22} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={s.modalRow}>
                  <Ionicons name="cash-outline" size={20} color={Colors.successGreen} />
                  <View>
                    <Text style={s.modalRowTitle}>ค่าบริการ</Text>
                    <Text style={s.modalRowSub}>฿{finishedMachine?.price ?? '0'}</Text>
                  </View>
                </View>
                <View style={s.modalRow}>
                  <Ionicons name="shirt-outline" size={20} color={Colors.primaryBlue} />
                  <View>
                    <Text style={s.modalRowTitle}>{finishedMachine?.washMode ?? finishedMachine?.program}</Text>
                    <Text style={s.modalRowSub}>{finishedMachine?.capacity}kg</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.collectBtn}
                  onPress={() => {
                    if (finishedMachine) {
                      const earned = collectMachine(finishedMachine.id);
                      setCollectedAmount(earned);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wallet-outline" size={20} color={Colors.white} />
                  <Text style={s.collectBtnText}>รับเงิน ฿{finishedMachine?.price ?? '0'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={s.collectedWrap}>
                <View style={s.collectedIcon}>
                  <Ionicons name="checkmark-circle" size={48} color={Colors.successGreen} />
                </View>
                <Text style={s.collectedTitle}>รับเงินสำเร็จ!</Text>
                <Text style={s.collectedAmount}>+฿{collectedAmount}</Text>
                <Text style={s.collectedSub}>เครื่องพร้อมใช้งานแล้ว</Text>
                <TouchableOpacity
                  style={[s.collectBtn, { width: '100%' }]}
                  onPress={() => { setFinishedMachine(null); setCollectedAmount(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={s.collectBtnText}>ตกลง</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: { padding: 4 },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shopName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBorder,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  filterTextActive: { color: Colors.white },
  filterTextRunning: { color: '#eab308' },
  filterTextReady: { color: Colors.successGreen },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  revenueChangeNegative: { fontSize: 12, fontWeight: '600', color: '#dc2626', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  machineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  machineCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  machineIdLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge_running: { backgroundColor: '#fef9c3' },
  statusBadge_available: { backgroundColor: '#dbeafe' },
  statusBadge_finished: { backgroundColor: '#dcfce7' },
  statusBadge_offline: { backgroundColor: '#f3f4f6' },
  machineStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  status_running: { color: '#a16207' },
  status_available: { color: Colors.primaryBlue },
  status_finished: { color: '#166534' },
  status_offline: { color: Colors.textMuted },
  machineCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 80,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRunning: {
    borderWidth: 3,
    borderColor: '#eab308',
    backgroundColor: '#fef9c3',
  },
  circleClockIcon: { marginBottom: 4 },
  circleTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a16207',
    textAlign: 'center',
  },
  circleLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a16207',
    textAlign: 'center',
    marginTop: 2,
  },
  circleDashed: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryBlue,
    backgroundColor: '#eff6ff',
  },
  circleFinished: {
    backgroundColor: Colors.successGreen,
  },
  circleReadyText: { fontSize: 10, fontWeight: '700', color: Colors.white, marginTop: 2 },
  circleOffline: {
    backgroundColor: '#f3f4f6',
  },
  machineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  machineMetaText: { fontSize: 12, color: Colors.textSecondary },
  machineMetaIcon: {},
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { alignItems: 'center', gap: 4, flex: 1 },
  navLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  navLabelActive: { color: Colors.primaryBlue },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    shadowColor: Colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalMachineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalJustNowRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalJustNow: { fontSize: 13, color: Colors.textSecondary },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  modalRowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  modalRowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.white,
  },
  optionChipActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionChipTextActive: {
    color: Colors.white,
  },
  startMachineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  startMachineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eab308',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  cancelBtn: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.successGreen,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  collectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  collectedWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  collectedIcon: {
    marginBottom: 12,
  },
  collectedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  collectedAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.successGreen,
    marginBottom: 4,
  },
  collectedSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  addMachineSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  sheetContent: { flex: 1 },
  sheetSectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sheetSectionSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
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
    marginBottom: 12,
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: -8, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.white,
  },
  typeBtnActive: { backgroundColor: Colors.primaryBlue, borderColor: Colors.primaryBlue },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.white },
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  halfField: { flex: 1 },
  priceWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, marginBottom: 12 },
  priceInput: { flex: 1, marginBottom: 0 },
  priceSuffix: { fontSize: 15, color: Colors.textSecondary, paddingRight: 14 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  dropdownText: { fontSize: 15, color: Colors.textPrimary },
  addMachineBtn: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addMachineBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
