// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), icon()],

  // Declarar las variables acá las valida en vez de dejarlas llegar como
  // undefined hasta el navegador. Un PUBLIC_WHATSAPP_PHONE que falta ahora
  // rompe el build, en lugar de generar links a "wa.me/undefined".
  env: {
    schema: {
      // Client: se inlinea en el bundle. No es un secreto, el número termina
      // igual en el href del link de WhatsApp.
      PUBLIC_WHATSAPP_PHONE: envField.string({
        context: "client",
        access: "public",
      }),
      // Secret: vive solo en el runtime del Worker, nunca en el bundle.
      // En local salen de .dev.vars; en producción, de `wrangler secret put`.
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
      // Casilla que recibe las consultas del formulario.
      CONTACT_TO_EMAIL: envField.string({ context: "server", access: "secret" }),
      // Remitente: tiene que ser un dominio verificado en Resend.
      CONTACT_FROM_EMAIL: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },

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