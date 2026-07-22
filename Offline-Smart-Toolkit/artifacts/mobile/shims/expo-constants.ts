/**
 * expo-constants shim — provides the subset used in this project.
 */
import { Platform } from 'react-native';

const Constants = {
  expoConfig: null,
  manifest: null,
  appOwnership: null,
  executionEnvironment: 'storeClient',
  platform: {
    android: Platform.OS === 'android' ? {} : undefined,
    ios:     Platform.OS === 'ios'     ? {} : undefined,
  },
  isDevice: true,
  deviceName: undefined as string | undefined,
  systemFonts: [] as string[],
  statusBarHeight: 24,
  sessionId: `session-${Date.now()}`,
};

export default Constants;
