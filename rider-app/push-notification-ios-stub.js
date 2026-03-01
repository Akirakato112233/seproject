/**
 * Stub for PushNotificationIOS when running in Expo (native module not linked).
 * Prevents "Cannot read property 'default' of undefined" when react-native-webview
 * or other code triggers loading of PushNotificationIOS.
 */
module.exports = {
  default: {
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
    requestPermissions: () => Promise.resolve({}),
    abandonPermissions: () => {},
    checkPermissions: () => Promise.resolve({}),
    getDeliveredNotifications: () => Promise.resolve([]),
    removeDeliveredNotifications: () => {},
    removeAllDeliveredNotifications: () => {},
    getSuggestedNotificationId: () => Promise.resolve(null),
    presentLocalNotification: () => {},
    scheduleLocalNotification: () => {},
    cancelAllLocalNotifications: () => {},
    removeListeners: () => {},
    getInitialNotification: () => Promise.resolve(null),
  },
};
