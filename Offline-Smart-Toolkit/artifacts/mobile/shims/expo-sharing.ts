/**
 * expo-sharing — native shim using react-native-share.
 *
 * On web the original no-op behaviour is preserved (Web Share API / download
 * fallback is handled inside each screen). On native, delegates to the
 * react-native-share library that is already included in this project.
 */
import { Platform } from 'react-native';

let _Share: any = null;
function getShare() {
  if (_Share) return _Share;
  try { _Share = require('react-native-share').default; } catch { _Share = null; }
  return _Share;
}

export async function isAvailableAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return getShare() !== null;
}

export async function shareAsync(
  url: string,
  options: { mimeType?: string; dialogTitle?: string; UTI?: string } = {},
): Promise<void> {
  if (Platform.OS === 'web') return; // handled by screen

  const Share = getShare();
  if (!Share) {
    console.warn('[expo-sharing shim] react-native-share not available.');
    return;
  }

  await Share.open({
    url,
    type:    options.mimeType ?? 'application/octet-stream',
    title:   options.dialogTitle,
    failOnCancel: false,
  });
}

export default { isAvailableAsync, shareAsync };
