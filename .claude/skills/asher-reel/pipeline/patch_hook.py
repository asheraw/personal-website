p = 'build.mjs'
s = open(p, encoding='utf-8').read()
if 'const HOOK' not in s:
    s = s.replace('const html = `<!doctype html>', '// text HOOK at the very top of the video (Asher 2026-10-28): HOOK="AI SAID 8/10.|<b>BUY</b> IT?" (| = line break, <b> = gold word); 3-7 words\nconst HOOK = (process.env.HOOK || "").split("|").filter(Boolean).map((l) => `<div>${l}</div>`).join("");\nconst html = `<!doctype html>', 1)
    s = s.replace('  #flash { position: absolute;', '  #hook { position: absolute; left: 60px; right: 60px; top: 96px; z-index: 31; text-align: center; font: 800 96px/1.03 "Montserrat", sans-serif; color: #fff7ea; -webkit-text-stroke: .1em #0a0807; paint-order: stroke fill; opacity: 0; }\n  #hook b { color: #f0b865; } #hook div { white-space: nowrap; }\n  #flash { position: absolute;', 1)
    s = s.replace('  <div id="flash"></div>', '  ${HOOK ? `<div id="hook">${HOOK}</div>` : ""}\n  <div id="flash"></div>', 1)
    s = s.replace('    const tl = gsap.timeline({ paused: true });', '    const tl = gsap.timeline({ paused: true });\n    if (document.getElementById("hook")) { const h = document.getElementById("hook"); let sz = 96; while (sz > 64 && [...h.children].some((d) => d.getBoundingClientRect().width > 900)) { sz -= 4; h.style.fontSize = sz + "px"; } tl.fromTo("#hook", { opacity: 0, y: -30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, 0.15); }', 1)
    open(p, 'w', encoding='utf-8').write(s)
print(s.count('HOOK'))
