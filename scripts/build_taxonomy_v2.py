#!/usr/bin/env python3
"""Build the v2.0 taxonomy document with subtemas integrated."""
import json
from pathlib import Path

SUBTEMAS_FILE = Path("data/exports/subtemas_by_category.json")
OUTPUT_FILE = Path(r"C:\lexia-workspace\01_taxonomia\taxonomia_conceptos_supersociedades_v2.0.md")

CAT_META = {
    "INSPECCION_VIGILANCIA": {
        "num": "01", "pct": 14.0, "n": 42, "est": 1786,
        "label": "Inspección, vigilancia y control de Supersociedades",
        "desc": "Conceptos sobre las funciones, competencias, alcance y facultades administrativas de la Superintendencia de Sociedades.",
        "norm_base": "Ley 222/1995 (arts. 82-87), Decreto 4350/2006, Ley 1258/2008",
        "lexia": "Sin equivalente directo — administrativo, no arbitral",
    },
    "INSOLVENCIA": {
        "num": "02", "pct": 12.0, "n": 36, "est": 1531,
        "label": "Régimen de insolvencia empresarial",
        "desc": "Procesos de reorganización empresarial, liquidación judicial, acuerdos de reestructuración, toma de posesión. Cubre Ley 1116/2006, Ley 550/1999 y concordatos.",
        "norm_base": "Ley 1116/2006, Ley 550/1999, Ley 222/1995 (Título II)",
        "lexia": "Sin equivalente directo — CT.SOC.07 tangencialmente relacionado",
    },
    "SOCIOS_ACCIONISTAS": {
        "num": "03", "pct": 11.3, "n": 34, "est": 1442,
        "label": "Derechos de socios y accionistas",
        "desc": "Derechos, obligaciones e interacciones de socios y accionistas. Incluye inspección, preferencia, cesión, exclusión, retiro.",
        "norm_base": "C.Co. arts. 369-380, 397-417, Ley 1258/2008, Ley 222/1995 art. 48",
        "lexia": "→ CT.SOC.01, .02, .03, .08 (superconjunto)",
    },
    "DISOLUCION_LIQUIDACION": {
        "num": "04", "pct": 11.3, "n": 34, "est": 1442,
        "label": "Disolución y liquidación de sociedades",
        "desc": "Causales de disolución, enervatoria, liquidación voluntaria/judicial, funciones del liquidador, adjudicación, reactivación.",
        "norm_base": "C.Co. arts. 218-233, 457-460, Ley 1258/2008 arts. 34-36, Ley 222/1995 arts. 225-259",
        "lexia": "→ CT.SOC.07 (disolución y liquidación)",
    },
    "ORGANOS_SOCIALES": {
        "num": "05", "pct": 9.0, "n": 27, "est": 1148,
        "label": "Órganos sociales y gobierno interno",
        "desc": "Funcionamiento de asamblea, junta de socios, junta directiva, representante legal. Convocatorias, quórum, mayorías, actas.",
        "norm_base": "C.Co. arts. 181-198, 434-439, Ley 222/1995 arts. 18-25, Ley 1258/2008 arts. 17-27",
        "lexia": "→ CT.SOC.05, B6.05, B6.06, S-ABV",
    },
    "TIPOS_SOCIETARIOS": {
        "num": "06", "pct": 8.3, "n": 25, "est": 1059,
        "label": "Tipos societarios y constitución",
        "desc": "Características, constitución, requisitos y diferencias entre tipos: SAS, SA, Ltda, SCA, EU, sucursales extranjeras, SEM.",
        "norm_base": "C.Co. Libros II-III, Ley 1258/2008, Ley 222/1995 arts. 71-81, Ley 1014/2006",
        "lexia": "Sin equivalente directo — contexto estructural",
    },
    "REFORMAS_ESTATUTARIAS": {
        "num": "07", "pct": 6.0, "n": 18, "est": 765,
        "label": "Reformas estatutarias y reorganizaciones corporativas",
        "desc": "Modificación de estatutos, fusión, escisión, transformación, aumento/disminución de capital como reforma.",
        "norm_base": "C.Co. arts. 158-177, 172-180, Ley 222/1995 arts. 4-12",
        "lexia": "Parcial — CT.SOC.02 incluye M&A",
    },
    "CAPITAL_APORTES": {
        "num": "08", "pct": 5.7, "n": 17, "est": 727,
        "label": "Capital social, aportes y acciones",
        "desc": "Capital social, aportes en dinero/especie/industria, emisión y colocación de acciones, prima en colocación, avalúo.",
        "norm_base": "C.Co. arts. 122-135, 375-395, Ley 1258/2008 arts. 4-9",
        "lexia": "Parcial — CT.SOC.02 cubre valoración",
    },
    "ADMINISTRADORES": {
        "num": "09", "pct": 4.7, "n": 14, "est": 600,
        "label": "Deberes y responsabilidad de administradores",
        "desc": "Deberes de diligencia, lealtad, no competencia. Conflicto de intereses, responsabilidad civil, administrador de hecho.",
        "norm_base": "Ley 222/1995 arts. 22-25, Decreto 1925/2009, C.Co. art. 200",
        "lexia": "→ CT.SOC.06, .10, S-COI, B6.05-B6.07",
    },
    "GRUPOS_EMPRESARIALES": {
        "num": "10", "pct": 3.3, "n": 10, "est": 421,
        "label": "Grupos empresariales y situaciones de control",
        "desc": "Configuración, registro y efectos de situaciones de control y grupos empresariales. Subordinación, consolidación.",
        "norm_base": "Ley 222/1995 arts. 26-33, C.Co. arts. 260-265",
        "lexia": "Sin equivalente directo — contexto regulatorio",
    },
    "CONTRATACION_COMERCIAL": {
        "num": "11", "pct": 2.7, "n": 8, "est": 345,
        "label": "Contratación y garantías comerciales",
        "desc": "Contratos comerciales en contexto societario: fiducia, garantías mobiliarias, mutuo, multinivel, distribución.",
        "norm_base": "C.Co. Libro IV, Ley 1676/2013, Ley 1700/2013",
        "lexia": "Sin equivalente directo",
    },
    "REVISOR_FISCAL": {
        "num": "12", "pct": 2.3, "n": 7, "est": 294,
        "label": "Revisoría fiscal",
        "desc": "Nombramiento, funciones, inhabilidades, obligatoriedad y responsabilidad del revisor fiscal.",
        "norm_base": "Ley 222/1995 art. 13, C.Co. arts. 203-217, Ley 43/1990",
        "lexia": "Sin equivalente directo",
    },
    "UTILIDADES_DIVIDENDOS": {
        "num": "13", "pct": 1.7, "n": 5, "est": 217,
        "label": "Utilidades, dividendos y reservas",
        "desc": "Distribución de utilidades, reservas, dividendos, absorción de pérdidas, recompra de acciones.",
        "norm_base": "C.Co. arts. 149-157, 451-456, Ley 222/1995 art. 240",
        "lexia": "→ CT.SOC.04",
    },
    "LIBROS_CONTABILIDAD": {
        "num": "14", "pct": 1.7, "n": 5, "est": 217,
        "label": "Libros de comercio y contabilidad",
        "desc": "Libros de comercio, obligaciones contables, estados financieros, NIIF, conservación documental.",
        "norm_base": "C.Co. arts. 48-74, Ley 1314/2009",
        "lexia": "Sin equivalente directo",
    },
    "PROCEDIMIENTO": {
        "num": "15", "pct": 1.3, "n": 4, "est": 166,
        "label": "Aspectos procesales y jurisdiccionales",
        "desc": "Competencia jurisdiccional, acciones judiciales, impugnación, conciliación, velo corporativo.",
        "norm_base": "CGP, Ley 1258/2008 arts. 40-43, Ley 222/1995 arts. 133-141",
        "lexia": "→ CT.GEN.08, .10",
    },
    "ENTIDADES_SIN_ANIMO_LUCRO": {
        "num": "16", "pct": 1.3, "n": 4, "est": 166,
        "label": "Entidades sin ánimo de lucro",
        "desc": "ESAL, fundaciones, asociaciones, cooperativas — en la medida en que Supersociedades tenga competencia.",
        "norm_base": "Decreto 2150/1995, C.C. arts. 633-652",
        "lexia": "Sin equivalente directo",
    },
    "REGIMEN_CAMBIARIO": {
        "num": "17", "pct": 1.0, "n": 3, "est": 128,
        "label": "Régimen cambiario e inversión extranjera",
        "desc": "Inversión extranjera directa, régimen cambiario, registro de inversión en contexto societario.",
        "norm_base": "Decreto 119/2017, Ley 9/1991",
        "lexia": "Sin equivalente directo",
    },
    "OTRO": {
        "num": "20", "pct": 1.3, "n": 4, "est": 166,
        "label": "Otros temas",
        "desc": "Conceptos que no encajan en categorías anteriores.",
        "norm_base": "Varia",
        "lexia": "Residual",
    },
}

