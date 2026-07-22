/**
 * expo-router compatibility shim for React Native CLI migration.
 *
 * Wraps @react-navigation/native to provide the same API surface that
 * existing screen files use (useRouter, usePathname, Redirect, Stack, Link).
 * Metro redirects `expo-router` imports here via resolveRequest in metro.config.js.
 */
import React, { useEffect, useRef, ComponentType } from 'react';
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from '@react-navigation/native';
import { ROUTE_TO_SCREEN, SCREEN_TO_ROUTE } from '@/navigation/routes';

// ─── Router hook ─────────────────────────────────────────────────────────────

export interface Router {
  push: (href: string, params?: Record<string, unknown>) => void;
  replace: (href: string, params?: Record<string, unknown>) => void;
  back: () => void;
  canGoBack: () => boolean;
  navigate: (href: string, params?: Record<string, unknown>) => void;
}

export function useRouter(): Router {
  const navigation = useNavigation<NavigationProp<any>>();

  const resolveScreen = (path: string) => {
    // Handle paths with query-style params like '/screen?foo=bar'
    const [cleanPath] = path.split('?');
    return ROUTE_TO_SCREEN[cleanPath] ?? ROUTE_TO_SCREEN[cleanPath.replace(/\/$/, '')] ?? null;
  };

  return {
    push(href: string, params?: Record<string, unknown>) {
      const screen = resolveScreen(href);
      if (screen) {
        (navigation as any).navigate(screen, params);
      } else {
        console.warn(`[expo-router shim] Unknown route: ${href}`);
      }
    },
    replace(href: string, params?: Record<string, unknown>) {
      const screen = resolveScreen(href);
      if (screen) {
        navigation.reset({ index: 0, routes: [{ name: screen, params }] });
      } else {
        console.warn(`[expo-router shim] Unknown route for replace: ${href}`);
      }
    },
    navigate(href: string, params?: Record<string, unknown>) {
      const screen = resolveScreen(href);
      if (screen) {
        (navigation as any).navigate(screen, params);
      }
    },
    back() {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    canGoBack() {
      return navigation.canGoBack();
    },
  };
}

// ─── Pathname hook ────────────────────────────────────────────────────────────

export function usePathname(): string {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const route = useRoute();
    return SCREEN_TO_ROUTE[route.name] ?? `/${route.name.toLowerCase()}`;
  } catch {
    // useRoute throws outside a navigator context — return root path
    return '/dashboard';
  }
}

// ─── Redirect component ───────────────────────────────────────────────────────

export function Redirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Link component ───────────────────────────────────────────────────────────

import { TouchableOpacity, Text } from 'react-native';

interface LinkProps {
  href: string;
  children?: React.ReactNode;
  style?: any;
  [key: string]: any;
}

export function Link({ href, children, style, ...rest }: LinkProps) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(href)} style={style} {...rest}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  );
}

// ─── useFocusEffect ───────────────────────────────────────────────────────────
// Runs a callback whenever the screen comes into focus.

import { useFocusEffect as rnUseFocusEffect } from '@react-navigation/native';

export function useFocusEffect(callback: () => (() => void) | void): void {
  rnUseFocusEffect(
    React.useCallback(() => {
      return callback() ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
}

// ─── Stack (no-op) ────────────────────────────────────────────────────────────
// The actual navigator is in AppNavigator.tsx; these are no-ops for layout files.

const StackScreenNoOp: ComponentType<any> = () => null;

interface StackProps {
  children?: React.ReactNode;
  screenOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

export const Stack = Object.assign(
  ({ children }: StackProps) => <>{children}</>,
  { Screen: StackScreenNoOp },
);

// ─── Tabs (no-op) ────────────────────────────────────────────────────────────

export const Tabs = Object.assign(
  ({ children }: StackProps) => <>{children}</>,
  { Screen: StackScreenNoOp },
);

// ─── useLocalSearchParams ─────────────────────────────────────────────────────

export function useLocalSearchParams<T = Record<string, string>>(): T {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const route = useRoute();
    return (route.params ?? {}) as T;
  } catch {
    return {} as T;
  }
}

export const useSearchParams = useLocalSearchParams;
export const useGlobalSearchParams = useLocalSearchParams;

// ─── router object (imperative, outside components) ──────────────────────────
// For navigating from outside React components; requires the navigationRef set in App.tsx

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const router: Router = {
  push(href: string, params?: Record<string, unknown>) {
    const screen = ROUTE_TO_SCREEN[href];
    if (screen && navigationRef.isReady()) {
      navigationRef.navigate(screen, params as any);
    }
  },
  replace(href: string, params?: Record<string, unknown>) {
    const screen = ROUTE_TO_SCREEN[href];
    if (screen && navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: screen, params }] });
    }
  },
  navigate(href: string, params?: Record<string, unknown>) {
    const screen = ROUTE_TO_SCREEN[href];
    if (screen && navigationRef.isReady()) {
      navigationRef.navigate(screen, params as any);
    }
  },
  back() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },
  canGoBack() {
    return navigationRef.isReady() ? navigationRef.canGoBack() : false;
  },
};
