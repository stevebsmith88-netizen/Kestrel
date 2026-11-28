"""Draft 3 sticker generator: every sticker as one SVG, then review boards, print sheets and single files."""
import math, random, os, sys, json, re

BRAND = '/home/user/Kestrel/public/brand'
NAVY, CHESTNUT, DEEP, CREAM, BUFF, MIST, PAPER, SOFT, SLATE, LINE = '#1B2B4B', '#A4502C', '#8C4024', '#F7F1E6', '#D8B48A', '#DCE3E6', '#FBF8F2', '#2B3F5F', '#5A6672', '#E3D9C8'
INK = '#13203A'

def brand(name, x, y, w, h):
    s = open(os.path.join(BRAND, name)).read().strip()
    return s.replace('<svg ', f'<svg x="{x}" y="{y}" width="{w}" height="{h}" ', 1)

def site(x, y, fill, anchor='middle', size=14, op=1):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" class="site" font-size="{size}" fill="{fill}" fill-opacity="{op}">eyecarejobs.ca</text>'

def arc_site(pid, d, fill, size=14, op=1):
    return (f'<defs><path id="{pid}" d="{d}"></path></defs>'
            f'<text class="site" font-size="{size}" fill="{fill}" fill-opacity="{op}"><textPath href="#{pid}" startOffset="50%" text-anchor="middle">eyecarejobs.ca</textPath></text>')

def bottom_arc(cx, cy, r):
    return f'M {cx-r} {cy} A {r} {r} 0 0 0 {cx+r} {cy}'

def top_arc(cx, cy, r):
    return f'M {cx-r} {cy} A {r} {r} 0 0 1 {cx+r} {cy}'

def eye(cx, cy, w=41, lashes=True, sw=4):
    s = (f'<path d="M{cx-w} {cy} Q{cx} {cy-36*w/41} {cx+w} {cy} Q{cx} {cy+36*w/41} {cx-w} {cy} Z" fill="{PAPER}" stroke="{NAVY}" stroke-width="{sw}" stroke-linejoin="round"></path>'
         f'<circle cx="{cx+1}" cy="{cy}" r="{17*w/41:.1f}" fill="{SOFT}"></circle><circle cx="{cx+1}" cy="{cy}" r="{8*w/41:.1f}" fill="{INK}"></circle>'
         f'<circle cx="{cx+6*w/41:.1f}" cy="{cy-6*w/41:.1f}" r="{3.5*w/41:.1f}" fill="#FFFFFF"></circle>')
    if lashes:
        k = w / 41
        s += (f'<path d="M{cx-27*k} {cy-20*k} L{cx-33*k} {cy-34*k} M{cx-12*k} {cy-27*k} L{cx-15*k} {cy-43*k} M{cx+4*k} {cy-30*k} L{cx+6*k} {cy-46*k} '
              f'M{cx+20*k} {cy-26*k} L{cx+26*k} {cy-40*k}" stroke="{NAVY}" stroke-width="{sw}" stroke-linecap="round"></path>')
    return s

CLOUD = 'M8 24 Q14 8 24 14 Q30 2 42 10 Q52 0 60 12 Q72 8 72 22'

def puff_cloud(x, y, scale, colour, dash):
    return (f'<g transform="translate({x} {y}) scale({scale})"><path d="{CLOUD}" fill="none" stroke="{colour}" stroke-width="{2.6}" stroke-linecap="round" stroke-linejoin="round"></path>'
            f'<path d="M4 28 H76" stroke="{dash}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="1.5 5.5"></path></g>')

STICKERS = []
def add(num, sid, name, vbw, vbh, shapes, body, size_in):
    """shapes: list of SVG element strings with {F} where the fill goes; they make the die cut."""
    STICKERS.append(dict(num=num, id=sid, name=name, w=vbw, h=vbh, shapes=shapes, body=body, size=size_in))

# 1 Better 1 or 2 (smaller)
b = f'''<circle cx="210" cy="210" r="160" fill="none" stroke="{BUFF}" stroke-opacity="0.28" stroke-width="1.5"></circle>
<rect x="150" y="66" width="120" height="14" rx="7" fill="{SLATE}"></rect><rect x="186" y="76" width="48" height="90" rx="10" fill="{SLATE}"></rect><circle cx="210" cy="104" r="8" fill="{BUFF}"></circle>'''
for cx, n in ((140, '1'), (280, '2')):
    b += f'''<circle cx="{cx}" cy="134" r="62" fill="none" stroke="{BUFF}" stroke-width="3" stroke-dasharray="2 8"></circle><circle cx="{cx}" cy="134" r="54" fill="{SOFT}" stroke="#9AA3AB" stroke-width="4"></circle>
<circle cx="{cx}" cy="134" r="36" fill="{INK}" stroke="{BUFF}" stroke-width="3"></circle><circle cx="{cx}" cy="134" r="24" fill="{MIST}"></circle>
<text x="{cx}" y="145" text-anchor="middle" class="serif" font-size="30" fill="{NAVY}">{n}</text><path d="M{cx-14} 124 A18 18 0 0 1 {cx-2} 114" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round"></path>'''
b += f'''<circle cx="70" cy="134" r="10" fill="{CHESTNUT}"></circle><circle cx="350" cy="134" r="10" fill="{CHESTNUT}"></circle>
<text x="210" y="262" text-anchor="middle" class="serif" font-size="42" fill="{CREAM}">Better 1... or 2?</text>
<text x="210" y="292" text-anchor="middle" class="pop" font-size="13" fill="{BUFF}">They look the same to me too.</text>''' + arc_site('a1', bottom_arc(210, 210, 178), BUFF)
add(1, 'better', 'Better 1... or 2?', 420, 420, ['<circle cx="210" cy="210" r="196" fill="{F}"></circle>'], b, 2.5)

# 2 Sorry about the puff: original cloud puff and the startled eye
b = puff_cloud(36, 46, 2.9, CREAM, BUFF)
b += f'''<path d="M262 82 H278 M260 98 H282 M262 114 H278" stroke="{CREAM}" stroke-width="4" stroke-linecap="round" opacity="0.85"></path>''' + eye(334, 100)
b += f'''<text x="200" y="250" text-anchor="middle" class="serif" font-size="38" fill="#FFFFFF">Sorry about the puff.</text>''' + site(370, 304, CREAM, 'end', op=0.9)
add(2, 'puff', 'Sorry about the puff.', 400, 330, ['<rect x="0" y="0" width="400" height="330" rx="36" fill="{F}"></rect>'], b, 2.9)
STICKERS[-1]['bg'] = CHESTNUT

