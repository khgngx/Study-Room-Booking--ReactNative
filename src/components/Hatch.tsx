import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { colors } from '../theme/tokens';

const STRIPE_GAP = 6;

/** Diagonal stripes filling the parent: marks time that is closed rather than taken. */
export function Hatch() {
  // Each instance owns its pattern: on web a shared id breaks once the first owner is hidden.
  const patternId = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={patternId} width={STRIPE_GAP} height={STRIPE_GAP} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1={0} y1={0} x2={0} y2={STRIPE_GAP} stroke={colors.borderStrong} strokeWidth={2} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
}
