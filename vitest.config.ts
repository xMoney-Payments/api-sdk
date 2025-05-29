import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['stripe-node'],
    server: {
      deps: {
        inline: ['vitest-package-exports'],
      },
    },
  },
})
