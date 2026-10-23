const F = await (await import('./film.js')).build();
window.DUR = F.dur; window.EV = F.ev || []; window.CHK = F.chk; window.render = t => F.render(t);
window.READY = true;
