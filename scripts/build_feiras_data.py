import csv
import hashlib
import html
import json
import re
import unicodedata
import urllib.request
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SOURCE_DIR = DATA_DIR / "sources"
SP_XLSX = SOURCE_DIR / "feiras_sp.xlsx"
GUARULHOS_CSV = SOURCE_DIR / "guarulhos_feiras.csv"

SP_EXCEL_URL = "https://prefeitura.sp.gov.br/documents/d/seguranca_alimentar/enderecos-de-feiras-livres-xlsx"
SP_SOURCE_URL = "https://prefeitura.sp.gov.br/web/seguranca_alimentar/w/feiras-livres-sp"
GUARULHOS_SOURCE_URL = "https://guarulhostododia.com.br/guias/2024/04/16/informacoes-sobre-as-feiras-livres-de-guarulhos/"

CSV_PATH = DATA_DIR / "feiras.csv"
JSON_PATH = DATA_DIR / "feiras.json"

XLS_NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def slug(value):
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "sem-id"


def clean(value):
    text = html.unescape(str(value or "")).replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text or "-"


def normalize_day(value):
    text = clean(value).upper()
    mapping = {
        "DOMINGO": "Domingo",
        "SEGUNDA": "Segunda-feira",
        "SEGUNDA FEIRA": "Segunda-feira",
        "TERCA": "Terça-feira",
        "TERÇA": "Terça-feira",
        "TERCA FEIRA": "Terça-feira",
        "TERÇA FEIRA": "Terça-feira",
        "QUARTA": "Quarta-feira",
        "QUARTA FEIRA": "Quarta-feira",
        "QUINTA": "Quinta-feira",
        "QUINTA FEIRA": "Quinta-feira",
        "SEXTA": "Sexta-feira",
        "SEXTA FEIRA": "Sexta-feira",
        "SABADO": "Sábado",
        "SÁBADO": "Sábado",
    }
    return mapping.get(text, clean(value))


def category_hours(category):
    normalized = clean(category).lower()
    if "noturna" in normalized:
        return "16:00", "21:00"
    if "tradicional" in normalized:
        return "08:00", "14:00"
    return "-", "-"


def stable_id(*parts):
    base = "|".join(clean(part) for part in parts)
    digest = hashlib.sha1(base.encode("utf-8")).hexdigest()[:8]
    return f"{slug(parts[0])}-{digest}"


def download(url, path):
    if path.exists() and path.stat().st_size > 0:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, path)


def column_index(cell_ref):
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    value = 0
    for ch in letters:
        value = value * 26 + ord(ch.upper()) - 64
    return value - 1


def read_sp_xlsx(path):
    records = []
    with zipfile.ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_root.findall("a:si", XLS_NS):
                shared.append("".join(node.text or "" for node in item.findall(".//a:t", XLS_NS)))

        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in sheet.findall(".//a:row", XLS_NS)[1:]:
            values = []
            for cell in row.findall("a:c", XLS_NS):
                index = column_index(cell.attrib.get("r", "A"))
                while len(values) <= index:
                    values.append("")

                node = cell.find("a:v", XLS_NS)
                value = "" if node is None else node.text or ""
                if cell.attrib.get("t") == "s" and value:
                    value = shared[int(value)]
                values[index] = value

            if len(values) < 11 or not any(values):
                continue

            code = clean(values[0])
            day = normalize_day(values[1])
            category = clean(values[2])
            address = clean(values[6])
            number = clean(values[7])
            neighborhood = clean(values[8])
            reference = clean(values[9])
            subprefecture = clean(values[10])
            start, end = category_hours(category)

            records.append(
                {
                    "id": stable_id("sao-paulo", code, day, address, number),
                    "municipio": "São Paulo",
                    "uf": "SP",
                    "nome_feira": f"{neighborhood} - {address}",
                    "categoria": category,
                    "dia_semana": day,
                    "horario_inicio": start,
                    "horario_fim": end,
                    "endereco": address,
                    "numero": number,
                    "bairro": neighborhood,
                    "referencia": reference,
                    "subprefeitura": subprefecture,
                    "quantidade_feirantes": clean(values[5]),
                    "codigo_oficial": code,
                    "fonte_nome": "Prefeitura de São Paulo - SESANA",
                    "fonte_url": SP_SOURCE_URL,
                    "status_validacao": "oficial",
                    "observacoes": "Importado da planilha oficial de endereços de feiras livres.",
                }
            )
    return records


class GuarulhosParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture_heading = False
        self.capture_item = False
        self.current_heading = ""
        self.current_item = ""
        self.records = []

    def handle_starttag(self, tag, attrs):
        if tag in {"h3", "h4"}:
            self.capture_heading = True
            self.current_heading = ""
        if tag == "li" and self.current_heading:
            self.capture_item = True
            self.current_item = ""

    def handle_endtag(self, tag):
        if tag in {"h3", "h4"} and self.capture_heading:
            heading = clean(self.current_heading).upper()
            if heading in {"DOMINGO", "TERÇA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "SABADO"}:
                self.current_heading = heading
            self.capture_heading = False

        if tag == "li" and self.capture_item:
            item = clean(self.current_item)
            if item != "-" and self.current_heading:
                self.records.append((normalize_day(self.current_heading), item))
            self.capture_item = False

    def handle_data(self, data):
        if self.capture_heading:
            self.current_heading += data
        if self.capture_item:
            self.current_item += data


def parse_guarulhos_item(item):
    parts = [clean(part) for part in re.split(r"\s+[–-]\s+", item, maxsplit=2)]
    name = parts[0] if len(parts) > 0 else "-"
    neighborhood = parts[1] if len(parts) > 1 else "-"
    address = parts[2] if len(parts) > 2 else "-"
    return name, neighborhood, address


def read_guarulhos_page():
    request = urllib.request.Request(
        GUARULHOS_SOURCE_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FeiraAondeDataBot/1.0"
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            page = response.read().decode("utf-8", errors="replace")
        parser = GuarulhosParser()
        parser.feed(page)
        source_rows = []
        for day, item in parser.records:
            name, neighborhood, address = parse_guarulhos_item(item)
            source_rows.append(
                {
                    "dia_semana": day,
                    "nome_feira": name,
                    "bairro": neighborhood,
                    "endereco": address,
                }
            )
    except Exception:
        with GUARULHOS_CSV.open(encoding="utf-8-sig", newline="") as source:
            source_rows = list(csv.DictReader(source))

    records = []
    for row in source_rows:
        day = normalize_day(row["dia_semana"])
        name = clean(row["nome_feira"])
        neighborhood = clean(row["bairro"])
        address = clean(row["endereco"])
        records.append(
            {
                "id": stable_id("guarulhos", day, name, neighborhood, address),
                "municipio": "Guarulhos",
                "uf": "SP",
                "nome_feira": name,
                "categoria": "Feira livre tradicional",
                "dia_semana": day,
                "horario_inicio": "-",
                "horario_fim": "-",
                "endereco": address,
                "numero": "-",
                "bairro": neighborhood,
                "referencia": "-",
                "subprefeitura": "-",
                "quantidade_feirantes": "-",
                "codigo_oficial": "-",
                "fonte_nome": "Guarulhos Todo Dia",
                "fonte_url": GUARULHOS_SOURCE_URL,
                "status_validacao": "a_confirmar",
                "observacoes": "Lista pública local; confirmar com moradores, feirantes ou Prefeitura de Guarulhos.",
            }
        )
    return records


def write_outputs(records):
    fields = [
        "id",
        "municipio",
        "uf",
        "nome_feira",
        "categoria",
        "dia_semana",
        "horario_inicio",
        "horario_fim",
        "endereco",
        "numero",
        "bairro",
        "referencia",
        "subprefeitura",
        "quantidade_feirantes",
        "codigo_oficial",
        "fonte_nome",
        "fonte_url",
        "status_validacao",
        "observacoes",
    ]

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        writer.writerows(records)

    JSON_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    download(SP_EXCEL_URL, SP_XLSX)
    records = read_sp_xlsx(SP_XLSX)
    records.extend(read_guarulhos_page())
    records.sort(key=lambda row: (row["municipio"], row["dia_semana"], row["bairro"], row["endereco"]))
    write_outputs(records)
    print(f"{len(records)} feiras geradas")
    print(f"CSV: {CSV_PATH}")
    print(f"JSON: {JSON_PATH}")


if __name__ == "__main__":
    main()
