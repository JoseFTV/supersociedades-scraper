"""Data models for scraped documents."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass


@dataclass
class DocumentRecord:
    fuente: str = ""                    # juridicos | contables
    tipo_documento: str = ""            # Conceptos Jurídicos | Conceptos Contables
    numero_oficio: str = ""             # e.g. OFICIO 220-011414
    titulo: str = ""                    # full title text
    asunto: str = ""                    # subject/topic
    fecha_publicacion: str = ""         # DD MMM YYYY
    fecha_expedicion: str = ""          # DD MMM YYYY
    tamano_reportado: str = ""          # e.g. 1053 Kb
    url_detalle: str = ""               # page URL where it was found
    url_descarga: str = ""              # direct download URL
    nombre_archivo_sugerido: str = ""   # normalized filename
    extension_detectada: str = ""       # .pdf, .doc, etc.
    estado_descarga: str = "pending"    # pending | ok | error | skipped
    hash_sha256: str = ""
    error: str = ""
    local_path: str = ""               # path where file was saved

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json_line(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

    @classmethod
    def csv_headers(cls) -> list[str]:
        return list(cls.__dataclass_fields__.keys())
