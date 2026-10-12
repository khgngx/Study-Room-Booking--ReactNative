# VKU Study Room Booking

Mini-Project 2, Cross-platform Programming (VKU). A React Native + Expo app for booking group-study rooms and computer labs on the VKU campus.

## Features

| Area | What works |
|---|---|
| Room discovery | `FlatList` of memoized room cards with a per-room day timeline (7h–21h, live "now" marker), 7-day date strip, "free now" toggle, room-type chips, search, and a filter sheet for building, capacity and equipment |
| Booking | 7-day date strip, discrete time slots, multi-slot selection (up to 4 bookings a day by default), custom `HH:mm` times where extra minutes roll into the hour, conflict engine that disables taken slots, QR booking pass |
| State | Zustand stores persisted with AsyncStorage (`useBookingStore` holds the session and reservations) |
| Notifications | Local `expo-notifications` reminder 15 minutes before check-in, cancelled with the booking |
| Lab staff | Shift list scoped to assigned buildings, QR scan or manual code check-in, no-show marking, maintenance toggle |
| Facility manager | Room CRUD, account roles, usage dashboard, usage policy |
| Presence | Status pill at the top right: Trực tiếp (full use), Đang bận (no notifications), Không hoạt động (read-only) |

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

Demo accounts (password `123456`):

| Role | Email |
|---|---|
| Student | `sv@vku.udn.vn` |
| Lab staff (buildings A, B) | `staff@vku.udn.vn` |
| Facility manager | `manager@vku.udn.vn` |

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm test` | Run the Jest suite |
| `npm run typecheck` | Run TypeScript with no emit |

## Architecture

```
src/
  domain/       Pure TypeScript: slots, conflict engine, room status, filters, check-in rules, permissions, stats
  store/        Zustand stores (bookings + session, rooms, accounts, policy), persisted through one storage adapter
  services/     expo-notifications wrapper
  navigation/   React Navigation; three tabs (Phòng, Lịch của tôi, Cá nhân) wired per role
  screens/      auth / student / staff / manager / shared
  components/   Design-system components
  theme/        Design tokens
  data/         Seed rooms, accounts and bookings
```

The conflict engine (`src/domain/conflict.ts`) is a pure function. The UI uses it to disable slots, and `createBooking` re-runs it before writing, so a stale screen cannot double-book.

Room status is derived from bookings and the clock; only the maintenance flag is stored.

Presence is enforced in two places: `useBookingStore` rejects actions from an inactive user, and screens disable their controls. Going busy or inactive cancels pending check-in reminders; going back online reschedules them.

## Design

The UI follows `DESIGN.md`, an analysis of Airbnb's design system from [getdesign.md](https://getdesign.md/airbnb/design-md). Tokens live in `src/theme/tokens.ts`. Airbnb Cereal is proprietary, so the app uses Inter, the substitute `DESIGN.md` recommends. This project is not affiliated with Airbnb.

## Known limitations

- There is no backend. All data is stored on the device, so a booking made on one phone is not visible on another. To demo check-in, book as the student, sign out, and sign in as lab staff on the same device.
- Accounts are mock data with plain-text demo passwords. Do not reuse this auth for anything real.
- Room photos are placeholders from picsum.photos, not real campus photos.
