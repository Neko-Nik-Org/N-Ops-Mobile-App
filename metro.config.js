const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Load each module on first use instead of all at startup: faster cold start on both platforms.
  transformer: { getTransformOptions: async () => ({ transform: { experimentalImportSupport: false, inlineRequires: true } }) },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
