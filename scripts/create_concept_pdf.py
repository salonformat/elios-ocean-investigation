from pathlib import Path
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Konzept_Das_Wesen_aus_der_Tiefe.pdf"
CREATURE = ROOT / "output" / "wesen-freigestellt.png"
ORIGINAL = ROOT / "tmp" / "source" / "zeichnung-original.png"

W, H = landscape(A4)
NAVY = HexColor("#061A25")
DEEP = HexColor("#092C3A")
BLUE = HexColor("#087CA7")
CYAN = HexColor("#5ED8E8")
ORANGE = HexColor("#F28C28")
CREAM = HexColor("#F4EFE3")
MUTED = HexColor("#A9C1C9")


def bg(c, color=NAVY):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def footer(c, n):
    c.setStrokeColor(Color(1, 1, 1, .16))
    c.line(34, 27, W - 34, 27)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawString(34, 14, "DAS WESEN AUS DER TIEFE  |  IMMERSIVE LEARNING EXPERIENCE")
    c.drawRightString(W - 34, 14, f"{n:02d}")


def title(c, kicker, heading, sub=None):
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(42, H - 46, kicker.upper())
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 27)
    c.drawString(42, H - 82, heading)
    if sub:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 11)
        c.drawString(42, H - 103, sub)


def wrap(c, text, x, y, width, size=11, leading=15, color=CREAM, font="Helvetica"):
    words = text.split()
    lines, line = [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if stringWidth(trial, font, size) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y


def card(c, x, y, w, h, number, heading, body):
    c.setFillColor(Color(1, 1, 1, .055))
    c.roundRect(x, y, w, h, 10, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 16, y + h - 22, number)
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x + 16, y + h - 43, heading)
    wrap(c, body, x + 16, y + h - 62, w - 32, 9.2, 12.3, MUTED)


def place_image_contain(c, path, x, y, w, h):
    ir = ImageReader(str(path))
    iw, ih = ir.getSize()
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(ir, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, mask="auto")


def page1(c):
    bg(c)
    c.setFillColor(Color(.03, .44, .58, .22))
    c.circle(W * .79, H * .53, 250, fill=1, stroke=0)
    place_image_contain(c, CREATURE, W * .51, 42, W * .45, H - 70)
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(48, H - 62, "IMMERSIVE LEARNING EXPERIENCE")
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 38)
    c.drawString(48, H - 120, "DAS WESEN")
    c.drawString(48, H - 164, "AUS DER TIEFE")
    c.setStrokeColor(ORANGE)
    c.setLineWidth(3)
    c.line(48, H - 184, 235, H - 184)
    wrap(c, "Eine kindliche Zeichnung wird zum Portal in die noch unbekannte Welt der Ozeane.", 48, H - 218, 325, 14, 20, MUTED)
    c.setFont("Helvetica-Oblique", 14)
    c.setFillColor(CREAM)
    c.drawString(48, 72, '"Diese Kreatur lebt im Ozean."')
    c.setFont("Helvetica", 8.5)
    c.setFillColor(MUTED)
    c.drawString(48, 55, "Konzeptstand  |  30. August 2026")


def page2(c):
    bg(c, DEEP); title(c, "01 | Ursprung", "Eine Zeichnung wird zur Welt")
    place_image_contain(c, ORIGINAL, 42, 60, 355, 370)
    c.setStrokeColor(Color(1, 1, 1, .16)); c.rect(42, 60, 355, 370, fill=0, stroke=1)
    x = 435
    wrap(c, "Nicht ein wissenschaftliches Modell eröffnet die Experience, sondern die Vorstellung eines vierjährigen Kindes.", x, H - 145, 335, 17, 23, CREAM, "Helvetica-Bold")
    y = wrap(c, "Das orange-blaue Wesen ist kein Maskottchen. Es ist Erzähler, Spur und offene Frage. Seine ursprünglichen Linien bleiben sichtbar und geben der gesamten Gestaltung ihre emotionale Glaubwürdigkeit.", x, H - 235, 330, 11, 16, MUTED)
    c.setFillColor(ORANGE); c.roundRect(x, y - 86, 330, 64, 9, fill=1, stroke=0)
    wrap(c, "LEITFRAGE", x + 16, y - 42, 295, 8.5, 11, NAVY, "Helvetica-Bold")
    wrap(c, "Wenn dieses Wesen wirklich im Ozean lebte - wie müsste seine Welt beschaffen sein?", x + 16, y - 59, 295, 11.5, 15, NAVY, "Helvetica-Bold")
    footer(c, 2)


