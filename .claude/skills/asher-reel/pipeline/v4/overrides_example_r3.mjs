// Reel 3 hand-built scenes using the supplied Frankenstein artwork (Materials/). Called by deck.mjs with { EM, IMG }.
export default ({ EM, IMG, CUT }) => {
  const full = (f) => IMG(f, "position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover");
  const frame = (x, y, w, h, inner) => `<div class="abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:8px dashed var(--edge);border-radius:24px;overflow:hidden;background:#000">${inner}</div>`;
  return {
    victorFace: () => `<div class="abs" style="left:110px;top:200px;width:1000px"><h1 style="font-size:130px">AN OLD STORY ABOUT A SCIENTIST</h1><div style="font:700 70px var(--bf);margin-top:30px">named Frankenstein</div></div>${frame(1130, 160, 700, 760, IMG("Victor Frankenstein the Scientist.png", "position:absolute;width:2000px;left:-610px;top:20px"))}`,
    lab: () => full("Frankenstein’s Electrified Laboratory.png"),
    victorBubble: () => `${CUT("victor.png", "position:absolute;left:200px;top:30px;height:1030px")}<div class="abs" style="left:560px;top:10px;font-size:150px">💢</div><div class="bub" style="left:880px;top:230px;width:940px;font-size:130px">You did... WHAT?</div>`,
    feelsLike: () => `<div class="abs flex" style="left:0;right:0;top:0;bottom:0;padding:0 110px;text-align:center"><div style="font:900 180px/1.12 var(--hf);color:var(--head)">An offer that <span style="color:#111;background:#d7f27a;padding:0 16px;border-radius:12px">feels like yours</span></div></div>`,
    escape: () => full("Frankenstein’s Lab Escape.png"),
    demands: () => IMG("Monster demands.jpeg", "position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover"),
    borrowed: () => `<div class="abs" style="left:100px;top:110px;width:1080px"><h1 style="font-size:160px;line-height:1.04">A BORROWED OFFER DOES THAT TO YOU</h1></div>${frame(1230, 150, 600, 780, IMG("Frankenstein Monster.png", "position:absolute;width:1500px;left:-465px;top:10px"))}`,
    more: () => full("Monster demands more.jpeg"),
    moreList: () => `${full("Monster demands more.jpeg")}<div class="abs" style="left:0;right:0;bottom:0;padding:26px 90px 30px;background:rgba(0,0,0,.78);font:900 104px/1.12 var(--hf);color:#fff"><span style="color:#d7f27a">ANOTHER</span> MODULE<br><span style="color:#d7f27a">ANOTHER</span> BONUS<br><span style="color:#d7f27a">ANOTHER</span> FRAMEWORK</div>`,
    rule: () => `<div class="abs flex" style="left:0;right:0;top:40px;bottom:40px;flex-direction:column;text-align:center"><div style="font:700 74px var(--bf)">Borrow the</div><div style="font:900 240px/1 var(--hf);color:var(--acc)">STRUCTURE</div><div style="font:700 74px var(--bf);margin-top:26px">Bring the</div><div style="font:900 240px/1 var(--hf);color:#d7f27a">MATERIAL</div></div>`,
  };
};
