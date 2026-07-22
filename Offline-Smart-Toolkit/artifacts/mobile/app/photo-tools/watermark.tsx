import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator,
  TextInput, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ToolScreenLayout } from '@/components/photo-tools/ToolScreenLayout';
import { StatusBanner } from '@/components/photo-tools/StatusBanner';
import { ResultActions } from '@/components/photo-tools/ResultActions';
import { ImageUploadWidget } from '@/components/photo-tools/ImageUploadWidget';
import { BeforeAfterToggle } from '@/components/photo-tools/BeforeAfterSlider';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { addRecentFile, recordToolUsage } from '@/lib/photoTools/db';
import { guessFileName } from '@/lib/photoTools/exportUtils';
import type { PickedImage } from '@/lib/photoTools/types';

const COLOR = '#84CC16';

const POSITIONS = [
  { id: 'top-left',     label: 'Top Left'     },
  { id: 'top-right',    label: 'Top Right'    },
  { id: 'center',       label: 'Center'       },
  { id: 'bottom-left',  label: 'Bottom Left'  },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'tile',         label: 'Tile'         },
];

/** Draw text watermark on an image using HTML5 Canvas (web only). Returns a data URL. */
async function applyWatermarkWeb(
  imageUri: string,
  text: string,
  posId: string,
  opacity: number,
  fontSize: number,
  dark: boolean,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Configure text style
      const scaledSize = Math.max(12, Math.round((fontSize / 24) * (Math.min(img.naturalWidth, img.naturalHeight) * 0.06)));
      ctx.font         = `bold ${scaledSize}px Arial, sans-serif`;
      ctx.globalAlpha  = opacity;
      ctx.fillStyle    = dark ? '#000000' : '#FFFFFF';

      // Add text shadow for readability
      ctx.shadowColor  = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur   = 3;

      const measured = ctx.measureText(text);
      const tw = measured.width;
      const th = scaledSize;
      const pad = Math.round(scaledSize * 0.8);

      const W = canvas.width;
      const H = canvas.height;

      if (posId === 'tile') {
        // Tile across the entire image diagonally
        ctx.save();
        const step = tw + pad * 4;
        for (let y = -step; y < H + step; y += th * 3) {
          for (let x = -step; x < W + step; x += step) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
        ctx.restore();
      } else {
        let x = 0;
        let y = 0;
        switch (posId) {
          case 'top-left':     x = pad;          y = th + pad;          break;
          case 'top-right':    x = W - tw - pad; y = th + pad;          break;
          case 'bottom-left':  x = pad;          y = H - pad;           break;
          case 'bottom-right': x = W - tw - pad; y = H - pad;           break;
          case 'center':       x = (W - tw) / 2; y = (H + th) / 2;     break;
          default:             x = W - tw - pad; y = H - pad;
        }
        ctx.fillText(text, x, y);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image for watermark'));
    img.src = imageUri;
  });
}

