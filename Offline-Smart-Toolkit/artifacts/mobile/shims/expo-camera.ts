/**
 * expo-camera — shim.
 *
 * On web: exports null for CameraView/Camera and a no-op for useCameraPermissions
 *         so scanner screens show the "Camera not available" fallback UI.
 *
 * On native: delegates to react-native-vision-camera v4, adapting its API to
 *            match the expo-camera prop interface used by QR/Barcode scanners.
 */
import { Platform } from 'react-native';

// ── Web stubs ─────────────────────────────────────────────────────────────────
export const CameraView          = (Platform.OS === 'web' ? null : _CameraViewNative()) as any;
export const Camera              = CameraView;
export const useCameraPermissions = Platform.OS === 'web'
  ? () => [null, async () => ({})] as const
  : _useCameraPermissionsNative;

// ── Native implementation (only evaluated on non-web) ─────────────────────────
function _useCameraPermissionsNative(): [
  { granted: boolean; status: string } | null,
  () => Promise<void>
] {
  let vc: any;
  try { vc = require('react-native-vision-camera'); } catch { return [null, async () => {}]; }

  const { useCameraPermission } = vc;
  if (!useCameraPermission) return [null, async () => {}];

  // react-hooks/rules-of-hooks: this function IS a hook (called as a hook by screens)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasPermission, requestPermission } = useCameraPermission();
  const perm = { granted: hasPermission, status: hasPermission ? 'granted' : 'undetermined' };
  return [perm, requestPermission];
}

function _CameraViewNative() {
  let vc: any;
  try { vc = require('react-native-vision-camera'); } catch { return null; }
  if (!vc) return null;

  const React = require('react');
  const { StyleSheet } = require('react-native');
  const { Camera, useCameraDevice, useCodeScanner } = vc;

  if (!Camera) return null;

  /**
   * CameraView adapter — wraps vision-camera Camera with expo-camera props:
   *   facing, barcodeScannerSettings, onBarcodeScanned
   */
  function CameraView(props: {
    style?: any;
    facing?: 'front' | 'back';
    barcodeScannerSettings?: { barcodeTypes?: string[] };
    onBarcodeScanned?: (r: { type: string; data: string }) => void;
    [k: string]: any;
  }) {
    const device = useCameraDevice(props.facing === 'front' ? 'front' : 'back');

    const codeScanner = useCodeScanner({
      codeTypes: props.barcodeScannerSettings?.barcodeTypes ?? ['qr', 'ean-13', 'code-128'],
      onCodeScanned: (codes: any[]) => {
        if (!props.onBarcodeScanned || !codes[0]) return;
        props.onBarcodeScanned({ type: codes[0].type, data: codes[0].value ?? '' });
      },
    });

    if (!device) return null;
    return React.createElement(Camera, {
      style: [StyleSheet.absoluteFill, props.style],
      device,
      isActive: true,
      codeScanner,
    });
  }

  return CameraView;
}

export default { CameraView, Camera, useCameraPermissions };
