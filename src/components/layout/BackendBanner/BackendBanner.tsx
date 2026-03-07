import {
  MessageBar,
  MessageBarBody,
  MessageBarActions,
  Button,
} from '@fluentui/react-components';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearBackendUnavailable } from '../../../store/slices/authSlice';

export function BackendBanner() {
  const backendUnavailable = useAppSelector((s) => s.auth.backendUnavailable);
  const dispatch = useAppDispatch();

  if (!backendUnavailable) return null;

  return (
    <MessageBar intent="warning" role="alert">
      <MessageBarBody>
        Server unavailable. Start the API server, or check your network connection.
      </MessageBarBody>
      <MessageBarActions>
        <Button
          appearance="transparent"
          size="small"
          onClick={() => dispatch(clearBackendUnavailable())}
          aria-label="Dismiss"
        >
          Dismiss
        </Button>
      </MessageBarActions>
    </MessageBar>
  );
}
