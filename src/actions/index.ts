import { ActionError, defineAction } from "astro:actions";
// astro/zod y no "astro:schema": ese alias quedó marcado para borrarse en
// Astro 7 (create-vite.js) y este proyecto ya está en 7.x.
import { z } from "astro/zod";
import { sendContactEmail } from "@/lib/email";

export const server = {
  contacto: defineAction({
    // Recibe el FormData tal cual. Los atributos name del form son el
    // contrato: si no coinciden con estas claves, la validación falla.
    accept: "form",
    input: z.object({
      nombre: z.string().trim().min(1, "Ingresá tu nombre").max(80),
      apellido: z.string().trim().min(1, "Ingresá tu apellido").max(80),
      // El .pipe() no es capricho: en Zod 4 (el que trae Astro 7) z.email()
      // valida el formato ANTES de que corra un .trim() encadenado, así que un
      // mail pegado con espacios al final se rechazaría. Trimear y después
      // validar es el orden correcto.
      email: z.string().trim().pipe(z.email("Revisá tu email").max(160)),
      mensaje: z
        .string()
        .trim()
        .min(10, "Contanos un poco más")
        .max(2000, "El mensaje es demasiado largo"),
      // Honeypot: invisible para una persona, irresistible para un bot que
      // completa todo lo que encuentra.
      // Acepta cualquier valor a propósito. Si lo validáramos acá (un .max(0),
      // por ejemplo) el bot recibiría un 400 apuntando al campo "website" y
      // sabría exactamente qué dejar vacío en el próximo intento. El descarte
      // va en el handler, en silencio.
      website: z.string().optional(),
    }),
    handler: async ({ website, ...message }) => {
      // Al bot le devolvemos el mismo éxito que a una persona. Si le
      // contestáramos un error sabría que la trampa existe y reintentaría
      // sin tocar el campo.
      if (website) return { ok: true };

      try {
        await sendContactEmail(message);
      } catch (error) {
        // El detalle queda en el log del Worker. Al visitante le damos algo
        // accionable en vez del error crudo del proveedor.
        console.error("[contacto] falló el envío:", error);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp.",
        });
      }

      return { ok: true };
    },
  }),
};
