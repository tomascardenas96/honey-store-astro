import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const productos = defineCollection({
  // El "loader" le dice a Astro de dónde leer los productos.
  // glob = "leé todos los .md de esta carpeta". Cada archivo = un producto.
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),

  // El esquema. Fijate que image() viene como parámetro:
  // Astro te lo inyecta para poder validar archivos de imagen.
  schema: ({ image }) =>
    z.object({
      name: z.string(),

      // Obligatoria: decidiste que toda miel tiene descripción.
      description: z.string(),

      // Imagen validada: Astro verifica que el archivo exista.
      image: image(),

      price: z.number().positive(),
    }),
});

// Registrás la colección. La clave ("productos") es su nombre.
export const collections = { productos };
