// QR Tools metadata — single source of truth for routes, icons, and descriptions.

export interface QRToolMeta {
  id: string;
  name: string;
  nameHi: string;
  iconName: string;
  color: string;
  description: string;
  descHi: string;
  route: string;
  /** Optional navigation params (e.g. { initialType: 'wifi' }) */
  params?: Record<string, string>;
}

export const QR_COLOR = '#8B5CF6';
export const BARCODE_COLOR = '#7C3AED';

/** Tools shown on the QR & Barcode index screen — only main entry points */
export const QR_TOOLS: QRToolMeta[] = [
  {
    id: 'qr-generator',
    name: 'QR Generator',
    nameHi: 'QR जेनरेटर',
    iconName: 'qrcode',
    color: QR_COLOR,
    description: 'Generate QR codes for text, URL, WiFi, contact, and more',
    descHi: 'टेक्स्ट, URL, WiFi, संपर्क और अधिक के लिए QR कोड बनाएं',
    route: '/qr-tools/generator',
  },
  {
    id: 'qr-scanner',
    name: 'QR Scanner',
    nameHi: 'QR स्कैनर',
    iconName: 'qrcode-scan',
    color: QR_COLOR,
    description: 'Scan QR codes from camera or gallery with history',
    descHi: 'कैमरे या गैलरी से QR कोड स्कैन करें, इतिहास के साथ',
    route: '/qr-tools/scanner',
  },
];

/**
 * Individual QR type shortcuts — used internally (e.g. deep links, search results)
 * but NOT shown on the index screen to preserve the original 4-tool layout.
 */
export const QR_TYPE_TOOLS: QRToolMeta[] = [
  { id: 'qr-text',    name: 'Text QR',    nameHi: 'टेक्स्ट QR', iconName: 'text',                         color: QR_COLOR, description: 'Generate QR code from any text or message',               descHi: 'किसी भी टेक्स्ट से QR बनाएं',    route: '/qr-tools/generator', params: { initialType: 'text' } },
  { id: 'qr-url',     name: 'URL QR',     nameHi: 'URL QR',      iconName: 'web',                          color: QR_COLOR, description: 'Generate QR code from a website URL or link',             descHi: 'URL से QR बनाएं',               route: '/qr-tools/generator', params: { initialType: 'url' } },
  { id: 'qr-wifi',    name: 'WiFi QR',    nameHi: 'WiFi QR',     iconName: 'wifi',                         color: QR_COLOR, description: 'Share WiFi password as a scannable QR code',              descHi: 'WiFi पासवर्ड को QR से शेयर करें', route: '/qr-tools/generator', params: { initialType: 'wifi' } },
  { id: 'qr-contact', name: 'Contact QR', nameHi: 'संपर्क QR',  iconName: 'card-account-details-outline', color: QR_COLOR, description: 'Share contact info as a QR vCard',                       descHi: 'संपर्क जानकारी को QR से शेयर करें', route: '/qr-tools/generator', params: { initialType: 'contact' } },
  { id: 'qr-email',   name: 'Email QR',   nameHi: 'ईमेल QR',    iconName: 'email-outline',                color: QR_COLOR, description: 'Generate QR code that opens email with pre-filled address', descHi: 'ईमेल QR बनाएं',               route: '/qr-tools/generator', params: { initialType: 'email' } },
  { id: 'qr-phone',   name: 'Phone QR',   nameHi: 'फोन QR',     iconName: 'phone',                        color: QR_COLOR, description: 'Generate QR code that dials a phone number',             descHi: 'फोन नंबर QR बनाएं',            route: '/qr-tools/generator', params: { initialType: 'phone' } },
];

export const BARCODE_TOOLS: QRToolMeta[] = [
  {
    id: 'barcode-generator',
    name: 'Barcode Generator',
    nameHi: 'बारकोड जेनरेटर',
    iconName: 'barcode',
    color: BARCODE_COLOR,
    description: 'Generate Code128, EAN-13, EAN-8, UPC, ITF barcodes',
    descHi: 'Code128, EAN-13, EAN-8, UPC, ITF बारकोड बनाएं',
    route: '/barcode-tools/generator',
  },
  {
    id: 'barcode-scanner',
    name: 'Barcode Scanner',
    nameHi: 'बारकोड स्कैनर',
    iconName: 'barcode-scan',
    color: BARCODE_COLOR,
    description: 'Scan product barcodes from camera or gallery',
    descHi: 'कैमरे या गैलरी से प्रोडक्ट बारकोड स्कैन करें',
    route: '/barcode-tools/scanner',
  },
];

export const ALL_QR_TOOLS: QRToolMeta[] = [...QR_TOOLS, ...BARCODE_TOOLS];

export function getQRTool(id: string): QRToolMeta | undefined {
  return ALL_QR_TOOLS.find((t) => t.id === id);
}
