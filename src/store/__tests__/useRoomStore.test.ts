import { SEED_USERS } from '../../data/seed';
import { useRoomStore } from '../useRoomStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const find = (id: string) => {
  const user = SEED_USERS.find((candidate) => candidate.id === id);
  if (!user) throw new Error(`Missing seed user ${id}`);
  return user;
};
// Seed staff cover buildings A and B.
const staff = find('user-staff');
const manager = find('user-manager');
const student = find('user-student');
const initial = useRoomStore.getState().rooms;
const roomIn = (building: string) => {
  const room = initial.find((candidate) => candidate.building === building && !candidate.underMaintenance);
  if (!room) throw new Error(`No seed room in building ${building}`);
  return room;
};
const current = (id: string) => useRoomStore.getState().rooms.find((room) => room.id === id);
const { setMaintenance } = useRoomStore.getState();

beforeEach(() => useRoomStore.setState({ rooms: initial }));

describe('setMaintenance', () => {
  it('lets staff switch a room in an assigned building, keeping the note only while it is on', () => {
    const room = roomIn('A');
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: staff, note: 'Đang sửa máy chiếu' })).toEqual({ ok: true });
    expect(current(room.id)).toMatchObject({ underMaintenance: true, maintenanceNote: 'Đang sửa máy chiếu' });
    expect(setMaintenance({ id: room.id, underMaintenance: false, actor: staff, note: 'Đang sửa máy chiếu' })).toEqual({ ok: true });
    expect(current(room.id)).toMatchObject({ underMaintenance: false, maintenanceNote: undefined });
  });

  it('refuses staff outside their buildings and leaves the room untouched', () => {
    const room = roomIn('C');
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: staff })).toEqual({ ok: false, reason: 'out_of_area' });
    expect(current(room.id)?.underMaintenance).toBe(false);
  });

  it('follows a change to the assigned buildings', () => {
    const room = roomIn('C');
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: { ...staff, assignedBuildings: ['C'] } })).toEqual({ ok: true });
    expect(setMaintenance({ id: roomIn('A').id, underMaintenance: true, actor: { ...staff, assignedBuildings: ['C'] } })).toEqual({ ok: false, reason: 'out_of_area' });
  });

  it('lets a manager switch any room, but nobody who is inactive or a student', () => {
    const room = roomIn('V');
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: student })).toEqual({ ok: false, reason: 'forbidden' });
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: { ...manager, presence: 'inactive' } })).toEqual({ ok: false, reason: 'inactive' });
    expect(setMaintenance({ id: room.id, underMaintenance: true, actor: manager })).toEqual({ ok: true });
    expect(current(room.id)?.underMaintenance).toBe(true);
  });

  it('reports a room that no longer exists', () => {
    expect(setMaintenance({ id: 'gone', underMaintenance: true, actor: manager })).toEqual({ ok: false, reason: 'room_not_found' });
  });
});
