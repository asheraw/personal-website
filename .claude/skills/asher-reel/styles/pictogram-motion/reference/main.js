const F = await (await import('./film.js')).build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = F.ev || []; window.CHK = F.chk; window.render = t => F.render(ctx, t);
window.READY = true;
