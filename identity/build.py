#!/usr/bin/env python3
"""Builds the Alrifada identity templates (PDF print files with 3 mm bleed + PNG previews).

Usage:  python3 build.py [pilgrims.csv]
Without a CSV the sample file data/pilgrims_sample.csv is used.
Requires: pillow, segno, Chromium (CHROME env var or the Playwright path below).
"""
import csv, html, os, subprocess, sys, shutil
import segno

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'out')
CHROME = os.environ.get('CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
RED, BLACK, IVORY, CHAR, GRAY, LIGHT = '#A80713', '#000000', '#F5F2ED', '#2B2B2B', '#8C8C8C', '#E6E2DC'
PX = 96 / 25.4

# rings.png geometry (px): circle centre and outer radius of the supplied logo
RC = (250, 293)

GROUP_COLORS = ['#1F5FBF', '#1E9E5A', '#F28C00', '#7A3FB5', '#17A2C4', '#F2D100', '#E0508F', '#7B4A2A']
GROUP_NAMES = ['أزرق', 'أخضر', 'برتقالي', 'بنفسجي', 'سماوي', 'أصفر', 'وردي', 'بني']

E = html.escape

CSS = """
@font-face{font-family:Plex;font-weight:400;src:url(../fonts/ibm-plex-sans-latin-400-normal.woff2)}
@font-face{font-family:Plex;font-weight:500;src:url(../fonts/ibm-plex-sans-latin-500-normal.woff2)}
@font-face{font-family:Plex;font-weight:600;src:url(../fonts/ibm-plex-sans-latin-600-normal.woff2)}
@font-face{font-family:Plex;font-weight:700;src:url(../fonts/ibm-plex-sans-latin-700-normal.woff2)}
@font-face{font-family:PlexAr;font-weight:400;src:url(../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2)}
@font-face{font-family:PlexAr;font-weight:500;src:url(../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2)}
@font-face{font-family:PlexAr;font-weight:600;src:url(../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2)}
@font-face{font-family:PlexAr;font-weight:700;src:url(../fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2)}
*{box-sizing:border-box;margin:0;padding:0}
html{direction:rtl}
body{font-family:Plex,PlexAr,sans-serif;color:%(char)s;-webkit-print-color-adjust:exact;print-color-adjust:exact;letter-spacing:0}
.sheet{position:relative;overflow:hidden;break-after:page;page-break-after:always}
.page{position:absolute}
.a{position:absolute}
.en{direction:ltr;text-align:left}
.ar{direction:rtl;text-align:right}
.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
.nw{white-space:nowrap}
.guide{display:none;border:.2mm dashed #00A3E0;position:absolute}
.guides .guide{display:block}
.gline{display:none}
.guides .gline{display:block;position:absolute;border:.15mm solid #00A3E0}
img{display:block}
""" % dict(char=CHAR)


def mm(v):
    return f'{v}mm'


class Doc:
    """A multi-page document; every page = trim box W x H (mm) + bleed b on each side."""

    def __init__(self, name, W, H, b=3, bg=IVORY, unit='mm'):
        self.name, self.W, self.H, self.b, self.bg, self.unit = name, W, H, b, bg, unit
        self.pages = []
        self.layout = None  # (cols, rows) for the preview sheet

    def add(self, inner, bg=None):
        self.pages.append((inner, bg or self.bg))

    def html(self, b, guides):
        u = self.unit
        sw, sh = self.W + 2 * b, self.H + 2 * b
        sheets = []
        for inner, bg in self.pages:
            sheets.append(
                f'<div class="sheet" style="width:{sw}{u};height:{sh}{u};background:{bg}">'
                f'<div class="page" style="left:{b}{u};top:{b}{u};width:{self.W}{u};height:{self.H}{u}">{inner}</div></div>')
        if guides:
            cols, rows = self.layout or (1, len(sheets))
            flow = 'grid-auto-flow:column;grid-template-rows:repeat(%d,auto);' % rows if self.layout else ''
            body = (f'<div style="display:grid;direction:ltr;margin:0 auto 0 0;gap:6mm;background:#ddd;width:max-content;'
                    f'grid-template-columns:repeat({cols},auto);{flow}">' + ''.join(f'<div style="direction:rtl">{x}</div>' for x in sheets) + '</div>')
        else:
            body = ''.join(sheets)
        cls = 'guides' if guides else ''
        size = f'{sw}{u} {sh}{u}'
        return (f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>{self.name}</title>'
                f'<style>{CSS}@page{{size:{size};margin:0}}</style></head><body class="{cls}">{body}</body></html>')

    def render(self, pdf=True, png=True, scale=3):
        os.makedirs(SRC, exist_ok=True)
        os.makedirs(OUT, exist_ok=True)
        if pdf:
            f = os.path.join(SRC, f'{self.name}_print.html')
            open(f, 'w', encoding='utf-8').write(self.html(self.b, False))
            run_pdf(f, os.path.join(OUT, f'{self.name}_print.pdf'))
        if png:
            f = os.path.join(SRC, f'{self.name}_preview.html')
            open(f, 'w', encoding='utf-8').write(self.html(0, True))
            n = len(self.pages)
            cols, rows = self.layout or (1, n)
            k = PX if self.unit == 'mm' else 1
            w, h = (self.W * cols) * k + (cols - 1) * 6 * PX, (self.H * rows) * k + (rows - 1) * 6 * PX
            run_png(f, os.path.join(OUT, f'{self.name}_preview.png'), int(w + 1), int(h + 1), scale)


def chrome(args):
    cmd = [CHROME, '--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files',
           '--hide-scrollbars', '--virtual-time-budget=4000'] + args
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    return r


def run_pdf(src, dst):
    chrome(['--no-pdf-header-footer', f'--print-to-pdf={dst}', 'file://' + src])


def run_png(src, dst, w, h, scale):
    chrome([f'--window-size={w},{h + 160}', f'--force-device-scale-factor={scale}', f'--screenshot={dst}', 'file://' + src])
    from PIL import Image
    im = Image.open(dst)
    im.crop((0, 0, min(im.width, int(w * scale)), min(im.height, int(h * scale)))).save(dst)


# ---------- shared building blocks ----------
def img(path, style):
    return f'<img class="a" src="../assets/{path}" style="{style}">'


def logo(width, **pos):
    """Approved vertical logo, proportions locked (1030 x 941)."""
    st = ''.join(f'{k}:{v};' for k, v in pos.items())
    return img('logo.png', f'width:{width};{st}')


def arc(left=None, top=None, right=None, bottom=None, scale=0.05, cx=RC[0], cy=RC[1], px=0, py=0, unit='mm', opacity=1):
    """Place the supplied rings so the circle centre (cx, cy px) lands on page point (px, py).
    The rings are never rotated, recoloured or redrawn - the page edge does the cutting."""
    return (f'<img class="a" src="../assets/rings.png" style="width:{522 * scale}{unit};'
            f'left:{px - cx * scale}{unit};top:{py - cy * scale}{unit};opacity:{opacity}">')


def arc_corner(W, H, corner, S, R=None, unit='mm'):
    """The supplied rings centred on a page corner: one quadrant shows, cut by the page edges.
    S = reach of the outer ring along each edge. Never rotated, recoloured or redrawn."""
    sc = S / 252.0
    x = 0 if 'l' in corner else W
    y = 0 if 't' in corner else H
    return arc(px=x, py=y, scale=sc, unit=unit)


def bullet(size=3, red=True, unit='mm'):
    f = 'rhombus_red.png' if red else 'rhombus.png'
    return f'<img src="../assets/{f}" style="display:inline-block;width:{size}{unit};height:{size}{unit};vertical-align:middle;margin:0 1.2mm">'


def bleed_box(style, inner='', b=3):
    # element that runs into the bleed on the sides named via CSS vars
    return f'<div class="a" style="{style}">{inner}</div>'


def tel(s):
    return f'<span class="ltr">{E(s)}</span>'


def qr_svg(url, size_mm, border=0):
    q = segno.make(url, error='m')
    uri = q.svg_data_uri(scale=10, border=border, dark='#000000', light='#FFFFFF')
    return f'<img src="{uri}" style="width:{size_mm}mm;height:{size_mm}mm;image-rendering:crisp-edges">'


PHOTO_PLACEHOLDER = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 28' width='100%' height='100%'>"
                     "<rect width='22' height='28' fill='%23E6E2DC'/><circle cx='11' cy='10.5' r='4.2' fill='%238C8C8C'/>"
                     "<path d='M2.5 28c0-6 3.8-9.5 8.5-9.5S19.5 22 19.5 28z' fill='%238C8C8C'/></svg>")


