/* eslint-disable @typescript-eslint/no-var-requires */
// Learn more https://docs.expo.io/guides/customizing-metro
const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);

  const brandingCandidates = [
    path.resolve(__dirname, '../../packages/branding'),
    path.resolve('/packages/branding'),
  ];
  const brandingDir = brandingCandidates.find(dir => fs.existsSync(dir));

  return {
    ...defaultConfig,
    watchFolders: [
      ...(defaultConfig.watchFolders || []),
      ...(brandingDir ? [brandingDir] : []),
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
