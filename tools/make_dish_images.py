"""Draws a simple illustration for every dish: python tools/make_dish_images.py
The three hand-drawn ones (chicken-biryani, cheese-burger, gulab-jamun) are kept as they are."""
import math, os, random

OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images")
KEEP = {"chicken-biryani", "cheese-burger", "gulab-jamun"}


def svg(body, bg):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400"><rect width="700" height="400" fill="{bg}"/>{body}</svg>'


def plate(cx=350, cy=300, rx=255, ry=62):
    return (f'<ellipse cx="{cx}" cy="{cy+38}" rx="{rx-10}" ry="{ry-12}" fill="#00000022"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#ffffff" stroke="#e8d9c5" stroke-width="4"/>'
            f'<ellipse cx="{cx}" cy="{cy-4}" rx="{rx-40}" ry="{ry-16}" fill="#f6efe4"/>')


def bowl(x, y, liquid, w=70, dots=""):
    return (f'<ellipse cx="{x}" cy="{y+8}" rx="{w}" ry="{w*0.38:.0f}" fill="#c9ced6"/>'
            f'<ellipse cx="{x}" cy="{y}" rx="{w}" ry="{w*0.38:.0f}" fill="#e8ecf1"/>'
            f'<ellipse cx="{x}" cy="{y}" rx="{w-9}" ry="{w*0.38-7:.0f}" fill="{liquid}"/>{dots}'
            f'<ellipse cx="{x-w*0.3:.0f}" cy="{y-4}" rx="{w*0.25:.0f}" ry="4" fill="#ffffff66"/>')


# ------------------------------------------------------------------ biryani
SPOTS = {
    "chicken": [(300, 175), (410, 190), (350, 235)], "mutton": [(300, 180), (405, 195), (350, 238)],
    "egg": [(295, 190), (405, 195), (350, 240)], "paneer": [(290, 185), (350, 165), (410, 195), (345, 240)],
    "veg": [(285, 195), (330, 170), (380, 200), (425, 185), (350, 240), (300, 240)],
    "fry": [(305, 185), (405, 195), (350, 238)],
}


def pieces(kind):
    out = []
    for k, (x, y) in enumerate(SPOTS[kind]):
        rot = random.Random(f"{kind}{k}").randint(-30, 30)
        if kind == "chicken":
            out.append(f'<g transform="rotate({rot} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="46" ry="28" fill="#a8531f"/><ellipse cx="{x}" cy="{y-5}" rx="36" ry="19" fill="#c9702c"/></g>')
        elif kind == "mutton":
            out.append(f'<g transform="rotate({rot} {x} {y})"><rect x="{x-38}" y="{y-24}" width="76" height="48" rx="18" fill="#5c2f17"/><rect x="{x-30}" y="{y-18}" width="60" height="30" rx="14" fill="#7a4326"/></g>')
        elif kind == "egg":
            out.append(f'<ellipse cx="{x}" cy="{y}" rx="38" ry="28" fill="#fffdf5" stroke="#e6dcc0" stroke-width="3"/><circle cx="{x}" cy="{y}" r="14" fill="#f5b82e"/>')
        elif kind == "paneer":
            out.append(f'<g transform="rotate({rot} {x} {y})"><rect x="{x-26}" y="{y-26}" width="52" height="52" rx="9" fill="#fff3d0" stroke="#e5cf93" stroke-width="3"/><rect x="{x-18}" y="{y-18}" width="20" height="14" rx="5" fill="#ffffff99"/></g>')
        elif kind == "veg":
            c = ["#ee8b2d", "#4fa83d", "#f4ead2", "#d9482b"][k % 4]
            out.append(f'<circle cx="{x}" cy="{y}" r="22" fill="{c}"/><circle cx="{x-7}" cy="{y-7}" r="7" fill="#ffffff66"/>')
        elif kind == "fry":
            out.append(f'<g transform="rotate({rot} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="48" ry="26" fill="#8a4318"/><ellipse cx="{x}" cy="{y-5}" rx="40" ry="18" fill="#d98a3d"/><rect x="{x+38}" y="{y-6}" width="30" height="12" rx="6" fill="#fff6e0"/><circle cx="{x+70}" cy="{y}" r="9" fill="#fff6e0"/></g>')
    return "".join(out)


