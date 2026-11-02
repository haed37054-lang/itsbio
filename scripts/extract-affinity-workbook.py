"""Extract the supplied AffinityImmuno XLSX without changing it.

Usage: python scripts/extract-affinity-workbook.py /path/to/source.xlsx
Public catalog inputs deliberately exclude the supplied price/currency fields.
"""
import sys, zipfile, json, re, hashlib
from pathlib import Path
import xml.etree.ElementTree as ET

source = Path(sys.argv[1])
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(source) as z:
    strings = ["".join(x.itertext()) for x in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("s:si", ns)]
    rels = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    records = {}
    duplicates = []
    for sheet in ET.fromstring(z.read("xl/workbook.xml")).findall("s:sheets/s:sheet", ns):
        name = sheet.attrib["name"]
        target = rels[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        for row in ET.fromstring(z.read(path)).findall("s:sheetData/s:row", ns):
            cells = {}
            for c in row.findall("s:c", ns):
                v = c.find("s:v", ns)
                text = v.text if v is not None else ""
                if c.attrib.get("t") == "s":
                    text = strings[int(text)]
                elif c.attrib.get("t") == "inlineStr":
                    text = "".join(c.find("s:is", ns).itertext())
                column = re.sub(r"\d+$", "", c.attrib["r"])
                if text and column not in (["D", "E"] if name == "ELISAs" else ["D"]):
                    cells[column] = text
            if not re.match(r"^(EL-|ab-)", cells.get("A", ""), re.I):
                continue
            key = cells["A"].strip().lower()
            ref = {"sheet": name, "row": int(row.attrib["r"])}
            if key in records:
                assert records[key]["fields"] == cells, "Conflicting duplicate SKU: " + key
                records[key]["sourceRows"].append(ref)
                duplicates.append({"sku": cells["A"], **ref})
            else:
                records[key] = {"fields": cells, "sourceRows": [ref], "kind": "elisa" if name == "ELISAs" else "antibody"}
result = {"sourceFilename": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "duplicates": duplicates, "records": list(records.values())}
out = Path("data/affinityimmuno/workbook-input.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"products": len(records), "duplicatesRemoved": len(duplicates)}))
