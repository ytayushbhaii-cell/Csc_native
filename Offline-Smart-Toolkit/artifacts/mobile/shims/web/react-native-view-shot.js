/**
 * Web stub for react-native-view-shot.
 * ViewShot is used to capture component trees as images on native.
 * On web, it returns an empty string (no-op capture).
 */
import React from 'react';

const ViewShot = React.forwardRef(function ViewShot({ children, style }, ref) {
  const internalRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    capture: async () => {
      // No-op on web — return empty data URI
      return '';
    },
  }));

  return React.createElement('div', { ref: internalRef, style }, children);
});

export default ViewShot;
export const captureRef = async () => '';
export const captureScreen = async () => '';
export const releaseCapture = () => {};