def biryani(name, kind, rice="#f2c14e", rice2="#f7d774"):
    r = random.Random(name)
    grains = ""
    for _ in range(26):
        x, y = r.randint(200, 500), r.randint(150, 270)
        grains += f'<ellipse cx="{x}" cy="{y}" rx="11" ry="4" fill="{r.choice(["#fff6d6", "#e2711d", "#ffffff"])}" transform="rotate({r.randint(-40, 40)} {x} {y})"/>'
    garnish = ('<g fill="#3f9142"><path d="M350 120 q30 -40 60 -10 q-30 30 -60 10z"/><path d="M350 120 q-30 -45 -62 -15 q32 32 62 15z"/></g>'
               '<path d="M530 290 a60 60 0 0 1 80 20 l-80 5z" fill="#9bcf3f"/><path d="M540 292 a48 48 0 0 1 58 14 l-58 4z" fill="#d6ee8a"/>')
    return svg(plate() + f'<path d="M150 285 Q170 150 350 110 Q530 150 550 285 Q350 335 150 285Z" fill="{rice}"/>'
               f'<path d="M190 270 Q215 170 350 135 Q485 170 510 270 Q350 310 190 270Z" fill="{rice2}"/>' + grains + pieces(kind) + garnish, "#fff1e0")


def handi():
    steam = "".join(f'<path d="M{x} 175 q-18 -26 0 -50 q18 -24 0 -48" fill="none" stroke="#ffffffcc" stroke-width="9" stroke-linecap="round"/>' for x in (300, 350, 400))
    return svg(f'<ellipse cx="350" cy="352" rx="190" ry="22" fill="#00000022"/>'
               '<path d="M185 215 H515 Q545 330 350 348 Q155 330 185 215Z" fill="#b8651b"/>'
               '<path d="M205 230 Q215 310 300 335 Q230 300 225 230Z" fill="#ffffff33"/>'
               '<ellipse cx="350" cy="215" rx="165" ry="30" fill="#8f4a10"/><ellipse cx="350" cy="214" rx="146" ry="22" fill="#f2c14e"/>'
               '<ellipse cx="320" cy="212" rx="34" ry="12" fill="#a8531f"/><ellipse cx="395" cy="214" rx="30" ry="11" fill="#c9702c"/>'
               '<ellipse cx="350" cy="222" rx="110" ry="8" fill="#e2711d44"/>'
               '<rect x="150" y="205" width="40" height="16" rx="8" fill="#8f4a10"/><rect x="510" y="205" width="40" height="16" rx="8" fill="#8f4a10"/>' + steam, "#fff1e0")


# -------------------------------------------------------------------- pizza
def topping(kind, x, y):
    if kind == "pepperoni":
        return f'<circle cx="{x}" cy="{y}" r="23" fill="#a82a25"/><circle cx="{x}" cy="{y}" r="17" fill="#c94a3a"/><circle cx="{x-6}" cy="{y-4}" r="3" fill="#a82a25"/><circle cx="{x+6}" cy="{y+5}" r="3" fill="#a82a25"/>'
    if kind == "paneer":
        return f'<rect x="{x-14}" y="{y-14}" width="28" height="28" rx="5" fill="#fff3d0" stroke="#e5cf93" stroke-width="2" transform="rotate({(x*7+y*3) % 50 - 25} {x} {y})"/>'
    if kind == "capsicum":
        return f'<circle cx="{x}" cy="{y}" r="14" fill="none" stroke="#3f9142" stroke-width="6"/>'
    if kind == "onion":
        return f'<circle cx="{x}" cy="{y}" r="15" fill="none" stroke="#e3b5e8" stroke-width="4" stroke-dasharray="40 14"/>'
    if kind == "tomato":
        return f'<circle cx="{x}" cy="{y}" r="16" fill="#e53935"/><circle cx="{x-5}" cy="{y-5}" r="5" fill="#ffffff55"/>'
    if kind == "mushroom":
        return f'<path d="M{x-16} {y} a16 14 0 0 1 32 0z" fill="#f1e6d0" stroke="#cdbd9e" stroke-width="2"/><rect x="{x-5}" y="{y}" width="10" height="11" rx="3" fill="#f1e6d0" stroke="#cdbd9e" stroke-width="2"/>'
    if kind == "basil":
        return f'<path d="M{x-14} {y} q14 -22 28 0 q-14 18 -28 0z" fill="#2f8f3a"/>'
    if kind == "chicken":
        return f'<ellipse cx="{x}" cy="{y}" rx="19" ry="14" fill="#a8531f"/><ellipse cx="{x}" cy="{y-3}" rx="14" ry="9" fill="#c9702c"/>'
    if kind == "mozz":
        return f'<circle cx="{x}" cy="{y}" r="19" fill="#fffdf3"/>'
    return ""


