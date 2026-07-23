"use strict";
(self["webpackChunk_workspace_mobile"] = self["webpackChunk_workspace_mobile"] || []).push([["shims_expo-sharing_web_ts"],{

/***/ "./shims/expo-sharing.web.ts"
/*!***********************************!*\
  !*** ./shims/expo-sharing.web.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   isAvailableAsync: () => (/* binding */ isAvailableAsync),
/* harmony export */   shareAsync: () => (/* binding */ shareAsync)
/* harmony export */ });
/**
 * expo-sharing — web stub.
 * On web, sharing is handled directly by the Web Share API or download fallback
 * inside each screen. This stub satisfies dynamic imports.
 */
async function isAvailableAsync() {
  return false;
}
async function shareAsync(_url, _options) {
  // No-op on web — callers check isAvailableAsync() first.
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  isAvailableAsync,
  shareAsync
});

/***/ }

}]);
//# sourceMappingURL=shims_expo-sharing_web_ts.bundle.js.map