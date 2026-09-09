import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import type { AuthUser } from '../../api/types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** True when /auth/me failed with 404 or network error (backend likely not running). */
  backendUnavailable: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  backendUnavailable: false,
};

/** Serializable shape for rejected payloads (Redux requires no Error objects in actions). */
function toSerializableError(err: unknown): { message: string } {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return { message: msg };
}

function isBackendDown(payload: unknown): boolean {
  const msg =
    payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message: unknown }).message === 'string'
      ? (payload as { message: string }).message
      : String(payload ?? '');
  return (
    msg.includes('404') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed')
  );
}

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const user = await authApi.me();
    return user ?? null;
  } catch (err) {
    return rejectWithValue(toSerializableError(err));
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // Send the still-valid Firebase ID token so the backend can revoke its
    // refresh tokens; signing out locally first would make that impossible.
    await authApi.logout();
    await signOut(auth);
  } catch {
    // Always remove the local session even if the network is unavailable.
    await signOut(auth).catch(() => undefined);
    return rejectWithValue(null);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: { payload: AuthUser | null }) => {
      state.user = action.payload;
    },
    setLoading: (state, action: { payload: boolean }) => {
      state.loading = action.payload;
    },
    clearBackendUnavailable: (state) => {
      state.backendUnavailable = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.backendUnavailable = false;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.user = null;
        state.loading = false;
        state.backendUnavailable = isBackendDown(action.payload);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
      });
  },
});

export const { setUser, setLoading, clearBackendUnavailable } = authSlice.actions;
export default authSlice.reducer;