# 3 Slit lamp with a face in the chin rest
b = f'''<rect x="22" y="286" width="276" height="16" rx="8" fill="{SLATE}"></rect>
<rect x="74" y="150" width="14" height="138" rx="5" fill="{NAVY}"></rect><rect x="74" y="140" width="72" height="14" rx="6" fill="{NAVY}"></rect>
<rect x="60" y="104" width="34" height="20" rx="5" fill="{SLATE}"></rect><rect x="90" y="100" width="72" height="28" rx="8" fill="{NAVY}"></rect><rect x="158" y="104" width="10" height="20" rx="3" fill="{SLATE}"></rect>
<rect x="118" y="154" width="16" height="64" rx="4" fill="{SLATE}"></rect><rect x="112" y="210" width="28" height="12" rx="4" fill="{NAVY}"></rect>
<polygon points="134,170 200,121 200,126 134,178" fill="{BUFF}" opacity="0.95"></polygon>
<rect x="254" y="66" width="12" height="222" rx="6" fill="{NAVY}"></rect>
<path d="M214 82 Q232 66 250 74 V122 Q236 104 220 98 Z" fill="{DEEP}"></path>
<path d="M214 82 Q198 86 198 104 Q196 120 190 132 L172 150 Q170 157 180 159 L188 161 Q186 171 192 173 Q186 181 194 187 Q190 197 196 205 Q202 214 218 214 L250 214 L250 92 Q236 84 214 82 Z" fill="#E9CFAF" stroke="{NAVY}" stroke-width="3" stroke-linejoin="round"></path>
<path d="M196 122 Q203 117 210 122" fill="none" stroke="{NAVY}" stroke-width="3" stroke-linecap="round"></path><path d="M194 112 Q203 106 212 110" fill="none" stroke="{DEEP}" stroke-width="3" stroke-linecap="round"></path>
<rect x="210" y="76" width="44" height="12" rx="6" fill="{CHESTNUT}"></rect>
<rect x="204" y="212" width="52" height="12" rx="6" fill="{CHESTNUT}"></rect>
<text x="160" y="350" text-anchor="middle" class="serif" font-size="31" fill="{NAVY}">Chin on the rest.</text>
<text x="160" y="386" text-anchor="middle" class="serif" font-size="31" fill="{CHESTNUT}">Forehead forward.</text>''' + site(160, 416, SLATE)
add(3, 'slitlamp', 'Chin on the rest. Forehead forward.', 320, 430, ['<rect x="0" y="0" width="320" height="430" rx="30" fill="{F}"></rect>'], b, 3.2)
STICKERS[-1]['bg'] = PAPER

# 5 Old glasses (speech bubble)
b = f'''<path d="M126 76 L100 68 M294 76 L320 68" stroke="{DEEP}" stroke-width="7" stroke-linecap="round"></path>
<circle cx="160" cy="82" r="34" fill="{MIST}" stroke="{DEEP}" stroke-width="8"></circle><circle cx="260" cy="82" r="34" fill="{MIST}" stroke="{DEEP}" stroke-width="8"></circle>
<path d="M194 78 Q210 68 226 78" fill="none" stroke="{DEEP}" stroke-width="7"></path>
<g transform="rotate(-8 210 78)"><rect x="196" y="66" width="28" height="24" rx="3" fill="#FFFFFF" stroke="#C9D1D6" stroke-width="1.5"></rect><path d="M201 72 H219 M201 78 H219 M201 84 H219" stroke="#C9D1D6" stroke-width="1.2"></path></g>
<polyline points="246,58 256,76 249,88 266,104" fill="none" stroke="{NAVY}" stroke-width="1.8" stroke-linejoin="round"></polyline>
<path d="M140 70 A22 22 0 0 1 154 60" stroke="#FFFFFF" stroke-width="3.5" fill="none" stroke-linecap="round"></path>
<text x="210" y="160" text-anchor="middle" class="serif" font-size="30" fill="{NAVY}">Did you bring your</text>
<text x="210" y="200" text-anchor="middle" class="serif" font-size="40" fill="{CHESTNUT}">old glasses?</text>''' + site(388, 42, SLATE, 'end')
add(5, 'oldglasses', 'Did you bring your old glasses?', 420, 300, ['<path d="M40 12 H380 Q408 12 408 40 V200 Q408 228 380 228 H150 L70 286 L96 228 H40 Q12 228 12 200 V40 Q12 12 40 12 Z" fill="{F}"></path>'], b, 3.0)
STICKERS[-1]['bg'] = CREAM

# 6 Do not lick your lenses: no entry sign with a tongue
RED = '#B5524A'
b = f'''<path d="M142 268 Q138 362 174 370 Q210 362 206 268 Z" fill="#E58C8A"></path><path d="M174 296 V350" stroke="#C9706E" stroke-width="4" stroke-linecap="round"></path>
<path d="M156 352 Q174 340 192 352 Q174 362 156 352 Z" fill="#DCEAF0" stroke="#FFFFFF" stroke-width="2.5"></path>
<circle cx="174" cy="160" r="150" fill="{RED}"></circle><circle cx="174" cy="160" r="139" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2"></circle>
<path d="M128 112 Q174 48 220 112 Q174 100 128 112 Z" fill="#DCEAF0" fill-opacity="0.9" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"></path><path d="M146 94 Q158 78 176 74" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"></path>
<rect x="54" y="132" width="240" height="56" rx="10" fill="#FFFFFF"></rect>
<text x="174" y="170" text-anchor="middle" class="pop6" font-size="25" letter-spacing="2.5" fill="{RED}">DO NOT LICK</text>
<text x="174" y="234" text-anchor="middle" class="serif" font-size="34" fill="#FFFFFF">your lenses.</text>''' + arc_site('a6', top_arc(174, 160, 124), '#FFFFFF', op=0.9)
add(6, 'lick', 'Do not lick your lenses.', 348, 380, ['<circle cx="174" cy="160" r="150" fill="{F}"></circle>', '<path d="M142 268 Q138 362 174 370 Q210 362 206 268 Z" fill="{F}"></path>'], b, 2.8)

# 7 Give them 2 weeks: progressive lens, address follows the lens
b = f'''<defs><clipPath id="c7"><ellipse cx="210" cy="150" rx="182" ry="120"></ellipse></clipPath></defs>
<g clip-path="url(#c7)"><path d="M150 20 H270 L234 168 L238 280 H182 L186 168 Z" fill="{BUFF}" opacity="0.38"></path></g>
<ellipse cx="210" cy="150" rx="186" ry="124" fill="none" stroke="{NAVY}" stroke-width="8"></ellipse>
<rect x="6" y="138" width="22" height="24" rx="5" fill="{NAVY}"></rect><rect x="392" y="138" width="22" height="24" rx="5" fill="{NAVY}"></rect>
<path d="M70 92 A150 100 0 0 1 132 46" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round"></path>
<text x="210" y="62" text-anchor="middle" class="pop6" font-size="10" letter-spacing="2.4" fill="{SLATE}">DISTANCE</text>
<text x="210" y="124" text-anchor="middle" class="serif" font-size="40" fill="{NAVY}">Give them</text>
<text x="210" y="178" text-anchor="middle" class="serif" font-size="54" fill="{CHESTNUT}">2 weeks.</text>
<text x="210" y="208" text-anchor="middle" class="pop6" font-size="10" letter-spacing="2.4" fill="{SLATE}">NEAR</text>''' + arc_site('a7', 'M 46 150 A 164 104 0 0 0 374 150', NAVY, op=0.8)
add(7, 'twoweeks', 'Give them 2 weeks.', 420, 300, ['<ellipse cx="210" cy="150" rx="200" ry="138" fill="{F}"></ellipse>'], b, 3.0)
STICKERS[-1]['bg'] = '#EEF3F5'