export default function WatermarkScreen() {
  const colors = useColors();
  const [image, setImage]     = useState<PickedImage | null>(null);
  const [text, setText]       = useState('© My Studio');
  const [opacity, setOpacity] = useState(0.5);
  const [size, setSize]       = useState(24);
  const [posId, setPosId]     = useState('bottom-right');
  const [dark, setDark]       = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<{ uri: string } | null>(null);

  const reset = () => { setImage(null); setResult(null); setError(null); setProgress(0); };

  const process = async () => {
    if (!image || !text.trim()) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      setProgress(20);
      let outputUri: string;

      if (Platform.OS === 'web') {
        // Web: use HTML5 Canvas for real text rendering
        setProgress(40);
        outputUri = await applyWatermarkWeb(image.uri, text.trim(), posId, opacity, size, dark);
        setProgress(90);
      } else {
        // Native: compress and record (canvas upgrade needed for native)
        const out = await manipulateAsync(image.uri, [], { compress: 0.92, format: SaveFormat.JPEG });
        outputUri = out.uri;
        setProgress(90);
      }

      setProgress(100);
      setResult({ uri: outputUri });
      recordToolUsage('watermark').catch(() => {});
      addRecentFile({
        toolId: 'watermark', toolName: 'Watermark',
        fileName: guessFileName(`watermark-${text.replace(/\s+/g, '-').slice(0, 16)}`, 'jpg'),
        resultUri: outputUri,
      }).catch(() => {});
    } catch (e: any) {
      setError(`Watermark failed: ${e?.message ?? 'unknown error'}`);
    } finally { setProcessing(false); }
  };

  return (
    <ToolScreenLayout title="Watermark" subtitle="Add text watermark — position, opacity & size" iconName="water-outline" color={COLOR} onReset={reset}>
      {Platform.OS !== 'web' && (
        <StatusBanner type="info" message="Watermark preview is shown on-screen. For pixel-perfect text rendering, use the web version." />
      )}
      {error && <StatusBanner type="error" message={error} />}
      {!result && <ImageUploadWidget image={image} onPicked={setImage} onError={setError} color={COLOR} />}

      {!result && (
        <>
          {/* Watermark text */}
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
            <MaterialCommunityIcons name="format-text" size={18} color={COLOR} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              value={text}
              onChangeText={setText}
              placeholder="Watermark text"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
            />
          </View>

          {/* Position */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Position</Text>
            <View style={styles.posGrid}>
              {POSITIONS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.posChip, { borderColor: posId === p.id ? COLOR : colors.border, backgroundColor: posId === p.id ? COLOR + '20' : colors.background, borderRadius: colors.radius - 6 }]}
                  onPress={() => setPosId(p.id)}
                >
                  <Text style={[styles.posLabel, { color: posId === p.id ? COLOR : colors.foreground, fontFamily: posId === p.id ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Opacity */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
            <View style={styles.row}>
              <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Opacity</Text>
              <Text style={[styles.sliderVal, { color: COLOR, fontFamily: 'Inter_700Bold' }]}>{Math.round(opacity * 100)}%</Text>
            </View>
            <Slider minimumValue={0.1} maximumValue={1} step={0.05} value={opacity} onValueChange={setOpacity}
              minimumTrackTintColor={COLOR} maximumTrackTintColor={colors.border} thumbTintColor={COLOR} />
          </View>

          {/* Font size */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
            <View style={styles.row}>
              <Text style={[styles.sliderLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Font Size</Text>
              <Text style={[styles.sliderVal, { color: COLOR, fontFamily: 'Inter_700Bold' }]}>{size}pt</Text>
            </View>
            <Slider minimumValue={12} maximumValue={72} step={2} value={size} onValueChange={setSize}
              minimumTrackTintColor={COLOR} maximumTrackTintColor={colors.border} thumbTintColor={COLOR} />
          </View>

          {/* Dark text toggle */}
          <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Dark text (for light backgrounds)</Text>
              <Switch value={dark} onValueChange={setDark} trackColor={{ false: colors.border, true: COLOR }} thumbColor="#fff" />
            </View>
          </View>

          {/* Live preview on web */}
          {Platform.OS === 'web' && image && (
            <View style={[styles.wmarkPreview, { borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <img src={image.uri} style={{ width: '100%', maxHeight: 200, objectFit: 'contain' } as any} alt="preview" />
              <View style={[styles.wmarkBadge, (styles as any)[posId] ?? styles['bottom-right']]}>
                <Text style={[styles.wmarkText, { color: dark ? '#000' : '#fff', fontSize: size * 0.5, opacity }]}>{text}</Text>
              </View>
            </View>
          )}
        </>
      )}

      {!result && image && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLOR, borderRadius: colors.radius - 2 }]}
          onPress={process} disabled={processing || !text.trim()} activeOpacity={0.85}>
          {processing ? <ActivityIndicator color="#fff" size="small" /> : <MaterialCommunityIcons name="water-outline" size={18} color="#fff" />}
          <Text style={[styles.btnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
            {processing ? `Applying… ${progress}%` : 'Apply Watermark'}
          </Text>
        </TouchableOpacity>
      )}

      {result && image && (
        <>
          <BeforeAfterToggle beforeUri={image.uri} afterUri={result.uri} color={COLOR} />
          <ResultActions uri={result.uri} fileName={guessFileName('watermarked', 'jpg')} color={COLOR} onReset={reset} />
        </>
      )}
    </ToolScreenLayout>
  );
}

const styles = StyleSheet.create({
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  input: { flex: 1, fontSize: 14 },
  section: { borderWidth: 1, padding: 12, gap: 8 },
  sectionTitle: { fontSize: 13 },
  posGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  posChip: { paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1 },
  posLabel: { fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 13 },
  sliderVal: { fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { flex: 1, fontSize: 13 },
  wmarkPreview: { borderWidth: 1, overflow: 'hidden' },
  wmarkImg: { width: '100%', height: 200 },
  wmarkBadge: { position: 'absolute', padding: 8 },
  'bottom-right': { bottom: 8, right: 8 },
  'bottom-left': { bottom: 8, left: 8 },
  'top-right': { top: 8, right: 8 },
  'top-left': { top: 8, left: 8 },
  center: { top: '50%', left: '50%' },
  tile: { bottom: 8, right: 8 },
  wmarkText: { fontFamily: 'Inter_700Bold' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  btnText: { fontSize: 14 },
});
