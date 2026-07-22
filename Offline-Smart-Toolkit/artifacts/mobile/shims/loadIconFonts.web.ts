/**
 * Web-only: load react-native-vector-icons fonts via webpack asset URLs.
 * Import this ONCE at the top of index.web.js before anything else.
 *
 * Webpack's asset/resource rule turns each require() into a hashed URL,
 * then we inject @font-face rules so the browser knows which CSS font-family
 * name maps to which glyph file. react-native-vector-icons uses the font-family
 * name from the glyph map (e.g. "MaterialCommunityIcons") to render icons.
 */

// ── Webpack bundles these TTFs as asset URLs ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MaterialCommunityIconsFont: string = require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf');
const MaterialIconsFont: string          = require('react-native-vector-icons/Fonts/MaterialIcons.ttf');
const IoniconsFont: string               = require('react-native-vector-icons/Fonts/Ionicons.ttf');
const FontAwesomeFont: string            = require('react-native-vector-icons/Fonts/FontAwesome.ttf');
const FontAwesome5SolidFont: string      = require('react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf');
const FontAwesome5RegularFont: string    = require('react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf');
const FontAwesome5BrandsFont: string     = require('react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf');
const FeatherFont: string                = require('react-native-vector-icons/Fonts/Feather.ttf');
const AntDesignFont: string              = require('react-native-vector-icons/Fonts/AntDesign.ttf');
const EntypoFont: string                 = require('react-native-vector-icons/Fonts/Entypo.ttf');
const EvilIconsFont: string              = require('react-native-vector-icons/Fonts/EvilIcons.ttf');
const OcticonsFont: string               = require('react-native-vector-icons/Fonts/Octicons.ttf');
const SimpleLineIconsFont: string        = require('react-native-vector-icons/Fonts/SimpleLineIcons.ttf');
const FontistoFont: string               = require('react-native-vector-icons/Fonts/Fontisto.ttf');
const FoundationFont: string             = require('react-native-vector-icons/Fonts/Foundation.ttf');
const ZocialFont: string                 = require('react-native-vector-icons/Fonts/Zocial.ttf');

// ── Build @font-face CSS and inject a <style> tag ────────────────────────────
function fontFace(family: string, url: string): string {
  return `@font-face { font-family: '${family}'; src: url('${url}') format('truetype'); font-weight: normal; font-style: normal; }`;
}

const css = [
  fontFace('MaterialCommunityIcons',  MaterialCommunityIconsFont),
  fontFace('Material Design Icons',   MaterialCommunityIconsFont),
  fontFace('MaterialIcons',           MaterialIconsFont),
  fontFace('Material Icons',          MaterialIconsFont),
  fontFace('Ionicons',                IoniconsFont),
  fontFace('FontAwesome',             FontAwesomeFont),
  fontFace('FontAwesome5Free-Solid',  FontAwesome5SolidFont),
  fontFace('FontAwesome5Free-Regular',FontAwesome5RegularFont),
  fontFace('FontAwesome5Brands-Regular', FontAwesome5BrandsFont),
  fontFace('Feather',                 FeatherFont),
  fontFace('AntDesign',               AntDesignFont),
  fontFace('Entypo',                  EntypoFont),
  fontFace('EvilIcons',               EvilIconsFont),
  fontFace('Octicons',                OcticonsFont),
  fontFace('SimpleLineIcons',         SimpleLineIconsFont),
  fontFace('Fontisto',                FontistoFont),
  fontFace('Foundation',              FoundationFont),
  fontFace('Zocial',                  ZocialFont),
].join('\n');

const style = document.createElement('style');
style.setAttribute('data-icon-fonts', 'react-native-vector-icons');
style.textContent = css;
document.head.appendChild(style);
