/**
 * expo-status-bar shim — wraps React Native's built-in StatusBar.
 * Metro redirects `expo-status-bar` imports here.
 */
import React from 'react';
import { StatusBar as RNStatusBar, StatusBarStyle } from 'react-native';

interface StatusBarProps {
  style?: 'auto' | 'inverted' | 'light' | 'dark';
  backgroundColor?: string;
  translucent?: boolean;
  hidden?: boolean;
  animated?: boolean;
}

// Maps expo-status-bar style values to RN StatusBarStyle
function mapStyle(style?: string): StatusBarStyle {
  switch (style) {
    case 'light': return 'light-content';
    case 'dark':  return 'dark-content';
    default:      return 'default';
  }
}

export function StatusBar({ style, backgroundColor, translucent, hidden, animated }: StatusBarProps) {
  return (
    <RNStatusBar
      barStyle={mapStyle(style)}
      backgroundColor={backgroundColor}
      translucent={translucent}
      hidden={hidden}
      animated={animated}
    />
  );
}

export function setStatusBarStyle(style: string) {
  RNStatusBar.setBarStyle(mapStyle(style), true);
}

export function setStatusBarBackgroundColor(color: string, animated?: boolean) {
  RNStatusBar.setBackgroundColor(color, animated);
}

export function setStatusBarHidden(hidden: boolean, animation?: 'none' | 'fade' | 'slide') {
  RNStatusBar.setHidden(hidden, animation);
}

export function setStatusBarTranslucent(translucent: boolean) {
  RNStatusBar.setTranslucent(translucent);
}
