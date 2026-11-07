(() => {
    const nav = document.querySelector('.site-header .nav');
    const toggle = nav?.querySelector('.nav-toggle');
    const links = nav?.querySelector('.nav-links');

    if (!nav || !toggle || !links) return;

    const setMenuOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
        links.classList.toggle('is-open', open);
    };

    nav.classList.add('nav--collapsible');
    toggle.addEventListener('click', () => {
        setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    links.addEventListener('click', (event) => {
        if (event.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('click', (event) => {
        if (!nav.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false);
            toggle.focus();
        }
    });

    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
        if (event.matches) setMenuOpen(false);
    });
})();
