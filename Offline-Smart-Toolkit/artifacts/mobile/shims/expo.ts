/**
 * expo (framework) shim — stubs the few APIs used from the root 'expo' package.
 * Metro redirects `expo` imports here via resolveRequest in metro.config.js.
 */
import { DevSettings } from 'react-native';

export async function reloadAppAsync(): Promise<void> {
  if (__DEV__ && DevSettings?.reload) {
    DevSettings.reload();
  }
}

export async function registerRootComponent(_component: any): Promise<void> {
  // no-op — AppRegistry.registerComponent is called in index.js
}

export const ExpoRoot = undefined;
