/**
 * AppNavigator — single flat Stack that contains every screen in the app.
 * No headers (all screens render their own headers).
 * This replaces expo-router's file-based routing.
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// ── Main / Tabs ────────────────────────────────────────────────────────────
import Dashboard      from '@/app/(tabs)/dashboard';
import Tools          from '@/app/(tabs)/tools';
import Search         from '@/app/(tabs)/search';
import Favorites      from '@/app/(tabs)/favorites';
import Recent         from '@/app/(tabs)/recent';
import MostUsed       from '@/app/(tabs)/most-used';
import History        from '@/app/(tabs)/history';
import Settings       from '@/app/(tabs)/settings';

// ── Settings sub-screens ──────────────────────────────────────────────────
import SettingsTheme         from '@/app/settings/theme';
import SettingsLanguage      from '@/app/settings/language';
import SettingsPrintSize     from '@/app/settings/print-size';
import SettingsDefaultFolder from '@/app/settings/default-folder';
import SettingsBackup        from '@/app/settings/backup';

// ── Photo Tools ───────────────────────────────────────────────────────────
import PhotoTools            from '@/app/photo-tools/index';
import PhotoBackgroundRemove from '@/app/photo-tools/background-remove';
import PhotoBackgroundChanger from '@/app/photo-tools/background-changer';
import PhotoBatchRename      from '@/app/photo-tools/batch-rename';
import PhotoBatchResize      from '@/app/photo-tools/batch-resize';
import PhotoBlueBackground   from '@/app/photo-tools/blue-background';
import PhotoBlurBackground   from '@/app/photo-tools/blur-background';
import PhotoColorCorrection  from '@/app/photo-tools/color-correction';
import PhotoCompress         from '@/app/photo-tools/compress';
import PhotoConverter        from '@/app/photo-tools/converter';
import PhotoCrop             from '@/app/photo-tools/crop';
import PhotoDpiConverter     from '@/app/photo-tools/dpi-converter';
import PhotoDuplicateFinder  from '@/app/photo-tools/duplicate-finder';
import PhotoEnhance          from '@/app/photo-tools/enhance';
import PhotoFaceCenter       from '@/app/photo-tools/face-center';
import PhotoFaceRestore      from '@/app/photo-tools/face-restore';
import PhotoMetadataViewer   from '@/app/photo-tools/metadata-viewer';
import PhotoMirror           from '@/app/photo-tools/mirror';
import PhotoPassportPhoto    from '@/app/photo-tools/passport-photo';
import PhotoRedBackground    from '@/app/photo-tools/red-background';
import PhotoResize           from '@/app/photo-tools/resize';
import PhotoRotateFlip       from '@/app/photo-tools/rotate-flip';
import PhotoTransparentPng   from '@/app/photo-tools/transparent-png';
import PhotoWatermark        from '@/app/photo-tools/watermark';
import PhotoWhiteBackground  from '@/app/photo-tools/white-background';

// ── Document Tools ────────────────────────────────────────────────────────
import DocumentTools       from '@/app/document-tools/index';
// Aadhaar
import DocumentAadhaar     from '@/app/document-tools/aadhaar/index';
import AadhaarA4Layout     from '@/app/document-tools/aadhaar/a4-layout';
import AadhaarColorCorr    from '@/app/document-tools/aadhaar/color-correction';
import AadhaarCopies       from '@/app/document-tools/aadhaar/copies';
import AadhaarCrop         from '@/app/document-tools/aadhaar/crop';
import AadhaarDetectBack   from '@/app/document-tools/aadhaar/detect-back';
import AadhaarDetectFront  from '@/app/document-tools/aadhaar/detect-front';
import AadhaarImageToSheet from '@/app/document-tools/aadhaar/image-to-sheet';
import AadhaarPdfToSheet   from '@/app/document-tools/aadhaar/pdf-to-sheet';
// PAN
import DocumentPan         from '@/app/document-tools/pan/index';
import PanA4Layout         from '@/app/document-tools/pan/a4-layout';
import PanColorEnhancement from '@/app/document-tools/pan/color-enhancement';
import PanCopies           from '@/app/document-tools/pan/copies';
import PanCrop             from '@/app/document-tools/pan/crop';
import PanSizeDetection    from '@/app/document-tools/pan/size-detection';
// Voter
import DocumentVoter       from '@/app/document-tools/voter/index';
import VoterCopies         from '@/app/document-tools/voter/copies';
import VoterCrop           from '@/app/document-tools/voter/crop';
import VoterDetect         from '@/app/document-tools/voter/detect';
import VoterPrintLayout    from '@/app/document-tools/voter/print-layout';
// Driving License
import DocumentDrivingLicense from '@/app/document-tools/driving-license/index';
import DrivingBackCrop     from '@/app/document-tools/driving-license/back-crop';
import DrivingCopies       from '@/app/document-tools/driving-license/copies';
import DrivingFrontCrop    from '@/app/document-tools/driving-license/front-crop';
import DrivingPrintLayout  from '@/app/document-tools/driving-license/print-layout';
// Passport
import DocumentPassport    from '@/app/document-tools/passport/index';
import PassportA4Layout    from '@/app/document-tools/passport/a4-layout';
import PassportCrop        from '@/app/document-tools/passport/crop';
import PassportSizeDetect  from '@/app/document-tools/passport/size-detection';
import PassportValidation  from '@/app/document-tools/passport/validation';
// PDF
import DocumentPdf         from '@/app/document-tools/pdf/index';
import PdfCompress         from '@/app/document-tools/pdf/compress';
import PdfDeletePages      from '@/app/document-tools/pdf/delete-pages';
import PdfExtractPages     from '@/app/document-tools/pdf/extract-pages';
import PdfFromImage        from '@/app/document-tools/pdf/from-image';
import PdfInfo             from '@/app/document-tools/pdf/info';
import PdfMerge            from '@/app/document-tools/pdf/merge';
import PdfOcr              from '@/app/document-tools/pdf/ocr';
import PdfPasswordProtect  from '@/app/document-tools/pdf/password-protect';
import PdfRearrange        from '@/app/document-tools/pdf/rearrange';
import PdfRemovePassword   from '@/app/document-tools/pdf/remove-password';
import PdfRename           from '@/app/document-tools/pdf/rename';
import PdfRotate           from '@/app/document-tools/pdf/rotate';
import PdfSearch           from '@/app/document-tools/pdf/search';
import PdfSplit            from '@/app/document-tools/pdf/split';

// ── QR Tools ──────────────────────────────────────────────────────────────
import QrTools     from '@/app/qr-tools/index';
import QrGenerator from '@/app/qr-tools/generator';
import QrScanner   from '@/app/qr-tools/scanner';

// ── Barcode Tools ─────────────────────────────────────────────────────────
import BarcodeGenerator from '@/app/barcode-tools/generator';
import BarcodeScanner   from '@/app/barcode-tools/scanner';

// ── Signature / Stamp ─────────────────────────────────────────────────────
import SignatureTools   from '@/app/signature-tools/index';
import SignatureMaker   from '@/app/signature-tools/maker';
import SignatureBgRemove from '@/app/signature-tools/bg-remove';
import StampMaker       from '@/app/stamp-maker/index';
import StampCompany     from '@/app/stamp-maker/company-stamp';
import StampCsc         from '@/app/stamp-maker/csc-stamp';

// ── ID Card Tools ─────────────────────────────────────────────────────────
import IdCardTools   from '@/app/id-card-tools/index';
import IdCardCustom  from '@/app/id-card-tools/custom';
import IdCardEmployee from '@/app/id-card-tools/employee';
import IdCardStudent from '@/app/id-card-tools/student';
import IdCardVisitor from '@/app/id-card-tools/visitor';

// ── Print Tools ───────────────────────────────────────────────────────────
import PrintTools        from '@/app/print-tools/index';
import PrintA4Layout     from '@/app/print-tools/a4-layout';
import PrintCustomPaper  from '@/app/print-tools/custom-paper';
import PrintMultipleCopies from '@/app/print-tools/multiple-copies';
import PrintPassportSheet  from '@/app/print-tools/passport-sheet';
import PrintPreview      from '@/app/print-tools/print-preview';

// ── Utility Tools ─────────────────────────────────────────────────────────
import UtilityTools           from '@/app/utility-tools/index';
import UtilityAgeCalculator   from '@/app/utility-tools/age-calculator';
import UtilityCalendar        from '@/app/utility-tools/calendar';
import UtilityPercentageCalc  from '@/app/utility-tools/percentage-calculator';

// ─────────────────────────────────────────────────────────────────────────────

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {/* ── Main screens ─────────────────────────────────────────── */}
      <Stack.Screen name="Dashboard"  component={Dashboard} />
      <Stack.Screen name="Tools"      component={Tools} />
      <Stack.Screen name="Search"     component={Search} />
      <Stack.Screen name="Favorites"  component={Favorites} />
      <Stack.Screen name="Recent"     component={Recent} />
      <Stack.Screen name="MostUsed"   component={MostUsed} />
      <Stack.Screen name="History"    component={History} />
      <Stack.Screen name="Settings"   component={Settings} />

      {/* ── Settings sub-screens ─────────────────────────────────── */}
      <Stack.Screen name="SettingsTheme"         component={SettingsTheme} />
      <Stack.Screen name="SettingsLanguage"      component={SettingsLanguage} />
      <Stack.Screen name="SettingsPrintSize"     component={SettingsPrintSize} />
      <Stack.Screen name="SettingsDefaultFolder" component={SettingsDefaultFolder} />
      <Stack.Screen name="SettingsBackup"        component={SettingsBackup} />

      {/* ── Photo Tools ──────────────────────────────────────────── */}
      <Stack.Screen name="PhotoTools"            component={PhotoTools} />
      <Stack.Screen name="PhotoBackgroundRemove" component={PhotoBackgroundRemove} />
      <Stack.Screen name="PhotoBackgroundChanger" component={PhotoBackgroundChanger} />
      <Stack.Screen name="PhotoBatchRename"      component={PhotoBatchRename} />
      <Stack.Screen name="PhotoBatchResize"      component={PhotoBatchResize} />
      <Stack.Screen name="PhotoBlueBackground"   component={PhotoBlueBackground} />
      <Stack.Screen name="PhotoBlurBackground"   component={PhotoBlurBackground} />
      <Stack.Screen name="PhotoColorCorrection"  component={PhotoColorCorrection} />
      <Stack.Screen name="PhotoCompress"         component={PhotoCompress} />
      <Stack.Screen name="PhotoConverter"        component={PhotoConverter} />
      <Stack.Screen name="PhotoCrop"             component={PhotoCrop} />
      <Stack.Screen name="PhotoDpiConverter"     component={PhotoDpiConverter} />
      <Stack.Screen name="PhotoDuplicateFinder"  component={PhotoDuplicateFinder} />
      <Stack.Screen name="PhotoEnhance"          component={PhotoEnhance} />
      <Stack.Screen name="PhotoFaceCenter"       component={PhotoFaceCenter} />
      <Stack.Screen name="PhotoFaceRestore"      component={PhotoFaceRestore} />
      <Stack.Screen name="PhotoMetadataViewer"   component={PhotoMetadataViewer} />
      <Stack.Screen name="PhotoMirror"           component={PhotoMirror} />
      <Stack.Screen name="PhotoPassportPhoto"    component={PhotoPassportPhoto} />
      <Stack.Screen name="PhotoRedBackground"    component={PhotoRedBackground} />
      <Stack.Screen name="PhotoResize"           component={PhotoResize} />
      <Stack.Screen name="PhotoRotateFlip"       component={PhotoRotateFlip} />
      <Stack.Screen name="PhotoTransparentPng"   component={PhotoTransparentPng} />
      <Stack.Screen name="PhotoWatermark"        component={PhotoWatermark} />
      <Stack.Screen name="PhotoWhiteBackground"  component={PhotoWhiteBackground} />

      {/* ── Document Tools ───────────────────────────────────────── */}
      <Stack.Screen name="DocumentTools"         component={DocumentTools} />
      {/* Aadhaar */}
      <Stack.Screen name="DocumentAadhaar"       component={DocumentAadhaar} />
      <Stack.Screen name="AadhaarA4Layout"       component={AadhaarA4Layout} />
      <Stack.Screen name="AadhaarColorCorrection" component={AadhaarColorCorr} />
      <Stack.Screen name="AadhaarCopies"         component={AadhaarCopies} />
      <Stack.Screen name="AadhaarCrop"           component={AadhaarCrop} />
      <Stack.Screen name="AadhaarDetectBack"     component={AadhaarDetectBack} />
      <Stack.Screen name="AadhaarDetectFront"    component={AadhaarDetectFront} />
      <Stack.Screen name="AadhaarImageToSheet"   component={AadhaarImageToSheet} />
      <Stack.Screen name="AadhaarPdfToSheet"     component={AadhaarPdfToSheet} />
      {/* PAN */}
      <Stack.Screen name="DocumentPan"           component={DocumentPan} />
      <Stack.Screen name="PanA4Layout"           component={PanA4Layout} />
      <Stack.Screen name="PanColorEnhancement"   component={PanColorEnhancement} />
      <Stack.Screen name="PanCopies"             component={PanCopies} />
      <Stack.Screen name="PanCrop"               component={PanCrop} />
      <Stack.Screen name="PanSizeDetection"      component={PanSizeDetection} />
      {/* Voter */}
      <Stack.Screen name="DocumentVoter"         component={DocumentVoter} />
      <Stack.Screen name="VoterCopies"           component={VoterCopies} />
      <Stack.Screen name="VoterCrop"             component={VoterCrop} />
      <Stack.Screen name="VoterDetect"           component={VoterDetect} />
      <Stack.Screen name="VoterPrintLayout"      component={VoterPrintLayout} />
      {/* Driving License */}
      <Stack.Screen name="DocumentDrivingLicense" component={DocumentDrivingLicense} />
      <Stack.Screen name="DrivingBackCrop"       component={DrivingBackCrop} />
      <Stack.Screen name="DrivingCopies"         component={DrivingCopies} />
      <Stack.Screen name="DrivingFrontCrop"      component={DrivingFrontCrop} />
      <Stack.Screen name="DrivingPrintLayout"    component={DrivingPrintLayout} />
      {/* Passport */}
      <Stack.Screen name="DocumentPassport"      component={DocumentPassport} />
      <Stack.Screen name="PassportA4Layout"      component={PassportA4Layout} />
      <Stack.Screen name="PassportCrop"          component={PassportCrop} />
      <Stack.Screen name="PassportSizeDetection" component={PassportSizeDetect} />
      <Stack.Screen name="PassportValidation"    component={PassportValidation} />
      {/* PDF */}
      <Stack.Screen name="DocumentPdf"           component={DocumentPdf} />
      <Stack.Screen name="PdfCompress"           component={PdfCompress} />
      <Stack.Screen name="PdfDeletePages"        component={PdfDeletePages} />
      <Stack.Screen name="PdfExtractPages"       component={PdfExtractPages} />
      <Stack.Screen name="PdfFromImage"          component={PdfFromImage} />
      <Stack.Screen name="PdfInfo"               component={PdfInfo} />
      <Stack.Screen name="PdfMerge"              component={PdfMerge} />
      <Stack.Screen name="PdfOcr"               component={PdfOcr} />
      <Stack.Screen name="PdfPasswordProtect"    component={PdfPasswordProtect} />
      <Stack.Screen name="PdfRearrange"          component={PdfRearrange} />
      <Stack.Screen name="PdfRemovePassword"     component={PdfRemovePassword} />
      <Stack.Screen name="PdfRename"             component={PdfRename} />
      <Stack.Screen name="PdfRotate"             component={PdfRotate} />
      <Stack.Screen name="PdfSearch"             component={PdfSearch} />
      <Stack.Screen name="PdfSplit"              component={PdfSplit} />

      {/* ── QR Tools ─────────────────────────────────────────────── */}
      <Stack.Screen name="QrTools"     component={QrTools} />
      <Stack.Screen name="QrGenerator" component={QrGenerator} />
      <Stack.Screen name="QrScanner"   component={QrScanner} />

      {/* ── Barcode Tools ────────────────────────────────────────── */}
      <Stack.Screen name="BarcodeTools"     component={BarcodeGenerator} />
      <Stack.Screen name="BarcodeGenerator" component={BarcodeGenerator} />
      <Stack.Screen name="BarcodeScanner"   component={BarcodeScanner} />

      {/* ── Signature / Stamp ────────────────────────────────────── */}
      <Stack.Screen name="SignatureTools"   component={SignatureTools} />
      <Stack.Screen name="SignatureMaker"   component={SignatureMaker} />
      <Stack.Screen name="SignatureBgRemove" component={SignatureBgRemove} />
      <Stack.Screen name="StampMaker"       component={StampMaker} />
      <Stack.Screen name="StampCompany"     component={StampCompany} />
      <Stack.Screen name="StampCsc"         component={StampCsc} />

      {/* ── ID Card Tools ────────────────────────────────────────── */}
      <Stack.Screen name="IdCardTools"    component={IdCardTools} />
      <Stack.Screen name="IdCardCustom"   component={IdCardCustom} />
      <Stack.Screen name="IdCardEmployee" component={IdCardEmployee} />
      <Stack.Screen name="IdCardStudent"  component={IdCardStudent} />
      <Stack.Screen name="IdCardVisitor"  component={IdCardVisitor} />

      {/* ── Print Tools ──────────────────────────────────────────── */}
      <Stack.Screen name="PrintTools"          component={PrintTools} />
      <Stack.Screen name="PrintA4Layout"       component={PrintA4Layout} />
      <Stack.Screen name="PrintCustomPaper"    component={PrintCustomPaper} />
      <Stack.Screen name="PrintMultipleCopies" component={PrintMultipleCopies} />
      <Stack.Screen name="PrintPassportSheet"  component={PrintPassportSheet} />
      <Stack.Screen name="PrintPreview"        component={PrintPreview} />

      {/* ── Utility Tools ────────────────────────────────────────── */}
      <Stack.Screen name="UtilityTools"         component={UtilityTools} />
      <Stack.Screen name="UtilityAgeCalculator" component={UtilityAgeCalculator} />
      <Stack.Screen name="UtilityCalendar"      component={UtilityCalendar} />
      <Stack.Screen name="UtilityPercentageCalc" component={UtilityPercentageCalc} />
    </Stack.Navigator>
  );
}
