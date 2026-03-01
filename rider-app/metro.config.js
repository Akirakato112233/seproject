const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const pushNotificationStub = path.resolve(__dirname, 'push-notification-ios-stub.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolved = context.resolveRequest(context, moduleName, platform);
  if (
    resolved &&
    resolved.filePath &&
    (resolved.filePath.includes('Libraries/PushNotificationIOS') ||
      resolved.filePath.includes('Libraries\\PushNotificationIOS'))
  ) {
    return { type: 'sourceFile', filePath: pushNotificationStub };
  }
  return resolved;
};

module.exports = config;