def photo_html(src, w, h):
    if src:
        s = src if src.startswith(('http://', 'https://', 'file://', '/')) else os.path.abspath(os.path.join(ROOT, src))
        if not s.startswith(('http://', 'https://')):
            s = 'file://' + s if not s.startswith('file://') else s
        return f'<img src="{E(s)}" style="width:{w}mm;height:{h}mm;object-fit:cover">'
    return f'<img src="data:image/svg+xml;utf8,{PHOTO_PLACEHOLDER}" style="width:{w}mm;height:{h}mm">'


# ---------- templates ----------
def letterhead(office=False):
    d = Doc('letterhead_office' if office else 'letterhead', 210, 297, bg='#FFFFFF')
    p = ''
    if not office:
        p += arc_corner(210, 297, 'tl', 26, 60)
    p += logo('30mm', right='20mm', top='15mm')
    p += ('<div class="a ar nw" style="right:20mm;top:50mm;font-size:9pt;line-height:1.6">الرقم: ........................<br>التاريخ: ........................</div>'
          '<div class="a en nw" style="left:20mm;top:50mm;font-size:8pt;line-height:1.6">Ref: ........................<br>Date: ........................</div>')
    p += ('<div class="a ar" style="right:20mm;left:20mm;top:75mm;font-size:11.5pt;line-height:1.6;font-weight:400">'
          '<p style="font-weight:600;margin-bottom:4mm">الموضوع: عنوان الخطاب</p>'
          '<p>نص الخطاب يُكتب هنا. هذا نص تجريبي لتحديد منطقة الكتابة ومقاس الخط واتجاه الفقرات، ويُستبدل بالنص الفعلي عند الاستخدام.</p></div>')
    p += '<div class="a" style="left:20mm;right:20mm;top:272mm;border-top:.18mm solid ' + GRAY + '"></div>'
    p += ('<div class="a ar" style="right:20mm;top:275mm;width:80mm;font-size:9pt;line-height:1.55">'
          'العنوان: ........................<br>هاتف: ' + tel('+000 00 000 0000') + bullet(3) + 'بريد: ' + tel('info@example.com') + '<br>الموقع: ' + tel('www.example.com') + '</div>'
          '<div class="a en" style="left:20mm;top:275mm;width:80mm;font-size:8pt;line-height:1.6">'
          'Address: ........................<br>Tel: +000 00 000 0000 ' + bullet(3) + ' info@example.com<br>www.example.com</div>')
    d.add(p)
    return d


