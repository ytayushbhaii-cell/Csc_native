/**
 * expo-clipboard shim — wraps @react-native-clipboard/clipboard.
 */
import Clipboard from '@react-native-clipboard/clipboard';

export async function getStringAsync(): Promise<string> {
  return Clipboard.getString();
}

export async function setStringAsync(text: string): Promise<void> {
  Clipboard.setString(text);
}

export function getString(): string {
  // sync variant — not available in RN clipboard; return empty
  return '';
}

export function setString(text: string): void {
  Clipboard.setString(text);
}

export async function hasStringAsync(): Promise<boolean> {
  return Clipboard.hasString();
}

export function useClipboard(): [string, (text: string) => void] {
  const set = (text: string) => Clipboard.setString(text);
  return ['', set];
}
