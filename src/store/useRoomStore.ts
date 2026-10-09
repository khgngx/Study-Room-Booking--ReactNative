import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { SEED_ROOMS } from '../data/seed';
import type { Room } from '../domain/types';
import { createId, jsonStorage } from './storage';

export type RoomDraft = Omit<Room, 'id'>;

interface RoomState {
  rooms: Room[];
  addRoom: (draft: RoomDraft) => Room;
  updateRoom: (id: string, changes: Partial<RoomDraft>) => void;
  deleteRoom: (id: string) => void;
  setMaintenance: (id: string, underMaintenance: boolean, note?: string) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      rooms: SEED_ROOMS,
      addRoom: (draft) => {
        const room: Room = { ...draft, id: createId('room') };
        set((state) => ({ rooms: [...state.rooms, room] }));
        return room;
      },
      updateRoom: (id, changes) =>
        set((state) => ({ rooms: state.rooms.map((room) => (room.id === id ? { ...room, ...changes } : room)) })),
      deleteRoom: (id) => set((state) => ({ rooms: state.rooms.filter((room) => room.id !== id) })),
      setMaintenance: (id, underMaintenance, note) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id ? { ...room, underMaintenance, maintenanceNote: underMaintenance ? note : undefined } : room,
          ),
        })),
    }),
    { name: 'vku-rooms', storage: jsonStorage },
  ),
);
