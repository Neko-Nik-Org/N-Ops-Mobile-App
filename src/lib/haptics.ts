import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const o = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };
export const Haptics = {
  success: () => ReactNativeHapticFeedback.trigger('notificationSuccess', o),
  warning: () => ReactNativeHapticFeedback.trigger('notificationWarning', o),
  error: () => ReactNativeHapticFeedback.trigger('notificationError', o),
  light: () => ReactNativeHapticFeedback.trigger('impactLight', o),
};
