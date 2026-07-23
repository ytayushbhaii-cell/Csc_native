"use strict";
(self["webpackChunk_workspace_mobile"] = self["webpackChunk_workspace_mobile"] || []).push([["shims_expo-media-library_web_ts"],{

/***/ "./shims/expo-media-library.web.ts"
/*!*****************************************!*\
  !*** ./shims/expo-media-library.web.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createAssetAsync: () => (/* binding */ createAssetAsync),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getPermissionsAsync: () => (/* binding */ getPermissionsAsync),
/* harmony export */   requestPermissionsAsync: () => (/* binding */ requestPermissionsAsync),
/* harmony export */   saveToLibraryAsync: () => (/* binding */ saveToLibraryAsync)
/* harmony export */ });
/**
 * expo-media-library — web stub.
 * Gallery save is a native-only feature; screens guard it with Platform.OS checks.
 */
async function requestPermissionsAsync() {
  return {
    status: 'denied',
    granted: false,
    canAskAgain: false
  };
}
async function getPermissionsAsync() {
  return requestPermissionsAsync();
}
async function saveToLibraryAsync(_uri) {
  // No-op on web.
}
async function createAssetAsync(_uri) {
  return {
    uri: _uri,
    id: _uri,
    filename: '',
    mediaType: 'photo'
  };
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  requestPermissionsAsync,
  getPermissionsAsync,
  saveToLibraryAsync,
  createAssetAsync
});

/***/ }

}]);
//# sourceMappingURL=shims_expo-media-library_web_ts.bundle.js.map