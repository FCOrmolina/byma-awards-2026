"""
BYMA 2026 — Manual del Votante
Cadencia: editorial silence, scored across six movements.

Run: python3 build_manual.py
Output: ../manual-votante-byma-2026.pdf
"""

from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg


# ─── PALETTE ──────────────────────────────────────────────────────────────────
BLACK   = HexColor("#262626")
CREAM   = HexColor("#efd9c6")
ORANGE  = HexColor("#dc6e00")
BLUE    = HexColor("#025c98")
RED     = HexColor("#921426")

def cream_alpha(a):
    return Color(0xef/255, 0xd9/255, 0xc6/255, alpha=a)

CREAM_12 = cream_alpha(0.12)
CREAM_30 = cream_alpha(0.30)
CREAM_55 = cream_alpha(0.55)
CREAM_75 = cream_alpha(0.75)
CREAM_85 = cream_alpha(0.85)
ORANGE_10 = Color(0xdc/255, 0x6e/255, 0x00/255, alpha=0.10)
BLUE_10   = Color(0x02/255, 0x5c/255, 0x98/255, alpha=0.10)


# ─── FONTS ────────────────────────────────────────────────────────────────────
HERE = Path(__file__).resolve().parent
pdfmetrics.registerFont(TTFont("Onest",     str(HERE / "Onest-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Md",  str(HERE / "Onest-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Sb",  str(HERE / "Onest-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Bd",  str(HERE / "Onest-Bold.ttf")))


# ─── ASSETS ───────────────────────────────────────────────────────────────────
LOGO_BYMA_SVG  = HERE / "logo-byma-on-dark.svg"   # cls-3 dark→cream
FCO_LOGO_PNG   = HERE / "fco-logo-cream.png"      # baked cream-on-transparent
BG_COVER       = HERE / "bg-crema.png"            # platillos · 16% opacity
BG_CLOSE       = HERE / "bg-naranja.png"          # closing page texture


# ─── GEOMETRY ─────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = LETTER       # 612 x 792 pt
MARGIN_X = 0.85 * inch
MARGIN_T = 0.85 * inch
MARGIN_B = 0.80 * inch
COL_X = MARGIN_X
COL_W = PAGE_W - 2 * MARGIN_X

STAFF_Y_TOP = 1.65 * inch
STAFF_GAP   = 0.085 * inch
STAFF_LINES = 5


# ─── PRIMITIVES ───────────────────────────────────────────────────────────────
def tracked(c, text, x, y, *, font, size, color, tracking_em):
    c.setFont(font, size)
    c.setFillColor(color)
    cs = size * tracking_em
    c.drawString(x, y, text, charSpace=cs)
    return pdfmetrics.stringWidth(text, font, size) + cs * max(len(text) - 1, 0)


def text_width(text, font, size, tracking_em=0):
    cs = size * tracking_em
    return pdfmetrics.stringWidth(text, font, size) + cs * max(len(text) - 1, 0)


def eyebrow(c, text, x, y, *, color=ORANGE, rule_w=40, gap=10, size=7.5, tracking_em=0.30):
    c.setStrokeColor(color)
    c.setLineWidth(0.9)
    c.line(x, y + 2.5, x + rule_w, y + 2.5)
    tracked(c, text.upper(), x + rule_w + gap, y, font="Onest-Md", size=size,
            color=color, tracking_em=tracking_em)


def display_headline(c, text, x, y, *, size=46, color=CREAM, tight=-0.030):
    tracked(c, text, x, y, font="Onest-Sb", size=size, color=color, tracking_em=tight)


def body(c, text, x, y, *, size=10.5, color=CREAM_85, leading=15.5, max_width=None,
         font="Onest"):
    c.setFillColor(color)
    if max_width is None:
        max_width = COL_W
    words = text.split()
    line, lines = "", []
    for w in words:
        trial = (line + " " + w).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    c.setFont(font, size)
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y + leading


def small_caps_meta(c, text, x, y, *, color=CREAM_30, size=6.6, tracking_em=0.28):
    tracked(c, text.upper(), x, y, font="Onest-Md", size=size, color=color,
            tracking_em=tracking_em)


def page_number(c, n):
    label = f"/ {n:02d} — VI"
    w = text_width(label.upper(), "Onest-Md", 6.6, 0.28)
    small_caps_meta(c, label, PAGE_W - MARGIN_X - w, MARGIN_B - 28, color=CREAM_55)


def colophon(c, page_no: int):
    """Standard footer for inner pages."""
    y = MARGIN_B - 14
    cs = 6.6 * 0.28
    c.setFillColor(CREAM_55)
    c.setFont("Onest-Md", 6.6)
    left = "UN  "
    c.drawString(MARGIN_X, y, left, charSpace=cs)
    adv = text_width(left, "Onest-Md", 6.6, 0.28)

    c.setFillColor(CREAM_85)
    c.setFont("Onest-Sb", 6.6)
    emph = "MOMENTO MEMORABLE  "
    c.drawString(MARGIN_X + adv, y, emph, charSpace=cs)
    adv += text_width(emph, "Onest-Sb", 6.6, 0.28)

    c.setFillColor(CREAM_55)
    c.setFont("Onest-Md", 6.6)
    tail = "DE FCO GROUP"
    c.drawString(MARGIN_X + adv, y, tail, charSpace=cs)

    right = "EDICIÓN 2026  ·  NOMINACIONES.BYMA.MX"
    c.setFont("Onest-Md", 6.6)
    rw = text_width(right, "Onest-Md", 6.6, 0.28)
    c.setFillColor(CREAM_55)
    c.drawString(PAGE_W - MARGIN_X - rw, y, right, charSpace=cs)
    page_number(c, page_no)


def draw_staff(c, *, y_top=STAFF_Y_TOP, lines=STAFF_LINES, gap=STAFF_GAP,
               marks=None, mark_color=None):
    c.setStrokeColor(CREAM_12)
    c.setLineWidth(0.4)
    for i in range(lines):
        y = y_top - i * gap
        c.line(MARGIN_X, y, PAGE_W - MARGIN_X, y)
    if marks:
        mark_color = mark_color or ORANGE
        c.setFillColor(mark_color)
        for x_pt, line_i, r in marks:
            y = y_top - line_i * gap
            c.circle(x_pt, y, r, stroke=0, fill=1)


def background(c, *, bg_image=None, bg_y=None, bg_h=None):
    """Solid black field + optional low-opacity art behind."""
    c.setFillColor(BLACK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    if bg_image and bg_image.exists():
        h = bg_h if bg_h else PAGE_H * 0.55
        y = bg_y if bg_y is not None else (PAGE_H - h) / 2
        c.drawImage(str(bg_image), 0, y, PAGE_W, h, mask='auto',
                    preserveAspectRatio=True, anchor='c')


def draw_svg(c, svg_path: Path, x, y, target_w):
    """Embed a vector SVG at given top-left, scaled to target_w. Returns final h."""
    drawing = svg2rlg(str(svg_path))
    scale = target_w / drawing.width
    drawing.width *= scale
    drawing.height *= scale
    drawing.scale(scale, scale)
    renderPDF.draw(drawing, c, x, y)
    return drawing.height


def draw_png(c, png_path: Path, x, y, target_w, target_h=None):
    """Embed a PNG, preserving aspect if target_h omitted."""
    from PIL import Image as _Image
    if target_h is None:
        with _Image.open(png_path) as im:
            ratio = im.height / im.width
        target_h = target_w * ratio
    c.drawImage(str(png_path), x, y, target_w, target_h, mask='auto',
                preserveAspectRatio=True, anchor='sw')
    return target_h


# ─── PAGE 1 · COVER ───────────────────────────────────────────────────────────
def page_cover(c):
    background(c, bg_image=BG_COVER, bg_y=0, bg_h=PAGE_H)

    # Staff with a few scattered notes — sits well above the bottom block.
    draw_staff(c, y_top=PAGE_H * 0.42,
               marks=[
                   (MARGIN_X + 0.6 * inch, 1, 1.8),
                   (MARGIN_X + 1.8 * inch, 0, 1.2),
                   (MARGIN_X + 3.3 * inch, 3, 2.6),
                   (MARGIN_X + 4.4 * inch, 2, 1.4),
                   (MARGIN_X + 5.3 * inch, 4, 1.0),
               ])

    # Eyebrow
    eyebrow(c, "Edición 2026 · Manual del votante",
            MARGIN_X, PAGE_H - MARGIN_T - 6, color=ORANGE)

    # BYMA logo — the title. Set large, hung from the upper third.
    logo_w = PAGE_W - 2 * MARGIN_X
    # Aspect: 1558:433  →  height = logo_w * 433/1558
    logo_h = logo_w * 433 / 1558
    logo_y = PAGE_H - MARGIN_T - 60 - logo_h - 8  # baseline below eyebrow
    draw_svg(c, LOGO_BYMA_SVG, MARGIN_X, logo_y, logo_w)

    # Subtitle — restrained, below the logo.
    sub_y = logo_y - 36
    body(c, "Guía rápida para registrar a tus nominados en "
            "nominaciones.byma.mx. Seis movimientos. Lee con calma.",
         MARGIN_X, sub_y, size=12, color=CREAM_85, leading=20,
         max_width=COL_W * 0.62, font="Onest")

    # ─ Bottom block ────────────────────────────────────────────────────────────
    # Centered: SAVE THE DATE / 26.08.26 / Un momento memorable de [FCO logo]
    cx = PAGE_W / 2
    block_top = MARGIN_B + 96

    # SAVE THE DATE — wide tracking, small
    label = "Save the date"
    tw = text_width(label.upper(), "Onest-Md", 9, 0.42)
    tracked(c, label.upper(), cx - tw / 2, block_top, font="Onest-Md", size=9,
            color=CREAM_55, tracking_em=0.42)

    # 26.08.26 — display, large
    date = "26.08.26"
    dw = text_width(date, "Onest-Sb", 44, -0.020)
    display_headline(c, date, cx - dw / 2, block_top - 52, size=44, color=ORANGE, tight=-0.020)

    # "Un momento memorable de [FCO logo]"
    line_y = block_top - 92
    txt_left = "UN  "
    txt_emph = "MOMENTO MEMORABLE  "
    txt_de   = "DE "
    sz = 10
    cs = sz * 0.28
    tw_total = (
        text_width(txt_left, "Onest-Md", sz, 0.28) +
        text_width(txt_emph, "Onest-Sb", sz, 0.28) +
        text_width(txt_de,   "Onest-Md", sz, 0.28) +
        80  # space for FCO logo
    )
    start_x = cx - tw_total / 2

    c.setFillColor(CREAM_55)
    c.setFont("Onest-Md", sz)
    c.drawString(start_x, line_y, txt_left, charSpace=cs)
    start_x += text_width(txt_left, "Onest-Md", sz, 0.28)

    c.setFillColor(CREAM_85)
    c.setFont("Onest-Sb", sz)
    c.drawString(start_x, line_y, txt_emph, charSpace=cs)
    start_x += text_width(txt_emph, "Onest-Sb", sz, 0.28)

    c.setFillColor(CREAM_55)
    c.setFont("Onest-Md", sz)
    c.drawString(start_x, line_y, txt_de, charSpace=cs)
    start_x += text_width(txt_de, "Onest-Md", sz, 0.28)

    # FCO logo — inline at this baseline.
    fco_h = 26
    fco_w = fco_h * 433 / 157
    draw_png(c, FCO_LOGO_PNG, start_x + 2, line_y - fco_h * 0.35, fco_w, fco_h)


# ─── PAGE 2 · ACCESO ──────────────────────────────────────────────────────────
def page_acceso(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 0.5 * inch, 2, 2.2)])

    eyebrow(c, "01 · Acceso", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Solo necesitas", MARGIN_X, PAGE_H - MARGIN_T - 60, size=44)
    display_headline(c, "tu correo.",     MARGIN_X, PAGE_H - MARGIN_T - 60 - 50, size=44, color=ORANGE)

    steps = [
        ("Entra a nominaciones.byma.mx",
         "Desde cualquier navegador moderno, en computadora o teléfono."),
        ("Escribe el correo con el que te invitamos.",
         "Solo los correos en nuestro allowlist pueden entrar. Si quieres usar otro, escríbenos."),
        ("Recibirás un código de seis dígitos por correo.",
         "Puede tardar un par de minutos. Revisa tu carpeta de spam o promociones."),
        ("Ingresa el código en la pantalla siguiente.",
         "Estás dentro. La sesión queda activa en este navegador hasta que cierres sesión."),
    ]
    y = PAGE_H - MARGIN_T - 60 - 50 - 80
    for i, (head, sub) in enumerate(steps, start=1):
        c.setFillColor(CREAM_55)
        c.setFont("Onest-Md", 8)
        c.drawString(MARGIN_X, y, f"{i:02d}", charSpace=8 * 0.25)
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 12.5)
        c.drawString(MARGIN_X + 36, y, head)
        body(c, sub, MARGIN_X + 36, y - 16, size=10, color=CREAM_55,
             leading=14, max_width=COL_W - 36 - 1.6 * inch)
        c.setStrokeColor(CREAM_12)
        c.setLineWidth(0.4)
        c.line(MARGIN_X, y - 44, PAGE_W - MARGIN_X, y - 44)
        y -= 64

    tip_x, tip_y = MARGIN_X, MARGIN_B + 78
    tip_w, tip_h = COL_W, 56
    c.setFillColor(ORANGE_10)
    c.rect(tip_x, tip_y, tip_w, tip_h, stroke=0, fill=1)
    c.setStrokeColor(ORANGE)
    c.setLineWidth(2.0)
    c.line(tip_x, tip_y, tip_x, tip_y + tip_h)
    small_caps_meta(c, "Nota", tip_x + 18, tip_y + tip_h - 18, color=ORANGE)
    body(c, "El código expira en pocos minutos. Si no llega o caduca, "
            "pide uno nuevo con el botón “Reenviar código”.",
         tip_x + 18, tip_y + tip_h - 34, size=10.5, color=CREAM_85, leading=14,
         max_width=tip_w - 36)

    colophon(c, 2)


# ─── PAGE 3 · DASHBOARD ───────────────────────────────────────────────────────
def page_dashboard(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 1.1 * inch, 0, 1.6),
                         (MARGIN_X + 4.0 * inch, 2, 2.0)])

    eyebrow(c, "02 · Dashboard", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Aquí están",       MARGIN_X, PAGE_H - MARGIN_T - 60, size=44)
    display_headline(c, "tus categorías.",  MARGIN_X, PAGE_H - MARGIN_T - 60 - 50, size=44, color=ORANGE)

    intro_y = PAGE_H - MARGIN_T - 60 - 50 - 38
    intro_y = body(c, "Al entrar verás un panel con cuatro elementos clave. "
                      "Todo cabe en una sola pantalla.",
                   MARGIN_X, intro_y, size=11, color=CREAM_85, leading=16,
                   max_width=COL_W * 0.78)

    points = [
        ("Tus categorías asignadas",
         "Las define el comité según tu perfil."),
        ("Un contador de avance",
         "Arriba del panel: cuántas categorías llevas completadas."),
        ("Selector horizontal por bucket",
         "Makers · Players · Distribution · Live · Impact. Toca uno para saltar directo."),
        ("Tarjeta por categoría",
         "Cada una muestra estado: Pendiente, X/5 en progreso, o completada."),
    ]
    y = intro_y - 22
    for label, sub in points:
        c.setFillColor(ORANGE)
        c.circle(MARGIN_X + 2.5, y + 3, 1.8, stroke=0, fill=1)
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 11)
        c.drawString(MARGIN_X + 16, y, label)
        body(c, sub, MARGIN_X + 16, y - 14, size=9.8, color=CREAM_55,
             leading=13.5, max_width=COL_W * 0.78)
        y -= 42

    mock_y = MARGIN_B + 96
    card_w = (COL_W - 24) / 3
    card_h = 110
    states = [
        ("PENDIENTE", CREAM_30, None),
        ("3/5",       ORANGE,   "EN PROGRESO"),
        ("COMPLETA",  CREAM,    "DESTACADO"),
    ]
    bucket_labels = ["MAKERS / 04", "PLAYERS / 11", "LIVE / 19"]
    titles = ["Compositor del Año", "Label del Año", "Gira del Año"]

    for i in range(3):
        x = MARGIN_X + i * (card_w + 12)
        c.setStrokeColor(CREAM_30)
        c.setLineWidth(0.6)
        c.rect(x, mock_y, card_w, card_h, stroke=1, fill=0)

        small_caps_meta(c, bucket_labels[i], x + 12, mock_y + card_h - 18,
                        color=CREAM_55)
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 12)
        c.drawString(x + 12, mock_y + card_h - 38, titles[i])

        label, color, _ = states[i]
        cs = 6.6 * 0.26
        c.setFont("Onest-Md", 6.6)
        pill_w = pdfmetrics.stringWidth(label, "Onest-Md", 6.6) + cs * (len(label) - 1) + 12
        c.setStrokeColor(color)
        c.setLineWidth(0.7)
        c.rect(x + 12, mock_y + 14, pill_w, 14, stroke=1, fill=0)
        c.setFillColor(color)
        c.drawString(x + 18, mock_y + 18.4, label, charSpace=cs)

    small_caps_meta(c, "Visual aproximado — la realidad es más fina.",
                    MARGIN_X, mock_y - 14, color=CREAM_30)

    colophon(c, 3)


