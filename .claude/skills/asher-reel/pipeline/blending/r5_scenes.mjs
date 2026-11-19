// Reel 5 "Your home address", round 2 (2026-11-17 feedback): animated GPS map, Asher emojis, blurred thoughts that sharpen as he says them.
// Imported by reels.mjs (R[5].scenes). anim = JS body run every frame: (sc, lt, t, W) -> lt = seconds into the scene, W(re, after) = time of a spoken word.
const AE = (n, w = 260, st = "", id = "") => `<img ${id ? `id="${id}"` : ""} src="file:///D:/Work/Assets/asher-emoji/${n}.png" style="width:${w}px;height:auto;${st}">`;
const FE = (n, w = 200, st = "") => `<img src="file:///D:/Work/Assets/fluent-emoji/${n}_3d.png" style="width:${w}px;height:${w}px;${st}">`;
const U = (c, s = 200, st = "") => `<span class="u" style="font-size:${s}px;${st}">${c}</span>`;
const H = (t, st = "") => `<div class="h" style="${st}">${t}</div>`;
const y = (t) => `<span class="y">${t}</span>`, g = (t) => `<span class="g">${t}</span>`, r = (t) => `<span class="r">${t}</span>`;
const row = (h, gap = 60, st = "") => `<div class="row" style="gap:${gap}px;${st}">${h}</div>`;
const col = (h, gap = 24, st = "") => `<div class="col" style="gap:${gap}px;${st}">${h}</div>`;
const card = (h, cls = "", st = "", attr = "") => `<div class="card ${cls} col" ${attr} style="${st}">${h}</div>`;
const tag = (t) => `<div class="tag">${t}</div>`;
const note = (h, st = "") => `<div class="note" style="${st}">${h}</div>`;
const nums = (a) => row(a.map((x) => `<div class="num">${x}</div>`).join(""), 60);
const ar = (a, b, c = "yel", curve = 0) => `<i class="ar" data-a="${a}" data-b="${b}" data-c="${c}" data-curve="${curve}"></i>`;

// chalk street map (absolute, so the FIT scaling leaves it alone)
const streets = [250, 700, 1150, 1600].map((x) => `<line x1="${x}" y1="120" x2="${x}" y2="980" />`).join("") + [300, 540, 800].map((yy) => `<line x1="100" y1="${yy}" x2="1820" y2="${yy}" />`).join("");
const MAP = (inner) => `<svg class="mapsvg" viewBox="0 0 1920 1080" style="position:absolute;left:0;top:0;width:1920px;height:1080px"><g stroke="#93a099" stroke-opacity=".35" stroke-width="14" stroke-linecap="round">${streets}</g>${inner}</svg>`;
const CAR = `<text id="car" font-size="170" text-anchor="middle" dominant-baseline="central" style="font-family:'Segoe UI Emoji'">🚗</text>`;
const carAt = `const P=(p,L)=>{const q=p.getPointAtLength(Math.max(0,Math.min(p.getTotalLength(),L))),q2=p.getPointAtLength(Math.max(0,Math.min(p.getTotalLength(),L+6)));return [q.x,q.y,q2.x-q.x]};const put=(c,x,y,dx)=>{c.setAttribute('transform','translate('+x+','+(y-10)+')'+(dx<-0.5?' scale(-1,1)':''))};const ease=x=>x<0?0:x>1?1:x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;`;

const homeMap = MAP(`<path id="rt" d="M250 800 V540 H1600" fill="none" stroke="#ffd23f" stroke-width="14" stroke-dasharray="34 26" opacity="0"/>
<path id="drv" d="M100 950 H250 V800 H700 V300 H1150" fill="none" stroke="none"/>
<path id="np" d="M1150 300 V540 H1600" pathLength="1" fill="none" stroke="#ffd23f" stroke-width="18" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>
<text x="1600" y="560" font-size="170" text-anchor="middle" dominant-baseline="central" style="font-family:'Segoe UI Emoji';filter:drop-shadow(0 0 30px #ffd23f)">🏠</text>
<g id="rr" opacity="0"><rect x="560" y="110" width="800" height="150" rx="75" fill="#1d2824" stroke="#ffd23f" stroke-width="8"/><text x="960" y="210" font-size="96" text-anchor="middle" fill="#ffd23f" style="font-family:'Cabin Sketch'">Rerouting...</text></g>
<g id="lbl1" opacity="0"><text x="960" y="1010" font-size="80" text-anchor="middle" fill="#f3efe4" style="font-family:'Cabin Sketch'">Take any detour</text></g>${CAR}`);
const homeAnim = `${carAt}const m=sc.querySelector('.mapsvg'),drv=m.querySelector('#drv'),np=m.querySelector('#np'),car=m.querySelector('#car'),T0=t-lt;
const tD=(W(/^detour/,T0-1)??T0+3)-T0,tR=(W(/^rerouting/,T0-1)??T0+7.5)-T0,tH=(W(/^home/,T0+tR)??T0+tR+3)-T0;
m.querySelector('#rt').setAttribute('opacity',Math.min(1,Math.max(0,(lt-tD+0.3)/0.5)));m.querySelector('#lbl1').setAttribute('opacity',lt>tD&&lt<tR?1:0);
m.querySelector('#rr').setAttribute('opacity',lt>tR-0.1?Math.min(1,(lt-tR+0.1)/0.25):0);np.setAttribute('stroke-dashoffset',1-Math.min(1,Math.max(0,(lt-tR-0.2)/0.8)));
let x,yy,dx;if(lt<tD){[x,yy,dx]=P(drv,300*ease(lt/Math.max(.5,tD)))}else if(lt<tR+0.9){[x,yy,dx]=P(drv,300+1400*ease((lt-tD)/Math.max(.5,tR-tD)))}else{[x,yy,dx]=P(np,np.getTotalLength()*ease((lt-tR-0.9)/Math.max(.6,tH-tR-0.6)))}put(car,x,yy,dx);`;

