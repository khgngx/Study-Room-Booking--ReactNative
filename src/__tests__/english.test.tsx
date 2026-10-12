import type { ComponentProps, ReactElement } from 'react';
import { act, create, type ReactTestRenderer, type ReactTestRendererNode } from 'react-test-renderer';

import { SEED_ROOMS, SEED_USERS } from '../data/seed';
import { generateSlots } from '../domain/slots';
import { addDays, toDateKey } from '../domain/time';
import { setActiveLanguage } from '../i18n';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/manager/DashboardScreen';
import { PolicyScreen } from '../screens/manager/PolicyScreen';
import { RoomFormScreen } from '../screens/manager/RoomFormScreen';
import { UsersScreen } from '../screens/manager/UsersScreen';
import { ManageRoomsScreen } from '../screens/shared/ManageRoomsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { ShiftBookingsScreen } from '../screens/staff/ShiftBookingsScreen';
import { MyBookingsScreen } from '../screens/student/MyBookingsScreen';
import { RoomDetailScreen } from '../screens/student/RoomDetailScreen';
import { RoomListScreen } from '../screens/student/RoomListScreen';
import { useBookingStore } from '../store/useBookingStore';
import { usePolicyStore } from '../store/usePolicyStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('../services/dialog', () => ({ showMessage: jest.fn(), confirmDestructive: jest.fn() }));

const NOW = new Date(2026, 9, 12, 14, 15);
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// What people typed or what came with the data is shown as written, in any language.
const DATA = [
  ...SEED_ROOMS.flatMap((room) => [room.name, room.description ?? '', room.maintenanceNote ?? '']),
  ...SEED_USERS.flatMap((user) => [user.name, ...user.name.split(' ')]),
]
  .filter((text) => text.length > 0)
  .sort((a, b) => b.length - a.length);

function collectStrings(node: ReactTestRendererNode | ReactTestRendererNode[] | null, into: string[] = []): string[] {
  if (node === null) return into;
  if (typeof node === 'string') into.push(node);
  else if (Array.isArray(node)) node.forEach((child) => collectStrings(child, into));
  else {
    if (typeof node.props.placeholder === 'string') into.push(node.props.placeholder);
    collectStrings(node.children, into);
  }
  return into;
}

async function render(element: ReactElement, userId: string | null): Promise<{ shown: string[]; untranslated: string[] }> {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    useBookingStore.setState({ session: userId ? { userId } : null });
    renderer = create(element);
    jest.runOnlyPendingTimers();
  });
  if (!renderer) throw new Error('Screen did not render');
  const strings = collectStrings(renderer.toJSON());
  await act(async () => renderer?.unmount());
  return { shown: strings, untranslated: strings.filter((text) => VIETNAMESE.test(DATA.reduce((rest, known) => rest.split(known).join(''), text))) };
}

const navigation = { navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() };
const props = <Props,>(params: object) => ({ navigation, route: { key: 'test', name: 'test', params } }) as unknown as Props;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  setActiveLanguage('en');
  // One booking of each kind, so list rows, schedule blocks and the shift list all have content.
  const [slot] = generateSlots(usePolicyStore.getState().policy).slice(-1);
  const base = { roomId: 'room-1', startMinutes: slot.startMinutes, endMinutes: slot.endMinutes, createdAt: 0 };
  useBookingStore.setState({
    bookings: [
      { ...base, id: 'b1', code: 'AAA111', userId: 'user-student', dateKey: toDateKey(NOW), status: 'confirmed' },
      { ...base, id: 'b2', code: 'BBB222', userId: 'user-student-2', dateKey: toDateKey(addDays(NOW, 1)), status: 'confirmed' },
      { ...base, id: 'b3', code: 'CCC333', userId: 'user-student', dateKey: toDateKey(addDays(NOW, -1)), status: 'no_show' },
    ],
  });
});

afterEach(() => {
  setActiveLanguage('vi');
  jest.useRealTimers();
});

describe('English interface', () => {
  it.each<[string, () => ReactElement, string | null]>([
    ['sign in', () => <LoginScreen {...props<ComponentProps<typeof LoginScreen>>({})} />, null],
    ['sign up', () => <RegisterScreen />, null],
    ['room list', () => <RoomListScreen {...props<ComponentProps<typeof RoomListScreen>>({})} />, 'user-student'],
    ['room detail', () => <RoomDetailScreen {...props<ComponentProps<typeof RoomDetailScreen>>({ roomId: 'room-1' })} />, 'user-student'],
    ['room under maintenance', () => <RoomDetailScreen {...props<ComponentProps<typeof RoomDetailScreen>>({ roomId: 'room-15' })} />, 'user-student'],
    ['my bookings', () => <MyBookingsScreen />, 'user-student'],
    ['student profile', () => <ProfileScreen {...props<ComponentProps<typeof ProfileScreen>>({})} />, 'user-student'],
    ['staff shift', () => <ShiftBookingsScreen {...props<ComponentProps<typeof ShiftBookingsScreen>>({})} />, 'user-staff'],
    ['room management', () => <ManageRoomsScreen {...props<ComponentProps<typeof ManageRoomsScreen>>({})} />, 'user-staff'],
    ['manager profile', () => <ProfileScreen {...props<ComponentProps<typeof ProfileScreen>>({})} />, 'user-manager'],
    ['dashboard', () => <DashboardScreen />, 'user-manager'],
    ['policy', () => <PolicyScreen />, 'user-manager'],
    ['accounts', () => <UsersScreen />, 'user-manager'],
    ['new room form', () => <RoomFormScreen {...props<ComponentProps<typeof RoomFormScreen>>({})} />, 'user-manager'],
    ['edit room form', () => <RoomFormScreen {...props<ComponentProps<typeof RoomFormScreen>>({ roomId: 'room-15' })} />, 'user-manager'],
  ])('shows no Vietnamese interface text on %s', async (_name, screen, userId) => {
    const { shown, untranslated } = await render(screen(), userId);
    // Guards against the check passing only because the screen rendered nothing.
    expect(shown.length).toBeGreaterThan(5);
    expect(untranslated).toEqual([]);
  });
});