# Categories not in subtemas generation (too small)
SMALL_CATS = {
    "REGISTRO_MERCANTIL": {
        "num": "18", "pct": 0.3, "n": 1, "est": 38,
        "label": "Registro mercantil y matrícula",
        "desc": "Inscripción, renovación, cancelación de matrícula mercantil, certificados.",
        "norm_base": "C.Co. arts. 26-47",
        "lexia": "Sin equivalente directo",
    },
    "PROPIEDAD_INTELECTUAL": {
        "num": "19", "pct": 0.0, "n": 0, "est": 0,
        "label": "Propiedad intelectual en contexto societario",
        "desc": "Marcas, nombres comerciales en contexto societario. No observada en muestra — candidata a eliminación.",
        "norm_base": "Decisión Andina 486",
        "lexia": "Sin equivalente directo",
    },
}


def main():
    with open(SUBTEMAS_FILE, "r", encoding="utf-8") as f:
        subtemas_data = json.load(f)

    lines = []

    # Header
    lines.append("# Taxonomía de Conceptos Jurídicos — Superintendencia de Sociedades v2.0")
    lines.append("## Clasificación temática con subtemas para corpus doctrinal")
    lines.append("")
    lines.append("**Versión:** 2.0")
    lines.append("**Fecha:** 2026-04-05")
    lines.append("**Estado:** Completa — 20 categorías gruesas + 114 subtemas")
    lines.append("**Método:** Extracción de texto de muestra estratificada (n=300) + clasificación con Claude Sonnet 4 + generación de subtemas supervisada")
    lines.append("**Corpus:** 12,758 conceptos jurídicos (1999–2026), 441 conceptos contables (pendientes)")
    lines.append("**Complementa:** taxonomia_lexia_v3.0_canonica.md (series CT.SOC, B6)")
    lines.append("**Reemplaza:** taxonomia_conceptos_supersociedades_v1.0.md")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Changelog
    lines.append("## CHANGELOG v1.0 → v2.0")
    lines.append("")
    lines.append("- **114 subtemas** añadidos a 18 categorías (todas excepto REGISTRO_MERCANTIL y PROPIEDAD_INTELECTUAL por muestra insuficiente)")
    lines.append("- Normatividad específica por subtema")
    lines.append("- Frecuencia estimada por subtema dentro de cada categoría")
    lines.append("- Reglas de desambiguación ampliadas")
    lines.append("- Tabla resumen completa con códigos TX.SOC.XX.YY")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Principles
    lines.append("## PRINCIPIOS DE DISEÑO")
    lines.append("")
    lines.append("1. **Exhaustividad:** todo concepto cae en exactamente una categoría + un subtema")
    lines.append("2. **Mutua exclusividad:** ni categorías ni subtemas se solapan")
    lines.append("3. **Jerarquía de dos niveles:** TX.SOC.XX (categoría gruesa) → TX.SOC.XX.YY (subtema)")
    lines.append("4. **Basada en evidencia:** distribución derivada de muestra estratificada real (n=300)")
    lines.append("5. **Compatible con Lexia:** mapeo cruzado con CT.SOC y B6 de taxonomia_lexia_v3.0_canonica.md")
    lines.append("6. **Residual controlado:** cada categoría tiene subtema OTRO para casos no cubiertos; si OTRO supera 10%, subdividir")
    lines.append("7. **Estabilización:** un subtema necesita aparecer en 3+ conceptos independientes para justificar código propio")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Schema
    lines.append("## ESQUEMA DE CLASIFICACIÓN")
    lines.append("")
    lines.append("Cada concepto clasificado produce:")
    lines.append("")
    lines.append("| Campo | Tipo | Descripción |")
    lines.append("|-------|------|-------------|")
    lines.append("| `tema_principal` | TX.SOC.XX | Categoría gruesa — exactamente una |")
    lines.append("| `subtema` | TX.SOC.XX.YY | Subtema dentro de la categoría — exactamente uno |")
    lines.append("| `tema_secundario` | TX.SOC.XX \\| null | Segunda categoría si aplica |")
    lines.append("| `subtema_secundario` | TX.SOC.XX.YY \\| null | Subtema de la segunda categoría |")
    lines.append("| `confianza` | float 0–1 | Confianza de clasificación |")
    lines.append("| `normatividad_citada` | string[] | Normas principales referenciadas en el concepto |")
    lines.append("| `resumen` | string | Resumen de una línea del concepto |")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Overview table
    lines.append("## TABLA RESUMEN DE CATEGORÍAS")
    lines.append("")
    lines.append("| # | Código | Categoría | % | n (muestra) | Est. corpus | Subtemas | Mapeo Lexia |")
    lines.append("|---|--------|-----------|---|-------------|-------------|----------|-------------|")

    all_cats = list(CAT_META.items()) + list(SMALL_CATS.items())
    all_cats.sort(key=lambda x: x[1]["num"])

    for cat_name, meta in all_cats:
        n_sub = len(subtemas_data.get(cat_name, {}).get("subtemas", []))
        num = meta["num"]
        lines.append(
            f"| {num} | TX.SOC.{num} | {meta['label']} | {meta['pct']}% | {meta['n']} | ~{meta['est']:,} | {n_sub} | {meta['lexia']} |"
        )

    lines.append("")
    lines.append("---")
    lines.append("")

    # Detailed sections per category
    lines.append("# PARTE I: CATEGORÍAS Y SUBTEMAS")
    lines.append("")

    for cat_name, meta in all_cats:
        num = meta["num"]
        lines.append(f"## TX.SOC.{num} — {cat_name}")
        lines.append(f"**Label:** {meta['label']}")
        lines.append(f"**Frecuencia:** {meta['pct']}% (~{meta['est']:,} documentos estimados)")
        lines.append(f"**Normatividad base:** {meta['norm_base']}")
        lines.append(f"**Mapeo Lexia v3.0:** {meta['lexia']}")
        lines.append("")
        lines.append(f"**Definición:** {meta['desc']}")
        lines.append("")

        cat_subtemas = subtemas_data.get(cat_name, {}).get("subtemas", [])

        if cat_subtemas:
            lines.append("### Subtemas")
            lines.append("")

            for s in cat_subtemas:
                code = s.get("codigo", "")
                label = s.get("label", "")
                nombre = s.get("nombre", "")
                defn = s.get("definicion", "")
                pct = s.get("frecuencia_estimada_pct", 0)
                normas = s.get("normatividad", [])
                ejemplos = s.get("ejemplos_observados", [])

                lines.append(f"#### {code} — {label}")
                lines.append(f"**Nombre:** {nombre}")
                lines.append(f"**Frecuencia estimada:** {pct}% de la categoría")
                lines.append("")
                lines.append(f"**Definición:** {defn}")
                lines.append("")
                if normas:
                    lines.append(f"**Normatividad:** {', '.join(normas)}")
                    lines.append("")
                if ejemplos:
                    lines.append("**Ejemplos observados:**")
                    for ej in ejemplos:
                        lines.append(f"- {ej}")
                    lines.append("")
        else:
            lines.append("*Sin subtemas — muestra insuficiente para subdivisión.*")
            lines.append("")

        lines.append("---")
        lines.append("")

    # Cross-mapping table
    lines.append("# PARTE II: MAPEO CRUZADO CON LEXIA v3.0")
    lines.append("")
    lines.append("| Código TX.SOC | Subtema | Equivalente Lexia v3.0 | Tipo de relación |")
    lines.append("|---------------|---------|------------------------|------------------|")
    lines.append("| TX.SOC.03.01 | Derecho de retiro | CT.SOC.03 | Equivalente directo |")
    lines.append("| TX.SOC.03.02 | Derecho de preferencia | CT.SOC.08 | Equivalente directo |")
    lines.append("| TX.SOC.03.03 | Cesión de participaciones | CT.SOC.02 (parcial) | Solapamiento parcial |")
    lines.append("| TX.SOC.03.05 | Exclusión de socios | CT.SOC.03 | Equivalente directo |")
    lines.append("| TX.SOC.03.09 | Derechos de voto | S-ABV, B6.07 | Contexto de abuso |")
    lines.append("| TX.SOC.04.01–06 | Disolución/Liquidación | CT.SOC.07 | Superconjunto |")
    lines.append("| TX.SOC.05.01 | Convocatorias | B6.05 | Falla vs. doctrina |")
    lines.append("| TX.SOC.05.02 | Quórum y mayorías | B6.05, B6.06 | Falla vs. doctrina |")
    lines.append("| TX.SOC.05.05 | Representación legal | B6.06 | Falla vs. doctrina |")
    lines.append("| TX.SOC.09.01 | Responsabilidad admin. | CT.SOC.06 | Equivalente directo |")
    lines.append("| TX.SOC.09.02 | Incompatibilidades | S-COI | Contexto normativo |")
    lines.append("| TX.SOC.10.01–02 | Grupos/Control | — | Sin equivalente |")
    lines.append("| TX.SOC.13.01–05 | Utilidades/Dividendos | CT.SOC.04 | Superconjunto |")
    lines.append("")
    lines.append("**Observación:** La taxonomía TX.SOC es significativamente más amplia que CT.SOC. Solo ~30% de los subtemas tienen equivalente en el universo arbitral. Esto es esperable: los conceptos de Supersociedades cubren el espectro regulatorio completo, mientras que los laudos arbitrales solo ven las controversias que llegan a tribunal.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Classification rules
    lines.append("# PARTE III: REGLAS DE CLASIFICACIÓN")
    lines.append("")
    lines.append("## Regla 1: Tema principal = consulta central")
    lines.append("Asignar el tema que describe la **consulta central** del concepto, no temas mencionados incidentalmente.")
    lines.append("")
    lines.append("## Regla 2: Competencia vs. tema sustantivo")
    lines.append("Si el concepto trata sobre la competencia de Supersociedades para intervenir en tema X → TX.SOC.01, no X.")
    lines.append("")
    lines.append("## Regla 3: Subtema = aspecto específico más relevante")
    lines.append("Dentro de la categoría, elegir el subtema que mejor capture el aspecto específico consultado.")
    lines.append("")
    lines.append("## Regla 4: Desambiguación por pares comunes")
    lines.append("")
    lines.append("| Situación | Clasificar como | No como |")
    lines.append("|-----------|-----------------|---------|")
    lines.append("| Disolución por pérdidas + enervatoria por capitalización | TX.SOC.04.03 (causales) | TX.SOC.08 (capital) |")
    lines.append("| Fusión que requiere autorización de Supersociedades | TX.SOC.07.01 (fusión) | TX.SOC.01 (inspección) |")
    lines.append("| Derechos de accionista en asamblea | TX.SOC.03 si foco = derecho del socio | TX.SOC.05 si foco = funcionamiento órgano |")
    lines.append("| Administrador en conflicto de intereses | TX.SOC.09.02 (incompatibilidades) | TX.SOC.05 (órganos) |")
    lines.append("| Revisor fiscal en liquidación | TX.SOC.12.04 (RF especial) | TX.SOC.04 (liquidación) |")
    lines.append("| Grupo empresarial con sucursal extranjera | TX.SOC.10.05 (grupos + extranjera) | TX.SOC.06.06 (tipos) |")
    lines.append("| SAS unipersonal + constitución | TX.SOC.06.04 (SAS) | TX.SOC.06.05 (EU) |")
    lines.append("| Emisión de acciones en aumento de capital | TX.SOC.08.01 (emisión) | TX.SOC.07.03 (reforma capital) |")
    lines.append("| Cesión de cuotas con derecho de preferencia | TX.SOC.03.02 (preferencia) | TX.SOC.03.03 (cesión) |")
    lines.append("| Insolvencia + efectos en contratos estatales | TX.SOC.02.07 (efectos jurisdiccionales) | TX.SOC.11 (contratación) |")
    lines.append("")
    lines.append("## Regla 5: Tema secundario")
    lines.append("Asignar solo si el concepto desarrolla sustancialmente dos temas distintos. No asignar por mención incidental.")
    lines.append("")
    lines.append("## Regla 6: Ilegibles")
    lines.append("Si el texto está vacío, corrupto o en formato no legible → no clasificar. Marcar como `ILEGIBLE`.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Stats
    lines.append("# PARTE IV: ESTADÍSTICAS Y COBERTURA")
    lines.append("")
    lines.append("## Distribución estimada del corpus completo (12,758 documentos)")
    lines.append("")
    lines.append("| Categoría | % | Docs est. | Subtemas |")
    lines.append("|-----------|---|-----------|----------|")
    for cat_name, meta in all_cats:
        n_sub = len(subtemas_data.get(cat_name, {}).get("subtemas", []))
        lines.append(f"| TX.SOC.{meta['num']} {meta['label']} | {meta['pct']}% | ~{meta['est']:,} | {n_sub} |")
    total_sub = sum(len(subtemas_data.get(c, {}).get("subtemas", [])) for c, _ in all_cats)
    lines.append(f"| **TOTAL** | **100%** | **~12,758** | **{total_sub}** |")
    lines.append("")
    lines.append("## Métricas de la taxonomía")
    lines.append("")
    lines.append(f"- **Categorías gruesas:** 20 (TX.SOC.01 – TX.SOC.20)")
    lines.append(f"- **Subtemas totales:** {total_sub}")
    lines.append(f"- **Categorías con subtemas:** 18")
    lines.append(f"- **Promedio subtemas/categoría:** {total_sub/18:.1f}")
    lines.append(f"- **Rango:** 4–10 subtemas por categoría")
    lines.append(f"- **Tasa de ilegibles:** ~0.7% (~89 docs)")
    lines.append(f"- **Muestra de validación:** 300 documentos (IC 95% ±5.6%)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Next steps
    lines.append("# PARTE V: PRÓXIMOS PASOS")
    lines.append("")
    lines.append("1. **Clasificación completa:** Aplicar TX.SOC a los 12,758 conceptos jurídicos usando Claude API batch")
    lines.append("2. **Validación cruzada:** Muestra de 50 conceptos clasificados manualmente para medir concordancia inter-anotador")
    lines.append("3. **Conceptos contables (TX.CON):** Crear serie equivalente para los 441 conceptos contables")
    lines.append("4. **Refinamiento:** Evaluar fusión de TX.SOC.18/19 si no aparecen en clasificación completa")
    lines.append("5. **Integración Lexia:** Alimentar la capa de contexto regulatorio del análisis de laudos con esta taxonomía")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Version history
    lines.append("## HISTORIAL DE CAMBIOS")
    lines.append("")
    lines.append("| Versión | Fecha | Cambios |")
    lines.append("|---------|-------|---------|")
    lines.append("| 1.0 | 2026-04-05 | Versión inicial — 20 categorías gruesas |")
    lines.append("| 2.0 | 2026-04-05 | 114 subtemas añadidos, normatividad por subtema, reglas de desambiguación |")

    # Write
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Taxonomy v2.0 written to {OUTPUT_FILE}")
    print(f"  Categories: {len(all_cats)}")
    print(f"  Subtemas: {total_sub}")
    print(f"  Lines: {len(lines)}")


if __name__ == "__main__":
    main()
