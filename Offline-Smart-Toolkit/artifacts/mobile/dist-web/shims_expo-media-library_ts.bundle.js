"use strict";
(self["webpackChunk_workspace_mobile"] = self["webpackChunk_workspace_mobile"] || []).push([["shims_expo-media-library_ts"],{

/***/ "../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/CameraRoll.js"
/*!**************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/CameraRoll.js ***!
  \**************************************************************************************************************************************************************************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react_native__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-native */ "../../node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/react-native-web/dist/exports/Platform/index.js");
/* harmony import */ var _nativeInterface__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./nativeInterface */ "../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/nativeInterface.js");
/* module decorator */ module = __webpack_require__.hmd(module);
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */




const invariant = __webpack_require__(/*! fbjs/lib/invariant */ "../../node_modules/.pnpm/fbjs@3.0.5/node_modules/fbjs/lib/invariant.js");
const GROUP_TYPES_OPTIONS = {
  Album: 'Album',
  All: 'All',
  // default
  Event: 'Event',
  Faces: 'Faces',
  Library: 'Library',
  PhotoStream: 'PhotoStream',
  SavedPhotos: 'SavedPhotos'
};
const ASSET_TYPE_OPTIONS = {
  All: 'All',
  Videos: 'Videos',
  Photos: 'Photos'
};

/**
 * Shape of the param arg for the `getPhotos` function.
 */

/**
 * `CameraRoll` provides access to the local camera roll or photo library.
 *
 * See https://facebook.github.io/react-native/docs/cameraroll.html
 */
class CameraRoll {
  static GroupTypesOptions = GROUP_TYPES_OPTIONS;
  static AssetTypeOptions = ASSET_TYPE_OPTIONS;

  /**
   * `CameraRoll.saveImageWithTag()` is deprecated. Use `CameraRoll.saveToCameraRoll()` instead.
   */
  static saveImageWithTag(tag) {
    console.warn('`CameraRoll.saveImageWithTag()` is deprecated. Use `CameraRoll.saveToCameraRoll()` instead.');
    return this.saveToCameraRoll(tag, 'photo');
  }

  /**
   * On iOS: requests deletion of a set of photos from the camera roll.
   * On Android: Deletes a set of photos from the camera roll.
   *
   */
  static deletePhotos(photoUris) {
    return _nativeInterface__WEBPACK_IMPORTED_MODULE_1__["default"].deletePhotos(photoUris);
  }

  /**
   * Saves the photo or video to the camera roll or photo library.
   *
   */
  static save(tag, options = {}) {
    let {
      type = 'auto',
      album = ''
    } = options;
    invariant(typeof tag === 'string', 'CameraRoll.saveToCameraRoll must be a valid string.');
    invariant(options.type === 'photo' || options.type === 'video' || options.type === 'auto' || options.type === undefined, `The second argument to saveToCameraRoll must be 'photo' or 'video' or 'auto'. You passed ${type || 'unknown'}`);
    if (type === 'auto') {
      if (['mov', 'mp4'].indexOf(tag.split('.').slice(-1)[0]) >= 0) {
        type = 'video';
      } else {
        type = 'photo';
      }
    }
    return _nativeInterface__WEBPACK_IMPORTED_MODULE_1__["default"].saveToCameraRoll(tag, {
      type,
      album
    });
  }
  static saveToCameraRoll(tag, type) {
    console.warn('CameraRoll.saveToCameraRoll(tag, type) is deprecated.  Use the save function instead');
    return CameraRoll.save(tag, {
      type
    });
  }
  static getAlbums(params = {
    assetType: ASSET_TYPE_OPTIONS.All
  }) {
    return _nativeInterface__WEBPACK_IMPORTED_MODULE_1__["default"].getAlbums(params);
  }
  static getParamsWithDefaults(params) {
    const newParams = {
      ...params
    };
    if (!newParams.assetType) {
      newParams.assetType = ASSET_TYPE_OPTIONS.All;
    }
    if (!newParams.groupTypes && react_native__WEBPACK_IMPORTED_MODULE_0__["default"].OS !== 'android') {
      newParams.groupTypes = GROUP_TYPES_OPTIONS.All;
    }
    return newParams;
  }

  /**
   * Returns a Promise with photo identifier objects from the local camera
   * roll of the device matching shape defined by `getPhotosReturnChecker`.
   *
   * See https://facebook.github.io/react-native/docs/cameraroll.html#getphotos
   */
  static getPhotos(params) {
    params = CameraRoll.getParamsWithDefaults(params);
    const promise = _nativeInterface__WEBPACK_IMPORTED_MODULE_1__["default"].getPhotos(params);
    if (arguments.length > 1) {
      console.warn('CameraRoll.getPhotos(tag, success, error) is deprecated.  Use the returned Promise instead');
      let successCallback = arguments[1];
      const errorCallback = arguments[2] || (() => {});
      promise.then(successCallback, errorCallback);
    }
    return promise;
  }
}
module.exports = CameraRoll;

/***/ },