def pizza(name, kinds, crust="#e0a458", sauce="#d9482b", burst=False, bbq=False):
    r = random.Random(name)
    cx, cy = 350, 200
    b = f'<ellipse cx="{cx}" cy="{cy+168}" rx="180" ry="16" fill="#00000022"/><circle cx="{cx}" cy="{cy}" r="166" fill="{crust}"/>'
    if burst:
        b += "".join(f'<circle cx="{cx+157*math.cos(a*math.pi/11):.0f}" cy="{cy+157*math.sin(a*math.pi/11):.0f}" r="9" fill="#ffe27a"/>' for a in range(22))
    b += f'<circle cx="{cx}" cy="{cy}" r="146" fill="{sauce}"/><circle cx="{cx}" cy="{cy}" r="136" fill="#ffd966"/>'
    for _ in range(14):
        a, d = r.uniform(0, 6.28), r.uniform(10, 115)
        b += f'<ellipse cx="{cx+d*math.cos(a):.0f}" cy="{cy+d*math.sin(a):.0f}" rx="22" ry="12" fill="#fff0b3"/>'
    if bbq:
        b += '<path d="M240 170 q40 -30 80 0 t80 0 t60 20" fill="none" stroke="#6b2f12" stroke-width="7" stroke-linecap="round"/><path d="M250 240 q40 -30 80 0 t80 0 t50 10" fill="none" stroke="#6b2f12" stroke-width="7" stroke-linecap="round"/>'
    n = 0
    for kind, count in kinds:
        for _ in range(count):
            a = n * 2.4 + r.uniform(-.3, .3)
            d = 30 + (n * 37) % 85
            b += topping(kind, round(cx + d * math.cos(a)), round(cy + d * math.sin(a)))
            n += 1
    b += "".join(f'<line x1="{cx-146*math.cos(a):.0f}" y1="{cy-146*math.sin(a):.0f}" x2="{cx+146*math.cos(a):.0f}" y2="{cy+146*math.sin(a):.0f}" stroke="#c9892b" stroke-opacity=".5" stroke-width="3"/>' for a in (0, math.pi/4, math.pi/2, 3*math.pi/4))
    return svg(b, "#fdece0")


# ------------------------------------------------------------------- burger
def burger(name, layers, bun="#e8a24a", patty="#6b3a1e", crispy=False):
    t = 290
    body = '<ellipse cx="350" cy="352" rx="215" ry="20" fill="#00000022"/><path d="M150 290 h400 q0 55 -60 55 h-280 q-60 0 -60 -55z" fill="#d98a3d"/>'
    for kind in layers:
        if kind == "lettuce":
            body += f'<path d="M145 {t} ' + "q22 -30 45 -8 " * 9 + f'v14 h-405z" fill="#4fa83d"/>'
            t -= 14
        elif kind == "tomato":
            body += f'<rect x="150" y="{t-13}" width="400" height="13" rx="6" fill="#e53935"/>'
            t -= 13
        elif kind == "onion":
            body += f'<rect x="155" y="{t-7}" width="390" height="7" rx="3" fill="#e3b5e8"/>'
            t -= 7
        elif kind == "cheese":
            body += f'<path d="M148 {t-12} h404 l-26 22 -20 -20 -22 24 -22 -22 -22 22 -22 -20 -22 24 -22 -22 -22 22 -22 -20 -22 22z" fill="#ffc933"/>'
            t -= 10
        elif kind in ("patty", "patty2"):
            body += f'<rect x="140" y="{t-36}" width="420" height="36" rx="18" fill="{patty}"/><rect x="155" y="{t-32}" width="390" height="10" rx="5" fill="#ffffff22"/>'
            if crispy:
                body += "".join(f'<circle cx="{170+i*29}" cy="{t-18+(i%3)*6}" r="4" fill="#ffffff33"/>' for i in range(13))
            if patty == "#7a8f3c":
                body += "".join(f'<circle cx="{175+i*37}" cy="{t-18}" r="5" fill="#4fa83d"/>' for i in range(10))
            t -= 34
    h = 105
    body += f'<path d="M140 {t} q0 -{h} 210 -{h} q210 0 210 {h}z" fill="{bun}"/><path d="M170 {t-20} q20 -65 120 -75 q-85 25 -120 75z" fill="#ffffff33"/>'
    rr = random.Random(name)
    for _ in range(10):
        x, y = rr.randint(220, 480), rr.randint(t - 90, t - 25)
        body += f'<ellipse cx="{x}" cy="{y}" rx="10" ry="5" fill="#fff3d6" transform="rotate({rr.randint(-30, 30)} {x} {y})"/>'
    return svg(body, "#ffeede")


