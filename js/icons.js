/* Flat inline SVG icon set (original artwork, no external assets). */
window.Icons = (function () {
  const svg = (body, vb = '0 0 32 32') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  return {
    start: svg('<path fill="#0a84ff" d="M3 6.2l11-1.5v10.3H3zM15.6 4.5L29 2.7V15H15.6zM3 16.6h11v10.2L3 25.3zM15.6 16.6H29v12.7l-13.4-1.8z"/>'),
    search: svg('<circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M20 20l8 8" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
    explorer: svg('<path fill="#f6c343" d="M2 8a3 3 0 013-3h7l3 3h12a3 3 0 013 3v15a3 3 0 01-3 3H5a3 3 0 01-3-3z"/><path fill="#fbd96b" d="M2 12a3 3 0 013-3h22a3 3 0 013 3v14a3 3 0 01-3 3H5a3 3 0 01-3-3z"/>'),
    folder: svg('<path fill="#f6c343" d="M2 8a3 3 0 013-3h7l3 3h12a3 3 0 013 3v15a3 3 0 01-3 3H5a3 3 0 01-3-3z"/><path fill="#fbd96b" d="M2 12a3 3 0 013-3h22a3 3 0 013 3v14a3 3 0 01-3 3H5a3 3 0 01-3-3z"/>'),
    file: svg('<path fill="#e8eaed" d="M7 2h12l7 7v19a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/><path fill="#b8bfc9" d="M19 2l7 7h-5a2 2 0 01-2-2z"/><path stroke="#8a93a1" stroke-width="1.6" d="M9 15h14M9 19h14M9 23h9"/>'),
    notepad: svg('<rect x="5" y="3" width="22" height="26" rx="3" fill="#4fc3f7"/><rect x="5" y="3" width="22" height="6" rx="3" fill="#0288d1"/><path stroke="#fff" stroke-width="1.8" stroke-linecap="round" d="M9 14h14M9 18h14M9 22h8"/>'),
    calculator: svg('<rect x="5" y="2" width="22" height="28" rx="3.5" fill="#455a64"/><rect x="8" y="5" width="16" height="6" rx="1.5" fill="#b2ebf2"/><g fill="#eceff1"><circle cx="10.5" cy="16" r="1.8"/><circle cx="16" cy="16" r="1.8"/><circle cx="21.5" cy="16" r="1.8"/><circle cx="10.5" cy="21" r="1.8"/><circle cx="16" cy="21" r="1.8"/><circle cx="21.5" cy="21" r="1.8"/></g><rect x="9" y="24.5" width="4" height="3.4" rx="1.6" fill="#eceff1"/><rect x="15" y="24.5" width="8" height="3.4" rx="1.6" fill="#0a84ff"/>'),
    settings: svg('<path fill="#78909c" d="M13 2h6l1 4 3 1.7 4-1.3 3 5.2-3 2.8v3.2l3 2.8-3 5.2-4-1.3L20 26l-1 4h-6l-1-4-3-1.7-4 1.3-3-5.2 3-2.8v-3.2L2 10.6l3-5.2 4 1.3L12 6z" transform="translate(-1 0) scale(1)"/><circle cx="16" cy="16" r="4.8" fill="#eceff1"/>'),
    browser: svg('<circle cx="16" cy="16" r="13" fill="#1e88e5"/><path fill="#43a047" d="M5 12c3-1 5 1 7 0s2-4 5-4c-1 3 1 4 0 6s-4 1-5 4-4 3-6 2c-2-2-2-6-1-8zM19 20c2-1 5-1 7 1-1 3-4 5-7 6-1-3-1-5 0-7z"/><path fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" d="M16 3a13 13 0 010 26M3 16h26"/>'),
    terminal: svg('<rect x="2" y="5" width="28" height="22" rx="3.5" fill="#263238"/><rect x="2" y="5" width="28" height="5" rx="3" fill="#37474f"/><path d="M7 14l5 4-5 4" fill="none" stroke="#69f0ae" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 23h9" stroke="#eceff1" stroke-width="2.2" stroke-linecap="round"/>'),
    paint: svg('<path fill="#ffd54f" d="M16 3C8 3 2.5 8.5 2.5 15.5c0 6 4.6 11.5 11 11.5 3 0 3.5-2.2 2.2-3.8-1.2-1.6-.4-3.7 1.8-3.7H23c4 0 6.5-2 6.5-5.4C29.5 7.3 23.5 3 16 3z"/><circle cx="9" cy="14" r="2.2" fill="#ef5350"/><circle cx="14" cy="9" r="2.2" fill="#42a5f5"/><circle cx="21" cy="10" r="2.2" fill="#66bb6a"/><circle cx="9.5" cy="20" r="2.2" fill="#ab47bc"/>'),
    computer: svg('<rect x="3" y="5" width="26" height="17" rx="2.5" fill="#42a5f5"/><rect x="5.5" y="7.5" width="21" height="12" rx="1" fill="#e3f2fd"/><rect x="12" y="24" width="8" height="2.6" fill="#78909c"/><rect x="8" y="26" width="16" height="2.4" rx="1.2" fill="#90a4ae"/>'),
    trash: svg('<path fill="#b0bec5" d="M7 9h18l-1.6 18a2 2 0 01-2 1.8H10.6a2 2 0 01-2-1.8z"/><rect x="5" y="6" width="22" height="3" rx="1.5" fill="#cfd8dc"/><rect x="12" y="3" width="8" height="3.2" rx="1.2" fill="#cfd8dc"/><path stroke="#78909c" stroke-width="1.6" stroke-linecap="round" d="M12.5 13v11M16 13v11M19.5 13v11"/>'),
    image: svg('<rect x="3" y="5" width="26" height="22" rx="3" fill="#e1f5fe"/><circle cx="21" cy="12" r="3" fill="#ffca28"/><path fill="#43a047" d="M3 24l8-9 6 6 4-4 8 8v2a3 3 0 01-3 3H6a3 3 0 01-3-3z"/>'),
    power: svg('<path d="M16 4v11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M9.5 8.5a10 10 0 1013 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'),
    wifi: svg('<path d="M3 12a19 19 0 0126 0M7 17a13 13 0 0118 0M11 22a7 7 0 0110 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="26" r="2" fill="currentColor"/>'),
    volume: svg('<path d="M4 12h5l7-6v20l-7-6H4z" fill="currentColor"/><path d="M21 11a7 7 0 010 10M24 7a12 12 0 010 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
    battery: svg('<rect x="3" y="9" width="23" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="5.5" y="11.5" width="15" height="9" rx="1.4" fill="currentColor"/><rect x="27" y="13" width="3" height="6" rx="1.2" fill="currentColor"/>'),
    bluetooth: svg('<path d="M9 10l14 12-7 6V4l7 6L9 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    plane: svg('<path d="M29 15L19 12 14 3h-3l2.5 9L6 13l-2-3H2l1.5 6L2 22h2l2-3 7.5 1L11 29h3l5-9 10-3z" fill="currentColor"/>'),
    moon: svg('<path d="M24 20.5A11 11 0 0111.5 8 11 11 0 1024 20.5z" fill="currentColor"/>'),
    sun: svg('<circle cx="16" cy="16" r="5.5" fill="currentColor"/><path stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l2.8 2.8M22.2 22.2L25 25M25 7l-2.8 2.8M9.8 22.2L7 25"/>'),
    back: svg('<path d="M20 5L9 16l11 11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    forward: svg('<path d="M12 5l11 11-11 11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    up: svg('<path d="M16 27V6M7 14l9-9 9 9" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    reload: svg('<path d="M26 14a10 10 0 10-2 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M27 5v9h-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'),
    plus: svg('<path d="M16 5v22M5 16h22" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
    user: svg('<circle cx="16" cy="12" r="6" fill="currentColor"/><path d="M4 29c0-7 5-11 12-11s12 4 12 11z" fill="currentColor"/>'),
    win: svg('<path fill="currentColor" d="M3 6.2l11-1.5v10.3H3zM15.6 4.5L29 2.7V15H15.6zM3 16.6h11v10.2L3 25.3zM15.6 16.6H29v12.7l-13.4-1.8z"/>')
  };
})();
