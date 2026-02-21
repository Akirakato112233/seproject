const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      longdoMapApiKey: process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY,
    },
  };
};
