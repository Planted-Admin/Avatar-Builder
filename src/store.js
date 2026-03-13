import { create } from 'zustand';
import PocketBase from 'pocketbase';

// Use env var when set (localhost); fallback for Elestio static build where build-time env may be missing
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is Required');
}

export const pb = new PocketBase(pocketbaseUrl);

// Single in-flight fetch to avoid PocketBase "request was autocancelled" (e.g. React Strict Mode double-mount)
let categoriesFetchPromise = null;

export const useConfiguratorStore = create((set, get) => ({
  categories: [],
  currentCategory: null,
  assets: [],
  customization: {},
  fetchError: null,
  download: () => {},
  setDownload: (download) => set({ download }),
  clearFetchError: () => set({ fetchError: null }),
  fetchCategories: async () => {
    if (categoriesFetchPromise) {
      return categoriesFetchPromise;
    }
    set({ fetchError: null });
    categoriesFetchPromise = (async () => {
      try {
        const categories = await pb.collection('CustomizationGroups').getFullList({
          sort: "+position",
        });
        const assets = await pb.collection('CustomizationAssets').getFullList({
          sort: "-created",
        });
        const customization = {};
        categories.forEach((category) => {
          category.assets = assets.filter((asset) => asset.group === category.id);
          customization[category.name] = {};
          if (category.startingAsset) {
            customization[category.name].asset = category.assets.find(
              (asset) => asset.id === category.startingAsset
            );
          }
          if (!customization[category.name].asset && category.assets?.length > 0) {
            customization[category.name].asset = category.assets[0];
          }
        });

        set({ categories, currentCategory: categories[0], assets, customization });
      } catch (err) {
        console.error('PocketBase fetch failed:', err);
        const message = err?.message || err?.status || String(err);
        set({ fetchError: message });
      } finally {
        categoriesFetchPromise = null;
      }
    })();
    return categoriesFetchPromise;
  },
  setCurrentCategory: (category) => set({ currentCategory: category }),
  changeAsset: (category, asset) =>
    set((state) => ({
        customization: {
            ...state.customization,
            [category]: {
                ...state.customization[category],
                asset,
            },
        },
    })),
}));

