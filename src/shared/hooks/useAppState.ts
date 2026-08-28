import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** Current app state ('active' | 'background' | 'inactive'), kept in sync. */
export function useAppState(): AppStateStatus {
  const [status, setStatus] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setStatus);
    return () => {
      subscription.remove();
    };
  }, []);

  return status;
}