# -------------------------------------------------------------- south indian
def dosa(name, color, dark, ghee=False):
    stripes = "".join(f'<path d="M{190+k*10} {255-k*12} Q340 {180-k*8} {560-k*10} {232-k*4}" fill="none" stroke="{dark}" stroke-width="5" stroke-opacity=".45" stroke-linecap="round"/>' for k in range(3))
    b = (plate() + f'<path d="M110 268 Q330 120 610 212 Q625 245 600 264 Q340 322 110 284Z" fill="{color}"/>' + stripes +
         '<path d="M565 205 q45 -30 58 8 q-8 30 -52 24z" fill="#f3c94b"/><circle cx="590" cy="215" r="4" fill="#e0a82c"/><circle cx="573" cy="222" r="3" fill="#e0a82c"/>')
    if ghee:
        b += '<ellipse cx="340" cy="205" rx="52" ry="15" fill="#ffe27a"/><ellipse cx="335" cy="201" rx="26" ry="6" fill="#fff3b0"/>'
    b += bowl(190, 330, "#7bb661", 55) + bowl(290, 338, "#fff8ec", 50) + bowl(560, 322, "#e2711d", 52, '<circle cx="545" cy="320" r="5" fill="#f2c14e"/><circle cx="575" cy="324" r="5" fill="#4fa83d"/>')
    return svg(b, "#eef7e8")


def idli():
    b = plate()
    for x, y in [(245, 262), (345, 245), (445, 262)]:
        b += (f'<ellipse cx="{x}" cy="{y+12}" rx="64" ry="24" fill="#e6e0cf"/>'
              f'<path d="M{x-62} {y+12} Q{x-55} {y-48} {x} {y-48} Q{x+55} {y-48} {x+62} {y+12}Z" fill="#fffdf6" stroke="#ece6d3" stroke-width="3"/>'
              f'<ellipse cx="{x-18}" cy="{y-24}" rx="18" ry="8" fill="#ffffff"/>')
    return svg(b + bowl(560, 318, "#e2711d", 62, '<circle cx="540" cy="316" r="6" fill="#4fa83d"/><circle cx="575" cy="320" r="6" fill="#d9482b"/><circle cx="555" cy="328" r="5" fill="#f2c14e"/>') + bowl(150, 318, "#7bb661", 52), "#eef7e8")


def vada():
    b = plate()
    for x, y in [(235, 250), (345, 232), (455, 250)]:
        b += (f'<ellipse cx="{x}" cy="{y}" rx="52" ry="40" fill="#b8741f"/><ellipse cx="{x}" cy="{y-4}" rx="48" ry="36" fill="#e3a23b"/>'
              f'<ellipse cx="{x}" cy="{y-3}" rx="17" ry="12" fill="#f6efe4"/><path d="M{x-40} {y-14} q14 -22 40 -22" fill="none" stroke="#ffffff66" stroke-width="6" stroke-linecap="round"/>')
    return svg(b + bowl(570, 316, "#fff8ec", 58, '<circle cx="555" cy="314" r="4" fill="#4fa83d"/><circle cx="585" cy="320" r="4" fill="#4fa83d"/>') + bowl(135, 322, "#e2711d", 50), "#eef7e8")


def uttapam():
    r = random.Random("uttapam")
    b = ('<ellipse cx="350" cy="228" rx="255" ry="150" fill="#00000018"/><ellipse cx="350" cy="215" rx="255" ry="150" fill="#ffffff" stroke="#e8d9c5" stroke-width="4"/>'
         '<ellipse cx="350" cy="210" rx="190" ry="112" fill="#d9993d"/><ellipse cx="350" cy="205" rx="180" ry="104" fill="#ecc27a"/>')
    for i in range(46):
        a, d = r.uniform(0, 6.28), math.sqrt(r.random())
        x, y = 350 + 165 * d * math.cos(a), 205 + 92 * d * math.sin(a)
        k = i % 4
        b += [f'<rect x="{x:.0f}" y="{y:.0f}" width="16" height="8" rx="3" fill="#c97bd0"/>', f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="10" ry="4" fill="#3f9142"/>',
              f'<circle cx="{x:.0f}" cy="{y:.0f}" r="5" fill="#2f7d33"/>', f'<circle cx="{x:.0f}" cy="{y:.0f}" r="7" fill="#e53935"/>'][k]
    return svg(b, "#eef7e8")