def page3(c):
    bg(c); title(c, "02 | Positionierung", "Poetisch. Wissenschaftlich. Gemeinsam.", "Keine Kinderkulisse, sondern eine sinnliche Forschungsreise für mehrere Generationen.")
    cards = [
        ("A", "Staunen", "Eine unbekannte Kreatur weckt Neugier, bevor Wissen vermittelt wird."),
        ("B", "Verstehen", "Licht, Tiefe, Druck und Anpassung werden räumlich und körperlich erfahrbar."),
        ("C", "Verbinden", "Kinder entdecken intuitiv; Erwachsene finden Atmosphäre, Bedeutung und Reflexion."),
        ("D", "Handeln", "Das eigene Verhalten verändert die Welt und macht ökologische Zusammenhänge spürbar."),
    ]
    for i, data in enumerate(cards):
        card(c, 42 + i * 195, 105, 175, 275, *data)
    c.setFont("Helvetica-Bold", 14); c.setFillColor(CYAN)
    c.drawCentredString(W / 2, 68, "FANTASIE IST DER EINSTIEG. WISSENSCHAFT IST DIE ENTDECKUNG.")
    footer(c, 3)


def page4(c):
    bg(c, DEEP); title(c, "03 | Dramaturgie", "Der Abstieg in sechs Akten")
    items = [
        ("01", "Die Entdeckung", "Originalzeichnung, Kinderstimme, erste Bewegung der Linien."),
        ("02", "Die Oberfläche", "Licht, Farbe und der Ozean als System verschiedener Lebensräume."),
        ("03", "Der Abstieg", "Blau wird Dunkelheit; Klang und Spuren führen tiefer."),
        ("04", "Der lebendige Ozean", "Ein reagierendes Ökosystem macht Beziehungen sichtbar."),
        ("05", "Die Tiefsee", "Reale Anpassungen treffen auf die vollständige Kreatur."),
        ("06", "Das Archiv", "Besucher entwerfen Wesen und erweitern die gemeinsame Welt."),
    ]
    for i, (n, h, b) in enumerate(items):
        col, row = i % 3, i // 3
        x, y = 42 + col * 260, 270 - row * 145
        card(c, x, y, 235, 118, n, h, b)
    footer(c, 4)


def page5(c):
    bg(c); title(c, "04 | Learning Experience", "Wissen wird nicht gelesen - es geschieht")
    left = [
        ("LICHT", "Mit jedem Schritt in die Tiefe verschwinden Farben. Besucher erleben, warum Tiefseetiere anders sehen und leuchten."),
        ("ANPASSUNG", "Form, Haut, Flossen und Sinne des Wesens werden als Antworten auf konkrete Umweltbedingungen verständlich."),
        ("VERNETZUNG", "Schwärme, Nahrungsketten und Riffe reagieren nur, wenn Menschen beobachten und gemeinsam handeln."),
    ]
    for i, (h, b) in enumerate(left):
        y = 365 - i * 105
        c.setFillColor(ORANGE); c.circle(58, y + 12, 8, fill=1, stroke=0)
        c.setFillColor(CREAM); c.setFont("Helvetica-Bold", 13); c.drawString(82, y + 17, h)
        wrap(c, b, 82, y - 4, 365, 10.2, 14, MUTED)
    c.setFillColor(Color(1, 1, 1, .055)); c.roundRect(500, 90, 290, 315, 14, fill=1, stroke=0)
    c.setFillColor(CYAN); c.setFont("Helvetica-Bold", 9); c.drawString(524, 375, "DOPPELTE LESEEBENE")
    c.setFillColor(CREAM); c.setFont("Helvetica-Bold", 18); c.drawString(524, 340, "Für Kinder")
    wrap(c, "suchen, bewegen, berühren, ausprobieren, zeichnen und staunen", 524, 316, 230, 11, 16, MUTED)
    c.setStrokeColor(Color(1, 1, 1, .14)); c.line(524, 250, 760, 250)
    c.setFillColor(CREAM); c.setFont("Helvetica-Bold", 18); c.drawString(524, 215, "Für Erwachsene")
    wrap(c, "Atmosphäre, Schönheit, wissenschaftliche Tiefe, Kontemplation und ökologische Verantwortung", 524, 191, 230, 11, 16, MUTED)
    footer(c, 5)


