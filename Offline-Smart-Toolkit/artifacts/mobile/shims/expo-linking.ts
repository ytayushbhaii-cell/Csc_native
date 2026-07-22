/**
 * expo-linking shim — delegates to React Native's built-in Linking.
 */
import { Linking } from 'react-native';

export async function openURL(url: string): Promise<void> {
  await Linking.openURL(url);
}

export async function canOpenURL(url: string): Promise<boolean> {
  return Linking.canOpenURL(url);
}

export async function getInitialURL(): Promise<string | null> {
  return Linking.getInitialURL();
}

export function addEventListener(
  type: string,
  handler: (event: { url: string }) => void,
) {
  return Linking.addEventListener(type as any, handler as any);
}

export function removeEventListener(
  type: string,
  handler: (event: { url: string }) => void,
) {
  // deprecated in newer RN — use subscription.remove() instead
}

export function createURL(path: string, _options?: Record<string, unknown>): string {
  return `cscsmartoolkit://${path}`;
}

export function parse(url: string) {
  try {
    const u = new URL(url);
    return {
      scheme: u.protocol.replace(':', ''),
      hostname: u.hostname,
      path: u.pathname,
      queryParams: Object.fromEntries(u.searchParams.entries()),
    };
  } catch {
    return { scheme: null, hostname: null, path: url, queryParams: {} };
  }
}

export default { openURL, canOpenURL, getInitialURL, addEventListener, createURL, parse };
