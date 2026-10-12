import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { PresencePill } from '../components/PresencePill';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/manager/DashboardScreen';
import { PolicyScreen } from '../screens/manager/PolicyScreen';
import { RoomFormScreen } from '../screens/manager/RoomFormScreen';
import { UsersScreen } from '../screens/manager/UsersScreen';
import { ManageRoomsScreen } from '../screens/shared/ManageRoomsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { ScanScreen } from '../screens/staff/ScanScreen';
import { ShiftBookingsScreen } from '../screens/staff/ShiftBookingsScreen';
import { MyBookingsScreen } from '../screens/student/MyBookingsScreen';
import { RoomDetailScreen } from '../screens/student/RoomDetailScreen';
import { RoomListScreen } from '../screens/student/RoomListScreen';
import { can } from '../domain/permissions';
import { useCurrentUser } from '../store/useBookingStore';
import { colors, fonts } from '../theme/tokens';
import type { AuthStackParams, ExploreStackParams, ProfileStackParams, RoomAdminStackParams, ShiftStackParams } from './types';

const stackOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerTintColor: colors.ink,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
  headerStyle: { backgroundColor: colors.canvas },
  contentStyle: { backgroundColor: colors.canvas },
  // Pushed screens keep the status control in the same top-right spot as tab roots.
  headerRight: () => <PresencePill />,
};

const tabOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10 },
  tabBarStyle: { backgroundColor: colors.canvas, borderTopColor: colors.hairline },
};

type IconName = keyof typeof Ionicons.glyphMap;
const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const ExploreStack = createNativeStackNavigator<ExploreStackParams>();
const ShiftStack = createNativeStackNavigator<ShiftStackParams>();
const RoomAdminStack = createNativeStackNavigator<RoomAdminStackParams>();
const ProfileStack = createNativeStackNavigator<ProfileStackParams>();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={stackOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />
    </AuthStack.Navigator>
  );
}

function ExploreNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={stackOptions}>
      <ExploreStack.Screen name="RoomList" component={RoomListScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: '' }} />
    </ExploreStack.Navigator>
  );
}

function ShiftNavigator() {
  return (
    <ShiftStack.Navigator screenOptions={stackOptions}>
      <ShiftStack.Screen name="ShiftBookings" component={ShiftBookingsScreen} options={{ headerShown: false }} />
      <ShiftStack.Screen name="Scan" component={ScanScreen} options={{ title: 'Xác thực check-in' }} />
    </ShiftStack.Navigator>
  );
}

function RoomAdminNavigator() {
  return (
    <RoomAdminStack.Navigator screenOptions={stackOptions}>
      <RoomAdminStack.Screen name="ManageRooms" component={ManageRoomsScreen} options={{ headerShown: false }} />
      <RoomAdminStack.Screen
        name="RoomForm"
        component={RoomFormScreen}
        options={({ route }) => ({ title: route.params.roomId ? 'Sửa phòng' : 'Thêm phòng' })}
      />
    </RoomAdminStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: '' }} />
      <ProfileStack.Screen name="Users" component={UsersScreen} options={{ title: '' }} />
      <ProfileStack.Screen name="Policy" component={PolicyScreen} options={{ title: 'Chính sách sử dụng' }} />
    </ProfileStack.Navigator>
  );
}

/**
 * Every role gets the same three tabs; what differs is the screen behind "Phòng" and "Lịch của tôi".
 * Students browse and book; staff and managers operate rooms and their check-in shift.
 */
function MainTabs({ operator }: { operator: boolean }) {
  return (
    <Tabs.Navigator screenOptions={tabOptions}>
      <Tabs.Screen
        name="Rooms"
        component={operator ? RoomAdminNavigator : ExploreNavigator}
        options={{
          title: 'Phòng',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="door" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Schedule"
        component={operator ? ShiftNavigator : MyBookingsScreen}
        options={{ title: 'Lịch của tôi', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen name="Me" component={ProfileNavigator} options={{ title: 'Cá nhân', tabBarIcon: tabIcon('person-outline') }} />
    </Tabs.Navigator>
  );
}

/** Signed-out users see auth; everyone else gets the three tabs, wired by role. */
export function RootNavigator() {
  const user = useCurrentUser();
  if (!user) return <AuthNavigator />;
  return <MainTabs operator={can(user.role, 'checkin.verify')} />;
}
