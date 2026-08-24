/*
Script activates support for Universal Links in the application by setting proper preferences in the xcode project file.
Which is:
- deployment target set to the minimum that cordova-ios supports
- code signing left pointing at the entitlements files that cordova-ios generates

Content of those entitlements files is generated in another hook: projectEntitlements.js.
*/

var path = require('path');
var compare = require('node-version-compare');
var cordova_ios = require('cordova-ios');
var IOS_DEPLOYMENT_TARGET = '13.0';

// what cordova-ios puts in the project template
var DEFAULT_CODE_SIGN_ENTITLEMENTS = '"$(TARGET_NAME)/Entitlements-$(CONFIGURATION).plist"';

// what versions of this plugin up to 1.1.x used to put there instead
var LEGACY_CODE_SIGN_ENTITLEMENTS = /Resources[\/\\][^"]*\.entitlements/;

var COMMENT_KEY = /_comment$/;
var context;

module.exports = {
  enableAssociativeDomainsCapability: enableAssociativeDomainsCapability
}

// region Public API

/**
 * Activate associated domains capability for the application.
 *
 * @param {Object} cordovaContext - cordova context object
 */
function enableAssociativeDomainsCapability(cordovaContext) {
  context = cordovaContext;

  var projectFile = loadProjectFile();

  // adjust preferences
  activateAssociativeDomains(projectFile.xcode);

  // save changes
  projectFile.write();
}

// endregion

// region Alter project file preferences

/**
 * Activate associated domains support in the xcode project file:
 * - bump the deployment target if the project is below what cordova-ios needs;
 * - undo the Code Sign Entitlements override of older versions of this plugin.
 *
 * @param {Object} xcodeProject - xcode project preferences; all changes are made in that instance
 */
function activateAssociativeDomains(xcodeProject) {
  var configurations = nonComments(xcodeProject.pbxXCBuildConfigurationSection());
  var config;
  var buildSettings;
  var deploymentTargetIsUpdated;
  var entitlementsAreRestored;

  for (config in configurations) {
    buildSettings = configurations[config].buildSettings;

    // if deployment target is less then the required one - increase it
    if (buildSettings['IPHONEOS_DEPLOYMENT_TARGET']) {
      if (compare(buildSettings['IPHONEOS_DEPLOYMENT_TARGET'], IOS_DEPLOYMENT_TARGET) == -1) {
        buildSettings['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_DEPLOYMENT_TARGET;
        deploymentTargetIsUpdated = true;
      }
    } else {
      buildSettings['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_DEPLOYMENT_TARGET;
      deploymentTargetIsUpdated = true;
    }

    // Projects prepared by an older version of this plugin sign against a
    // <ProjectName>.entitlements of our own making, which shadows the per-configuration
    // files that cordova-ios and every other plugin write to. Hand signing back.
    if (LEGACY_CODE_SIGN_ENTITLEMENTS.test(buildSettings['CODE_SIGN_ENTITLEMENTS'] || '')) {
      buildSettings['CODE_SIGN_ENTITLEMENTS'] = DEFAULT_CODE_SIGN_ENTITLEMENTS;
      entitlementsAreRestored = true;
    }
  }

  if (deploymentTargetIsUpdated) {
    console.log('IOS project now has deployment target set as: ' + IOS_DEPLOYMENT_TARGET);
  }

  if (entitlementsAreRestored) {
    console.log('IOS project Code Sign Entitlements restored to: ' + DEFAULT_CODE_SIGN_ENTITLEMENTS);
  }
}

// endregion

// region Xcode project file helpers

/**
 * Load iOS project file from platform specific folder.
 *
 * @return {Object} projectFile - project file information
 */
function loadProjectFile() {
  var platformPath = iosPlatformPath();
  var iosProject = new cordova_ios('ios', platformPath);
  var pbxPath = iosProject.locations.pbxproj;

  var xcodeproj = require('xcode').project(pbxPath);
  xcodeproj.parseSync();

  return {
    xcode: xcodeproj,
    write: function () {
      var fs = require('fs');
      fs.writeFileSync(pbxPath, xcodeproj.writeSync());
    }
  };
}

/**
 * Remove comments from the file.
 *
 * @param {Object} obj - file object
 * @return {Object} file object without comments
 */
function nonComments(obj) {
  var keys = Object.keys(obj);
  var newObj = {};

  for (var i = 0, len = keys.length; i < len; i++) {
    if (!COMMENT_KEY.test(keys[i])) {
      newObj[keys[i]] = obj[keys[i]];
    }
  }

  return newObj;
}

// endregion

// region Path helpers

function iosPlatformPath() {
  return path.join(projectRoot(), 'platforms', 'ios');
}

function projectRoot() {
  return context.opts.projectRoot;
}

// endregion
