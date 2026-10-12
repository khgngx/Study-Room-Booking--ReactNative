import type { Building, Equipment, Room, RoomType } from './types';

export interface RoomFilter {
  query: string;
  type: RoomType | null;
  buildings: Building[];
  minCapacity: number | null;
  equipment: Equipment[];
}

export const EMPTY_FILTER: RoomFilter = { query: '', type: null, buildings: [], minCapacity: null, equipment: [] };

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

/** Buildings are OR-ed, equipment is AND-ed, and the query matches code, name or "toa X". */
export function filterRooms(rooms: readonly Room[], filter: RoomFilter): Room[] {
  const query = normalize(filter.query);
  return rooms.filter((room) => {
    if (filter.type !== null && room.type !== filter.type) return false;
    if (filter.buildings.length > 0 && !filter.buildings.includes(room.building)) return false;
    if (filter.minCapacity !== null && room.capacity < filter.minCapacity) return false;
    if (!filter.equipment.every((item) => room.equipment.includes(item))) return false;
    if (query.length === 0) return true;
    return normalize(`${room.code} ${room.name} toa ${room.building} tang ${room.floor}`).includes(query);
  });
}

/** How many of the sheet filters (building, capacity, equipment) are set. */
export function countAdvancedFilters(filter: RoomFilter): number {
  return filter.buildings.length + filter.equipment.length + (filter.minCapacity === null ? 0 : 1);
}