/***/ "../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/nativeInterface.js"
/*!*******************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/nativeInterface.js ***!
  \*******************************************************************************************************************************************************************************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((__webpack_require__(/*! react-native */ "../../node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/react-native-web/dist/index.js").NativeModules).RNCCameraRoll);

/***/ },

/***/ "./shims/expo-media-library.ts"
/*!*************************************!*\
  !*** ./shims/expo-media-library.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createAssetAsync: () => (/* binding */ createAssetAsync),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getPermissionsAsync: () => (/* binding */ getPermissionsAsync),
/* harmony export */   requestPermissionsAsync: () => (/* binding */ requestPermissionsAsync),
/* harmony export */   saveToLibraryAsync: () => (/* binding */ saveToLibraryAsync)
/* harmony export */ });
/* harmony import */ var react_native__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-native */ "../../node_modules/.pnpm/react-native-web@0.21.2_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/react-native-web/dist/exports/Platform/index.js");
/**
 * expo-media-library — native shim using @react-native-community/cameraroll.
 *
 * On web the operations are no-ops (guarded by Platform.OS checks in screens).
 * On native, delegates to the cameraroll library already in this project.
 */

let _CameraRoll = null;
function getCameraRoll() {
  if (_CameraRoll) return _CameraRoll;
  try {
    // Package exports CameraRoll as named export
    const mod = __webpack_require__(/*! @react-native-community/cameraroll */ "../../node_modules/.pnpm/@react-native-community+cameraroll@4.1.2_react-native@0.81.5_@babel+core@7.29.7_@react-_af399a522da3979e0e7b28ee1a20d451/node_modules/@react-native-community/cameraroll/js/CameraRoll.js");
    _CameraRoll = mod.CameraRoll ?? mod.default ?? mod;
  } catch {
    _CameraRoll = null;
  }
  return _CameraRoll;
}
async function requestPermissionsAsync() {
  if (react_native__WEBPACK_IMPORTED_MODULE_0__["default"].OS === 'web') {
    return {
      status: 'denied',
      granted: false,
      canAskAgain: false
    };
  }
  // react-native-permissions or cameraroll handles permissions during save
  return {
    status: 'granted',
    granted: true,
    canAskAgain: true
  };
}
async function getPermissionsAsync() {
  return requestPermissionsAsync();
}
async function saveToLibraryAsync(uri) {
  if (react_native__WEBPACK_IMPORTED_MODULE_0__["default"].OS === 'web') return; // guarded by screen

  const CameraRoll = getCameraRoll();
  if (!CameraRoll) {
    console.warn('[expo-media-library shim] @react-native-community/cameraroll not available.');
    return;
  }
  await CameraRoll.save(uri, {
    type: 'photo'
  });
}
async function createAssetAsync(uri) {
  await saveToLibraryAsync(uri);
  return {
    uri,
    id: uri,
    filename: uri.split('/').pop() ?? 'image',
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
//# sourceMappingURL=shims_expo-media-library_ts.bundle.js.map