# ─── PAGE 4 · PROPUESTAS ──────────────────────────────────────────────────────
def page_propuestas(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 0.6 * inch, 4, 2.0),
                         (MARGIN_X + 3.7 * inch, 1, 1.6)])

    eyebrow(c, "03 · Propuestas", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Hasta cinco",          MARGIN_X, PAGE_H - MARGIN_T - 60, size=44)
    display_headline(c, "por categoría.",       MARGIN_X, PAGE_H - MARGIN_T - 60 - 50, size=44, color=ORANGE)

    intro_y = PAGE_H - MARGIN_T - 60 - 50 - 38
    intro_y = body(c, "Entra a una categoría. Lee qué busca celebrar. Después "
                      "trabaja sobre los cinco espacios.",
                   MARGIN_X, intro_y, size=11, color=CREAM_85, leading=16,
                   max_width=COL_W * 0.78)

    slot_y = intro_y - 32
    slot_size = 30
    slot_gap = 8
    sx = MARGIN_X
    for i in range(5):
        x = sx + i * (slot_size + slot_gap)
        is_required = i < 3
        if is_required:
            c.setFillColor(ORANGE)
            c.rect(x, slot_y - slot_size, slot_size, slot_size, stroke=0, fill=1)
            c.setFillColor(BLACK)
        else:
            c.setStrokeColor(ORANGE)
            c.setLineWidth(0.8)
            c.rect(x, slot_y - slot_size, slot_size, slot_size, stroke=1, fill=0)
            c.setFillColor(ORANGE)
        c.setFont("Onest-Sb", 13)
        n = f"{i+1}"
        nw = pdfmetrics.stringWidth(n, "Onest-Sb", 13)
        c.drawString(x + (slot_size - nw) / 2, slot_y - slot_size / 2 - 4, n)

    bracket_y = slot_y - slot_size - 8
    req_x0 = sx
    req_x1 = sx + 3 * slot_size + 2 * slot_gap
    c.setStrokeColor(CREAM_55)
    c.setLineWidth(0.5)
    c.line(req_x0, bracket_y, req_x1, bracket_y)
    c.line(req_x0, bracket_y, req_x0, bracket_y + 3)
    c.line(req_x1, bracket_y, req_x1, bracket_y + 3)
    small_caps_meta(c, "Obligatorios", req_x0, bracket_y - 12, color=CREAM_75)

    opt_x0 = sx + 3 * (slot_size + slot_gap)
    opt_x1 = sx + 5 * slot_size + 4 * slot_gap
    c.line(opt_x0, bracket_y, opt_x1, bracket_y)
    c.line(opt_x0, bracket_y, opt_x0, bracket_y + 3)
    c.line(opt_x1, bracket_y, opt_x1, bracket_y + 3)
    small_caps_meta(c, "Opcionales", opt_x0, bracket_y - 12, color=CREAM_30)

    fields_y = bracket_y - 44
    small_caps_meta(c, "Cada espacio pide", MARGIN_X, fields_y, color=CREAM_55)

    fields_y -= 18
    c.setFillColor(CREAM)
    c.setFont("Onest-Sb", 11)
    c.drawString(MARGIN_X, fields_y, "Nombre del propuesto")
    body(c, "Persona, empresa, sello, plataforma o evento — quien corresponda a la categoría.",
         MARGIN_X, fields_y - 14, size=10, color=CREAM_55, leading=14,
         max_width=COL_W * 0.78)

    fields_y -= 44
    c.setFillColor(CREAM)
    c.setFont("Onest-Sb", 11)
    c.drawString(MARGIN_X, fields_y, "Justificación breve  ·  opcional")
    body(c, "Una o dos frases. No es obligatoria, pero ayuda al comité a leer tu propuesta.",
         MARGIN_X, fields_y - 14, size=10, color=CREAM_55, leading=14,
         max_width=COL_W * 0.78)

    pq_y = MARGIN_B + 96
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1.2)
    c.line(MARGIN_X, pq_y + 56, MARGIN_X + 40, pq_y + 56)
    display_headline(c, "La justificación",       MARGIN_X, pq_y + 30, size=22, color=CREAM, tight=-0.025)
    display_headline(c, "ayuda al comité",        MARGIN_X, pq_y + 8,  size=22, color=CREAM, tight=-0.025)
    display_headline(c, "a entender tu lectura.", MARGIN_X, pq_y - 14, size=22, color=ORANGE, tight=-0.025)

    colophon(c, 4)


