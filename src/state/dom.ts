/** Small DOM helpers for scrolling and focus. Kept out of the components so behavior stays consistent. */
export const PANEL_W = 404;
export const isWide = () => window.innerWidth > 860;

export const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Scroll the chart sideways so a card is not hidden behind the detail panel. */
export function reveal(id: string, panelOpen: boolean) {
  const c = document.querySelector<HTMLElement>(`[data-card="${id}"]`);
  const scroll = document.getElementById('chart-scroll');
  if (!c || !scroll) return;
  const r = c.getBoundingClientRect(), sr = scroll.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) return;
  const right = panelOpen && isWide() ? window.innerWidth - PANEL_W - 20 : sr.right - 16;
  if (r.right > right) scroll.scrollBy({ left: r.right - right, behavior: 'smooth' });
  else if (r.left < sr.left + 16) scroll.scrollBy({ left: r.left - sr.left - 16, behavior: 'smooth' });
}

/** After adding a role: bring the chart into view and put the cursor in the name field. */
export function afterAdd() {
  requestAnimationFrame(() => {
    scrollToSection('sec-chart');
    const f = document.getElementById('f-name') as HTMLInputElement | null;
    if (f) { f.focus({ preventScroll: true }); f.select(); }
  });
}
