/**
 * expo-camera web stub.
 * Both QR and Barcode scanner screens use require('expo-camera') inside a
 * try/catch and fall back to a "camera not available" UI when CameraView is
 * null.  On web this module simply exports null for those symbols so the
 * fallback UI is shown instead of a webpack build error.
 */
export const CameraView = null;
export const useCameraPermissions = () => [null, async () => {}] as const;
export const Camera = null;
export default null;
