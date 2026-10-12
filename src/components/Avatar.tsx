import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { resolveImage } from '../services/images';
import { themed } from '../theme/themed';
import { colors, fonts, radius } from '../theme/tokens';
import { AppText } from './AppText';
import { initials } from './labels';

interface AvatarProps {
  name: string;
  /** Stored avatar value; the initials show when it is missing. */
  imageUrl?: string;
  size?: number;
}

/** A round account picture: the photo the user picked, or their initials on Rausch. */
export function Avatar({ name, imageUrl, size = 40 }: AvatarProps) {
  const source = resolveImage(imageUrl);
  return (
    <View style={[styles.avatar, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <AppText color="onPrimary" style={{ fontFamily: fonts.bold, fontSize: size * 0.36, lineHeight: size * 0.46 }}>
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = themed(() => ({
  avatar: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, overflow: 'hidden', backgroundColor: colors.primary },
}));
