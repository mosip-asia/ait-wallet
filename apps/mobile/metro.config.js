/* eslint-disable @typescript-eslint/no-var-requires */
// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    watchFolders: [
      ...(defaultConfig.watchFolders || []),
      path.resolve(__dirname, '../../packages/branding'),
    ],
    transformer: {
      ...defaultConfig.transformer,
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      ...defaultConfig.resolver,
      assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    },
  };
})();
