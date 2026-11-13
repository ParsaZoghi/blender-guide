// Chapters sidebar: highlight the part or step the reader has scrolled to.
(() => {
  const nav = document.querySelector('nav.toc');
  if (!nav) return;

  // Sidebar links that point into this page, paired with their target, in page order.
  const here = location.pathname;
  const items = [...nav.querySelectorAll('a[href]')]
    .map(a => {
      const url = new URL(a.href);
      const el = url.pathname === here && url.hash
        ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      return el && { a, el };
    })
    .filter(Boolean)
    .sort((x, y) => x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  if (!items.length) return;

  // The part link for this page stays marked while any of its steps is active.
  const partOf = new Map();
  let part = null;
  for (const li of nav.querySelectorAll('li')) {
    const a = li.querySelector('a');
    if (!li.classList.contains('sub')) part = a;
    else partOf.set(a, part);
  }

  let current = null;
  function setActive(item) {
    if (item === current) return;
    nav.querySelectorAll('a.active, a.active-part').forEach(a => {
      a.classList.remove('active', 'active-part');
      a.removeAttribute('aria-current');
    });
    current = item;
    if (!item) return;
    item.a.classList.add('active');
    item.a.setAttribute('aria-current', 'location');
    const parent = partOf.get(item.a);
    if (parent && parent !== item.a) parent.classList.add('active-part');
    // Keep the active link visible inside the sticky, scrollable sidebar without moving the page.
    if (nav.scrollHeight > nav.clientHeight) {
      const top = item.a.offsetTop, bottom = top + item.a.offsetHeight;
      if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) {
        nav.scrollTop = top - nav.clientHeight / 2;
      }
    }
  }

  function update() {
    const line = window.innerHeight * 0.3; // a heading counts once it passes the top third
    let found = items[0];
    for (const item of items) {
      if (item.el.getBoundingClientRect().top <= line) found = item;
      else break;
    }
    // At the very bottom, the last heading may never reach the line.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      found = items[items.length - 1];
    }
    setActive(found);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  update();
})();
