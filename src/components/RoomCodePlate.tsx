import { View } from 'react-native';

import { themed } from '../theme/themed';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface RoomCodePlateProps {
  code: string;
  size?: 'md' | 'lg';
}

/** The door code set like the sign outside the room, so it is the first thing matched on arrival. */
export function RoomCodePlate({ code, size = 'md' }: RoomCodePlateProps) {
  const large = size === 'lg';
  return (
    <View style={[styles.plate, large && styles.plateLarge]}>
      <AppText variant={large ? 'plateLg' : 'plate'} color="onDark" numberOfLines={1}>
        {code}
      </AppText>
    </View>
  );
}

const styles = themed(() => ({
  plate: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.ink,
  },
  plateLarge: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base, borderRadius: radius.sm },
}));
