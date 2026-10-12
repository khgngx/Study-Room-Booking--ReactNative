import type { ComponentProps, ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer, type ReactTestRendererNode } from 'react-test-renderer';

import { DaySchedule } from '../components/DaySchedule';
import { generateSlots } from '../domain/slots';
import { addDays, toDateKey } from '../domain/time';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/manager/DashboardScreen';
import { PolicyScreen } from '../screens/manager/PolicyScreen';
import { ManageRoomsScreen } from '../screens/shared/ManageRoomsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { RoomDetailScreen } from '../screens/student/RoomDetailScreen';
import { showMessage } from '../services/dialog';
import { discardImage, storeImage } from '../services/images';
import { useAccountStore } from '../store/useAccountStore';
import { useBookingStore } from '../store/useBookingStore';
import { usePolicyStore } from '../store/usePolicyStore';
import { useRoomStore } from '../store/useRoomStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../services/dialog', () => ({ showMessage: jest.fn(), confirmDestructive: jest.fn() }));
jest.mock('../services/images', () => ({
  ...jest.requireActual('../services/images'),
  chooseImage: jest.fn(async () => ({ uri: 'file:///picked.jpg', width: 1200, height: 800 })),
  storeImage: jest.fn(async () => 'local:avatar-test.jpg'),
  discardImage: jest.fn(),
}));

const NOW = new Date(2026, 9, 12, 7, 0);
const tomorrow = toDateKey(addDays(NOW, 1));
const initialRooms = useRoomStore.getState().rooms;
const slots = generateSlots(usePolicyStore.getState().policy);

function collectText(node: ReactTestRendererNode | ReactTestRendererNode[] | null): string {
  if (node === null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  return collectText(node.children);
}

const mounted: ReactTestRenderer[] = [];

async function render(element: ReactElement, userId: string | null): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    useBookingStore.setState({ session: userId ? { userId } : null });
    renderer = create(element);
    jest.runOnlyPendingTimers();
  });
  if (!renderer) throw new Error('Screen did not render');
  mounted.push(renderer);
  return renderer;
}

const byLabel = (renderer: ReactTestRenderer, label: string | RegExp): ReactTestInstance => {
  const [match] = renderer.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      (typeof label === 'string' ? node.props.accessibilityLabel === label : label.test(node.props.accessibilityLabel)),
  );
  if (!match) throw new Error(`No pressable labelled ${label}`);
  return match;
};

const press = async (node: ReactTestInstance) => act(async () => node.props.onPress());

// Screens only use these two navigation calls; a full navigator would add nothing to what is checked here.
const navigation = { navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() };
const screenProps = <Props,>(params: object) => ({ navigation, route: { key: 'test', name: 'test', params } }) as unknown as Props;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
  useRoomStore.setState({ rooms: initialRooms });
  useBookingStore.setState({ bookings: [] });
});

afterEach(async () => {
  await act(async () => mounted.splice(0).forEach((renderer) => renderer.unmount()));
  jest.useRealTimers();
});

describe('DaySchedule', () => {
  const custom = { startMinutes: slots[0].startMinutes + 15, endMinutes: slots[0].startMinutes + 75 };
  const baseProps: ComponentProps<typeof DaySchedule> = {
    range: { startMinutes: 7 * 60, endMinutes: 21 * 60 },
    slots,
    availability: Object.fromEntries(slots.map((slot) => [slot.id, 'available' as const])),
    bookings: [],
    gaps: [],
    closed: [],
    selections: [custom],
    nowMinutes: null,
    onSelect: jest.fn(),
    onCustomize: jest.fn(),
    onCancelBooking: jest.fn(),
  };

  it('lets a custom time be dropped with a tap, and no longer draws the default slot underneath it', async () => {
    const renderer = await render(<DaySchedule {...baseProps} />, 'user-student');
    await press(byLabel(renderer, /đã chọn$/));
    expect(baseProps.onSelect).toHaveBeenCalledWith(custom);
    expect(() => byLabel(renderer, new RegExp(`^${slots[0].label}`))).toThrow();
    expect(byLabel(renderer, new RegExp(`^${slots[1].label}`))).toBeTruthy();
  });
});

