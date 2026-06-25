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


# ─── PALETTE ──────────────────────────────────────────────────────────────────
BLACK   = HexColor("#262626")
CREAM   = HexColor("#efd9c6")
ORANGE  = HexColor("#dc6e00")
BLUE    = HexColor("#025c98")
RED     = HexColor("#921426")

def cream_alpha(a):
    """Cream at given alpha (0–1) as a Color."""
    return Color(0xef/255, 0xd9/255, 0xc6/255, alpha=a)

CREAM_12 = cream_alpha(0.12)
CREAM_30 = cream_alpha(0.30)
CREAM_55 = cream_alpha(0.55)
CREAM_75 = cream_alpha(0.75)
CREAM_85 = cream_alpha(0.85)
ORANGE_25 = Color(0xdc/255, 0x6e/255, 0x00/255, alpha=0.25)
ORANGE_18 = Color(0xdc/255, 0x6e/255, 0x00/255, alpha=0.18)
ORANGE_10 = Color(0xdc/255, 0x6e/255, 0x00/255, alpha=0.10)
BLUE_25   = Color(0x02/255, 0x5c/255, 0x98/255, alpha=0.25)
BLUE_10   = Color(0x02/255, 0x5c/255, 0x98/255, alpha=0.10)


# ─── FONTS ────────────────────────────────────────────────────────────────────
HERE = Path(__file__).resolve().parent
pdfmetrics.registerFont(TTFont("Onest",     str(HERE / "Onest-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Md",  str(HERE / "Onest-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Sb",  str(HERE / "Onest-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Onest-Bd",  str(HERE / "Onest-Bold.ttf")))


# ─── GEOMETRY ─────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = LETTER       # 612 x 792 pt
MARGIN_X = 0.85 * inch        # ~61pt
MARGIN_T = 0.85 * inch
MARGIN_B = 0.80 * inch
COL_X = MARGIN_X
COL_W = PAGE_W - 2 * MARGIN_X

# Staff (the through-line motif): five thin horizontal lines, set low on the page,
# acting as a subtle musical staff that keeps time across every movement.
STAFF_Y_TOP    = 1.65 * inch  # uppermost line
STAFF_GAP      = 0.085 * inch # interval between lines (~6pt)
STAFF_LINES    = 5


# ─── PRIMITIVES ───────────────────────────────────────────────────────────────
def tracked(c: rl_canvas.Canvas, text: str, x, y, *, font, size, color, tracking_em: float):
    """Draw text with manual letter-spacing in em units."""
    c.setFont(font, size)
    c.setFillColor(color)
    char_space = size * tracking_em
    c.drawString(x, y, text, charSpace=char_space)
    return pdfmetrics.stringWidth(text, font, size) + char_space * max(len(text) - 1, 0)


def eyebrow(c, text, x, y, *, color=ORANGE, rule_w=40, gap=10, size=7.5, tracking_em=0.30):
    """Tiny orange rule + tracked uppercase label. The conductor's downbeat."""
    c.setStrokeColor(color)
    c.setLineWidth(0.9)
    c.line(x, y + 2.5, x + rule_w, y + 2.5)
    tracked(c, text.upper(), x + rule_w + gap, y, font="Onest-Md", size=size,
            color=color, tracking_em=tracking_em)


def display_headline(c, text, x, y, *, size=46, color=CREAM, tight=-0.030):
    """Set the headline with cinched tracking — architectural type."""
    tracked(c, text, x, y, font="Onest-Sb", size=size, color=color, tracking_em=tight)


def body(c, text, x, y, *, size=10.5, color=CREAM_85, leading=15.5, max_width=None,
         font="Onest"):
    """Wrap and draw a body block. Returns the final baseline y."""
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
    """Mono-style folio: '/ 03 — VI'  — printed bottom-right above the colophon."""
    label = f"/ {n:02d} — VI"
    small_caps_meta(c, label, PAGE_W - MARGIN_X - pdfmetrics.stringWidth(
        label.upper(), "Onest-Md", 6.6) * 1.28, MARGIN_B - 28,
        color=CREAM_55)


def colophon(c, page_no: int, show_brand=True):
    """Footer that recurs on every page. Anchors the bottom of the score."""
    y = MARGIN_B - 14
    if show_brand:
        cs = 6.6 * 0.28
        # Left: "Un momento memorable de FCO Group"
        c.setFillColor(CREAM_55)
        c.setFont("Onest-Md", 6.6)
        left = "UN  "
        c.drawString(MARGIN_X, y, left, charSpace=cs)
        adv = pdfmetrics.stringWidth(left, "Onest-Md", 6.6) + cs * (len(left) - 1)

        c.setFillColor(CREAM_85)
        c.setFont("Onest-Sb", 6.6)
        emph = "MOMENTO MEMORABLE  "
        c.drawString(MARGIN_X + adv, y, emph, charSpace=cs)
        adv += pdfmetrics.stringWidth(emph, "Onest-Sb", 6.6) + cs * (len(emph) - 1)

        c.setFillColor(CREAM_55)
        c.setFont("Onest-Md", 6.6)
        tail = "DE FCO GROUP"
        c.drawString(MARGIN_X + adv, y, tail, charSpace=cs)

        # Right: edition + url
        right = "EDICIÓN 2026  ·  NOMINACIONES.BYMA.MX"
        c.setFont("Onest-Md", 6.6)
        rw = pdfmetrics.stringWidth(right, "Onest-Md", 6.6) + cs * (len(right) - 1)
        c.setFillColor(CREAM_55)
        c.drawString(PAGE_W - MARGIN_X - rw, y, right, charSpace=cs)
    page_number(c, page_no)


def draw_staff(c, *, y_top=STAFF_Y_TOP, lines=STAFF_LINES, gap=STAFF_GAP,
               marks=None, mark_color=None):
    """The signature device. Five hair-thin cream lines, like a musical staff.
    Optional dots ('marks') sit on the staff at given (x_inch, line_index) pairs."""
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


def background(c):
    c.setFillColor(BLACK)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


# ─── PAGE 1 · COVER ───────────────────────────────────────────────────────────
def page_cover(c):
    background(c)

    # Staff: subtle, anchored low. A few marks like notes resting on a phrase.
    draw_staff(c, y_top=PAGE_H * 0.36,
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

    # Display headline — set very large, centered on a slow vertical rhythm.
    y_head = PAGE_H - MARGIN_T - 90
    display_headline(c, "Más allá",       MARGIN_X, y_head,           size=80, color=CREAM, tight=-0.035)
    display_headline(c, "del sonido.",    MARGIN_X, y_head - 78,      size=80, color=ORANGE, tight=-0.035)

    # Subtitle — long, generous leading, narrow column.
    sub_y = y_head - 78 - 64
    body(c, "Guía rápida para registrar a tus nominados en "
            "nominaciones.byma.mx. Seis movimientos. Lee con calma.",
         MARGIN_X, sub_y, size=12.5, color=CREAM_85, leading=20,
         max_width=COL_W * 0.65, font="Onest")

    # Lower-half metadata — set as a horizontal rule of small caps.
    rule_y = MARGIN_B + 56
    c.setStrokeColor(CREAM_12)
    c.setLineWidth(0.5)
    c.line(MARGIN_X, rule_y, PAGE_W - MARGIN_X, rule_y)

    # Three columns of metadata
    cols = [
        ("OBRA",          "Beyond Music Awards"),
        ("SAVE THE DATE", "26.08.26"),
        ("DESTINATARIO",  "Votante invitado"),
    ]
    col_w = COL_W / 3
    for i, (label, value) in enumerate(cols):
        x = MARGIN_X + i * col_w
        small_caps_meta(c, label, x, rule_y - 16, color=CREAM_55)
        c.setFillColor(CREAM)
        c.setFont("Onest-Md", 11.5)
        c.drawString(x, rule_y - 32, value)

    colophon(c, 1, show_brand=True)


# ─── PAGE 2 · ACCESO ──────────────────────────────────────────────────────────
def page_acceso(c):
    background(c)
    draw_staff(c, marks=[(MARGIN_X + 0.5 * inch, 2, 2.2)])

    # Chapter numeral — outside the column.

    eyebrow(c, "01 · Acceso", MARGIN_X, PAGE_H - MARGIN_T - 6)

    display_headline(c, "Solo necesitas", MARGIN_X, PAGE_H - MARGIN_T - 60, size=44)
    display_headline(c, "tu correo.",     MARGIN_X, PAGE_H - MARGIN_T - 60 - 50, size=44, color=ORANGE)

    # Four steps — numbered, each with hair-rule on the left.
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
        # number gutter
        c.setFillColor(CREAM_55)
        c.setFont("Onest-Md", 8)
        c.drawString(MARGIN_X, y, f"{i:02d}", charSpace=8 * 0.25)
        # head
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 12.5)
        c.drawString(MARGIN_X + 36, y, head)
        # sub
        body(c, sub, MARGIN_X + 36, y - 16, size=10, color=CREAM_55,
             leading=14, max_width=COL_W - 36 - 1.6 * inch)
        # divider
        c.setStrokeColor(CREAM_12)
        c.setLineWidth(0.4)
        c.line(MARGIN_X, y - 44, PAGE_W - MARGIN_X, y - 44)
        y -= 64

    # Tip box — left orange rule, cream label, cream body
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

    # List of four points — numbered with thin orange marker.
    points = [
        ("Tus categorías asignadas",
         "Pueden ser las 28 o solo un subconjunto. Lo define el comité según tu perfil."),
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

    # Mockup: three category cards.
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

        # Status pill
        label, color, _kicker = states[i]
        cs = 6.6 * 0.26
        c.setFont("Onest-Md", 6.6)
        pill_w = pdfmetrics.stringWidth(label, "Onest-Md", 6.6) + cs * (len(label) - 1) + 12
        c.setStrokeColor(color)
        c.setLineWidth(0.7)
        c.rect(x + 12, mock_y + 14, pill_w, 14, stroke=1, fill=0)
        c.setFillColor(color)
        c.drawString(x + 18, mock_y + 18.4, label, charSpace=cs)

    # Mockup caption
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

    # Slot diagram — five vertical markers
    slot_y = intro_y - 32
    slot_size = 30
    slot_gap = 8
    total_w = 5 * slot_size + 4 * slot_gap
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

    # Brackets / labels under slots
    bracket_y = slot_y - slot_size - 8
    # Required bracket spans 0..3
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

    # Fields description
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

    # Pull-quote
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

    # Support box — blue rule
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

    # Timeline — three milestones along a single thin rule
    tl_y = PAGE_H * 0.50
    tl_x0 = MARGIN_X
    tl_x1 = PAGE_W - MARGIN_X
    c.setStrokeColor(CREAM_30)
    c.setLineWidth(0.6)
    c.line(tl_x0, tl_y, tl_x1, tl_y)

    milestones = [
        (0.00, "AHORA",          "Ronda abierta",     "Propones tus nominados.",    CREAM),
        (0.50, "DESPUÉS",        "Cierre de ronda",   "Fecha por confirmar.",        CREAM),
        (1.00, "SAVE THE DATE",  "26.08.26",          "Beyond Music Awards.",        ORANGE),
    ]
    for frac, kicker, head, sub, color in milestones:
        x = tl_x0 + frac * (tl_x1 - tl_x0)
        c.setFillColor(color)
        c.circle(x, tl_y, 4.5, stroke=0, fill=1)
        # Tick down
        c.setStrokeColor(color)
        c.setLineWidth(0.6)
        c.line(x, tl_y - 5, x, tl_y - 14)

        # Anchor x: edges align to start/end; middle is centered
        anchor = "start" if frac == 0 else ("end" if frac == 1 else "middle")
        # Kicker
        kw = pdfmetrics.stringWidth(kicker, "Onest-Md", 6.6) + 6.6 * 0.28 * (len(kicker) - 1)
        if anchor == "start":
            kx = x
        elif anchor == "end":
            kx = x - kw
        else:
            kx = x - kw / 2
        small_caps_meta(c, kicker, kx, tl_y - 28, color=color)

        # Head
        c.setFillColor(CREAM)
        c.setFont("Onest-Sb", 17)
        hw = pdfmetrics.stringWidth(head, "Onest-Sb", 17)
        if anchor == "start": hx = x
        elif anchor == "end": hx = x - hw
        else: hx = x - hw / 2
        c.drawString(hx, tl_y - 50, head)

        # Sub
        c.setFillColor(CREAM_55)
        c.setFont("Onest", 10)
        sw = pdfmetrics.stringWidth(sub, "Onest", 10)
        if anchor == "start": sxp = x
        elif anchor == "end": sxp = x - sw
        else: sxp = x - sw / 2
        c.drawString(sxp, tl_y - 66, sub)

    # Closing tagline — set massive across the lower band
    cl_y = MARGIN_B + 96
    display_headline(c, "Más allá",     MARGIN_X, cl_y + 50, size=58, color=CREAM, tight=-0.035)
    display_headline(c, "del sonido.",  MARGIN_X, cl_y,      size=58, color=ORANGE, tight=-0.035)

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