# ------------------------------------------------------------------ desserts
def rasmalai():
    b = ('<ellipse cx="350" cy="335" rx="235" ry="30" fill="#00000022"/><ellipse cx="350" cy="295" rx="250" ry="70" fill="#ffffff" stroke="#e8d9c5" stroke-width="4"/>'
         '<ellipse cx="350" cy="290" rx="222" ry="54" fill="#fff0c4"/>')
    for x, y in [(265, 275), (350, 258), (435, 275)]:
        b += f'<ellipse cx="{x}" cy="{y}" rx="64" ry="36" fill="#fffaf0" stroke="#efe0b4" stroke-width="3"/><ellipse cx="{x-14}" cy="{y-10}" rx="26" ry="9" fill="#ffffff"/>'
        b += "".join(f'<rect x="{x-24+i*14}" y="{y-8+(i%2)*8}" width="11" height="4" rx="2" fill="#7bb661" transform="rotate({i*25-40} {x-24+i*14} {y})"/>' for i in range(4))
        b += f'<line x1="{x-4}" y1="{y-16}" x2="{x+8}" y2="{y-28}" stroke="#f2994a" stroke-width="2"/><line x1="{x+10}" y1="{y-14}" x2="{x+22}" y2="{y-22}" stroke="#f2994a" stroke-width="2"/>'
    return svg(b, "#fdeef4")


def brownie():
    b = plate()
    b += ('<rect x="195" y="215" width="190" height="80" rx="10" fill="#3f1e0e"/><rect x="195" y="215" width="190" height="24" rx="10" fill="#6a3a1e"/>'
          '<rect x="240" y="140" width="190" height="80" rx="10" fill="#3f1e0e"/><rect x="240" y="140" width="190" height="24" rx="10" fill="#6a3a1e"/>'
          '<path d="M255 150 q20 -8 30 6 t40 0 t40 4 t45 -6" fill="none" stroke="#24100a" stroke-width="9" stroke-linecap="round"/>'
          '<path d="M215 226 q20 -8 30 6 t40 0 t40 4 t45 -6" fill="none" stroke="#24100a" stroke-width="9" stroke-linecap="round"/>'
          '<circle cx="490" cy="215" r="58" fill="#fff5dc"/><circle cx="470" cy="195" r="20" fill="#ffffff88"/>'
          '<path d="M440 180 q10 30 6 45 M470 165 q8 25 4 50" fill="none" stroke="#24100a" stroke-width="7" stroke-linecap="round"/>')
    b += "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="#d9a15b"/>' for x, y in [(300, 280), (345, 262), (265, 250), (395, 188), (330, 175)])
    return svg(b, "#fdeef4")


def sundae():
    b = ('<ellipse cx="350" cy="362" rx="110" ry="14" fill="#00000022"/><rect x="327" y="290" width="46" height="62" fill="#dcebf5"/><ellipse cx="350" cy="352" rx="76" ry="12" fill="#c8dcea"/>'
         '<path d="M250 150 H450 Q450 262 376 288 H324 Q250 262 250 150Z" fill="#e8f4fb" stroke="#b8d6e8" stroke-width="4"/>'
         '<path d="M262 165 H438 Q434 240 372 270 H328 Q266 240 262 165Z" fill="#ffd6e7"/><path d="M262 200 H438 Q432 245 372 270 H328 Q268 245 262 200Z" fill="#8a4f2a"/>'
         '<rect x="420" y="40" width="22" height="130" rx="6" fill="#e7c27e" transform="rotate(18 430 100)"/>'
         '<circle cx="305" cy="135" r="52" fill="#fff5dc"/><circle cx="395" cy="135" r="52" fill="#ff9ec4"/><circle cx="350" cy="92" r="50" fill="#7a4326"/>'
         '<circle cx="290" cy="118" r="14" fill="#ffffff66"/><circle cx="380" cy="118" r="14" fill="#ffffff55"/><circle cx="335" cy="76" r="13" fill="#ffffff33"/>'
         '<path d="M290 150 q4 24 8 6 M395 150 q4 28 10 6" fill="none" stroke="#4a2512" stroke-width="7" stroke-linecap="round"/>'
         '<circle cx="350" cy="40" r="15" fill="#c62828"/><path d="M350 28 q10 -14 22 -16" fill="none" stroke="#3f9142" stroke-width="3"/>')
    return svg(b, "#fdeef4")