const lostMap = MAP(`<path id="mess" d="M250 800 H1150 V300 H700 V800 H1600 V300 H250 V540 H1150 V800 H700 V540 H1600 V800 H250 V300 H1150 V540 H250 Z" fill="none" stroke="#ff7262" stroke-width="10" stroke-opacity=".55" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>${CAR}`);
const lostAnim = `${carAt}const m=sc.querySelector('.mapsvg'),p=m.querySelector('#mess'),car=m.querySelector('#car'),L=p.getTotalLength(),d=(lt*1500)%L;const[x,yy,dx]=P(p,d);put(car,x,yy,dx);p.setAttribute('stroke-dashoffset',Math.max(0,1-lt*0.35));`;

export const S5 = [
  { at: "How I go off topic", label: "Map: a car drives; the original route home appears; it detours; 'Rerouting...' and a new path home", note: "Car on a chalk map. 'Take any detour': the dashed route home appears while the car goes the long way. 'Rerouting': a new yellow path is drawn and the car follows it home.",
    html: homeMap, anim: homeAnim },
  { at: "Once you find your", label: "Once you find your core, it's easy to panic: 1 thing forever?", note: "Worried Asher emoji: 1 thing forever?", html: row(`<span>${AE("a1_12", 360)}</span>` + H("1 thing<br>" + r("forever?"), "font-size:160px"), 100) },
  { at: "What if you want to share", label: "What if you want to share a holiday, a book, or a bad day?", note: "Thinking Asher emoji; the 3 thoughts start blurred and sharpen as each is said.",
    html: row(`<span>${AE("a1_05", 360)}</span>` + row(card(U("🏖️", 170) + H("a holiday", "font-size:84px"), "", "padding:30px 50px", 'data-say="holiday"') + card(U("📖", 170) + H("a book", "font-size:84px"), "", "padding:30px 50px", 'data-say="book"') + card(U("🌧️", 170) + H("a bad day", "font-size:84px"), "", "padding:30px 50px", 'data-say="bad"'), 34), 70) },
  { at: "What you want is room", label: "What you want: room to be yourself, without people losing track", note: "Asher emojis doing different things: reading, guitar, cooking, gardening, running, selfie.",
    html: `${H("Room to be " + y("yourself"), "font-size:150px")}${row(AE("a3_08", 220) + AE("a3_21", 220) + AE("a3_18", 220) + AE("a3_19", 220) + AE("a3_01", 200) + AE("a3_12", 220), 26)}` },
  { at: "You can take side trips", label: "Side trips are fine. No home address: the car drives everywhere, pointlessly.", note: "The map again, no home: the car races around at random leaving a tangle of red roads.",
    html: lostMap + H(r("No home address"), "font-size:130px;background:#1d2824;padding:10px 50px 24px;border-radius:24px") + H("every post = a " + g("different road"), "font-size:96px;background:#1d2824;padding:10px 40px 20px;border-radius:24px;margin-top:460px"), anim: lostAnim },
  { at: "Say your", label: "Core: handling money calmly. A savings-habit post is a side trip.", note: "A piggy bank side trip that ends at home.", html: `${H("Core: money, " + y("calmly"))}${row(card(U("🐷", 220) + H("old savings habit", "font-size:80px"), "", "", 'id="side"') + `<span style="width:200px"></span>` + card(U("🏠", 220, "filter:drop-shadow(0 0 34px #ffd23f)") + H(y("what it taught me"), "font-size:84px"), "yc", "", 'id="hm"'), 60)}${ar("#side", "#hm", "yel", -120)}` },
  { at: "That's the GPS pulling", label: "That's the GPS pulling you home", note: "GPS pulls you home.", html: row(U("🧭", 280) + H("The GPS pulls you " + y("home"), "font-size:140px"), 70) },
  { at: "this is what I", label: "Set a home pin: write your core in 1 line, stick it where you write", note: "Asher writing his 1-line core; a home pin.", html: row(`<span>${AE("a3_25", 380)}</span>` + col(note(`<div style="font-size:72px">My core: <b style="padding:0 6px">______</b></div>`, "padding:30px 50px") + FE("round_pushpin", 200, "filter:drop-shadow(0 0 34px #ffd23f)") + H("Set a " + y("home pin")), 20), 90) },
  { at: "Before you post, ask", label: "Before you post, ask: does this lead back home? If yes, post it.", note: "Thumbs-up Asher: yes, post it.", html: row(H("Does this lead back " + y("home") + "?", "font-size:130px") + `<span>${AE("a1_26", 240)}</span>`, 60) + H("Yes? Post it.", "color:var(--grey)") },
  { at: "three parts of positioning", label: "I wrote about the 3 parts of positioning that keep content from sounding generic", note: "The 3 parts.", html: `${H("Stop sounding " + g("generic"))}${nums([1, 2, 3])}${H("3 parts of positioning", "color:var(--grey)")}` },
];
