/*
Script injects the list of hosts, specified in config.xml, into the entitlements files
that cordova-ios generates for the application:

  platforms/ios/App/Entitlements-Debug.plist
  platforms/ios/App/Entitlements-Release.plist

Those are the files the Xcode project already points CODE_SIGN_ENTITLEMENTS at, so
nothing has to be changed about how the application is signed.
*/

var path = require('path');
var fs = require('fs');
var plist = require('plist');
var cordova_ios = require('cordova-ios');
var ASSOCIATED_DOMAINS = 'com.apple.developer.associated-domains';

// cordova-ios sets CODE_SIGN_ENTITLEMENTS to "$(TARGET_NAME)/Entitlements-$(CONFIGURATION).plist"
var BUILD_CONFIGURATIONS = ['Debug', 'Release'];

var context;
var entitlementsFilePaths;

module.exports = {
  generateAssociatedDomainsEntitlements: generateEntitlements
};

// region Public API

/**
 * Inject associated domains into the entitlements files of the project.
 *
 * @param {Object} cordovaContext - cordova context object
 * @param {Object} pluginPreferences - plugin preferences from config.xml; already parsed
 */
function generateEntitlements(cordovaContext, pluginPreferences) {
  context = cordovaContext;

  pathsToEntitlementsFiles().forEach(function(filePath) {
    var currentEntitlements = getEntitlementsFileContent(filePath);
    var newEntitlements = injectPreferences(currentEntitlements, pluginPreferences);

    saveContentToEntitlementsFile(filePath, newEntitlements);
  });
}

// endregion

// region Work with entitlements file

/**
 * Save data to entitlements file.
 *
 * @param {String} filePath - absolute path to the entitlements file
 * @param {Object} content - data to save; JSON object that will be transformed into xml
 */
function saveContentToEntitlementsFile(filePath, content) {
  fs.writeFileSync(filePath, plist.build(content), 'utf8');
}

/**
 * Read data from existing entitlements file. If none exist - default value is returned
 *
 * @param {String} filePath - absolute path to the entitlements file
 * @return {Object} entitlements file content
 */
function getEntitlementsFileContent(filePath) {
  var content;

  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return defaultEntitlementsFile();
  }

  return plist.parse(content);
}

/**
 * Get content for an empty entitlements file.
 *
 * @return {String} default entitlements file content
 */
function defaultEntitlementsFile() {
  return {};
}

/**
 * Inject list of hosts into entitlements file.
 *
 * @param {Object} currentEntitlements - entitlements where to inject preferences
 * @param {Object} pluginPreferences - list of hosts from config.xml
 * @return {Object} new entitlements content
 */
function injectPreferences(currentEntitlements, pluginPreferences) {
  var newEntitlements = currentEntitlements;
  var content = generateAssociatedDomainsContent(pluginPreferences);

  newEntitlements[ASSOCIATED_DOMAINS] = content;

  return newEntitlements;
}

/**
 * Generate content for associated-domains dictionary in the entitlements file.
 *
 * @param {Object} pluginPreferences - list of hosts from conig.xml
 * @return {Object} associated-domains dictionary content
 */
function generateAssociatedDomainsContent(pluginPreferences) {
  var domainsList = [];

  // generate list of host links
  pluginPreferences.hosts.forEach(function(host) {
    var link = domainsListEntryForHost(host);
    if (domainsList.indexOf(link) == -1) {
      domainsList.push(link);
    }
  });

  return domainsList;
}

/**
 * Generate domain record for the given host.
 *
 * @param {Object} host - host entry
 * @return {String} record
 */
function domainsListEntryForHost(host) {
  return 'applinks:' + host.name;
}

// endregion

// region Path helper methods

/**
 * Paths to the entitlements files of the project - one per build configuration.
 *
 * @return {String[]} absolute paths to the entitlements files
 */
function pathsToEntitlementsFiles() {
  if (entitlementsFilePaths === undefined) {
    var platformPath = path.join(getProjectRoot(), 'platforms', 'ios');
    var iosProject = new cordova_ios('ios', platformPath);

    entitlementsFilePaths = BUILD_CONFIGURATIONS.map(function(configuration) {
      return path.join(iosProject.locations.xcodeCordovaProj, 'Entitlements-' + configuration + '.plist');
    });
  }

  return entitlementsFilePaths;
}

/**
 * Projects root folder path.
 *
 * @return {String} absolute path to the projects root
 */
function getProjectRoot() {
  return context.opts.projectRoot;
}

// endregion
