/**
 * expo-haptics shim — wraps react-native-haptic-feedback.
 */
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

export const ImpactFeedbackStyle = {
  Light:  'impactLight',
  Medium: 'impactMedium',
  Heavy:  'impactHeavy',
};

export const NotificationFeedbackType = {
  Success: 'notificationSuccess',
  Warning: 'notificationWarning',
  Error:   'notificationError',
};

export async function impactAsync(style?: string): Promise<void> {
  const type = style === 'heavy' ? 'impactHeavy'
    : style === 'light'  ? 'impactLight'
    : 'impactMedium';
  ReactNativeHapticFeedback.trigger(type, options);
}

export async function notificationAsync(type?: string): Promise<void> {
  const t = type === 'success' ? 'notificationSuccess'
    : type === 'error'   ? 'notificationError'
    : 'notificationWarning';
  ReactNativeHapticFeedback.trigger(t, options);
}

export async function selectionAsync(): Promise<void> {
  ReactNativeHapticFeedback.trigger('selection', options);
}
