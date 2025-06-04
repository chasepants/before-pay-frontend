// frontend/src/store/wishlistSlice.js
import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: true,
    error: null,
  },
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setWishlistLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setWishlistError: (state, action) => {
      state.items = [];
      state.loading = false;
      state.error = action.payload;
    },
    clearWishlist: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    addWishlistItem: (state, action) => {
      state.items.push(action.payload);
    },
    removeWishlistItem: (state, action) => {
      state.items = state.items.filter(item => item._id !== action.payload);
    },
  },
});

export const { setWishlist, setWishlistLoading, setWishlistError, clearWishlist, addWishlistItem, removeWishlistItem } = wishlistSlice.actions;
export default wishlistSlice.reducer;