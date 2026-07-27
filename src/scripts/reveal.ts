// Observa los elementos con `data-reveal` y alterna `data-reveal-state` entre
// "in" (dentro del viewport) y "out" (fuera). Los estilos viven en
// `@/styles/reveal.css`.
//
// Atributos soportados:
//   data-reveal="up|down|left|right|fade|zoom"  variante de la animación
//   data-reveal-delay="150"                     retraso de entrada en ms
//   data-reveal-once                            no vuelve a ocultarse al salir
//   data-reveal-stagger="80"                    en un contenedor: reparte el
//                                               retraso entre sus hijos directos

const SELECTOR = "[data-reveal]";

// Porción del elemento que tiene que verse para considerarlo dentro. La salida,
// en cambio, recién se dispara cuando no queda nada visible: esa histéresis
// evita el parpadeo cuando el borde queda justo en el límite.
const ENTER_RATIO = 0.15;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const DEFAULT_STAGGER = 80;

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

function show(el: HTMLElement) {
  if (el.dataset.revealState === "in") return;
  el.style.setProperty("--reveal-delay", `${el.dataset.revealDelay ?? 0}ms`);
  delete el.dataset.revealEdge;
  el.dataset.revealState = "in";
}

function hide(el: HTMLElement, edge: "top" | "bottom") {
  // La salida no espera: el retraso solo escalona las entradas.
  el.style.setProperty("--reveal-delay", "0ms");
  el.dataset.revealEdge = edge;
  el.dataset.revealState = "out";
}

// Reparte retrasos crecientes entre los hijos directos de cada contenedor con
// `data-reveal-stagger`, respetando los `data-reveal-delay` ya escritos a mano.
function applyStagger(scope: ParentNode) {
  const groups = scope.querySelectorAll<HTMLElement>("[data-reveal-stagger]");

  groups.forEach((group) => {
    const step = Number(group.dataset.revealStagger) || DEFAULT_STAGGER;
    group
      .querySelectorAll<HTMLElement>(`:scope > ${SELECTOR}`)
      .forEach((item, i) => {
        if (item.dataset.revealDelay === undefined) {
          item.dataset.revealDelay = String(i * step);
        }
      });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;

      // Un elemento más alto que la ventana nunca llega al 15% de sí mismo, así
      // que el umbral se mide contra lo que la ventana puede mostrar de él.
      const visible = Math.min(
        entry.boundingClientRect.height,
        window.innerHeight,
      );

      if (entry.isIntersecting) {
        if (entry.intersectionRect.height >= visible * ENTER_RATIO) {
          show(el);
          if (el.dataset.revealOnce !== undefined) observer.unobserve(el);
        }
      } else {
        hide(el, entry.boundingClientRect.bottom <= 0 ? "top" : "bottom");
      }
    }
  },
  { threshold: THRESHOLDS },
);

function init() {
  const elements = document.querySelectorAll<HTMLElement>(SELECTOR);

  // Sin soporte o con movimiento reducido dejamos todo visible y no observamos.
  if (!("IntersectionObserver" in window) || reduced.matches) {
    elements.forEach((el) => (el.dataset.revealState = "in"));
    return;
  }

  applyStagger(document);
  elements.forEach((el) => observer.observe(el));
}

// Avisa al script inline del layout que el módulo llegó a ejecutarse.
root.dataset.revealInit = "";
init();

// Compatible con las transiciones de vista de Astro, si algún día se activan.
document.addEventListener("astro:page-load", init);
