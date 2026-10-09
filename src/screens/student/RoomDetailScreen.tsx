import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { DateStrip } from '../../components/DateStrip';
import { EQUIPMENT_ICON, EQUIPMENT_LABEL, ROOM_TYPE_LABEL } from '../../components/labels';
import { Divider, EmptyState } from '../../components/Layout';
import { QRPassModal } from '../../components/QRPassModal';
import { SlotGrid } from '../../components/SlotGrid';
import { RoomStatusBadge } from '../../components/StatusBadge';
import { getSlotAvailability, type SlotAvailability } from '../../domain/conflict';
import { getRoomStatus } from '../../domain/roomStatus';
import { generateSlots } from '../../domain/slots';
import { formatDateKey, nextDateKeys } from '../../domain/time';
import type { Booking, Slot } from '../../domain/types';
import { useNow } from '../../hooks/useNow';
import type { ExploreStackParams } from '../../navigation/types';
import { useBookingStore, type CreateBookingResult } from '../../store/useBookingStore';
import { usePolicyStore } from '../../store/usePolicyStore';
import { useRoomStore } from '../../store/useRoomStore';
import { colors, spacing } from '../../theme/tokens';

const DAYS_AHEAD = 7;
const MAX_PHOTO_HEIGHT = 360;

const FAILURE_MESSAGE: Record<Extract<CreateBookingResult, { ok: false }>['reason'], string> = {
  maintenance: 'Phòng đang bảo trì nên chưa thể đặt.',
  past: 'Khung giờ này đã bắt đầu. Vui lòng chọn khung giờ khác.',
  mine: 'Bạn đã đặt khung giờ này rồi.',
  booked: 'Khung giờ này vừa có người khác đặt. Vui lòng chọn khung giờ khác.',
  user_overlap: 'Bạn đã có phòng khác trong khung giờ này.',
  daily_limit: 'Bạn đã dùng hết số lượt đặt cho ngày này.',
  forbidden: 'Chỉ tài khoản sinh viên mới đặt được phòng.',
  room_not_found: 'Phòng này không còn tồn tại.',
};

export function RoomDetailScreen({ route }: NativeStackScreenProps<ExploreStackParams, 'RoomDetail'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const room = useRoomStore((state) => state.rooms.find((candidate) => candidate.id === route.params.roomId));
  const bookings = useBookingStore((state) => state.bookings);
  const userId = useBookingStore((state) => state.session?.userId);
  const createBooking = useBookingStore((state) => state.createBooking);
  const policy = usePolicyStore((state) => state.policy);
  const now = useNow();

  const dateKeys = useMemo(() => nextDateKeys(now, DAYS_AHEAD), [now]);
  const [pickedDate, setPickedDate] = useState(dateKeys[0]);
  // If the app stays open past midnight the picked day can fall off the strip.
  const dateKey = dateKeys.includes(pickedDate) ? pickedDate : dateKeys[0];
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pass, setPass] = useState<Booking | null>(null);

  const slots = useMemo(() => generateSlots(policy), [policy]);
  const availability = useMemo(() => {
    const map: Record<string, SlotAvailability> = {};
    if (!room || !userId) return map;
    for (const slot of slots) {
      map[slot.id] = getSlotAvailability({ room, dateKey, slot, bookings, userId, policy, now });
    }
    return map;
  }, [room, userId, slots, dateKey, bookings, policy, now]);

  if (!room) {
    return <EmptyState icon="alert-circle-outline" title="Không tìm thấy phòng" message="Phòng này có thể đã bị xoá." />;
  }

  // A slot picked earlier may have been taken or expired since.
  const activeSlot = selectedSlot && availability[selectedSlot.id] === 'available' ? selectedSlot : null;

  const book = async () => {
    if (!activeSlot) return;
    setSubmitting(true);
    const result = await createBooking({ roomId: room.id, dateKey, slot: activeSlot });
    setSubmitting(false);
    setSelectedSlot(null);
    if (result.ok) setPass(result.booking);
    else Alert.alert('Chưa đặt được phòng', FAILURE_MESSAGE[result.reason]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={room.imageUrl}
          contentFit="cover"
          transition={150}
          style={[styles.photo, { height: Math.min(width * 0.75, MAX_PHOTO_HEIGHT) }]}
        />
        <View style={styles.body}>
          <View style={styles.section}>
            <AppText variant="displayLg" accessibilityRole="header">
              {room.name}
            </AppText>
            <AppText variant="bodySm" color="muted">
              {ROOM_TYPE_LABEL[room.type]} · Toà {room.building} · Tầng {room.floor} · {room.capacity} chỗ
            </AppText>
            <RoomStatusBadge status={getRoomStatus(room, bookings, now)} />
            {room.underMaintenance && room.maintenanceNote ? (
              <AppText variant="bodySm" color="body">
                {room.maintenanceNote}
              </AppText>
            ) : null}
          </View>
          <Divider />
          <View style={styles.section}>
            <AppText variant="displayMd">Phòng này có gì</AppText>
            {room.equipment.length === 0 ? (
              <AppText color="muted">Chưa có thiết bị nào được khai báo.</AppText>
            ) : (
              room.equipment.map((item) => (
                <View key={item} style={styles.amenity}>
                  <Ionicons name={EQUIPMENT_ICON[item]} size={24} color={colors.ink} />
                  <AppText>{EQUIPMENT_LABEL[item]}</AppText>
                </View>
              ))
            )}
          </View>
          <Divider />
          <View style={styles.section}>
            <AppText variant="displayMd">Chọn ngày</AppText>
          </View>
        </View>
        <DateStrip
          dateKeys={dateKeys}
          selected={dateKey}
          onSelect={(next) => {
            setPickedDate(next);
            setSelectedSlot(null);
          }}
        />
        <View style={styles.body}>
          <View style={styles.section}>
            <AppText variant="displayMd">Chọn khung giờ</AppText>
            {slots.length === 0 ? (
              <AppText color="muted">Chưa có khung giờ nào được mở.</AppText>
            ) : (
              <SlotGrid slots={slots} availability={availability} selectedId={activeSlot?.id ?? null} onSelect={setSelectedSlot} />
            )}
            <AppText variant="captionSm" color="muted">
              Mỗi ngày bạn được đặt tối đa {policy.maxBookingsPerDay} lượt.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.base }]}>
        <View style={styles.barText}>
          <AppText variant="titleMd">{activeSlot ? activeSlot.label : 'Chưa chọn khung giờ'}</AppText>
          <AppText variant="bodySm" color="muted">
            {formatDateKey(dateKey)}
          </AppText>
        </View>
        <Button label={submitting ? 'Đang đặt…' : 'Đặt phòng'} onPress={book} disabled={!activeSlot || submitting} />
      </View>

      <QRPassModal booking={pass} room={room} onClose={() => setPass(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingBottom: spacing.lg },
  photo: { width: '100%', backgroundColor: colors.surfaceStrong },
  body: { paddingHorizontal: spacing.lg },
  section: { paddingVertical: spacing.lg, gap: spacing.sm },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingVertical: spacing.md },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingTop: spacing.base,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  barText: { flex: 1 },
});
