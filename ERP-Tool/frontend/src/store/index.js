import { configureStore } from '@reduxjs/toolkit';
import erpReducer from './erpSlice';

export const store = configureStore({
  reducer: {
    erp: erpReducer
  }
});