def business_card():
    d = Doc('business_card', 90, 50)
    f = arc_corner(90, 50, 'bl', 18, 40) + logo('30mm', left='30mm', top='11mm')
    d.add(f)
    p = ''
    p += ('<div class="a ar" style="right:5mm;top:9mm;width:37mm"><div class="nw" style="font-size:12pt;font-weight:600;color:#000;line-height:1.5">الاسم الكامل</div>'
          '<div class="nw" style="font-size:8.5pt;font-weight:500;line-height:1.6">المسمى الوظيفي</div></div>'
          '<div class="a en" style="left:5mm;top:9.3mm;width:37mm"><div class="nw" style="font-size:11pt;font-weight:600;color:#000;line-height:1.5">Full Name</div>'
          '<div class="nw" style="font-size:7.5pt;font-weight:500;line-height:1.7">Job Title</div></div>'
          f'<div class="a" style="left:45mm;top:10mm;height:18mm;border-left:.18mm solid {GRAY}"></div>'
          '<div class="a ar nw" style="right:5mm;left:5mm;top:33mm;font-size:8pt;line-height:1.7;text-align:center;direction:ltr">'
          + tel('+000 00 000 0000') + bullet(3) + tel('WhatsApp +000 00 000 0000') + '<br>' + tel('name@example.com') + bullet(3) + tel('www.example.com') + '</div>')
    d.add(p)
    return d


