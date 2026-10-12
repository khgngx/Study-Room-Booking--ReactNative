import { Image } from 'expo-image';
import { useEffect, useId, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors, type ColorToken } from '../theme/tokens';
import { USE_NATIVE_DRIVER } from '../theme/motion';

const LOGO = require('../../assets/vku-logo.png');
const LOGO_LIGHT = require('../../assets/vku-logo-light.png');
const LOGO_SHADE = require('../../assets/vku-logo-shade.png');
const LOGO_ASPECT = 247 / 480;
/** Logo width as a share of the ball's diameter. */
const LOGO_SCALE = 0.58;
/** How much longer a trip takes when the system asks for reduced motion. */
const CALM_SLOWDOWN = 2;

interface BallSpec {
  color: ColorToken;
  size: number;
  /** Horizontal centre, as a share of the screen width. */
  x: number;
  /** Seconds for one trip from below the screen to above it. */
  seconds: number;
  /** Where in that trip the ball starts, so the screen opens already full. */
  phase: number;
  /** Sideways drift in points. */
  sway: number;
  /** Pale balls carry the logo in its own colours; coloured ones in raised white. */
  logo: 'colour' | 'white';
}

const BALLS: BallSpec[] = [
  { color: 'primary', size: 190, x: 0.16, seconds: 26, phase: 0.62, sway: 14, logo: 'white' },
  { color: 'success', size: 120, x: 0.86, seconds: 19, phase: 0.78, sway: -18, logo: 'white' },
  { color: 'canvas', size: 150, x: 0.74, seconds: 23, phase: 0.3, sway: 16, logo: 'colour' },
  { color: 'accent', size: 84, x: 0.36, seconds: 16, phase: 0.1, sway: -12, logo: 'white' },
  { color: 'primaryActive', size: 230, x: 0.92, seconds: 31, phase: 0.02, sway: 10, logo: 'white' },
  { color: 'borderStrong', size: 104, x: 0.08, seconds: 21, phase: 0.36, sway: -14, logo: 'colour' },
  { color: 'success', size: 64, x: 0.56, seconds: 14, phase: 0.9, sway: 10, logo: 'white' },
];

/** Decorative backdrop: glossy balls embossed with the VKU logo, drifting up the screen forever. */
export function FloatingBalls() {
  const { width, height } = useWindowDimensions();
  // Unknown until the system answers, so a trip is never started at one pace and restarted at another.
  const [calm, setCalm] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => mounted && setCalm(reduced));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {BALLS.map((ball, index) => (
        <FloatingBall key={index} ball={ball} screenWidth={width} screenHeight={height} calm={calm} />
      ))}
    </View>
  );
}

interface FloatingBallProps {
  ball: BallSpec;
  screenWidth: number;
  screenHeight: number;
  /**
   * Reduce-motion. The rising balls are the point of this backdrop, so they keep rising, but at
   * half speed and without the sway and tilt. Null while the setting is still being read.
   */
  calm: boolean | null;
}

function FloatingBall({ ball, screenWidth, screenHeight, calm }: FloatingBallProps) {
  // Not `useAnimatedValue`: react-native-web does not export it.
  const [progress] = useState(() => new Animated.Value(ball.phase));

  useEffect(() => {
    if (calm === null) return;
    const travel = (from: number) =>
      Animated.timing(progress, {
        toValue: 1,
        duration: ball.seconds * (calm ? CALM_SLOWDOWN : 1) * 1000 * (1 - from),
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      });
    let loop: Animated.CompositeAnimation | undefined;
    // Finish the trip already under way, then repeat full trips from the bottom.
    const first = travel(ball.phase);
    first.start(({ finished }) => {
      if (!finished) return;
      progress.setValue(0);
      loop = Animated.loop(travel(0));
      loop.start();
    });
    return () => {
      first.stop();
      loop?.stop();
    };
  }, [progress, ball.phase, ball.seconds, calm]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [screenHeight, -ball.size] });
  const sway = calm ? 0 : ball.sway;
  const translateX = progress.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, sway, 0, -sway, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: calm ? ['0deg', '0deg', '0deg'] : ['-10deg', '8deg', '-10deg'] });

  return (
    <Animated.View
      style={[
        styles.ball,
        { left: screenWidth * ball.x - ball.size / 2, width: ball.size, height: ball.size, transform: [{ translateY }, { translateX }, { rotate }] },
      ]}
    >
      <Ball color={ball.color} size={ball.size} logo={ball.logo} />
    </Animated.View>
  );
}

/** A lit sphere with the logo pressed out of its surface. */
function Ball({ color, size, logo }: Pick<BallSpec, 'color' | 'size' | 'logo'>) {
  // Each instance owns its gradients: on web a shared id breaks once the first owner is hidden.
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const logoWidth = size * LOGO_SCALE;
  const logoHeight = logoWidth * LOGO_ASPECT;
  // Relief depth grows with the ball so small ones do not look smeared.
  const depth = Math.max(1, size / 90);
  const logoFrame = { width: logoWidth, height: logoHeight, left: (size - logoWidth) / 2, top: (size - logoHeight) / 2 };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Light falls from the upper left: a bright core there, the far edge in shadow. */}
          <RadialGradient id={`${id}shade`} cx="36%" cy="30%" r="78%">
            <Stop offset="0.45" stopColor={colors.ink} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.ink} stopOpacity={0.5} />
          </RadialGradient>
          <RadialGradient id={`${id}glow`} cx="34%" cy="28%" r="52%">
            <Stop offset="0" stopColor={colors.canvas} stopOpacity={0.55} />
            <Stop offset="1" stopColor={colors.canvas} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={colors[color]} />
        <Circle cx={50} cy={50} r={50} fill={`url(#${id}glow)`} />
        <Circle cx={50} cy={50} r={50} fill={`url(#${id}shade)`} />
      </Svg>

      {/* Emboss: a shadow cast down-right and a lit edge up-left, with the face on top. */}
      <Image source={LOGO_SHADE} contentFit="contain" style={[styles.logo, logoFrame, styles.reliefShade, { transform: [{ translateX: depth }, { translateY: depth * 1.4 }] }]} />
      <Image source={LOGO_LIGHT} contentFit="contain" style={[styles.logo, logoFrame, styles.reliefLight, { transform: [{ translateX: -depth * 0.7 }, { translateY: -depth }] }]} />
      <Image source={logo === 'colour' ? LOGO : LOGO_LIGHT} contentFit="contain" style={[styles.logo, logoFrame, logo === 'white' && styles.faceWhite]} />

      {/* The specular spot sits over the logo, so it reads as printed on the sphere rather than floating above it. */}
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`${id}spot`} cx="30%" cy="22%" r="26%">
            <Stop offset="0" stopColor={colors.canvas} stopOpacity={0.7} />
            <Stop offset="1" stopColor={colors.canvas} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={`url(#${id}spot)`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ball: { position: 'absolute', top: 0 },
  logo: { position: 'absolute' },
  reliefShade: { opacity: 0.38 },
  reliefLight: { opacity: 0.65 },
  faceWhite: { opacity: 0.92 },
});
