// Pure-JS barcode generators producing arrays of bar widths for SVG rendering.
// Supports Code128, EAN-13, EAN-8, UPC-A, and ITF-14.
// No external library — fully offline.

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE' | 'ITF14';

export interface BarSegment {
  isBar: boolean; // true = dark bar, false = space
  width: number;  // relative units
}

// ─── Code 128 ───────────────────────────────────────────────────────────────
const C128_CHARS =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

const C128_PATTERNS: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],
  [1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],[1,1,3,1,3,2],[1,3,3,3,1,1],
  [3,1,3,1,1,2],[2,1,1,1,3,3],[2,1,3,1,1,3],[2,1,3,1,3,1],[2,1,3,3,1,1],
  [2,3,3,1,1,1],[1,1,1,1,2,4],[1,1,1,2,2,4],[1,1,1,4,2,2],[1,2,1,1,2,4],
  [1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],[1,1,2,4,1,2],
  [1,4,2,1,1,2],[1,4,2,2,1,1],[2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],
  [2,4,1,1,1,2],[1,3,4,1,1,1],[1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],
  [1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],
  [4,2,1,2,1,1],[2,1,2,1,4,1],[2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],
  [1,1,1,3,4,1],[1,3,1,1,4,1],[1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],
  [4,1,1,3,1,1],[1,1,3,1,4,1],[1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],
  [2,1,1,4,1,2],[2,1,1,2,1,4],[2,1,1,2,3,2],[2,3,3,1,1,2],
  // Start B, Stop
  [2,1,1,4,1,2],[2,3,3,1,1,2],[2,3,3,1,1,2],
];

const C128_START_B = 104;
const C128_STOP = 106;

function encodeCode128(text: string): BarSegment[] {
  const values: number[] = [C128_START_B];
  let checksum = C128_START_B;
  for (let i = 0; i < text.length; i++) {
    const idx = C128_CHARS.indexOf(text[i]);
    if (idx < 0) throw new Error(`Character "${text[i]}" not supported in Code128`);
    values.push(idx);
    checksum += idx * (i + 1);
  }
  values.push(checksum % 103);
  values.push(C128_STOP);

  const segs: BarSegment[] = [{ isBar: false, width: 10 }]; // quiet zone
  for (const v of values) {
    const pat = C128_PATTERNS[v] ?? C128_PATTERNS[0];
    pat.forEach((w, i) => segs.push({ isBar: i % 2 === 0, width: w }));
  }
  // Stop extra bar
  segs.push({ isBar: true, width: 2 });
  segs.push({ isBar: false, width: 10 }); // quiet zone
  return segs;
}

// ─── EAN / UPC helpers ───────────────────────────────────────────────────────
const EAN_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const EAN_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const EAN_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const EAN13_STRUCTURE = [
  'LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'
];

function eanDigitSegs(digit: number, encoding: string): BarSegment[] {
  const bits = encoding === 'L' ? EAN_L[digit] : encoding === 'G' ? EAN_G[digit] : EAN_R[digit];
  return [...bits!].map((b, i) => ({ isBar: b === '1', width: 1 }));
}

function eanCheckDigit(digits: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

function encodeEAN13(text: string): BarSegment[] {
  const raw = text.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  const digits = raw.split('').map(Number);
  const check = eanCheckDigit(digits);
  const all = [...digits, check];
  const structure = EAN13_STRUCTURE[all[0]!] ?? 'LLLLLL';

  const segs: BarSegment[] = [{ isBar: false, width: 9 }];
  segs.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 }); // start
  for (let i = 1; i <= 6; i++) segs.push(...eanDigitSegs(all[i]!, structure[i - 1]!));
  segs.push({ isBar: false, width: 1 }, { isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 }, { isBar: false, width: 1 }); // middle
  for (let i = 7; i <= 12; i++) segs.push(...eanDigitSegs(all[i]!, 'R'));
  segs.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 }); // end
  segs.push({ isBar: false, width: 9 });
  return segs;
}

function encodeEAN8(text: string): BarSegment[] {
  const raw = text.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
  const digits = raw.split('').map(Number);
  const check = eanCheckDigit(digits);
  const all = [...digits, check];

  const segs: BarSegment[] = [{ isBar: false, width: 7 }];
  segs.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 });
  for (let i = 0; i <= 3; i++) segs.push(...eanDigitSegs(all[i]!, 'L'));
  segs.push({ isBar: false, width: 1 }, { isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 }, { isBar: false, width: 1 });
  for (let i = 4; i <= 7; i++) segs.push(...eanDigitSegs(all[i]!, 'R'));
  segs.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 });
  segs.push({ isBar: false, width: 7 });
  return segs;
}