# ─── PAGE 5 · GESTIÓN ─────────────────────────────────────────────────────────
def page_gestion(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 2.1 * inch, 3, 1.5)])

    eyebrow(c, "04 · Gestión", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Edita libremente.",       MARGIN_X, PAGE_H - MARGIN_T - 60, size=42)
    display_headline(c, "Cierra cuando termines.", MARGIN_X, PAGE_H - MARGIN_T - 60 - 48, size=42, color=ORANGE)

    bullets = [
        ("Guardado al instante",
         "Cada propuesta se guarda en cuanto sales del campo. No hay botón “guardar” global."),
        ("Editable hasta el cierre",
         "Vuelve cuantas veces quieras y modifica nombres o justificaciones."),
        ("Avance global visible",
         "El contador del dashboard refleja siempre tu progreso al día."),
        ("Cerrar sesión",
         "Botón “Salir” en la esquina superior derecha. La sesión queda abierta hasta entonces."),
    ]
    y = PAGE_H - MARGIN_T - 60 - 48 - 56
    for label, sub in bullets:
        c.setFillColor(ORANGE)
        c.circle(MARGIN_X + 3, y + 3, 2.2, stroke=0, fill=1)
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 12.5)
        c.drawString(MARGIN_X + 18, y, label)
        body(c, sub, MARGIN_X + 18, y - 16, size=10.5, color=CREAM_55,
             leading=14.5, max_width=COL_W * 0.78)
        y -= 56

    box_x, box_y = MARGIN_X, MARGIN_B + 80
    box_w, box_h = COL_W, 78
    c.setFillColor(BLUE_10)
    c.rect(box_x, box_y, box_w, box_h, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.0)
    c.line(box_x, box_y, box_x, box_y + box_h)

    small_caps_meta(c, "Soporte", box_x + 18, box_y + box_h - 18, color=BLUE)
    c.setFillColor(CREAM)
    c.setFont("Onest-Sb", 13)
    c.drawString(box_x + 18, box_y + box_h - 36, "¿Algo no funciona?")
    body(c, "Escríbenos a rmolina@fcogroup.mx con el asunto "
            "“BYMA 2026 — soporte de acceso”. "
            "Te respondemos el mismo día hábil.",
         box_x + 18, box_y + box_h - 52, size=10.5, color=CREAM_85,
         leading=14, max_width=box_w - 36)

    colophon(c, 5)


