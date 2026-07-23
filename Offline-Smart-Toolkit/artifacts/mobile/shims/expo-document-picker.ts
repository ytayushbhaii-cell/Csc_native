/**
 * expo-document-picker — native shim using react-native-document-picker.
 *
 * Replaces the Expo-managed version with a pure RN CLI implementation.
 * The API surface matches expo-document-picker so no changes are needed in
 * consuming screens.
 */

export interface DocumentPickerAsset {
  uri:      string;
  name:     string;
  mimeType: string;
  size?:    number;
}

export interface DocumentPickerResult {
  canceled: boolean;
  assets:   DocumentPickerAsset[] | null;
}

export interface GetDocumentOptions {
  type?:                 string | string[];
  copyToCacheDirectory?: boolean;
  multiple?:             boolean;
}

let _RNDocumentPicker: any = null;

function getRNDocumentPicker() {
  if (_RNDocumentPicker) return _RNDocumentPicker;
  try {
    _RNDocumentPicker = require('react-native-document-picker');
  } catch {
    _RNDocumentPicker = null;
  }
  return _RNDocumentPicker;
}

function toRNType(type: string | string[] | undefined): string | string[] {
  if (!type || type === '*/*') return require('react-native-document-picker').types?.allFiles ?? '*/*';
  const RNDocumentPicker = getRNDocumentPicker();
  const types = RNDocumentPicker?.types ?? {};
  if (!Array.isArray(type)) type = [type];
  return type.map((t) => {
    if (t === 'application/pdf')  return types.pdf ?? 'com.adobe.pdf';
    if (t === 'image/*')          return types.images ?? 'public.image';
    if (t === 'video/*')          return types.video ?? 'public.movie';
    return t;
  });
}

export async function getDocumentAsync(
  options: GetDocumentOptions = {},
): Promise<DocumentPickerResult> {
  const RNDocumentPicker = getRNDocumentPicker();
  if (!RNDocumentPicker) {
    console.warn('[expo-document-picker shim] react-native-document-picker not available.');
    return { canceled: true, assets: null };
  }

  try {
    const rnType = toRNType(options.type);
    let picked: any[];

    if (options.multiple) {
      picked = await RNDocumentPicker.pickMultiple({ type: rnType, copyTo: 'cachesDirectory' });
    } else {
      const single = await RNDocumentPicker.pickSingle({
        type:   rnType,
        copyTo: options.copyToCacheDirectory !== false ? 'cachesDirectory' : undefined,
      });
      picked = [single];
    }

    const assets: DocumentPickerAsset[] = picked.map((f: any) => ({
      uri:      f.fileCopyUri ?? f.uri,
      name:     f.name ?? 'document',
      mimeType: f.type ?? 'application/octet-stream',
      size:     f.size,
    }));
    return { canceled: false, assets };
  } catch (e: any) {
    if (RNDocumentPicker.isCancel?.(e)) {
      return { canceled: true, assets: null };
    }
    throw e;
  }
}

export default { getDocumentAsync };
