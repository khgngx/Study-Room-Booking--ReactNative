import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { ROLE_LABEL } from '../../components/labels';
import { Screen, screenStyles } from '../../components/Layout';
import { BUILDINGS, type UserRole } from '../../domain/types';
import { useCanAct } from '../../hooks/usePresence';
import { useAccountStore } from '../../store/useAccountStore';
import { useBookingStore } from '../../store/useBookingStore';
import { colors, spacing } from '../../theme/tokens';

const ROLES: UserRole[] = ['student', 'lab_staff', 'facility_manager'];

export function UsersScreen() {
  const users = useAccountStore((state) => state.users);
  const setRole = useAccountStore((state) => state.setRole);
  const setAssignedBuildings = useAccountStore((state) => state.setAssignedBuildings);
  const ownId = useBookingStore((state) => state.session?.userId);
  const canAct = useCanAct();

  return (
    <Screen nested title="Tài khoản" subtitle={`${users.length} tài khoản`}>
      <FlatList
        data={users}
        keyExtractor={(user) => user.id}
        contentContainerStyle={screenStyles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: user }) => {
          const isSelf = user.id === ownId;
          const assigned = user.assignedBuildings ?? [];
          return (
            <View style={styles.row}>
              <View style={styles.identity}>
                <Avatar name={user.name} imageUrl={user.avatarUrl} size={44} />
                <View style={styles.identityText}>
                  <AppText variant="titleMd" numberOfLines={1}>
                    {user.name}
                    {isSelf ? ' (bạn)' : ''}
                  </AppText>
                  <AppText variant="bodySm" color="muted" numberOfLines={1}>
                    {user.email}
                    {user.studentId ? ` · ${user.studentId}` : ''}
                  </AppText>
                </View>
              </View>
              <View style={styles.chips}>
                {ROLES.map((role) => (
                  // Changing your own role would lock you out of this screen.
                  <Chip key={role} label={ROLE_LABEL[role]} selected={user.role === role} disabled={isSelf || !canAct} onPress={() => setRole(user.id, role)} />
                ))}
              </View>
              {user.role === 'lab_staff' ? (
                <>
                  <AppText variant="caption" color="muted">
                    Khu vực phụ trách
                  </AppText>
                  <View style={styles.chips}>
                    {BUILDINGS.map((building) => (
                      <Chip
                        key={building}
                        label={`Toà ${building}`}
                        selected={assigned.includes(building)}
                        disabled={!canAct}
                        onPress={() =>
                          setAssignedBuildings(
                            user.id,
                            assigned.includes(building) ? assigned.filter((item) => item !== building) : [...assigned, building],
                          )
                        }
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: colors.hairlineSoft },
  row: { gap: spacing.sm, paddingVertical: spacing.base },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: spacing.xxs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
