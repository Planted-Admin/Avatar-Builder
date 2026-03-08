import { create } from 'zustand'
import PocketBase from 'pocketbase'

// Use env var when set (localhost); fallback for Elestio static build where build-time env may be missing
const pocketbaseUrl =
  import.meta.env.VITE_POCKETBASE_URL || 'https://pocketbase-u69392.vm.elestio.app'
const pb = new PocketBase(pocketbaseUrl)

const useConfiguratorStore = create((set) => ({
  categories: [],
  currentCategory: null,
  assets: [],
  customization: {},
  fetchCategories: async () => {

      const categories = await pb.collection('CustomizationGroups').getFullList({
        sort: '+position',
      })
      const assets = await pb.collection('CustomizationAssets').getFullList({
        sort: '-created',
      })
      const customization = {}
      categories.forEach((category) => {
        category.assets = assets.filter((asset) => asset.group === category.id)
        customization[category.name] = {}
      })

      set({ categories, currentCategory: categories[0], assets, customization })
  },
  setCurrentCategory: (category) => set({ currentCategory: category }),
  changeAsset: (category, asset) =>
    set((state) => ({
        customization: {
            ...state.customization,
            [category]: {
                ...state.customization[category],
                asset,
            }
        }
    })),
}))

export { pb, useConfiguratorStore }