def envelope():
    d = Doc('envelope_dl', 220, 110)
    p = arc_corner(220, 110, 'bl', 24, 55) + logo('26mm', right='12mm', top='10mm')
    p += '<div class="guide" style="right:20mm;top:55mm;width:95mm;height:35mm"></div>'
    p += ('<div class="a ar nw" style="right:20mm;bottom:8mm;font-size:8pt">' + tel('www.example.com') + bullet(3) + tel('+000 00 000 0000') + '</div>')
    d.add(p)
    d.add(img('rhombus.png', 'width:10mm;left:105mm;top:12mm'))
    return d


def social():
    outs = []
    for name, W, H, top_safe in (('social_post_4x5', 1080, 1350, 0), ('social_square', 1080, 1080, 0), ('social_story', 1080, 1920, 250)):
        d = Doc(name, W, H, b=0, unit='px')
        p = arc_corner(W, H, 'tl', 380, 300, unit='px')
        ty = 330 + top_safe
        p += (f'<div class="a ar" style="right:90px;left:90px;top:{ty}px;font-size:74px;font-weight:700;line-height:1.45;color:#000">عنوان المنشور<br>في سطرين كحد أقصى</div>'
              f'<div class="a en" style="left:90px;right:90px;top:{ty + 230}px;font-size:44px;font-weight:600;line-height:1.3">Post headline, two lines at most</div>'
              f'<div class="a ar" style="right:90px;left:90px;top:{ty + 340}px;font-size:34px;line-height:1.6;font-weight:400">نص مختصر يشرح فكرة المنشور في ثلاثة أسطر أو أقل.</div>'
              f'<div class="a en" style="left:90px;right:90px;top:{ty + 440}px;font-size:32px;line-height:1.5;font-weight:400">Short supporting text, three lines at most.</div>')
        by = H - 90 - (200 if top_safe else 0)
        p += f'<div class="a" style="left:90px;right:90px;top:{by - 215}px;border-top:2px solid {LIGHT}"></div>'
        p += f'<img class="a" src="../assets/logo.png" style="width:220px;right:90px;top:{by - 191}px">'
        p += f'<div class="a en nw" style="left:90px;top:{by - 60}px;font-size:24px;font-weight:400">www.example.com</div>'
        d.add(p)
        outs.append(d)
    return outs


