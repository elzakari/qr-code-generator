import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { QRCode, QRFormData, GenerateQRResponse } from '../../types';
import { qrService } from '../../services/qr.service';

interface QRState {
  currentQR: GenerateQRResponse | null;
  history: QRCode[];
  generating: boolean;
  error: string | null;
  formData: Partial<QRFormData>;
}

const initialState: QRState = {
  currentQR: null,
  history: [],
  generating: false,
  error: null,
  formData: {},
};

export const generateQR = createAsyncThunk(
  'qr/generate',
  async (formData: QRFormData) => {
    return await qrService.generateQR(formData);
  }
);

export const fetchQRHistory = createAsyncThunk(
  'qr/fetchHistory',
  async () => {
    const result = await qrService.getUserQRCodes();
    return result.qrs || result;
  }
);

const qrSlice = createSlice({
  name: 'qr',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFormData: (state, action: PayloadAction<Partial<QRFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    clearFormData: (state) => {
      state.formData = {};
    },
    addToHistory: (state, action: PayloadAction<QRCode>) => {
      state.history.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate QR
      .addCase(generateQR.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateQR.fulfilled, (state, action) => {
        state.generating = false;
        state.currentQR = action.payload;
      })
      .addCase(generateQR.rejected, (state, action) => {
        state.generating = false;
        state.error = action.error.message || 'Failed to generate QR code';
      })
      // Fetch history
      .addCase(fetchQRHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { clearError, updateFormData, clearFormData, addToHistory } = qrSlice.actions;
export default qrSlice.reducer;