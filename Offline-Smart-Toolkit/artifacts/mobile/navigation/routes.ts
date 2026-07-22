/**
 * Central route mapping for the CSC Smart Toolkit.
 * Maps expo-router style paths ↔ React Navigation screen names.
 * Used by the expo-router shim so existing screen files need no changes.
 */

export const ROUTE_TO_SCREEN: Record<string, string> = {
  // ── Root / Dashboard ──────────────────────────────────────────────────────
  '/':               'Dashboard',
  '/dashboard':      'Dashboard',

  // ── Main tabs ─────────────────────────────────────────────────────────────
  '/tools':          'Tools',
  '/search':         'Search',
  '/favorites':      'Favorites',
  '/recent':         'Recent',
  '/most-used':      'MostUsed',
  '/history':        'History',
  '/settings':       'Settings',

  // ── Settings sub-screens ──────────────────────────────────────────────────
  '/settings/theme':          'SettingsTheme',
  '/settings/language':       'SettingsLanguage',
  '/settings/print-size':     'SettingsPrintSize',
  '/settings/default-folder': 'SettingsDefaultFolder',
  '/settings/backup':         'SettingsBackup',

  // ── Photo Tools ───────────────────────────────────────────────────────────
  '/photo-tools':                     'PhotoTools',
  '/photo-tools/background-remove':   'PhotoBackgroundRemove',
  '/photo-tools/background-changer':  'PhotoBackgroundChanger',
  '/photo-tools/batch-rename':        'PhotoBatchRename',
  '/photo-tools/batch-resize':        'PhotoBatchResize',
  '/photo-tools/blue-background':     'PhotoBlueBackground',
  '/photo-tools/blur-background':     'PhotoBlurBackground',
  '/photo-tools/color-correction':    'PhotoColorCorrection',
  '/photo-tools/compress':            'PhotoCompress',
  '/photo-tools/converter':           'PhotoConverter',
  '/photo-tools/crop':                'PhotoCrop',
  '/photo-tools/dpi-converter':       'PhotoDpiConverter',
  '/photo-tools/duplicate-finder':    'PhotoDuplicateFinder',
  '/photo-tools/enhance':             'PhotoEnhance',
  '/photo-tools/face-center':         'PhotoFaceCenter',
  '/photo-tools/face-restore':        'PhotoFaceRestore',
  '/photo-tools/metadata-viewer':     'PhotoMetadataViewer',
  '/photo-tools/mirror':              'PhotoMirror',
  '/photo-tools/passport-photo':      'PhotoPassportPhoto',
  '/photo-tools/red-background':      'PhotoRedBackground',
  '/photo-tools/resize':              'PhotoResize',
  '/photo-tools/rotate-flip':         'PhotoRotateFlip',
  '/photo-tools/transparent-png':     'PhotoTransparentPng',
  '/photo-tools/watermark':           'PhotoWatermark',
  '/photo-tools/white-background':    'PhotoWhiteBackground',

  // ── Document Tools ────────────────────────────────────────────────────────
  '/document-tools':                                'DocumentTools',
  '/document-tools/aadhaar':                        'DocumentAadhaar',
  '/document-tools/aadhaar/a4-layout':              'AadhaarA4Layout',
  '/document-tools/aadhaar/color-correction':       'AadhaarColorCorrection',
  '/document-tools/aadhaar/copies':                 'AadhaarCopies',
  '/document-tools/aadhaar/crop':                   'AadhaarCrop',
  '/document-tools/aadhaar/detect-back':            'AadhaarDetectBack',
  '/document-tools/aadhaar/detect-front':           'AadhaarDetectFront',
  '/document-tools/aadhaar/image-to-sheet':         'AadhaarImageToSheet',
  '/document-tools/aadhaar/pdf-to-sheet':           'AadhaarPdfToSheet',

  '/document-tools/pan':                            'DocumentPan',
  '/document-tools/pan/a4-layout':                  'PanA4Layout',
  '/document-tools/pan/color-enhancement':          'PanColorEnhancement',
  '/document-tools/pan/copies':                     'PanCopies',
  '/document-tools/pan/crop':                       'PanCrop',
  '/document-tools/pan/size-detection':             'PanSizeDetection',

  '/document-tools/voter':                          'DocumentVoter',
  '/document-tools/voter/copies':                   'VoterCopies',
  '/document-tools/voter/crop':                     'VoterCrop',
  '/document-tools/voter/front-crop':              'VoterFrontCrop',
  '/document-tools/voter/back-crop':               'VoterBackCrop',
  '/document-tools/voter/detect':                   'VoterDetect',
  '/document-tools/voter/print-layout':             'VoterPrintLayout',

  '/document-tools/driving-license':                'DocumentDrivingLicense',
  '/document-tools/driving-license/back-crop':      'DrivingBackCrop',
  '/document-tools/driving-license/copies':         'DrivingCopies',
  '/document-tools/driving-license/front-crop':     'DrivingFrontCrop',
  '/document-tools/driving-license/print-layout':   'DrivingPrintLayout',

  '/document-tools/passport':                       'DocumentPassport',
  '/document-tools/passport/a4-layout':             'PassportA4Layout',
  '/document-tools/passport/crop':                  'PassportCrop',
  '/document-tools/passport/size-detection':        'PassportSizeDetection',
  '/document-tools/passport/validation':            'PassportValidation',

  '/document-tools/pdf':                            'DocumentPdf',
  '/document-tools/pdf/compress':                   'PdfCompress',
  '/document-tools/pdf/delete-pages':               'PdfDeletePages',
  '/document-tools/pdf/extract-pages':              'PdfExtractPages',
  '/document-tools/pdf/from-image':                 'PdfFromImage',
  '/document-tools/pdf/info':                       'PdfInfo',
  '/document-tools/pdf/merge':                      'PdfMerge',
  '/document-tools/pdf/ocr':                        'PdfOcr',
  '/document-tools/pdf/password-protect':           'PdfPasswordProtect',
  '/document-tools/pdf/rearrange':                  'PdfRearrange',
  '/document-tools/pdf/remove-password':            'PdfRemovePassword',
  '/document-tools/pdf/rename':                     'PdfRename',
  '/document-tools/pdf/rotate':                     'PdfRotate',
  '/document-tools/pdf/search':                     'PdfSearch',
  '/document-tools/pdf/split':                      'PdfSplit',

  // ── QR Tools ──────────────────────────────────────────────────────────────
  '/qr-tools':            'QrTools',
  '/qr-tools/generator':  'QrGenerator',
  '/qr-tools/scanner':    'QrScanner',

  // ── Barcode Tools ─────────────────────────────────────────────────────────
  '/barcode-tools':             'QrTools',
  '/barcode-tools/generator':   'BarcodeGenerator',
  '/barcode-tools/scanner':     'BarcodeScanner',

  // ── Signature Tools ───────────────────────────────────────────────────────
  '/signature-tools':             'SignatureTools',
  '/signature-tools/maker':       'SignatureMaker',
  '/signature-tools/bg-remove':   'SignatureBgRemove',

  // ── Stamp Maker ───────────────────────────────────────────────────────────
  '/stamp-maker':               'StampMaker',
  '/stamp-maker/company-stamp': 'StampCompany',
  '/stamp-maker/csc-stamp':     'StampCsc',

  // ── ID Card Tools ─────────────────────────────────────────────────────────
  '/id-card-tools':             'IdCardTools',
  '/id-card-tools/custom':      'IdCardCustom',
  '/id-card-tools/employee':    'IdCardEmployee',
  '/id-card-tools/student':     'IdCardStudent',
  '/id-card-tools/visitor':     'IdCardVisitor',

  // ── Print Tools ───────────────────────────────────────────────────────────
  '/print-tools':                   'PrintTools',
  '/print-tools/a4-layout':         'PrintA4Layout',
  '/print-tools/custom-paper':      'PrintCustomPaper',
  '/print-tools/multiple-copies':   'PrintMultipleCopies',
  '/print-tools/passport-sheet':    'PrintPassportSheet',
  '/print-tools/print-preview':     'PrintPreview',

  // ── Utility Tools ─────────────────────────────────────────────────────────
  '/utility-tools':                         'UtilityTools',
  '/utility-tools/age-calculator':          'UtilityAgeCalculator',
  '/utility-tools/calendar':               'UtilityCalendar',
  '/utility-tools/percentage-calculator':  'UtilityPercentageCalc',
};

/** Reverse map: screen name → expo-router path */
export const SCREEN_TO_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_TO_SCREEN)
    .filter(([path]) => path !== '/')   // skip duplicate '/' entry
    .map(([path, screen]) => [screen, path]),
);
