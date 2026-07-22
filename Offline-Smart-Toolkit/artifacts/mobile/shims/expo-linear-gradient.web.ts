/**
 * expo-linear-gradient web shim — CSS-based LinearGradient.
 * Avoids react-native-linear-gradient entirely (it has broken Windows/web build files).
 * Webpack picks this .web.ts variant over expo-linear-gradient.ts on web builds.
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface LinearGradientPoint {
  x: number;
  y: number;
}

interface LinearGradientProps {
  colors: string[];
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
  locations?: number[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  [key: string]: unknown;
}

function toAngle(start?: LinearGradientPoint, end?: LinearGradientPoint): number {
  if (!start || !end) return 180;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
}

export function LinearGradient({
  colors,
  start,
  end,
  locations,
  style,
  children,
  ...rest
}: LinearGradientProps) {
  const angle = toAngle(start, end);
  let gradientArg: string;

  if (locations && locations.length === colors.length) {
    gradientArg = colors.map((c, i) => `${c} ${Math.round(locations[i] * 100)}%`).join(', ');
  } else {
    gradientArg = colors.join(', ');
  }

  const cssStyle = {
    backgroundImage: `linear-gradient(${angle}deg, ${gradientArg})`,
  };

  return (
    <View style={[style as ViewStyle, cssStyle as unknown as ViewStyle]} {...(rest as any)}>
      {children}
    </View>
  );
}

export default LinearGradient;
