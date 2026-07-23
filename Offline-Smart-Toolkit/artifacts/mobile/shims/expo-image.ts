/**
 * expo-image — shim for native (Metro).
 *
 * expo-image adds contentFit, placeholder, blurhash, etc. on top of RN Image.
 * This shim wraps the standard RN Image component and maps expo-image-specific
 * props to their RN equivalents so no Expo native module is required.
 *
 * contentFit → resizeMode mapping:
 *   contain    → contain
 *   cover      → cover
 *   fill       → stretch
 *   none       → center
 *   scale-down → contain
 */
import React from 'react';
import { Image as RNImage, ImageStyle, StyleSheet, ImageProps as RNImageProps } from 'react-native';

type ContentFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export interface ImageProps extends Omit<RNImageProps, 'resizeMode'> {
  contentFit?:   ContentFit;
  placeholder?:  string | number | null;
  blurhash?:     string | null;
  contentPosition?: any;
  transition?:   any;
  resizeMode?:   RNImageProps['resizeMode'];
  /** Pass-through for any other expo-image-specific props */
  [key: string]: any;
}

const CONTENT_FIT_MAP: Record<ContentFit, RNImageProps['resizeMode']> = {
  contain:    'contain',
  cover:      'cover',
  fill:       'stretch',
  none:       'center',
  'scale-down': 'contain',
};

export function Image({
  contentFit,
  placeholder: _placeholder,
  blurhash: _blurhash,
  contentPosition: _cp,
  transition: _trans,
  style,
  ...rest
}: ImageProps): React.ReactElement {
  const resizeMode = contentFit ? CONTENT_FIT_MAP[contentFit] : (rest.resizeMode ?? 'cover');
  return React.createElement(RNImage, { ...rest, style, resizeMode } as any);
}

Image.displayName = 'ExpoImageShim';

export const ImageBackground = require('react-native').ImageBackground;
export default Image;
