import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the PWA icons in public/ from public/logo.svg: npm run pwa-assets
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#4A374F' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#4A374F' } },
  },
  images: ['public/logo.svg'],
})