def pilgrim_pages(rows):
    d = Doc('pilgrim_cards', 54, 85.6, bg=IVORY)
    d.layout = (len(rows), 2)
    warn = []
    for r in rows:
        gno = r.get('group_no', '')
        try:
            ci = (int(gno) - 1) % 8
        except ValueError:
            ci = int(r.get('group_color', '1') or 1) - 1
        col = GROUP_COLORS[ci]
        if len(r.get('name_ar', '')) > 26 or len(r.get('name_en', '')) > 34:
            warn.append(r.get('pilgrim_id'))
        # FRONT
        f = (f'<div class="a" style="left:-3mm;right:-3mm;top:-3mm;height:20mm;background:{col}"></div>'
             '<div class="guide" style="left:20.5mm;top:4mm;width:13mm;height:3mm;border-radius:1.5mm"></div>'
             '<div class="a" style="left:7mm;top:8mm;width:40mm;height:7mm;background:#fff;border-radius:1.5mm;display:flex;align-items:center;justify-content:space-between;padding:0 2.4mm;color:#000">'
             f'<span style="font-size:8pt;font-weight:500">المجموعة</span><span style="font-size:12pt;font-weight:700;line-height:1">{E(gno)}</span><span style="font-size:7pt;font-weight:500;direction:ltr">GROUP</span></div>'
             f'<div class="a" style="left:16mm;top:21mm;width:22mm;height:28mm;border:.18mm solid {LIGHT}">{photo_html(r.get("photo"), 22, 28)}</div>'
             f'<div class="a nw" style="left:0;right:0;top:51mm;text-align:center;font-size:11pt;font-weight:600;color:#000;line-height:1.5">{E(r.get("name_ar", ""))}</div>'
             f'<div class="a nw" style="left:0;right:0;top:57.2mm;text-align:center;direction:ltr;font-size:8pt;font-weight:500;line-height:1.4">{E(r.get("name_en", ""))}</div>'
             f'<div class="a" style="left:4mm;top:66mm;width:46mm;height:15.6mm;background:#000;border-radius:1.5mm;color:{IVORY};text-align:center">'
             '<div style="font-size:7pt;font-weight:500;margin-top:2mm;line-height:1.3">رقم الطوارئ · EMERGENCY</div>'
             f'<div style="font-size:14pt;font-weight:700;direction:ltr;line-height:1.35;margin-top:.6mm">{E(r.get("emergency_no", ""))}</div></div>')
        d.add(f)
        # BACK
        def block(label_ar, label_en, v_ar, v_en, top):
            return (f'<div class="a" style="left:4mm;right:4mm;top:{top}mm">'
                    f'<div class="nw" style="font-size:7.5pt;font-weight:600;line-height:1.5">{bullet(3)}{label_ar} · {label_en}</div>'
                    f'<div class="nw" style="font-size:10pt;font-weight:500;color:#000;line-height:1.5">{E(v_ar)}</div>'
                    f'<div class="nw en" style="font-size:7.5pt;font-weight:400;line-height:1.4">{E(v_en)}</div></div>')
        b = ('<div class="a" style="left:0;right:0;top:9mm"><div style="width:18mm;margin:0 auto">' + f'<img src="../assets/logo.png" style="width:18mm"></div></div>'
             + block('السكن في مكة', 'Makkah Hotel', r.get('hotel_makkah_ar', ''), r.get('hotel_makkah_en', ''), 28)
             + block('المخيم في منى', 'Mina Camp', r.get('camp_mina_ar', ''), r.get('camp_mina_en', ''), 43)
             + f'<div class="a" style="left:4mm;top:59.6mm;width:22mm;height:22mm;background:#fff;border-radius:1.5mm;padding:2mm">{qr_svg(r.get("qr_url") or "https://example.com/p/" + r.get("pilgrim_id", ""), 18)}</div>'
             + '<div class="a ar" style="right:4mm;top:62mm;width:21mm"><div style="font-size:8pt;font-weight:600;color:#000;line-height:1.5">امسح الرمز للمساعدة</div>'
               '<div class="en" style="font-size:7pt;font-weight:400;line-height:1.4">Scan for help</div></div>')
        d.add(b)
    return d, warn


