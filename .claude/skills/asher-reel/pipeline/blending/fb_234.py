"""Feedback round 1 for reels 2-4 (2026-11-17): chosen title hooks become the thumbnail copy, reel 3 SLOP much bigger, reel 4 opening text."""
p = 'reels.mjs'
s = open(p, encoding='utf-8').read()
def sub(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b, 1)
sub('copy: `WHO WOULD<br>${y("LISTEN?")}`, fs: 128', 'copy: `WHO CARES<br>ABOUT ${y("YOU?")}`, fs: 128')
sub('copy: `NO ${y("LOUD")}<br>NEEDED`, fs: 130', 'copy: `HOW I STAND<br>OUT AS AN<br>${y("INTROVERT")}`, fs: 112')
sub('<div class="h r" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:260px;transform:rotate(-8deg)">SLOP</div>',
    '<div class="h r" style="position:absolute;left:-120px;right:-120px;top:-140px;bottom:-140px;display:flex;align-items:center;justify-content:center;font-size:520px;line-height:1;transform:rotate(-8deg);text-shadow:0 0 30px #1d2824,0 0 60px #1d2824">SLOP</div>')
sub('H("No " + y("loud") + "<br>needed", "font-size:150px")', 'H("You don\'t need<br>to be " + y("loud"), "font-size:150px")')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
