import { create } from 'zustand';
import { createUISlice } from './slices/createUISlice.js';
import { createDataSlice } from './slices/createDataSlice.js';

export const useERPStore = create((set, get) => ({
  ...createUISlice(set, get),
  ...createDataSlice(set, get)
}));
