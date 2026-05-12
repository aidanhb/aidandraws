import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

function hexToChannels(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const hexColorChannels = {
  postcssPlugin: 'hex-color-channels',
  Declaration(decl) {
    if (decl.prop.startsWith('--color-') && /^#[0-9a-fA-F]{3,6}$/.test(decl.value.trim())) {
      decl.value = hexToChannels(decl.value.trim());
    }
  },
};

export default defineConfig({
  integrations: [tailwind(), react(), mdx()],
  vite: {
    server: {
      host: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.ngrok-free.dev',   // matches *.ngrok-free.dev (free tier)
        '.ngrok-free.app',   // matches *.ngrok-free.app (free tier alt)
        '.ngrok.io',         // matches *.ngrok.io (paid tier)
        'image-upturned-skyward.ngrok-free.dev',
      ],
    },
    css: {
      postcss: {
        plugins: [hexColorChannels],
      },
    },
  },
});
