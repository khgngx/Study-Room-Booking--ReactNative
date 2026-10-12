export type AuthStackParams = { Login: undefined; Register: undefined };
export type ExploreStackParams = { RoomList: undefined; RoomDetail: { roomId: string; dateKey?: string } };
export type ShiftStackParams = { ShiftBookings: undefined; Scan: undefined };
export type RoomAdminStackParams = { ManageRooms: undefined; RoomForm: { roomId?: string } };
/** "Cá nhân" tab. The management screens are only linked for facility managers. */
export type ProfileStackParams = { Profile: undefined; Dashboard: undefined; Users: undefined; Policy: undefined };
