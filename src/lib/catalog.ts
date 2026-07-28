import { getCollection } from "astro:content";
import { getImage } from "astro:assets";

// La forma "plana" y serializable de un producto: es lo que viaja desde el
// frontmatter de Astro hacia las islas de React como prop. Sin ImageMetadata
// ni objetos que React no pueda recibir.
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export async function getCatalog(): Promise<Product[]> {
  const products = await getCollection("productos");

  return Promise.all(
    products.map(async (product) => {
      const thumb = await getImage({
        src: product.data.image,
        width: 200,
        height: 200,
        format: "webp",
      });

      return {
        id: product.id,
        name: product.data.name,
        description: product.data.description,
        price: product.data.price,
        image: thumb.src,
      };
    }),
  );
}
