"use strict";
(self["webpackChunk_workspace_mobile"] = self["webpackChunk_workspace_mobile"] || []).push([["shims_expo-sharing_ts"],{

/***/ "./shims/expo-sharing.ts"
/*!*******************************!*\
  !*** ./shims/expo-sharing.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   isAvailableAsync: () => (/* binding */ isAvailableAsync),
/* harmony export */   shareAsync: () => (/* binding */ shareAsync)
/* harmony export */ });
/* harmony import */ var react_native__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-native */ "../../node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/react-native-web/dist/exports/Platform/index.js");
/**
 * expo-sharing — native shim using react-native-share.
 *
 * On web the original no-op behaviour is preserved (Web Share API / download
 * fallback is handled inside each screen). On native, delegates to the
 * react-native-share library that is already included in this project.
 */

let _Share = null;
function getShare() {
  if (_Share) return _Share;
  try {
    _Share = (__webpack_require__(/*! react-native-share */ "../../node_modules/.pnpm/react-native-share@10.2.1/node_modules/react-native-share/lib/module/index.js")["default"]);
  } catch {
    _Share = null;
  }
  return _Share;
}
async function isAvailableAsync() {
  if (react_native__WEBPACK_IMPORTED_MODULE_0__["default"].OS === 'web') return false;
  return getShare() !== null;
}
async function shareAsync(url, options = {}) {
  if (react_native__WEBPACK_IMPORTED_MODULE_0__["default"].OS === 'web') return; // handled by screen

  const Share = getShare();
  if (!Share) {
    console.warn('[expo-sharing shim] react-native-share not available.');
    return;
  }
  await Share.open({
    url,
    type: options.mimeType ?? 'application/octet-stream',
    title: options.dialogTitle,
    failOnCancel: false
  });
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  isAvailableAsync,
  shareAsync
});

/***/ }

}]);
//# sourceMappingURL=shims_expo-sharing_ts.bundle.js.map