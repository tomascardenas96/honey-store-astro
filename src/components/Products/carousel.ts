function initCarousel(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  const prevBtn = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const nextBtn = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const dots = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-carousel-dot]"),
  );
  if (!track) return;

  const slides = Array.from(track.children) as HTMLElement[];
  if (slides.length === 0) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const behavior = (): ScrollBehavior => (reduced.matches ? "auto" : "smooth");

  dots.forEach((dot) => {
    dot.dataset.label = dot.getAttribute("aria-label") ?? "";
  });

  // Posiciones de scroll reales del carril: la que centra cada slide, acotada
  // al rango alcanzable. Cuando caben varios slides por vista, varios colapsan
  // en la misma posición y forman una sola "página".
  let pages: number[] = [];
  let current = 0;

  const measure = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    pages = [];
    for (const slide of slides) {
      const target =
        slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      const position = Math.max(0, Math.min(target, maxScroll));
      if (pages.length === 0 || position - pages[pages.length - 1] > 1) {
        pages.push(position);
      }
    }
  };

  const updateDots = () => {
    dots.forEach((dot, i) => {
      const visible = i < pages.length;
      dot.style.display = visible ? "" : "none";
      if (visible) {
        dot.setAttribute(
          "aria-label",
          pages.length === dots.length
            ? dot.dataset.label!
            : `Ir a la página ${i + 1} de ${pages.length}`,
        );
      }
    });
  };

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, pages.length - 1));
    track.scrollTo({ left: pages[clamped], behavior: behavior() });
  };

  // Actualiza dot activo y estado (disabled) de las flechas según el scroll.
  const sync = () => {
    let closest = 0;
    let min = Infinity;
    pages.forEach((position, i) => {
      const distance = Math.abs(position - track.scrollLeft);
      if (distance < min) {
        min = distance;
        closest = i;
      }
    });

    current = closest;
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-current", i === closest ? "true" : "false"),
    );

    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 1;
    if (nextBtn) {
      nextBtn.disabled =
        track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    }
  };

  let ticking = false;
  track.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        sync();
      });
    },
    { passive: true },
  );

  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

  window.addEventListener("resize", () => {
    measure();
    updateDots();
    sync();
  });

  measure();
  updateDots();
  sync();
}

document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(initCarousel);
