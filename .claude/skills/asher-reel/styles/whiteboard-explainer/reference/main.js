await document.fonts.load('italic 500 100px PF');
const q = new URLSearchParams(location.search);
const F = await (await import(q.get('scene') === 'mock' ? './mock.js' : './film.js')).build(q.get('look') || 'stage');
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = F.ev || []; window.CHK = F.chk; window.render = t => F.render(ctx, t);
window.READY = true;
