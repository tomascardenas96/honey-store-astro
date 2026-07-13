function initCarousel(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  if (!track) return;

  const step = (dir: number) => {
    const slide = track.querySelector<HTMLElement>(":scope > *");
    const gap = 24; // gap-6 = 1.5rem
    const amount = slide ? slide.offsetWidth + gap : track.clientWidth;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: amount * dir,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  if (prev) prev.addEventListener("click", () => step(-1));
  if (next) next.addEventListener("click", () => step(1));
}

document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(initCarousel);
