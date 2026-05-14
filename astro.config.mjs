import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
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
  },
});