# ─── PAGE 6 · AGENDA ──────────────────────────────────────────────────────────
def page_agenda(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 0.4 * inch, 2, 1.4),
                         (MARGIN_X + 2.0 * inch, 2, 2.2),
                         (MARGIN_X + 4.0 * inch, 2, 3.0)])

    eyebrow(c, "Agenda", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Lo que viene.", MARGIN_X, PAGE_H - MARGIN_T - 70, size=56, color=CREAM)

    # Vertical timeline — 4 milestones, more breathing room than horizontal.
    tl_y_top = PAGE_H * 0.70
    tl_x = MARGIN_X + 18
    spacing = 78
    c.setStrokeColor(CREAM_30)
    c.setLineWidth(0.6)
    c.line(tl_x, tl_y_top + 6, tl_x, tl_y_top - spacing * 3 - 6)

    milestones = [
        ("Inicio de postulaciones",       "26 de junio",   CREAM,  False),
        ("Cierre del sistema de postulaciones", "06 de julio",   CREAM,  False),
        ("Anuncio de nominados",          "15 de agosto",  CREAM,  False),
        ("Beyond Music Awards",           "26 de agosto",  ORANGE, True),
    ]
    for i, (label, date, color, is_event) in enumerate(milestones):
        y = tl_y_top - i * spacing
        # Marker dot
        if is_event:
            c.setFillColor(color)
            c.circle(tl_x, y, 6, stroke=0, fill=1)
        else:
            c.setStrokeColor(color)
            c.setLineWidth(1.2)
            c.circle(tl_x, y, 5, stroke=1, fill=0)
        # Date — eyebrow style next to the dot
        small_caps_meta(c, date, tl_x + 22, y + 6, color=color, size=7.2)
        # Label — display, below
        c.setFillColor(CREAM if not is_event else CREAM)
        c.setFont("Onest-Sb", 17)
        c.drawString(tl_x + 22, y - 10, label)

        # For the event row, embed the BYMA logo small to the right
        if is_event:
            try:
                logo_w = 130
                logo_h = logo_w * 433 / 1558
                draw_svg(c, LOGO_BYMA_SVG, PAGE_W - MARGIN_X - logo_w,
                         y - logo_h / 2, logo_w)
            except Exception:
                pass

    colophon(c, 6)


# ─── DOC ──────────────────────────────────────────────────────────────────────
def build(out_path: Path):
    c = rl_canvas.Canvas(str(out_path), pagesize=LETTER)
    c.setTitle("BYMA Awards 2026 — Manual del Votante")
    c.setAuthor("FCO Group")
    c.setSubject("Manual del votante · Edición 2026")
    c.setCreator("Cadencia · master-typeset by hand")
    c.setKeywords(["BYMA", "Beyond Music Awards", "votante", "manual", "FCO Group"])

    for fn in (page_cover, page_acceso, page_dashboard, page_propuestas,
               page_gestion, page_agenda):
        fn(c)
        c.showPage()

    c.save()


if __name__ == "__main__":
    out = HERE.parent / "manual-votante-byma-2026.pdf"
    build(out)
    print(f"wrote {out}")
