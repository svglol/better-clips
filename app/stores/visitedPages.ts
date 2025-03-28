import { defineStore } from 'pinia'

export interface VisitedPage {
  path: string
  timestamp: number
  title?: string
  img?: string
}

export const useVisitedPagesStore = defineStore('visitedPages', {
  state: () => ({
    pages: [] as VisitedPage[],
  }),

  getters: {
    recentPages: (state) => {
      return [...state.pages].sort((a, b) => b.timestamp - a.timestamp)
    },

    hasVisitedPage: (state) => {
      return (path: string) => state.pages.some(page => page.path === path)
    },

    uniquePagesCount: (state) => {
      return new Set(state.pages.map(page => page.path)).size
    },
  },

  actions: {
    addVisitedPage(path: string, title?: string, img?: string) {
      const existingPageIndex = this.pages.findIndex(page => page.path === path)

      if (existingPageIndex !== -1) {
        if (this.pages[existingPageIndex]) {
          this.pages[existingPageIndex].timestamp = Date.now()
        }
      }
      else {
        this.pages.push({
          path,
          timestamp: Date.now(),
          title,
          img,
        })
      }
      this.limitVisitedPages(20)
    },

    removeVisitedPage(path: string) {
      this.pages = this.pages.filter(page => page.path !== path)
    },

    clearVisitedPages() {
      this.pages = []
    },

    limitVisitedPages(maxPages: number = 50) {
      if (this.pages.length > maxPages) {
        this.pages = this.pages
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-maxPages)
      }
    },
  },

  persist: {
    key: 'visitedPages',
    storage: piniaPluginPersistedstate.localStorage(),
  },
})
