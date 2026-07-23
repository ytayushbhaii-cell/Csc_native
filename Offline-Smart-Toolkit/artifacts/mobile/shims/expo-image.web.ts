/**
 * expo-image — web shim (webpack).
 *
 * Maps expo-image's contentFit prop to RN Image's resizeMode so print-tool
 * screens work in the web preview. react-native-web handles the actual rendering.
 */
import React from 'react';
import { Image as RNImage } from 'react-native';

type ContentFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export interface ImageProps {
  contentFit?:   ContentFit;
  placeholder?:  string | number | null;
  blurhash?:     string | null;
  contentPosition?: any;
  transition?:   any;
  [key: string]: any;
}

const CONTENT_FIT_MAP: Record<ContentFit, string> = {
  contain:      'contain',
  cover:        'cover',
  fill:         'stretch',
  none:         'center',
  'scale-down': 'contain',
};

export function Image({
  contentFit,
  placeholder: _placeholder,
  blurhash: _blurhash,
  contentPosition: _cp,
  transition: _trans,
  ...rest
}: ImageProps): React.ReactElement {
  const resizeMode = contentFit ? CONTENT_FIT_MAP[contentFit] : (rest.resizeMode ?? 'cover');
  return React.createElement(RNImage as any, { ...rest, resizeMode });
}

Image.displayName = 'ExpoImageShim';

export const ImageBackground = require('react-native').ImageBackground;
export default Image;
