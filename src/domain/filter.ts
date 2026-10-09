import type { Building, Equipment, Room } from './types';

export interface RoomFilter {
  query: string;
  buildings: Building[];
  minCapacity: number | null;
  equipment: Equipment[];
}

export const EMPTY_FILTER: RoomFilter = { query: '', buildings: [], minCapacity: null, equipment: [] };

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

/** Buildings are OR-ed, equipment is AND-ed, and the query matches name or "toa X". */
export function filterRooms(rooms: readonly Room[], filter: RoomFilter): Room[] {
  const query = normalize(filter.query);
  return rooms.filter((room) => {
    if (filter.buildings.length > 0 && !filter.buildings.includes(room.building)) return false;
    if (filter.minCapacity !== null && room.capacity < filter.minCapacity) return false;
    if (!filter.equipment.every((item) => room.equipment.includes(item))) return false;
    if (query.length === 0) return true;
    return normalize(`${room.name} toa ${room.building} tang ${room.floor}`).includes(query);
  });
}
