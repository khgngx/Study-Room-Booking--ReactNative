import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';

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
import { useCurrentUser } from '../store/useBookingStore';
import { colors, fonts } from '../theme/tokens';
import type { AuthStackParams, DashboardStackParams, ExploreStackParams, RoomAdminStackParams, ShiftStackParams } from './types';

const stackOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerTintColor: colors.ink,
  headerBackButtonDisplayMode: 'minimal',
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
  headerStyle: { backgroundColor: colors.canvas },
  contentStyle: { backgroundColor: colors.canvas },
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
const DashboardStack = createNativeStackNavigator<DashboardStackParams>();
const StudentTabs = createBottomTabNavigator();
const StaffTabs = createBottomTabNavigator();
const ManagerTabs = createBottomTabNavigator();

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

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={stackOptions}>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="Policy" component={PolicyScreen} options={{ title: 'Chính sách sử dụng' }} />
    </DashboardStack.Navigator>
  );
}

function StudentNavigator() {
  return (
    <StudentTabs.Navigator screenOptions={tabOptions}>
      <StudentTabs.Screen name="Explore" component={ExploreNavigator} options={{ title: 'Khám phá', tabBarIcon: tabIcon('search') }} />
      <StudentTabs.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'Đặt chỗ', tabBarIcon: tabIcon('calendar-outline') }} />
      <StudentTabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline') }} />
    </StudentTabs.Navigator>
  );
}

function LabStaffNavigator() {
  return (
    <StaffTabs.Navigator screenOptions={tabOptions}>
      <StaffTabs.Screen name="Shift" component={ShiftNavigator} options={{ title: 'Ca trực', tabBarIcon: tabIcon('clipboard-outline') }} />
      <StaffTabs.Screen name="Rooms" component={RoomAdminNavigator} options={{ title: 'Phòng', tabBarIcon: tabIcon('business-outline') }} />
      <StaffTabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline') }} />
    </StaffTabs.Navigator>
  );
}

function FacilityManagerNavigator() {
  return (
    <ManagerTabs.Navigator screenOptions={tabOptions}>
      <ManagerTabs.Screen name="Overview" component={DashboardNavigator} options={{ title: 'Tổng quan', tabBarIcon: tabIcon('stats-chart-outline') }} />
      <ManagerTabs.Screen name="Rooms" component={RoomAdminNavigator} options={{ title: 'Phòng', tabBarIcon: tabIcon('business-outline') }} />
      <ManagerTabs.Screen name="Shift" component={ShiftNavigator} options={{ title: 'Check-in', tabBarIcon: tabIcon('clipboard-outline') }} />
      <ManagerTabs.Screen name="Users" component={UsersScreen} options={{ title: 'Tài khoản', tabBarIcon: tabIcon('people-outline') }} />
      <ManagerTabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ sơ', tabBarIcon: tabIcon('person-circle-outline') }} />
    </ManagerTabs.Navigator>
  );
}

/** Picks the navigator tree from the signed-in user's role. */
export function RootNavigator() {
  const user = useCurrentUser();
  if (!user) return <AuthNavigator />;
  switch (user.role) {
    case 'student':
      return <StudentNavigator />;
    case 'lab_staff':
      return <LabStaffNavigator />;
    case 'facility_manager':
      return <FacilityManagerNavigator />;
  }
}
