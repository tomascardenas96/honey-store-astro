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

  let current = 0;

  // Centra el slide `index` dentro del carril (coincide con snap-center).
  const goTo = (index: number) => {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    track.scrollTo({ left, behavior: behavior() });
  };

  // Actualiza dot activo y estado (disabled) de las flechas según el scroll.
  const sync = () => {
    const viewportCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let min = Infinity;
    slides.forEach((slide, i) => {
      const distance = Math.abs(
        slide.offsetLeft + slide.offsetWidth / 2 - viewportCenter,
      );
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

  window.addEventListener("resize", sync);
  sync();
}

document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(initCarousel);