def page6(c):
    bg(c, DEEP); title(c, "05 | Interaktion", "Die Umgebung antwortet auf Verhalten")
    items = [
        ("Bewegen", "Schwärme weichen aus; Strömungen werden sichtbar."),
        ("Still werden", "Scheue Wesen und leuchtende Details treten hervor."),
        ("Zusammenarbeiten", "Ein Riff, ein Klangraum oder ein Nahrungsnetz wird gemeinsam aktiviert."),
        ("Gestalten", "Neue Kreaturen erhalten Lebensraum, Nahrung, Bewegung und Tarnung."),
    ]
    for i, (h, b) in enumerate(items):
        x = 42 + (i % 2) * 380; y = 275 - (i // 2) * 145
        card(c, x, y, 350, 118, f"0{i+1}", h, b)
    c.setFillColor(CYAN); c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W / 2, 68, "TECHNIK BLEIBT UNSICHTBAR. URSACHE UND WIRKUNG BLEIBEN VERSTÄNDLICH.")
    footer(c, 6)


def page7(c):
    bg(c); title(c, "06 | Gestaltungssprache", "Eine glaubwürdige, fremde Schönheit")
    place_image_contain(c, CREATURE, 430, 70, 360, 365)
    labels = [
        ("FARBE", "Tiefblau, Schwarz, Petrol; warmes Orange als Spur des Wesens."),
        ("LICHT", "Bewegte Reflexe, Biolumineszenz, bewusste Dunkelheit."),
        ("MATERIAL", "Wenige organische und transluzente Oberflächen; keine Themenpark-Kulisse."),
        ("KLANG", "Räumlich, langsam und körperlich - mit Momenten echter Stille."),
        ("INFORMATION", "Kurz, poetisch und mehrschichtig statt überladener Tafeln."),
    ]
    for i, (h, b) in enumerate(labels):
        y = 370 - i * 65
        c.setFillColor(CYAN); c.setFont("Helvetica-Bold", 8.5); c.drawString(42, y, h)
        wrap(c, b, 125, y, 255, 9.7, 13, MUTED)
    footer(c, 7)


def page8(c):
    bg(c, DEEP); title(c, "07 | Nächster Schritt", "Vom Leitkonzept zur User Experience")
    steps = [
        ("1", "Rahmen klären", "Ort, Fläche, Dauer, Besucherzahl, Barrierefreiheit und Budgetkorridor."),
        ("2", "Besucherreise bauen", "Personas, Emotionen, Lernziele, Touchpoints und Aufenthaltsdauer je Zone."),
        ("3", "Prototyp entwickeln", "Eine Kerninteraktion und den Auftritt des Wesens früh testen."),
        ("4", "Look & Feel definieren", "Moodboards, Materialwelt, Lichtdramaturgie, Sound und erste Szenenbilder."),
    ]
    for i, item in enumerate(steps):
        card(c, 42 + i * 195, 130, 175, 250, *item)
    c.setFillColor(ORANGE); c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(W / 2, 78, '"WIR KÖNNEN NUR SCHÜTZEN, WAS WIR UNS VORSTELLEN UND LIEBEN LERNEN."')
    footer(c, 8)


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Das Wesen aus der Tiefe - Immersive Learning Experience")
    for fn in (page1, page2, page3, page4, page5, page6, page7, page8):
        fn(c); c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
