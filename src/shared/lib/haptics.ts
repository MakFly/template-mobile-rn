import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Fire-and-forget haptic feedback, mirroring the assistant-ui expo example.
 * No-op on web; failures are swallowed (haptics are never worth an error).
 */
export const haptics = {
  light: () => {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  selection: () => {
    if (enabled) void Haptics.selectionAsync().catch(() => {});
  },
  success: () => {
    if (enabled)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