describe('screens render for their role', () => {
  it('shows the booking page with the schedule and no selection yet', async () => {
    const renderer = await render(
      <RoomDetailScreen {...screenProps<ComponentProps<typeof RoomDetailScreen>>({ roomId: initialRooms[0].id, dateKey: tomorrow })} />,
      'user-student',
    );
    const output = collectText(renderer.toJSON());
    expect(output).toContain('Chọn khung giờ');
    expect(output).toContain('Chưa chọn khung giờ');
    await press(byLabel(renderer, new RegExp(`^${slots[0].label}, còn trống`)));
    expect(collectText(renderer.toJSON())).toContain('1 ca');
    await press(byLabel(renderer, new RegExp(`^${slots[0].label}, đã chọn`)));
    expect(collectText(renderer.toJSON())).toContain('Chưa chọn khung giờ');
  });

  it('shows the dashboard charts and the export action to a manager', async () => {
    const output = collectText((await render(<DashboardScreen />, 'user-manager')).toJSON());
    for (const text of ['Lượt đặt theo ngày', 'Kết quả các lượt đặt', 'Giờ cao điểm', 'Mức sử dụng theo toà nhà', 'Xuất file CSV']) expect(output).toContain(text);
  });

  it('shows the policy groups', async () => {
    const output = collectText((await render(<PolicyScreen />, 'user-manager')).toJSON());
    for (const text of ['GIỜ HOẠT ĐỘNG', 'QUY ĐỊNH ĐẶT PHÒNG', 'Buổi sáng']) expect(output).toContain(text);
  });

  it('offers every role a way to set an avatar', async () => {
    for (const userId of ['user-student', 'user-staff', 'user-manager']) {
      const renderer = await render(<ProfileScreen {...screenProps<ComponentProps<typeof ProfileScreen>>({})} />, userId);
      expect(collectText(renderer.toJSON())).toContain('Thêm ảnh đại diện');
      expect(byLabel(renderer, 'Đổi ảnh đại diện')).toBeTruthy();
    }
  });

  describe('avatar editor', () => {
    const openEditor = async () => {
      const renderer = await render(<ProfileScreen {...screenProps<ComponentProps<typeof ProfileScreen>>({})} />, 'user-student');
      await press(byLabel(renderer, 'Đổi ảnh đại diện'));
      return renderer;
    };
    const button = (renderer: ReactTestRenderer, label: string) => renderer.root.find((node) => node.props.label === label && typeof node.props.onPress === 'function');
    const avatarOf = () => useAccountStore.getState().users.find((user) => user.id === 'user-student')?.avatarUrl;

    afterEach(() => useAccountStore.getState().setAvatar('user-student', undefined));

    it('saves a picked photo only after it is confirmed', async () => {
      const renderer = await openEditor();
      expect(button(renderer, 'Xác nhận').props.disabled).toBe(true);

      await press(button(renderer, 'Chọn ảnh'));
      expect(storeImage).not.toHaveBeenCalled();
      expect(avatarOf()).toBeUndefined();

      await press(button(renderer, 'Xác nhận'));
      expect(storeImage).toHaveBeenCalledWith('avatar', { uri: 'file:///picked.jpg', width: 1200, height: 800 }, undefined);
      expect(avatarOf()).toBe('local:avatar-test.jpg');
    });

    it('removes the current photo on confirm and frees its file', async () => {
      useAccountStore.getState().setAvatar('user-student', 'local:old.jpg');
      const renderer = await openEditor();
      await press(button(renderer, 'Gỡ ảnh'));
      expect(avatarOf()).toBe('local:old.jpg');

      await press(button(renderer, 'Xác nhận'));
      expect(avatarOf()).toBeUndefined();
      expect(discardImage).toHaveBeenCalledWith('local:old.jpg');
    });

    it('changes nothing when the sheet is cancelled', async () => {
      useAccountStore.getState().setAvatar('user-student', 'local:old.jpg');
      const renderer = await openEditor();
      await press(button(renderer, 'Gỡ ảnh'));
      await press(button(renderer, 'Huỷ'));
      expect(avatarOf()).toBe('local:old.jpg');
      expect(discardImage).not.toHaveBeenCalled();
    });
  });

  it('rejects a wrong password on the login screen', async () => {
    const renderer = await render(<LoginScreen {...screenProps<ComponentProps<typeof LoginScreen>>({})} />, null);
    await press(byLabel(renderer, 'Điền tài khoản Sinh viên'));
    const password = renderer.root.find((node) => node.props.accessibilityLabel === 'Mật khẩu' && typeof node.props.onChangeText === 'function');
    await act(async () => password.props.onChangeText('sai-mat-khau'));
    await act(async () => password.props.onSubmitEditing());
    expect(collectText(renderer.toJSON())).toContain('Email hoặc mật khẩu không đúng.');
    expect(useBookingStore.getState().session).toBeNull();
  });
});

describe('maintenance toggles for lab staff (buildings A and B)', () => {
  const props = screenProps<ComponentProps<typeof ManageRoomsScreen>>({});
  const roomA = initialRooms.find((room) => room.building === 'A');
  const roomC = initialRooms.find((room) => room.building === 'C' && !room.underMaintenance);
  if (!roomA || !roomC) throw new Error('Seed rooms missing');
  const underMaintenance = (id: string) => useRoomStore.getState().rooms.find((room) => room.id === id)?.underMaintenance;

  // Two rooms keep both inside the list's first rendered batch.
  beforeEach(() => useRoomStore.setState({ rooms: [roomA, roomC] }));

  it('switches a room in an assigned building on and off', async () => {
    const renderer = await render(<ManageRoomsScreen {...props} />, 'user-staff');
    const toggle = () => byLabel(renderer, `Bảo trì phòng ${roomA.code}`);
    expect(toggle().props.accessibilityState).toMatchObject({ checked: false, disabled: false });
    await press(toggle());
    expect(underMaintenance(roomA.id)).toBe(true);
    expect(toggle().props.accessibilityState).toMatchObject({ checked: true });
    await press(toggle());
    expect(underMaintenance(roomA.id)).toBe(false);
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('locks a room outside the assigned buildings and explains why when pressed', async () => {
    const renderer = await render(<ManageRoomsScreen {...props} />, 'user-staff');
    const toggle = byLabel(renderer, `Bảo trì phòng ${roomC.code}`);
    expect(toggle.props.accessibilityState).toMatchObject({ disabled: true });
    await press(toggle);
    expect(underMaintenance(roomC.id)).toBe(false);
    expect(showMessage).toHaveBeenCalledWith('Không được phân quyền', expect.stringContaining('Vui lòng chọn phòng hoặc khu khác'));
  });

  it('lets a manager switch a room in any building', async () => {
    const renderer = await render(<ManageRoomsScreen {...props} />, 'user-manager');
    await press(byLabel(renderer, `Bảo trì phòng ${roomC.code}`));
    expect(underMaintenance(roomC.id)).toBe(true);
  });
});
