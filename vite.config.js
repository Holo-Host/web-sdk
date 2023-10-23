// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'holo_hosting_web_sdk',
      fileName: 'holo_hosting_web_sdk',
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
})