function encodeUPCA(text: string): BarSegment[] {
  // UPC-A is EAN-13 with leading 0
  return encodeEAN13('0' + text.replace(/\D/g, '').slice(0, 11).padStart(11, '0'));
}

// ─── ITF-14 ─────────────────────────────────────────────────────────────────
const ITF_NARROW = 1;
const ITF_WIDE = 3;
const ITF_PATTERNS: number[] = [
  0b00110, 0b10001, 0b01001, 0b11000, 0b00101, 0b10100, 0b01100, 0b00011, 0b10010, 0b01010
];

function encodeITF14(text: string): BarSegment[] {
  let raw = text.replace(/\D/g, '').slice(0, 13).padStart(13, '0');
  // Add check digit
  const digits = raw.split('').map(Number);
  const check = eanCheckDigit(digits);
  raw += check;
  if (raw.length % 2 !== 0) raw = '0' + raw;

  const segs: BarSegment[] = [{ isBar: false, width: 10 }];
  // Start: NNN
  segs.push({ isBar: true, width: ITF_NARROW }, { isBar: false, width: ITF_NARROW }, { isBar: true, width: ITF_NARROW }, { isBar: false, width: ITF_NARROW });
  for (let i = 0; i < raw.length; i += 2) {
    const a = Number(raw[i]);
    const b = Number(raw[i + 1]);
    const pa = ITF_PATTERNS[a]!;
    const pb = ITF_PATTERNS[b]!;
    for (let bit = 4; bit >= 0; bit--) {
      const wa = (pa >> bit) & 1 ? ITF_WIDE : ITF_NARROW;
      const wb = (pb >> bit) & 1 ? ITF_WIDE : ITF_NARROW;
      segs.push({ isBar: true, width: wa }, { isBar: false, width: wb });
    }
  }
  // Stop: WNN
  segs.push({ isBar: true, width: ITF_WIDE }, { isBar: false, width: ITF_NARROW }, { isBar: true, width: ITF_NARROW });
  segs.push({ isBar: false, width: 10 });
  return segs;
}

// ─── Code 39 ────────────────────────────────────────────────────────────────
// Each character encodes as 5 bars + 4 spaces (9 elements, "3 of 9" = exactly 3 wide).
// Narrow = 1 unit, Wide = 3 units.
// Bit layout (MSB→LSB): bit8=bar1, bit7=space1, bit6=bar2, bit5=space2,
//   bit4=bar3, bit3=space3, bit2=bar4, bit1=space4, bit0=bar5.
// Each entry has exactly 3 bits set. Source: ISO/IEC 16388 / USS Code 39.
const C39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*';
const C39_PATTERNS: number[] = [
  // 0-9
  0x034, 0x121, 0x061, 0x160, 0x025, 0x124, 0x064, 0x023, 0x122, 0x062,
  // A-J
  0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C,
  // K-T
  0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016,
  // U-Z
  0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0,
  // - . SPACE $ / + %
  0x085, 0x184, 0x0C4, 0x0A8, 0x08A, 0x02A, 0x0A2,
  // * (start/stop)
  0x094,
];
const C39_NARROW = 1;
const C39_WIDE = 3;
const C39_GAP = 1; // inter-character gap (narrow space)

function encodeCode39(text: string): BarSegment[] {
  const upper = text.toUpperCase();
  const STAR_IDX = C39_CHARS.indexOf('*');

  const encodeChar = (idx: number): BarSegment[] => {
    const pat = C39_PATTERNS[idx] ?? 0;
    const segs: BarSegment[] = [];
    for (let bit = 8; bit >= 0; bit--) {
      const isWide = ((pat >> bit) & 1) === 1;
      const w = isWide ? C39_WIDE : C39_NARROW;
      // even bits (8,6,4,2,0) = bars; odd bits (7,5,3,1) = spaces
      segs.push({ isBar: bit % 2 === 0, width: w });
    }
    return segs;
  };

  const segs: BarSegment[] = [{ isBar: false, width: 10 }]; // quiet zone
  // Start *
  segs.push(...encodeChar(STAR_IDX), { isBar: false, width: C39_GAP });

  for (const ch of upper) {
    const idx = C39_CHARS.indexOf(ch);
    if (idx < 0) throw new Error(`Character "${ch}" not supported in Code 39`);
    segs.push(...encodeChar(idx), { isBar: false, width: C39_GAP });
  }

  // Stop *
  segs.push(...encodeChar(STAR_IDX));
  segs.push({ isBar: false, width: 10 }); // quiet zone
  return segs;
}

