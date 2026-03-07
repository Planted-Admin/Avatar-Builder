import { create } from 'zustand'
import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL
const pb = pocketbaseUrl ? new PocketBase(pocketbaseUrl) : null

export const useConfiguratorStore = create((set) => ({
  categories: [],
  currentCategory: null,
  assets: [],
  fetchCategories: async () => {
    if (!pb) {
      console.warn('VITE_POCKETBASE_URL is not set; using empty data')
      return
    }
    try {
      const categories = await pb.collection('CustomizationGroups').getFullList({
        sort: '+position',
      })
      const assets = await pb.collection('CustomizationAssets').getFullList({
        sort: '-created',
      })
      set({ categories, currentCategory: categories[0] ?? null, assets })
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      set({ categories: [], currentCategory: null, assets: [] })
    }
  },
  setCurrentCategory: (category) => set({ currentCategory: category }),
}))

export default useConfiguratorStore;