# 8 Just look at the house (no target)
b = f'''<defs><clipPath id="c8"><circle cx="210" cy="210" r="166"></circle></clipPath></defs>
<g clip-path="url(#c8)"><rect x="0" y="0" width="420" height="146" fill="#BFD6E0"></rect>
<ellipse cx="128" cy="78" rx="34" ry="11" fill="#FFFFFF"></ellipse><ellipse cx="152" cy="70" rx="22" ry="11" fill="#FFFFFF"></ellipse><ellipse cx="300" cy="96" rx="28" ry="9" fill="#FFFFFF"></ellipse>
<rect x="0" y="140" width="420" height="140" fill="#8FA67A"></rect><path d="M0 146 Q105 128 210 138 Q315 128 420 144 L420 154 L0 154 Z" fill="#7A9168"></path>
<circle cx="160" cy="136" r="6" fill="#5F7552"></circle><circle cx="172" cy="134" r="8" fill="#5F7552"></circle><circle cx="262" cy="135" r="7" fill="#5F7552"></circle>
<path d="M126 256 L294 256 L213 140 L207 140 Z" fill="{SLATE}"></path><path d="M210 146 L210 254" stroke="{CREAM}" stroke-width="3" stroke-dasharray="11 9"></path>
<rect x="200" y="126" width="20" height="15" fill="{CREAM}"></rect><path d="M195 128 L210 114 L225 128 Z" fill="{CHESTNUT}"></path><rect x="207" y="132" width="6" height="9" fill="{DEEP}"></rect>
<rect x="0" y="250" width="420" height="200" fill="{NAVY}"></rect></g>
<circle cx="210" cy="210" r="166" fill="none" stroke="{BUFF}" stroke-width="2.5"></circle>
<circle cx="210" cy="210" r="158" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="1 11"></circle>
<text x="210" y="294" text-anchor="middle" class="serif" font-size="34" fill="{CREAM}">Just look</text>
<text x="210" y="332" text-anchor="middle" class="serif" font-size="34" fill="{BUFF}">at the house.</text>''' + arc_site('a8', bottom_arc(210, 210, 178), BUFF)
add(8, 'house', 'Just look at the house.', 420, 420, ['<circle cx="210" cy="210" r="196" fill="{F}"></circle>'], b, 2.9)
STICKERS[-1]['bg'] = NAVY