def jalebi():
    b = plate()
    for cx, cy in [(255, 258), (350, 238), (445, 258), (300, 292), (400, 292)]:
        pts = [(cx + (5 + 3.3 * t) * math.cos(t * 1.1), cy + (3 + 2 * t) * math.sin(t * 1.1) * 0.7) for t in [i / 2 for i in range(2, 34)]]
        d = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts)
        b += f'<path d="{d}" fill="none" stroke="#d9760f" stroke-width="13" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#f9a825" stroke-width="8" stroke-linecap="round"/><path d="{d}" fill="none" stroke="#ffd27a" stroke-width="2" stroke-linecap="round" stroke-opacity=".8"/>'
    return svg(b, "#fdeef4")


def cake():
    b = plate()
    b += ('<path d="M236 160 L300 126 L530 126 L466 160Z" fill="#3a1a0a"/><path d="M466 160 L530 126 L530 258 L466 292Z" fill="#2c1308"/>'
          '<rect x="236" y="160" width="230" height="132" fill="#4b2511"/>'
          '<rect x="236" y="204" width="230" height="12" fill="#f0d9b5"/><rect x="236" y="246" width="230" height="12" fill="#f0d9b5"/>'
          '<path d="M236 160 h230 v14 q-14 28 -30 6 t-34 8 t-34 -6 t-34 10 t-34 -8 t-34 4z" fill="#2e1409"/>'
          '<ellipse cx="350" cy="140" rx="50" ry="8" fill="#ffffff22"/>'
          '<ellipse cx="410" cy="118" rx="26" ry="22" fill="#d62839"/><path d="M398 100 q12 -14 24 0 q-12 8 -24 0z" fill="#3f9142"/><circle cx="404" cy="116" r="3" fill="#ffd1d1"/>')
    return svg(b, "#fdeef4")


DISHES = {
    "veg-biryani": lambda: biryani("veg", "veg"), "mutton-biryani": lambda: biryani("mutton", "mutton", "#e0a43a", "#ecbc58"),
    "egg-biryani": lambda: biryani("egg", "egg"), "paneer-biryani": lambda: biryani("paneer", "paneer"),
    "hyderabadi-dum-biryani": handi, "chicken-fry-piece-biriyani": lambda: biryani("fry", "fry", "#eeb43c", "#f5cd62"),
    "margherita-pizza": lambda: pizza("marg", [("mozz", 6), ("basil", 6), ("tomato", 2)]),
    "paneer-pizza": lambda: pizza("paneer", [("paneer", 10), ("capsicum", 4), ("onion", 3)]),
    "farmhouse-pizza": lambda: pizza("farm", [("capsicum", 5), ("onion", 4), ("tomato", 4), ("mushroom", 4)]),
    "pepperoni-pizza": lambda: pizza("pep", [("pepperoni", 11)]),
    "bbq-chicken-pizza": lambda: pizza("bbq", [("chicken", 9), ("onion", 4)], sauce="#8a3a14", bbq=True),
    "cheese-burst-pizza": lambda: pizza("burst", [("mozz", 8), ("tomato", 3), ("basil", 3)], burst=True),
    "chicken-burger": lambda: burger("cb", ["lettuce", "tomato", "patty"], patty="#c8883a", crispy=True),
    "veg-burger": lambda: burger("vb", ["lettuce", "tomato", "onion", "patty"], patty="#7a8f3c"),
    "paneer-burger": lambda: burger("pb", ["lettuce", "tomato", "patty"], patty="#f0d9a0"),
    "double-patty-burger": lambda: burger("dp", ["lettuce", "tomato", "patty", "cheese", "patty2", "cheese"]),
    "crispy-chicken-burger": lambda: burger("cc", ["lettuce", "tomato", "cheese", "patty"], patty="#d79a3a", crispy=True),
    "masala-dosa": lambda: dosa("md", "#e6a24a", "#b8741f"), "ghee-roast-dosa": lambda: dosa("gr", "#d98a2b", "#8f5410", ghee=True),
    "idli-sambar": idli, "medu-vada": vada, "onion-uttapam": uttapam,
    "chocolate-cake": cake, "rasmalai": rasmalai, "chocolate-brownie": brownie,
    "vanilla-ice-cream-sundae": sundae, "jalebi": jalebi,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for slug, make in DISHES.items():
        if slug in KEEP:
            continue
        with open(os.path.join(OUT, slug + ".svg"), "w", encoding="utf-8") as f:
            f.write(make())
    print(len(DISHES), "dish images written to", os.path.normpath(OUT))
