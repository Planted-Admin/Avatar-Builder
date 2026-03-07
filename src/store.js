import { create } from 'zustand'

import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is not set');
}

const pb = new PocketBase(pocketbaseUrl);

const useConfiguratorStore = create((set) => ({
  categories: [],
  currentCategory: null,
  assests: [],
  fetchCategories: async () => {},

}))