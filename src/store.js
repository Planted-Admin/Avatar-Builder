import { create } from 'zustand'

import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is not set');
}

const pb = new PocketBase(pocketbaseUrl);

export const useConfiguratorStore = create((set) => ({
  categories: [],
  currentCategory: null,
  assests: [],
  fetchCategories: async () => {
    // you can also fetch all records at once via getFullList
    const categories = await pb.collection('CustomizationGroups').getFullList({
        sort: '+position',
    });
    const assets = await pb.collection('CustomizationAssets').getFullList({
        sort: '-created',
    });

    set({categories, currentCategory: categories[0], assests});
  },
  setcurrentCategory: (category) => set({currentCategory: category}),
}));

export default useConfiguratorStore;