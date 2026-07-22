/**
 * Web entry point for CSC Smart Toolkit (react-native-web + webpack).
 * Mirrors index.js but boots the React Native app into a DOM node.
 */
import './shims/loadIconFonts.web'; // inject @font-face CSS for vector icons
import 'react-native-gesture-handler'; // must precede any other RN import
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root'),
  initialProps: {},
});
