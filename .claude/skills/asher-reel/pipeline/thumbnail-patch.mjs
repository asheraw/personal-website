import fs from "fs";
let s = fs.readFileSync("index.html", "utf8");
const a = s.indexOf('<div class="board">'), b = s.indexOf('<div class="seam">');
s = s.slice(0, a) + '<div class="board"><img src="assets/board.jpg" style="position:absolute;left:0;top:0;width:100%;height:100%" /></div>\n  ' + s.slice(b);
s = s.replace(".board { position: absolute; left: 60px; top: 370px; width: 960px; height: 640px;", ".board { position: absolute; left: 60px; top: 440px; width: 960px; height: 552px;");
s = s.replace("top: 300px; display: flex", "top: 340px; display: flex").replace("right: 130px; top: 280px", "right: 130px; top: 320px");
s = s.replace(/<div class="tag">[\s\S]*?<\/div>/, '<div class="tag">another <b>COURSE</b>?</div>');
s = s.replace("font-size:60px !important; ", "").replace('66px "Montserrat"', '84px "Montserrat"');
fs.writeFileSync("index.html", s);
