/**
 * expo-document-picker — web shim using browser <input type="file">.
 *
 * Provides the same API as expo-document-picker so screens that call
 * DocumentPicker.getDocumentAsync() work in the webpack web bundle.
 */

export interface DocumentPickerAsset {
  uri:      string;
  name:     string;
  mimeType: string;
  size?:    number;
  file?:    File;
}

export interface DocumentPickerResult {
  canceled: boolean;
  assets:   DocumentPickerAsset[] | null;
  output?:  FileList | null;
}

export interface GetDocumentOptions {
  type?:                 string | string[];
  copyToCacheDirectory?: boolean;
  multiple?:             boolean;
}

function mimeToAccept(type: string | string[] | undefined): string {
  if (!type) return '*/*';
  if (Array.isArray(type)) return type.join(',');
  return type;
}

export function getDocumentAsync(
  options: GetDocumentOptions = {},
): Promise<DocumentPickerResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type     = 'file';
    input.accept   = mimeToAccept(options.type);
    input.multiple = options.multiple ?? false;

    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (!files.length) {
        resolve({ canceled: true, assets: null });
        return;
      }
      const assets: DocumentPickerAsset[] = files.map((f) => ({
        uri:      URL.createObjectURL(f),
        name:     f.name,
        mimeType: f.type || 'application/octet-stream',
        size:     f.size,
        file:     f,
      }));
      resolve({ canceled: false, assets, output: input.files });
    };

    input.oncancel = () => resolve({ canceled: true, assets: null });
    // Fallback: if no oncancel fires (older browsers), listen to focus on window
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!input.files?.length) {
          resolve({ canceled: true, assets: null });
        }
      }, 300);
    };
    window.addEventListener('focus', onFocus);
    input.click();
  });
}

export default { getDocumentAsync };
