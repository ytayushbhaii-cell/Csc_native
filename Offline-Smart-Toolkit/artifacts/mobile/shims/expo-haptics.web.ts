/**
 * expo-haptics web shim — pure no-op.
 * react-native-haptic-feedback is Android/iOS only; vibration not supported in web previews.
 */

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

export async function impactAsync(_style?: string): Promise<void> {
  // no-op on web
}

export async function notificationAsync(_type?: string): Promise<void> {
  // no-op on web
}

export async function selectionAsync(): Promise<void> {
  // no-op on web
}