def staff_card():
    d = Doc('staff_card', 85.6, 54)
    f = (img('logo.png', 'width:18mm;left:5mm;top:4.5mm')
         + '<div class="guide" style="left:36.3mm;top:4mm;width:13mm;height:3mm;border-radius:1.5mm"></div>'
         + f'<div class="a" style="right:5mm;top:7mm;width:22mm;height:28mm;border:.18mm solid {LIGHT}">{photo_html(None, 22, 28)}</div>'
         + '<div class="a ar" style="right:32mm;left:5mm;top:23mm"><div class="nw" style="font-size:12pt;font-weight:700;color:#000;line-height:1.4">الاسم الكامل</div>'
           '<div class="nw en" style="font-size:8.5pt;font-weight:500;line-height:1.4">Full Name</div>'
           '<div class="nw" style="font-size:9pt;line-height:1.4;margin-top:.5mm">المسمى الوظيفي</div><div class="nw en" style="font-size:7.5pt;line-height:1.4">Job Title</div></div>'
         + '<div class="a nw" style="right:5mm;top:36mm;width:22mm;text-align:center;font-size:8pt;font-weight:500;direction:ltr">ID 000000</div>'
         + f'<div class="a" style="left:-3mm;right:-3mm;top:45mm;bottom:-3mm;background:{RED};color:#fff;display:flex;justify-content:center;align-items:center;font-size:11pt;font-weight:700"><span style="margin-top:-1.5mm">فريق العمل · STAFF</span></div>')
    d.add(f)
    b = (img('logo.png', 'width:20mm;right:5mm;top:5mm')
         + f'<div class="a" style="left:5mm;top:10mm;width:24mm;height:24mm;background:#fff;border-radius:1.5mm;padding:2mm">{qr_svg("https://example.com/staff/verify/000000", 20)}</div>'
         + '<div class="a ar" style="right:5mm;left:34mm;top:30mm;line-height:1.5"><div style="font-size:8.5pt">هذه البطاقة مملوكة لشركة الرفادة. إن عثرت عليها فاتصل بـ</div>'
           '<div style="font-size:10pt;font-weight:700;color:#000;direction:ltr;text-align:right">+000 00 000 0000</div>'
           '<div class="en" style="font-size:7.5pt;direction:ltr;text-align:right">If found, please call the number above</div></div>'
         + f'<div class="a" style="left:-3mm;right:-3mm;bottom:-3mm;height:6mm;background:{RED}"></div>')
    d.add(b)
    return d


def email_signature():
    h = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>email signature</title></head><body>
<table dir="rtl" width="560" cellpadding="0" cellspacing="0" style="font-family:Tahoma,Arial,sans-serif;color:{CHAR};max-width:560px">
<tr><td style="font-size:16px;font-weight:bold;color:#000">الاسم الكامل</td></tr>
<tr><td style="font-size:13px;padding-bottom:6px">المسمى الوظيفي — شركة الرفادة</td></tr>
<tr><td dir="ltr" align="left" style="font-size:14px;font-weight:bold;color:#000">Full Name</td></tr>
<tr><td dir="ltr" align="left" style="font-size:13px;padding-bottom:8px">Job Title — Alrifada Pilgrims Services</td></tr>
<tr><td style="padding-bottom:8px"><table cellpadding="0" cellspacing="0"><tr><td width="40" height="2" style="background:{RED};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td dir="ltr" align="left" style="font-size:13px;padding-bottom:10px">+000 00 000 0000 &nbsp;|&nbsp; name@example.com &nbsp;|&nbsp; www.example.com</td></tr>
<tr><td><img src="../assets/signature_logo.png" width="180" alt="الرفادة لخدمات الحجاج | Alrifada Pilgrims Services" style="display:block;border:0"></td></tr>
</table></body></html>"""
    os.makedirs(SRC, exist_ok=True)
    f = os.path.join(SRC, 'email_signature.html')
    open(f, 'w', encoding='utf-8').write(h)
    run_png(f, os.path.join(OUT, 'email_signature_preview.png'), 620, 330, 2)


def read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as fh:
        return list(csv.DictReader(fh))


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'pilgrims_sample.csv')
    os.makedirs(OUT, exist_ok=True)
    letterhead().render()
    letterhead(office=True).render(png=False)
    business_card().render()
    envelope().render()
    for s in social():
        s.render(pdf=False)
    email_signature()
    staff_card().render()
    d, warn = pilgrim_pages(read_csv(csv_path))
    d.render()
    if warn:
        print('WARNING: names exceed the card limit for:', ', '.join(map(str, warn)))
    print('done ->', OUT)


if __name__ == '__main__':
    main()