// ─── UPC-E ───────────────────────────────────────────────────────────────────
// UPC-E is a compressed 6-digit UPC for small packages.
// We accept up to 6 digits from the user and pad/encode accordingly.
const UPCE_PARITY: string[] = [
  'EEEOOO', 'EEOEOO', 'EEOOEO', 'EEOOOE', 'EOEEOO',
  'EOOEEO', 'EOOOEE', 'EOEOEO', 'EOEOOE', 'EOOEOE',
];

function encodeUPCE(text: string): BarSegment[] {
  // Normalise to 6 digits (strip non-digits, pad/trim)
  const raw = text.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
  const digits = raw.split('').map(Number);

  // Derive check digit via UPC-A expansion then EAN check
  // Expand UPC-E to UPC-A for check digit calculation
  const d = digits;
  let expanded = '';
  const last = d[5]!;
  if (last <= 2) {
    expanded = `0${d[0]}${d[1]}${last}0000${d[2]}${d[3]}${d[4]}`;
  } else if (last === 3) {
    expanded = `0${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
  } else if (last === 4) {
    expanded = `0${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
  } else {
    expanded = `0${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${last}`;
  }
  const expDigits = expanded.split('').map(Number);
  // eanCheckDigit uses EAN-13 weighting (position 0 × 1, position 1 × 3, …).
  // UPC-A check needs position 0 × 3. Prepend an extra 0 so the 11-digit array
  // becomes 12 digits — same trick encodeUPCA uses internally via encodeEAN13.
  const check = eanCheckDigit([0, ...expDigits.slice(0, 11)]);

  // Parity pattern for check digit
  const parity = UPCE_PARITY[check] ?? 'EEEOOO';

  const segs: BarSegment[] = [{ isBar: false, width: 9 }];
  // Start: 101
  segs.push({ isBar: true, width: 1 }, { isBar: false, width: 1 }, { isBar: true, width: 1 });
  for (let i = 0; i < 6; i++) {
    segs.push(...eanDigitSegs(digits[i]!, parity[i] === 'O' ? 'L' : 'G'));
  }
  // End: 010101
  segs.push(
    { isBar: false, width: 1 }, { isBar: true, width: 1 },
    { isBar: false, width: 1 }, { isBar: true, width: 1 },
    { isBar: false, width: 1 }, { isBar: true, width: 1 },
  );
  segs.push({ isBar: false, width: 9 });
  return segs;
}

// ─── Public API ─────────────────────────────────────────────────────────────
export function generateBarcode(text: string, format: BarcodeFormat): BarSegment[] {
  switch (format) {
    case 'CODE128': return encodeCode128(text);
    case 'CODE39':  return encodeCode39(text);
    case 'EAN13':   return encodeEAN13(text);
    case 'EAN8':    return encodeEAN8(text);
    case 'UPCA':    return encodeUPCA(text);
    case 'UPCE':    return encodeUPCE(text);
    case 'ITF14':   return encodeITF14(text);
    default:        return encodeCode128(text);
  }
}

export function formatLabel(text: string, format: BarcodeFormat): string {
  switch (format) {
    case 'EAN13': {
      const d = text.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
      const c = eanCheckDigit(d.split('').map(Number));
      const full = d + c;
      return full[0] + ' ' + full.slice(1, 7) + ' ' + full.slice(7);
    }
    case 'EAN8': {
      const d = text.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
      const c = eanCheckDigit(d.split('').map(Number));
      return d.slice(0, 4) + ' ' + d.slice(4) + c;
    }
    case 'UPCA': {
      const d = text.replace(/\D/g, '').slice(0, 11).padStart(11, '0');
      const c = eanCheckDigit(d.split('').map(Number));
      return d[0] + ' ' + d.slice(1, 6) + ' ' + d.slice(6) + c;
    }
    case 'UPCE': {
      const d = text.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
      return d.slice(0, 3) + ' ' + d.slice(3);
    }
    case 'CODE39':
      return '*' + text.toUpperCase() + '*';
    default:
      return text;
  }
}

export function getTotalWidth(segs: BarSegment[]): number {
  return segs.reduce((sum, s) => sum + s.width, 0);
}
