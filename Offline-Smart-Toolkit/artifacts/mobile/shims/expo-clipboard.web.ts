/**
 * expo-clipboard web shim — uses navigator.clipboard API.
 * @react-native-clipboard/clipboard is native-only; use the browser API instead.
 */

export async function getStringAsync(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

export async function setStringAsync(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch { /* ignore */ }
}

export function getString(): string {
  return '';
}

export function setString(text: string): void {
  navigator.clipboard.writeText(text).catch(() => {});
}

export async function hasStringAsync(): Promise<boolean> {
  try {
    const text = await navigator.clipboard.readText();
    return text.length > 0;
  } catch {
    return false;
  }
}

export function useClipboard(): [string, (text: string) => void] {
  const set = (text: string) => setString(text);
  return ['', set];
}
