/**
 * expo-splash-screen web shim — pure no-op.
 * The native shim imports react-native-splash-screen which doesn't exist on web.
 * Webpack picks this .web.ts variant over the .ts variant on web builds.
 */

export async function preventAutoHideAsync(): Promise<boolean> {
  return true;
}

export async function hideAsync(): Promise<boolean> {
  return true;
}

export function setOptions(_options: Record<string, unknown>): void {
  // no-op on web
}
