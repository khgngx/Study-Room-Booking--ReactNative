import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../theme/motion';

const DURATION = 420;
const STAGGER = 90;
const RISE = 18;

/**
 * Fade-and-rise entrance for a screen's blocks, played once on mount.
 * `style(index)` gives each block its place in the stagger.
 */
export function useEntrance(count: number) {
  const [values] = useState(() => Array.from({ length: count }, () => new Animated.Value(0)));
  useEffect(() => {
    const animation = Animated.stagger(
      STAGGER,
      values.map((value) => Animated.timing(value, { toValue: 1, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER })),
    );
    animation.start();
    return () => animation.stop();
  }, [values]);

  return (index: number) => ({
    opacity: values[index],
    transform: [{ translateY: values[index].interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) }],
  });
}