# 9 The dog ate them
paw = lambda x, y, r: f'<g fill="{BUFF}" opacity="0.45" transform="translate({x} {y}) rotate({r})"><ellipse cx="0" cy="6" rx="11" ry="9"></ellipse><circle cx="-11" cy="-7" r="4.5"></circle><circle cx="-4" cy="-13" r="4.5"></circle><circle cx="5" cy="-13" r="4.5"></circle><circle cx="12" cy="-7" r="4.5"></circle></g>'
b = paw(58, 196, -18) + paw(372, 50, 22) + f'''<circle cx="160" cy="86" r="34" fill="{SOFT}" stroke="{BUFF}" stroke-width="7"></circle><circle cx="260" cy="86" r="34" fill="{SOFT}" stroke="{BUFF}" stroke-width="7"></circle>
<path d="M194 82 Q210 72 226 82" fill="none" stroke="{BUFF}" stroke-width="7"></path><path d="M294 80 L330 72" stroke="{BUFF}" stroke-width="7" stroke-linecap="round"></path>
<path d="M126 80 L114 77" stroke="{BUFF}" stroke-width="7" stroke-linecap="round"></path><polyline points="112,77 106,70 102,80 95,72" fill="none" stroke="{BUFF}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
<path d="M122 60 L133 68 L130 55 L142 62 L145 48 L118 44 Z" fill="{NAVY}"></path>
<path d="M144 74 A20 20 0 0 1 156 66 M244 74 A20 20 0 0 1 256 66" stroke="#FFFFFF" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"></path>
<text x="210" y="172" text-anchor="middle" class="serif" font-size="38" fill="{CREAM}">The dog ate them.</text>
<text x="210" y="214" text-anchor="middle" class="serif" font-size="38" fill="{BUFF}">Again.</text>''' + site(392, 232, BUFF, 'end')
add(9, 'dog', 'The dog ate them. Again.', 420, 250, ['<rect x="0" y="0" width="420" height="250" rx="40" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = NAVY

# 10a / 10b Full Snellen chart, plain and double vision
SN = [('E', 78), ('F P', 50), ('T O Z', 36), ('L P E D', 27), ('P E C F D', 21), ('E D F C Z P', 16.5), ('F E L O P Z D', 13), ('D E F P O T E C', 10.5), ('L E F O D P C T', 8.5)]
ACU = ['20/200', '20/100', '20/70', '20/50', '20/40', '20/30', '20/25', '20/20', '20/15']
def snellen(double):
    out, y = '', 34
    for i, (row, sz) in enumerate(SN):
        y += max(sz + 9, 22) if i else sz + 4
        if double:
            out += f'<text x="{156+sz*0.12:.1f}" y="{y-sz*0.06:.1f}" text-anchor="middle" class="sans7" font-size="{sz}" fill="{CHESTNUT}" fill-opacity="0.38">{row}</text>'
        out += f'<text x="156" y="{y}" text-anchor="middle" class="sans7" font-size="{sz}" fill="{NAVY}">{row}</text>'
        out += f'<text x="26" y="{y}" class="pop" font-size="7" fill="{SLATE}">{i+1}</text><text x="292" y="{y}" text-anchor="end" class="pop" font-size="7" fill="{SLATE}">{ACU[i]}</text>'
        if i == 7:
            out += f'<rect x="48" y="{y+4}" width="216" height="2" fill="{RED}"></rect>'
    return out, y
body, yend = snellen(False)
b = f'<rect x="10" y="10" width="292" height="{yend+44}" rx="12" fill="none" stroke="{LINE}" stroke-width="1.5"></rect>' + body + site(156, yend + 34, SLATE)
h10 = yend + 64
add('10a', 'snellen', 'Full Snellen chart', 312, h10, [f'<rect x="0" y="0" width="312" height="{h10}" rx="18" fill="{{F}}"></rect>'], b, 3.4)
STICKERS[-1]['bg'] = '#FFFFFF'
body, yend = snellen(True)
cap = yend + 52
b = f'<rect x="10" y="10" width="292" height="{cap+62}" rx="12" fill="none" stroke="{LINE}" stroke-width="1.5"></rect>' + body
b += f'''<text x="160" y="{cap+3}" text-anchor="middle" class="serif" font-size="21" fill="{CHESTNUT}" fill-opacity="0.35">Is it blurry, or is it double?</text>
<text x="156" y="{cap}" text-anchor="middle" class="serif" font-size="21" fill="{NAVY}">Is it blurry, or is it double?</text>''' + site(156, cap + 34, SLATE)
h10b = cap + 82
add('10b', 'snellendouble', 'Full Snellen chart, double vision', 312, h10b, [f'<rect x="0" y="0" width="312" height="{h10b}" rx="18" fill="{{F}}"></rect>'], b, 3.6)
STICKERS[-1]['bg'] = '#FFFFFF'

# 11 Shirt
b = f'''<path d="M136 26 Q190 66 244 26" fill="none" stroke="{DEEP}" stroke-width="7" stroke-linecap="round"></path>
<path d="M157 80 L150 46 M223 80 L230 46" stroke="{CREAM}" stroke-width="4" stroke-linecap="round"></path>
<circle cx="172" cy="88" r="16" fill="{MIST}" stroke="{CREAM}" stroke-width="4"></circle><circle cx="208" cy="88" r="16" fill="{MIST}" stroke="{CREAM}" stroke-width="4"></circle>
<path d="M186 86 Q190 82 194 86" fill="none" stroke="{CREAM}" stroke-width="3"></path>
<ellipse cx="128" cy="300" rx="20" ry="13" fill="{CREAM}" opacity="0.13"></ellipse><ellipse cx="252" cy="292" rx="16" ry="11" fill="{CREAM}" opacity="0.13"></ellipse><ellipse cx="244" cy="316" rx="10" ry="7" fill="{CREAM}" opacity="0.13"></ellipse>
<text x="190" y="176" text-anchor="middle" class="serif" font-size="28" fill="{CREAM}">No, your shirt</text>
<text x="190" y="212" text-anchor="middle" class="serif" font-size="28" fill="{CREAM}">is not a</text>
<text x="190" y="258" text-anchor="middle" class="serif" font-size="38" fill="#FFFFFF">lens cloth.</text>''' + site(190, 338, CREAM, op=0.9)
add(11, 'shirt', 'No, your shirt is not a lens cloth.', 380, 380, ['<path d="M126 22 Q190 58 254 22 L356 70 L318 150 L288 136 V352 Q190 364 92 352 V136 L62 150 L24 70 Z" fill="{F}"></path>'], b, 2.9)
STICKERS[-1]['bg'] = CHESTNUT

# 13 Chart: you're doing great
b = f'''<rect x="10" y="10" width="240" height="400" rx="12" fill="none" stroke="{LINE}" stroke-width="1.5"></rect>
<g class="pop" font-size="7" fill="{SLATE}"><text x="22" y="112">20/200</text><text x="22" y="178">20/100</text><text x="22" y="224">20/70</text><text x="22" y="258">20/50</text><text x="22" y="284">20/40</text><text x="22" y="304">20/20</text></g>
<text x="138" y="118" text-anchor="middle" class="sans7" font-size="92" fill="{NAVY}">1</text>
<text x="138" y="182" text-anchor="middle" class="sans7" font-size="46" letter-spacing="6" fill="{NAVY}">OR 2</text>
<text x="138" y="226" text-anchor="middle" class="sans7" font-size="29" letter-spacing="5" fill="{NAVY}">BETTER</text>
<text x="138" y="260" text-anchor="middle" class="sans7" font-size="19" letter-spacing="4" fill="{NAVY}">OR WORSE</text>
<text x="138" y="286" text-anchor="middle" class="sans7" font-size="12.5" letter-spacing="3" fill="{NAVY}">STILL WITH ME</text>
<text x="138" y="306" text-anchor="middle" class="sans7" font-size="8" letter-spacing="2.4" fill="{CHESTNUT}">YOU&apos;RE DOING GREAT</text>
<rect x="30" y="326" width="100" height="50" rx="6" fill="{RED}"></rect><rect x="130" y="326" width="100" height="50" rx="6" fill="#5E8C61"></rect><rect x="124" y="326" width="12" height="50" fill="#5E8C61"></rect>
<circle cx="80" cy="351" r="12" fill="none" stroke="{NAVY}" stroke-width="4"></circle><circle cx="180" cy="351" r="12" fill="none" stroke="{NAVY}" stroke-width="4"></circle>''' + site(130, 401, SLATE)
add(13, 'chart', "You're doing great chart", 260, 420, ['<rect x="0" y="0" width="260" height="420" rx="18" fill="{F}"></rect>'], b, 3.3)
STICKERS[-1]['bg'] = '#FFFFFF'

# 14 Rx coffee
b = f'''<circle cx="226" cy="132" r="36" fill="none" stroke="{DEEP}" stroke-opacity="0.16" stroke-width="6"></circle>
<text x="28" y="72" class="serif" font-size="54" fill="{CHESTNUT}">Rx</text>
<text x="312" y="44" text-anchor="end" class="pop6" font-size="9" letter-spacing="2" fill="{SLATE}">FOR: THE WHOLE TEAM</text>'''
for y, k, v in ((112, 'OD', 'coffee'), (152, 'OS', 'more coffee'), (192, 'ADD', '+2.50 patience')):
    b += f'<text x="28" y="{y}" class="pop6" font-size="14" fill="{SLATE}">{k}</text><text x="84" y="{y}" class="serif" font-size="25" fill="{NAVY}">{v}</text>'
    if y < 190:
        b += f'<rect x="28" y="{y+10}" width="284" height="1.5" fill="{LINE}"></rect>'
b += f'''<path d="M262 196 Q256 188 262 180 Q268 172 262 164 M282 196 Q276 188 282 180 Q288 172 282 164" fill="none" stroke="{SLATE}" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round"></path>
<path d="M244 208 H300 L294 252 Q292 260 284 260 H260 Q252 260 250 252 Z" fill="{CHESTNUT}"></path><rect x="247" y="222" width="50" height="14" fill="{DEEP}"></rect>
<ellipse cx="272" cy="208" rx="28" ry="6" fill="#5C3320"></ellipse><path d="M300 216 Q318 216 316 230 Q314 244 296 244" fill="none" stroke="{CHESTNUT}" stroke-width="6" stroke-linecap="round"></path>''' + site(28, 258, SLATE, 'start')
add(14, 'rx', 'Rx: coffee, more coffee', 340, 280, ['<rect x="0" y="0" width="340" height="280" rx="18" fill="{F}"></rect>'], b, 2.9)
STICKERS[-1]['bg'] = PAPER

# 15 20/20 hindsight: house added, address centred in the navy band
b = f'''<rect x="212" y="0" width="36" height="40" rx="8" fill="{SLATE}"></rect>
<defs><clipPath id="c15"><rect x="30" y="50" width="400" height="130" rx="52"></rect></clipPath></defs>
<g clip-path="url(#c15)"><rect x="30" y="50" width="400" height="130" fill="#BFD6E0"></rect><rect x="30" y="150" width="400" height="40" fill="#8FA67A"></rect>
<path d="M174 182 L286 182 L233 150 L227 150 Z" fill="{SLATE}"></path><path d="M230 154 V180" stroke="{CREAM}" stroke-width="2" stroke-dasharray="6 5"></path>
<rect x="223" y="140" width="14" height="10" fill="{CREAM}"></rect><path d="M220 141 L230 132 L240 141 Z" fill="{CHESTNUT}"></path><rect x="228" y="144" width="4" height="6" fill="{DEEP}"></rect>
<path d="M60 50 L120 50 L60 130 Z M140 50 L170 50 L80 170 L60 170 Z" fill="#FFFFFF" opacity="0.28"></path></g>
<text x="230" y="102" text-anchor="middle" class="serif" font-size="56" fill="{NAVY}">20/20</text>
<text x="230" y="124" text-anchor="middle" class="pop6" font-size="13" letter-spacing="4.5" fill="{CHESTNUT}">HINDSIGHT</text>''' + site(230, 210, BUFF)
add(15, 'hindsight', '20/20 hindsight', 460, 236, ['<rect x="212" y="0" width="36" height="40" rx="8" fill="{F}"></rect>', '<rect x="10" y="30" width="440" height="196" rx="70" fill="{F}"></rect>'], b, 3.4)
STICKERS[-1]['bg'] = NAVY
STICKERS[-1]['bgs'] = [SLATE, NAVY]

# 16 Plano and proud: address around the lens
b = f'''<rect x="103" y="210" width="5" height="90" rx="2.5" fill="#FFFFFF" opacity="0.5"></rect>
<text x="115" y="292" text-anchor="middle" class="pop6" font-size="10" fill="{NAVY}">0.00</text>
<circle cx="115" cy="115" r="98" fill="#F2F6F7" stroke="#9AA3AB" stroke-width="14"></circle>
<circle cx="115" cy="115" r="98" fill="none" stroke="{SLATE}" stroke-width="4" stroke-dasharray="1.5 4"></circle>
<circle cx="115" cy="115" r="89" fill="none" stroke="#C9D1D6" stroke-width="2"></circle>
<path d="M50 84 A70 70 0 0 1 84 48 M58 104 A60 60 0 0 1 66 88" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"></path>
<text x="115" y="112" text-anchor="middle" class="serif" font-size="42" fill="{NAVY}">Plano</text>
<text x="115" y="138" text-anchor="middle" class="pop6" font-size="12" letter-spacing="3" fill="{CHESTNUT}">AND PROUD</text>''' + arc_site('a16', bottom_arc(115, 115, 74), SLATE, size=12)
add(16, 'plano', 'Plano and proud', 230, 320, ['<rect x="99" y="190" width="32" height="120" rx="10" fill="{F}"></rect>', '<circle cx="115" cy="115" r="106" fill="{F}"></circle>'], b, 3.0)
STICKERS[-1]['bgs'] = ['#9AA3AB', '#F2F6F7']

# 17 PD
ticks = ' '.join(f'M{30+i*400/60:.1f} 240 V{240-(22 if i%10==0 else 14 if i%5==0 else 8)}' for i in range(61))
b = ''
for cx in (150, 310):
    b += f'<path d="M{cx-46} 66 Q{cx} 30 {cx+46} 66 Q{cx} 102 {cx-46} 66 Z" fill="#FFFFFF" stroke="{NAVY}" stroke-width="4" stroke-linejoin="round"></path><circle cx="{cx}" cy="66" r="19" fill="{SOFT}"></circle><circle cx="{cx}" cy="66" r="8" fill="{INK}"></circle><circle cx="{cx+5}" cy="60" r="3.5" fill="#FFFFFF"></circle>'
b += f'''<path d="M150 88 V126 M310 88 V126" stroke="{CHESTNUT}" stroke-width="2" stroke-dasharray="4 4"></path>
<path d="M154 118 H306 M162 111 L154 118 L162 125 M298 111 L306 118 L298 125" fill="none" stroke="{CHESTNUT}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
<rect x="200" y="106" width="60" height="24" rx="12" fill="{CREAM}"></rect><text x="230" y="123" text-anchor="middle" class="pop6" font-size="12" fill="{CHESTNUT}">63 mm</text>
<text x="230" y="172" text-anchor="middle" class="serif" font-size="28" fill="{NAVY}">Measured twice. Fitted once.</text>
<rect x="16" y="196" width="428" height="46" fill="#E9DFCC"></rect><path d="{ticks}" stroke="{NAVY}" stroke-width="1.5"></path>
<g class="pop" font-size="9" fill="{NAVY}" text-anchor="middle">''' + ''.join(f'<text x="{30+i*400/6:.1f}" y="212">{i}</text>' for i in range(7)) + '</g>' + site(434, 34, SLATE, 'end')
add(17, 'pd', 'Measured twice. Fitted once.', 460, 250, ['<rect x="0" y="0" width="460" height="250" rx="22" fill="{F}"></rect>'], b, 3.2)
STICKERS[-1]['bg'] = CREAM

# 19 Dilated and dramatic
b = f'''<path d="M54 92 Q130 32 206 92 Q130 152 54 92 Z" fill="#FFFFFF" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"></path>
<circle cx="130" cy="92" r="34" fill="{SOFT}"></circle><circle cx="130" cy="92" r="27" fill="{INK}"></circle><circle cx="140" cy="82" r="6" fill="#FFFFFF"></circle><circle cx="122" cy="102" r="2.5" fill="#FFFFFF" opacity="0.8"></circle>
<path d="M76 66 L68 54 M100 54 L96 40 M130 50 V35 M160 54 L164 40 M184 66 L192 54" stroke="{NAVY}" stroke-width="4" stroke-linecap="round"></path>
<path d="M40 46 L43 54 L51 57 L43 60 L40 68 L37 60 L29 57 L37 54 Z M222 40 L224 46 L230 48 L224 50 L222 56 L220 50 L214 48 L220 46 Z" fill="{CHESTNUT}"></path>
<text x="130" y="174" text-anchor="middle" class="serif" font-size="34" fill="{NAVY}">Dilated</text>
<text x="130" y="200" text-anchor="middle" class="serif" font-size="22" fill="{DEEP}">and dramatic.</text>''' + arc_site('a19', bottom_arc(130, 130, 108), NAVY, size=12, op=0.8)
add(19, 'dilated', 'Dilated and dramatic.', 260, 260, ['<circle cx="130" cy="130" r="122" fill="{F}"></circle>'], b, 2.4)
STICKERS[-1]['bg'] = BUFF

# 20 to 25 My superpower is
ICONS = {
'od': '<rect x="146" y="58" width="68" height="8" rx="4" fill="{acc}"></rect><rect x="170" y="64" width="20" height="40" rx="5" fill="{acc}"></rect><circle cx="148" cy="88" r="25" fill="none" stroke="{acc}" stroke-width="5"></circle><circle cx="212" cy="88" r="25" fill="none" stroke="{acc}" stroke-width="5"></circle><circle cx="148" cy="88" r="11" fill="{fg}"></circle><circle cx="212" cy="88" r="11" fill="{fg}"></circle>',
'screw': '<g transform="rotate(-24 180 86)"><rect x="112" y="72" width="82" height="28" rx="14" fill="{fg}"></rect><path d="M130 78 V94 M138 78 V94 M146 78 V94" stroke="{bg}" stroke-width="2.5" stroke-linecap="round"></path><rect x="192" y="77" width="12" height="18" rx="2" fill="{acc}"></rect><rect x="203" y="82" width="46" height="7" fill="{acc}"></rect><path d="M249 82 L257 84.5 V86.5 L249 89 Z" fill="{acc}"></path></g>',
'puff': 'PUFF',
'prog': '<defs><clipPath id="dprog"><ellipse cx="180" cy="88" rx="46" ry="30"></ellipse></clipPath></defs><g clip-path="url(#dprog)"><path d="M160 54 H200 L190 92 L192 124 H168 L170 92 Z" fill="{acc}" opacity="0.55"></path></g><ellipse cx="180" cy="88" rx="46" ry="30" fill="none" stroke="{fg}" stroke-width="5"></ellipse><path d="M146 80 A34 22 0 0 1 162 66" stroke="{fg}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"></path>',
'clip': '<rect x="152" y="56" width="56" height="70" rx="7" fill="{fg}"></rect><rect x="166" y="50" width="28" height="12" rx="4" fill="{acc}"></rect><path d="M164 92 L176 104 L198 78" fill="none" stroke="{bg}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M164 116 H196" stroke="{bg}" stroke-width="3" stroke-linecap="round" opacity="0.6"></path>',
'glass': '<rect x="152" y="52" width="56" height="7" rx="3.5" fill="{fg}"></rect><rect x="152" y="117" width="56" height="7" rx="3.5" fill="{fg}"></rect><path d="M158 59 H202 Q202 82 184 88 Q202 94 202 117 H158 Q158 94 176 88 Q158 82 158 59 Z" fill="none" stroke="{fg}" stroke-width="4" stroke-linejoin="round"></path><path d="M166 66 H194 Q192 78 180 84 Q168 78 166 66 Z" fill="{acc}"></path><path d="M180 96 V104 M166 113 Q180 100 194 113 Z" fill="{acc}" stroke="{acc}" stroke-width="2.5" stroke-linejoin="round"></path>',
}
SP = [(20, 'od', NAVY, CREAM, BUFF, 'knowing if it&apos;s', '1 or 2.', 30, 32, 'OPTOMETRIST'),
      (21, 'screw', CHESTNUT, CREAM, BUFF, 'the tiny', 'screwdriver.', 32, 32, 'OPTICIAN'),
      (22, 'puff', SOFT, CREAM, BUFF, 'the air puff', 'without the flinch.', 30, 26, 'OPTOMETRIC ASSISTANT'),
      (23, 'prog', CHESTNUT, CREAM, BUFF, 'making', 'progressives work.', 32, 26, 'OPTICIAN'),
      (24, 'clip', SOFT, CREAM, BUFF, 'the pretest before', 'the doctor asks.', 26, 28, 'OPTOMETRIC ASSISTANT'),
      (25, 'glass', BUFF, NAVY, CHESTNUT, '20/20', 'patience.', 38, 34, 'THE WHOLE EYE CARE TEAM')]
for num, ic, bg, fg, acc, l1, l2, s1, s2, role in SP:
    if ic == 'puff':
        icon = puff_cloud(120, 58, 1.25, fg, acc) + f'<path d="M216 74 H226 M214 84 H228 M216 94 H226" stroke="{acc}" stroke-width="3" stroke-linecap="round"></path>' + eye(254, 84, w=20, lashes=True, sw=2.5)
    else:
        icon = ICONS[ic].format(bg=bg, fg=fg, acc=acc)
    b = f'''<circle cx="180" cy="180" r="134" fill="none" stroke="{acc}" stroke-opacity="0.45" stroke-width="1.5"></circle>{icon}
<text x="180" y="156" text-anchor="middle" class="pop6" font-size="11" letter-spacing="3" fill="{acc}">MY SUPERPOWER IS</text>
<text x="180" y="198" text-anchor="middle" class="serif" font-size="{s1}" fill="{fg}">{l1}</text>
<text x="180" y="{198+s2+4}" text-anchor="middle" class="serif" font-size="{s2}" fill="{fg}">{l2}</text>
<text x="180" y="270" text-anchor="middle" class="pop" font-size="10" letter-spacing="2.4" fill="{fg}" fill-opacity="0.8">{role}</text>''' + arc_site(f'asp{num}', bottom_arc(180, 180, 150), acc, size=13)
    add(num, f'sp{num}', 'My superpower is ' + l1.replace('&apos;', "'") + ' ' + l2, 360, 360, ['<circle cx="180" cy="180" r="168" fill="{F}"></circle>'], b, 2.5)
    STICKERS[-1]['bg'] = bg

# 26 Wordmark
b = brand('kestrel-wordmark.svg', 30, 14, 380, 103) + site(418, 146, SLATE, 'end')
add(26, 'wordmark', 'Kestrel wordmark', 440, 160, ['<rect x="0" y="0" width="440" height="160" rx="22" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = CREAM
# 27 K on navy
b = brand('kestrel-k-mark-reversed.svg', 38, 22, 134, 134) + arc_site('a27', bottom_arc(105, 105, 80), BUFF, size=12)
add(27, 'kcircle', 'K on navy', 210, 210, ['<circle cx="105" cy="105" r="97" fill="{F}"></circle>'], b, 2.0)
STICKERS[-1]['bg'] = NAVY
# 28 Pill
b = brand('kestrel-k-mark-reversed.svg', 26, 18, 56, 56) + f'<text x="94" y="58" class="serif" font-size="34" fill="{CREAM}">eyecarejobs.ca</text>'
add(28, 'pill', 'eyecarejobs.ca pill', 340, 92, ['<rect x="0" y="0" width="340" height="92" rx="46" fill="{F}"></rect>'], b, 2.8)
STICKERS[-1]['bg'] = CHESTNUT

# 29 Seal: the words loop all the way round, maple leaves between
R, C = 106, 140
circ = 2 * math.pi * R
gap = 26
seg1, seg2 = 'EYECAREJOBS.CA', 'CANADA-WIDE EYE CARE JOB BOARD'
avail = circ - 2 * gap
L1 = avail * len(seg1) / (len(seg1) + len(seg2)); L2 = avail - L1
o1 = gap / 2; o2 = o1 + L1 + gap
b = f'''<defs><path id="ring29" d="M {C-R} {C} A {R} {R} 0 1 1 {C+R} {C} A {R} {R} 0 1 1 {C-R} {C}"></path></defs>
<circle cx="{C}" cy="{C}" r="80" fill="none" stroke="{BUFF}" stroke-width="1.5"></circle>
<text class="pop6" font-size="14.5" fill="{CREAM}"><textPath href="#ring29" startOffset="{o1:.1f}" textLength="{L1:.1f}" lengthAdjust="spacing">{seg1}</textPath></text>
<text class="pop6" font-size="14.5" fill="{CREAM}"><textPath href="#ring29" startOffset="{o2:.1f}" textLength="{L2:.1f}" lengthAdjust="spacing">{seg2}</textPath></text>'''
for s in (o1 + L1 + gap / 2, 0):
    t = s / R
    x, y = C - R * math.cos(t), C - R * math.sin(t)
    # put the leaf centre on the text's middle line (text sits outside the path by about half its height)
    xo, yo = C - (R + 5) * math.cos(t), C - (R + 5) * math.sin(t)
    phi = math.degrees(math.atan2(-math.cos(t), math.sin(t)))
    b += f'<g transform="translate({xo:.1f} {yo:.1f}) rotate({phi:.1f})">' + brand('kestrel-maple-leaf.svg', -8, -8, 16, 16) + '</g>'
b += brand('kestrel-k-mark-reversed.svg', 85, 85, 110, 110)
add(29, 'seal', 'Round seal', 280, 280, ['<circle cx="140" cy="140" r="132" fill="{F}"></circle>'], b, 2.6)
STICKERS[-1]['bg'] = NAVY

# 30 Chart with the K
b = brand('kestrel-k-mark.svg', 65, 46, 120, 120) + f'''<g class="sans7" text-anchor="middle" fill="{NAVY}"><text x="125" y="214" font-size="46" letter-spacing="4.6">EYE</text><text x="125" y="258" font-size="32" letter-spacing="4.5">CARE</text>
<text x="125" y="292" font-size="22" letter-spacing="4">JOBS</text><text x="125" y="318" font-size="13" letter-spacing="2.9">CANADA-WIDE</text></g>
<text x="125" y="340" text-anchor="middle" class="sans7" font-size="9" letter-spacing="2" fill="{CHESTNUT}">EYECAREJOBS.CA</text>
<rect x="10" y="10" width="230" height="360" rx="12" fill="none" stroke="{LINE}" stroke-width="1.5"></rect>'''
add(30, 'kchart', 'Chart with the K', 250, 380, ['<rect x="0" y="0" width="250" height="380" rx="18" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = '#FFFFFF'

# 32 Colour vision plate: hidden K, eyecarejobs.ca in the bottom dots
rnd = random.Random(20261120)
PC, PR = 190, 168
def in_poly(x, y, poly):
    inside = False
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside
KPOLYS = [[(108, 58), (164, 58), (164, 252), (108, 252)], [(150, 178), (230, 58), (292, 58), (180, 206)], [(166, 146), (292, 252), (230, 252), (140, 184)]]
def in_k(x, y): return any(in_poly(x, y, p) for p in KPOLYS)
letters = list('eyecarejobs.ca')
bubbles = []
n = len(letters); span = 112
for i, ch in enumerate(letters):
    a = math.radians(90 + span / 2 - i * span / (n - 1))
    bubbles.append((PC + 147 * math.cos(a), PC + 147 * math.sin(a), 11.5, ch))
dots = [(x, y, r) for x, y, r, _ in bubbles]
FIG = ['#E2692F', '#D4562C', '#EE8A3C', '#E5773A', '#C9482C', '#F09A4A']
BGC = ['#8DA65A', '#7A9A4F', '#9DB060', '#6E8F4A', '#A9B868', '#86A257', '#B3BD6C']
placed = []
for _ in range(90000):
    r = rnd.choice([3.5, 4.2, 5, 5.8, 6.6, 7.6, 8.6])
    a = rnd.random() * 2 * math.pi; d = math.sqrt(rnd.random()) * (PR - r - 2)
    x, y = PC + d * math.cos(a), PC + d * math.sin(a)
    if any((x - px) ** 2 + (y - py) ** 2 < (r + pr + 1.1) ** 2 for px, py, pr in dots):
        continue
    dots.append((x, y, r)); placed.append((x, y, r, rnd.choice(FIG) if in_k(x, y) else rnd.choice(BGC)))
b = f'<circle cx="{PC}" cy="{PC}" r="{PR+4}" fill="#F4EFE6"></circle>' + ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{c}"></circle>' for x, y, r, c in placed)
for x, y, r, ch in bubbles:
    b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{rnd.choice(["#6E8F4A","#7A9A4F","#8DA65A"])}"></circle><text x="{x:.1f}" y="{y+4.3:.1f}" text-anchor="middle" class="pop6" font-size="12.5" fill="#FFFFFF">{ch}</text>'
add(32, 'colourplate', 'Colour vision plate with a hidden K', 380, 380, [f'<circle cx="{PC}" cy="{PC}" r="182" fill="{{F}}"></circle>'], b, 2.8)
STICKERS[-1]['bg'] = '#F4EFE6'

# 33 Duochrome test
b = f'''<rect x="28" y="28" width="162" height="170" rx="10" fill="{RED}"></rect><rect x="190" y="28" width="162" height="170" rx="10" fill="#5E8C61"></rect><rect x="180" y="28" width="20" height="170" fill="#5E8C61"></rect>'''
for cx in (109, 271):
    b += f'<circle cx="{cx}" cy="96" r="34" fill="none" stroke="{INK}" stroke-width="6"></circle><circle cx="{cx}" cy="96" r="17" fill="none" stroke="{INK}" stroke-width="6"></circle><text x="{cx}" y="174" text-anchor="middle" class="sans7" font-size="26" letter-spacing="4" fill="{INK}">{"E Z" if cx < 200 else "H N"}</text>'
b += f'''<text x="190" y="244" text-anchor="middle" class="serif" font-size="34" fill="{CREAM}">Red or green?</text>
<text x="190" y="272" text-anchor="middle" class="pop" font-size="14" fill="{BUFF}">Which is clearer, or are they the same?</text>''' + site(352, 304, BUFF, 'end')
add(33, 'duochrome', 'Duochrome test', 380, 320, ['<rect x="0" y="0" width="380" height="320" rx="28" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = NAVY

# 34 Visual field arcade: rows of pixel eyeballs
SPR = ['..XXXXXXX..', '.XWWWWWWWX.', 'XWWWBBBWWWX', 'XWWBBKBBWWX', 'XWWWBBBWWWX', '.XWWWWWWWX.', '..XXXXXXX..', '.X..X.X..X.']
SPR2 = ['..XXXXXXX..', '.XWWWWWWWX.', 'XWWWBBBWWWX', 'XWWBBKBBWWX', 'XWWWBBBWWWX', '.XWWWWWWWX.', '..XXXXXXX..', 'X..X...X..X']
PAL = {'X': BUFF, 'W': CREAM, 'B': '#6FA3C7', 'K': INK}
def sprite(x0, y0, px, rows):
    out = ''
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != '.':
                out += f'<rect x="{x0+i*px}" y="{y0+j*px}" width="{px}" height="{px}" fill="{PAL[ch]}"></rect>'
    return out
b = f'<rect x="14" y="14" width="372" height="272" rx="18" fill="#0B1424"></rect>'
b += f'<text x="34" y="44" class="pix" font-size="9" fill="{BUFF}">SCORE 20/20</text><text x="366" y="44" text-anchor="end" class="pix" font-size="9" fill="{BUFF}">HI 20/15</text>'
for r in range(3):
    for c in range(5):
        b += sprite(52 + c * 62, 62 + r * 40, 4, SPR if (r + c) % 2 == 0 else SPR2)
for x, y in ((40, 200), (330, 186), (96, 232), (300, 236), (210, 214)):
    b += f'<rect x="{x}" y="{y}" width="4" height="4" fill="#FFFFFF" opacity="0.8"></rect>'
b += f'''<rect x="198" y="186" width="4" height="12" fill="{CREAM}"></rect>
<rect x="180" y="220" width="40" height="16" fill="{SLATE}"></rect><rect x="192" y="212" width="16" height="8" fill="{CHESTNUT}"></rect><rect x="176" y="236" width="48" height="6" fill="{SLATE}"></rect>
<text x="200" y="268" text-anchor="middle" class="pix" font-size="11" fill="{CREAM}">CLICK WHEN YOU SEE IT</text>''' + site(376, 306, SLATE, 'end', size=13)
add(34, 'arcade', 'Visual field arcade', 400, 320, ['<rect x="0" y="0" width="400" height="320" rx="28" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = '#FFFFFF'

# 35 Statement frames
def star(cx, cy, ro, ri, rot=-90):
    pts = []
    for k in range(10):
        r = ro if k % 2 == 0 else ri
        a = math.radians(rot + k * 36)
        pts.append(f'{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}')
    return ' '.join(pts)
b = ''
for cx in (128, 292):
    b += f'<polygon points="{star(cx, 108, 78, 38)}" fill="{BUFF}" stroke="{DEEP}" stroke-width="4" stroke-linejoin="round"></polygon>'
    b += f'<polygon points="{star(cx, 108, 54, 26)}" fill="#E8A6B0"></polygon>'
    for k in range(5):
        a = math.radians(-90 + k * 72)
        b += f'<circle cx="{cx + 64*math.cos(a):.1f}" cy="{108 + 64*math.sin(a):.1f}" r="4" fill="#FFFFFF"></circle>'
    b += f'<path d="M{cx-22} 96 A30 30 0 0 1 {cx-6} 80" stroke="#FFFFFF" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.85"></path>'
b += f'''<path d="M190 104 Q210 92 230 104" fill="none" stroke="{DEEP}" stroke-width="7" stroke-linecap="round"></path>
<path d="M30 70 L34 80 L44 84 L34 88 L30 98 L26 88 L16 84 L26 80 Z M392 40 L395 47 L402 50 L395 53 L392 60 L389 53 L382 50 L389 47 Z M210 30 L212 36 L218 38 L212 40 L210 46 L208 40 L202 38 L208 36 Z" fill="{BUFF}"></path>
<text x="210" y="236" text-anchor="middle" class="serif" font-size="36" fill="{CREAM}">Statement frames only.</text>''' + site(392, 266, BUFF, 'end')
add(35, 'statement', 'Statement frames only.', 420, 280, ['<rect x="0" y="0" width="420" height="280" rx="36" fill="{F}"></rect>'], b, 3.0)
STICKERS[-1]['bg'] = SOFT

# Background colours for the default base fills
DEFAULT_BG = {'lick': [RED, '#E58C8A']}

def sticker_svg(s, px_w, px_h, cutline=False, extra=''):
    """Return an <svg> sized px_w by px_h (outer, including the white edge)."""
    pad = 10
    bgs = s.get('bgs') or DEFAULT_BG.get(s['id']) or [s.get('bg', NAVY)] * len(s['shapes'])
    if len(bgs) < len(s['shapes']):
        bgs = bgs + [bgs[-1]] * (len(s['shapes']) - len(bgs))
    out = f'<svg viewBox="{-pad} {-pad} {s["w"]+2*pad} {s["h"]+2*pad}" width="{px_w:.2f}" height="{px_h:.2f}" role="img" aria-label="{s["name"]}" style="display:block;overflow:visible"{extra}>'
    if cutline:
        out += ''.join(sh.replace('fill="{F}"', 'fill="none" stroke="#AEB7BE" stroke-width="18.5" stroke-linejoin="round"') for sh in s['shapes'])
    out += ''.join(sh.replace('fill="{F}"', 'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round"') for sh in s['shapes'])
    out += ''.join(sh.replace('{F}', bgs[i]) for i, sh in enumerate(s['shapes']))
    out += s['body'] + '</svg>'
    return out

def outer_in(s):
    pad = 10
    W, H = s['w'] + 2 * pad, s['h'] + 2 * pad
    k = s['size'] / max(W, H)
    return W * k, H * k

def pack(items, sheet_w, sheet_h, margin, gap, scale=1.0):
    """MaxRects (best short side fit). Returns sheets of (sticker, x, y, w, h) in inches."""
    todo = sorted(items, key=lambda s: -(outer_in(s)[0] * outer_in(s)[1]))
    sheets = []
    while todo:
        W, H = sheet_w - 2 * margin + gap, sheet_h - 2 * margin + gap
        free = [(0.0, 0.0, W, H)]
        placed, rest = [], []
        for s in todo:
            w, h = outer_in(s); w *= scale; h *= scale
            bw, bh = w + gap, h + gap
            best = None
            for fx, fy, fw, fh in free:
                if bw <= fw + 1e-9 and bh <= fh + 1e-9:
                    score = (min(fw - bw, fh - bh), fy, fx)
                    if best is None or score < best[0]:
                        best = (score, fx, fy)
            if not best:
                rest.append(s); continue
            _, x, y = best
            placed.append((s, margin + x, margin + y, w, h))
            nf = []
            for fx, fy, fw, fh in free:
                if x >= fx + fw or x + bw <= fx or y >= fy + fh or y + bh <= fy:
                    nf.append((fx, fy, fw, fh)); continue
                if x > fx: nf.append((fx, fy, x - fx, fh))
                if x + bw < fx + fw: nf.append((x + bw, fy, fx + fw - x - bw, fh))
                if y > fy: nf.append((fx, fy, fw, y - fy))
                if y + bh < fy + fh: nf.append((fx, y + bh, fw, fy + fh - y - bh))
            free = [r for r in nf if not any(r != o and r[0] >= o[0] and r[1] >= o[1] and r[0] + r[2] <= o[0] + o[2] and r[1] + r[3] <= o[1] + o[3] for o in nf)]
        if not placed:
            raise SystemExit('sticker too big for the sheet')
        sheets.append(placed); todo = rest
    return sheets

CSS = """.serif{font-family:'DM Serif Display',serif}.pop{font-family:Poppins,sans-serif}.pop6{font-family:Poppins,sans-serif;font-weight:600}
.sans7{font-family:'Source Sans 3',sans-serif;font-weight:700}.site{font-family:Poppins,sans-serif;font-weight:600;letter-spacing:0.6px}.pix{font-family:'Press Start 2P',monospace}"""
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;family=Poppins:wght@400;600&amp;family=Source+Sans+3:wght@700&amp;family=Press+Start+2P&amp;display=swap">'

if __name__ == '__main__':
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    DPI = 96
    SW, SH, M, G = 8.5, 11, 0.35, 0.16
    sheets = pack(STICKERS, SW, SH, M, G, 0.92)
    meta = []
    for i, sh in enumerate(sheets, 1):
        # Print sheet (white paper, grey cut lines, no numbers)
        els = ''.join(f'<div style="position:absolute;left:{x*DPI:.2f}px;top:{y*DPI:.2f}px">{sticker_svg(s, w*DPI, h*DPI, cutline=True)}</div>' for s, x, y, w, h in sh)
        html = f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>@page{{size:8.5in 11in;margin:0}}html,body{{margin:0}}{CSS}</style></head><body><div style="position:relative;width:{SW*DPI}px;height:{SH*DPI}px;background:#FFFFFF;overflow:hidden">{els}</div></body></html>'
        open(os.path.join(outdir, f'print-sheet-{i}.html'), 'w').write(html)
        # Review board for the canvas (numbers beside each sticker, mist paper)
        badges = ''.join(f'<div style="position: absolute; left: {x*DPI-10:.1f}px; top: {y*DPI-10:.1f}px; z-index: 5; min-width: 30px; height: 30px; padding: 0 6px; box-sizing: border-box; border-radius: 15px; background: #1B2B4B; box-shadow: 0 0 0 2px #FFFFFF; display: flex; align-items: center; justify-content: center"><p style="margin: 0; font-family: Poppins, sans-serif; font-weight: 600; font-size: 14px; color: #FFFFFF">{s["num"]}</p></div>' for s, x, y, w, h in sh)
        els_r = ''.join(f'<div style="position: absolute; left: {x*DPI:.2f}px; top: {y*DPI:.2f}px; filter: drop-shadow(0 3px 5px rgba(27,43,75,0.22))">{sticker_svg(s, w*DPI, h*DPI)}</div>' for s, x, y, w, h in sh)
        dc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Draft 3, sheet {i}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
{CSS}
</style>
</helmet>
<div style="width: {int(SW*DPI)}px; height: {int(SH*DPI)}px; position: relative; overflow: hidden; background: #DCE3E6">
{els_r}
{badges}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{int(SW*DPI)},"height":{int(SH*DPI)}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''
        open(os.path.join(outdir, f'v3-sheet-{i}.dc.html'), 'w').write(dc)
        meta.append([s['num'] for s, *_ in sh])
    # Single stickers (transparent, no cut line), 1 file per sticker
    for s in STICKERS:
        w, h = outer_in(s)
        html = f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>html,body{{margin:0;background:transparent}}{CSS}</style></head><body>{sticker_svg(s, w*DPI, h*DPI)}</body></html>'
        open(os.path.join(outdir, f'single-{s["num"]}-{s["id"]}.html'), 'w').write(html)
    json.dump({'sheets': meta, 'stickers': [[s['num'], s['id'], s['name'], round(outer_in(s)[0], 2), round(outer_in(s)[1], 2)] for s in STICKERS]}, open(os.path.join(outdir, 'meta.json'), 'w'), indent=1)
    print(json.dumps(meta))
