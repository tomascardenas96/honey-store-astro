// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],

  vite: {
    plugins: [tailwindcss()],

    ssr: {
      optimizeDeps: {
        // astro/zod lo importan src/actions/index.ts y src/content.config.ts,
        // pero Vite no lo descubre en el primer escaneo: aparece recién cuando
        // se renderiza la primera página. Esa re-optimización a mitad de vuelo
        // recarga el grafo de módulos y deja dos instancias de React vivas al
        // mismo tiempo (react crudo desde .pnpm + el react que trae el chunk
        // optimizado de react-dom/server). El dispatcher de hooks queda en null
        // y cualquier componente con useState explota con "Invalid hook call".
        // Declararlo acá lo mete en el primer pase del optimizador.
        include: ["astro/zod"],
      },
    },
  },

  adapter: cloudflare({
    imageService: "compile",
  }),
});
