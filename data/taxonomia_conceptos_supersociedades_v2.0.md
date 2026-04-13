# Taxonomía de Conceptos Jurídicos — Superintendencia de Sociedades v2.0
## Clasificación temática con subtemas para corpus doctrinal

**Versión:** 2.0
**Fecha:** 2026-04-05
**Estado:** Completa — 20 categorías gruesas + 114 subtemas
**Método:** Extracción de texto de muestra estratificada (n=300) + clasificación con Claude Sonnet 4 + generación de subtemas supervisada
**Corpus:** 12,758 conceptos jurídicos (1999–2026), 441 conceptos contables (pendientes)
**Complementa:** taxonomia_lexia_v3.0_canonica.md (series CT.SOC, B6)
**Reemplaza:** taxonomia_conceptos_supersociedades_v1.0.md

---

## CHANGELOG v1.0 → v2.0

- **114 subtemas** añadidos a 18 categorías (todas excepto REGISTRO_MERCANTIL y PROPIEDAD_INTELECTUAL por muestra insuficiente)
- Normatividad específica por subtema
- Frecuencia estimada por subtema dentro de cada categoría
- Reglas de desambiguación ampliadas
- Tabla resumen completa con códigos TX.SOC.XX.YY

---

## PRINCIPIOS DE DISEÑO

1. **Exhaustividad:** todo concepto cae en exactamente una categoría + un subtema
2. **Mutua exclusividad:** ni categorías ni subtemas se solapan
3. **Jerarquía de dos niveles:** TX.SOC.XX (categoría gruesa) → TX.SOC.XX.YY (subtema)
4. **Basada en evidencia:** distribución derivada de muestra estratificada real (n=300)
5. **Compatible con Lexia:** mapeo cruzado con CT.SOC y B6 de taxonomia_lexia_v3.0_canonica.md
6. **Residual controlado:** cada categoría tiene subtema OTRO para casos no cubiertos; si OTRO supera 10%, subdividir
7. **Estabilización:** un subtema necesita aparecer en 3+ conceptos independientes para justificar código propio

---

## ESQUEMA DE CLASIFICACIÓN

Cada concepto clasificado produce:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tema_principal` | TX.SOC.XX | Categoría gruesa — exactamente una |
| `subtema` | TX.SOC.XX.YY | Subtema dentro de la categoría — exactamente uno |
| `tema_secundario` | TX.SOC.XX \| null | Segunda categoría si aplica |
| `subtema_secundario` | TX.SOC.XX.YY \| null | Subtema de la segunda categoría |
| `confianza` | float 0–1 | Confianza de clasificación |
| `normatividad_citada` | string[] | Normas principales referenciadas en el concepto |
| `resumen` | string | Resumen de una línea del concepto |

---

## TABLA RESUMEN DE CATEGORÍAS

| # | Código | Categoría | % | n (muestra) | Est. corpus | Subtemas | Mapeo Lexia |
|---|--------|-----------|---|-------------|-------------|----------|-------------|
| 01 | TX.SOC.01 | Inspección, vigilancia y control de Supersociedades | 14.0% | 42 | ~1,786 | 8 | Sin equivalente directo — administrativo, no arbitral |
| 02 | TX.SOC.02 | Régimen de insolvencia empresarial | 12.0% | 36 | ~1,531 | 10 | Sin equivalente directo — CT.SOC.07 tangencialmente relacionado |
| 03 | TX.SOC.03 | Derechos de socios y accionistas | 11.3% | 34 | ~1,442 | 10 | → CT.SOC.01, .02, .03, .08 (superconjunto) |
| 04 | TX.SOC.04 | Disolución y liquidación de sociedades | 11.3% | 34 | ~1,442 | 6 | → CT.SOC.07 (disolución y liquidación) |
| 05 | TX.SOC.05 | Órganos sociales y gobierno interno | 9.0% | 27 | ~1,148 | 6 | → CT.SOC.05, B6.05, B6.06, S-ABV |
| 06 | TX.SOC.06 | Tipos societarios y constitución | 8.3% | 25 | ~1,059 | 9 | Sin equivalente directo — contexto estructural |
| 07 | TX.SOC.07 | Reformas estatutarias y reorganizaciones corporativas | 6.0% | 18 | ~765 | 5 | Parcial — CT.SOC.02 incluye M&A |
| 08 | TX.SOC.08 | Capital social, aportes y acciones | 5.7% | 17 | ~727 | 6 | Parcial — CT.SOC.02 cubre valoración |
| 09 | TX.SOC.09 | Deberes y responsabilidad de administradores | 4.7% | 14 | ~600 | 5 | → CT.SOC.06, .10, S-COI, B6.05-B6.07 |
| 10 | TX.SOC.10 | Grupos empresariales y situaciones de control | 3.3% | 10 | ~421 | 6 | Sin equivalente directo — contexto regulatorio |
| 11 | TX.SOC.11 | Contratación y garantías comerciales | 2.7% | 8 | ~345 | 9 | Sin equivalente directo |
| 12 | TX.SOC.12 | Revisoría fiscal | 2.3% | 7 | ~294 | 6 | Sin equivalente directo |
| 13 | TX.SOC.13 | Utilidades, dividendos y reservas | 1.7% | 5 | ~217 | 6 | → CT.SOC.04 |
| 14 | TX.SOC.14 | Libros de comercio y contabilidad | 1.7% | 5 | ~217 | 5 | Sin equivalente directo |
| 15 | TX.SOC.15 | Aspectos procesales y jurisdiccionales | 1.3% | 4 | ~166 | 4 | → CT.GEN.08, .10 |
| 16 | TX.SOC.16 | Entidades sin ánimo de lucro | 1.3% | 4 | ~166 | 4 | Sin equivalente directo |
| 17 | TX.SOC.17 | Régimen cambiario e inversión extranjera | 1.0% | 3 | ~128 | 4 | Sin equivalente directo |
| 18 | TX.SOC.18 | Registro mercantil y matrícula | 0.3% | 1 | ~38 | 0 | Sin equivalente directo |
| 19 | TX.SOC.19 | Propiedad intelectual en contexto societario | 0.0% | 0 | ~0 | 0 | Sin equivalente directo |
| 20 | TX.SOC.20 | Otros temas | 1.3% | 4 | ~166 | 5 | Residual |

---

# PARTE I: CATEGORÍAS Y SUBTEMAS

## TX.SOC.01 — INSPECCION_VIGILANCIA
**Label:** Inspección, vigilancia y control de Supersociedades
**Frecuencia:** 14.0% (~1,786 documentos estimados)
**Normatividad base:** Ley 222/1995 (arts. 82-87), Decreto 4350/2006, Ley 1258/2008
**Mapeo Lexia v3.0:** Sin equivalente directo — administrativo, no arbitral

**Definición:** Conceptos sobre las funciones, competencias, alcance y facultades administrativas de la Superintendencia de Sociedades.

### Subtemas

#### TX.SOC.01.01 — competencias_supersociedades
**Nombre:** Competencias y límites de facultades de la Superintendencia de Sociedades
**Frecuencia estimada:** 28.5% de la categoría

**Definición:** Alcance, límites y delimitación de competencias de la Superintendencia de Sociedades frente a otras entidades, incluyendo casos de incompetencia y traslados por competencia

**Normatividad:** Art. 189 num. 24 Constitución Política, Art. 82-88 Ley 222 de 1995, Decreto 1080 de 1996

**Ejemplos observados:**
- conflictos competenciales con otras superintendencias
- límites de jurisdicción administrativa

#### TX.SOC.01.02 — causales_vigilancia
**Nombre:** Causales y criterios de vigilancia de sociedades
**Frecuencia estimada:** 16.7% de la categoría

**Definición:** Requisitos, causales y procedimientos para sujetar sociedades a vigilancia, incluyendo umbrales de activos, ingresos y otros criterios del Decreto 4350 de 2006

**Normatividad:** Decreto 4350 de 2006, Decreto 3100 de 1997, Art. 83-85 Ley 222 de 1995

**Ejemplos observados:**
- cumplimiento umbrales económicos
- vigilancia de oficio

#### TX.SOC.01.03 — investigaciones_administrativas
**Nombre:** Investigaciones administrativas y procedimientos sancionatorios
**Frecuencia estimada:** 14.3% de la categoría

**Definición:** Procedimientos de investigación administrativa, solicitudes de asociados por hechos violatorios y actuaciones administrativas de la Superintendencia

**Normatividad:** Art. 83-86 Ley 222 de 1995, Decreto 1080 de 1996, Código Contencioso Administrativo

**Ejemplos observados:**
- solicitudes de investigación por asociados
- hechos violatorios de estatutos

#### TX.SOC.01.04 — funciones_generales_supersociedades
**Nombre:** Funciones generales de inspección, vigilancia y control
**Frecuencia estimada:** 11.9% de la categoría

**Definición:** Descripción y alcance de las funciones generales de la Superintendencia de Sociedades en materia de inspección, vigilancia y control de sociedades comerciales

**Normatividad:** Art. 82 Ley 222 de 1995, Art. 189 num. 24 Constitución Política, Decreto 3100 de 1997

**Ejemplos observados:**
- consultas sobre funciones institucionales
- alcance de inspección y vigilancia

#### TX.SOC.01.05 — sagrilaft
**Nombre:** Sistema de Autocontrol y Gestión del Riesgo Integral SAGRILAFT
**Frecuencia estimada:** 11.9% de la categoría

**Definición:** Implementación, requisitos y aspectos relacionados con el SAGRILAFT, incluyendo oficial de cumplimiento y ámbito de aplicación

**Normatividad:** Circular Externa 100-000016 de 2020, Ley 1762 de 2015, Decreto 1674 de 2016

**Ejemplos observados:**
- requisitos oficial de cumplimiento
- implementación en operadores de libranza

#### TX.SOC.01.06 — consultas_conceptos_generales
**Nombre:** Función de consultas y conceptos generales
**Frecuencia estimada:** 9.5% de la categoría

**Definición:** Alcance y limitaciones de la función consultiva de la Superintendencia, incluyendo conceptos generales y abstractos sobre materias de competencia

**Normatividad:** Art. 25 Código Contencioso Administrativo, Art. 28 Ley 1755 de 2015, Decreto 1080 de 1996

**Ejemplos observados:**
- consultas abstractas
- limitaciones para casos concretos

#### TX.SOC.01.07 — sociedades_especiales
**Nombre:** Vigilancia de sociedades con regímenes especiales
**Frecuencia estimada:** 7.1% de la categoría

**Definición:** Competencia sobre sociedades con características especiales como empresas industriales y comerciales del Estado, empresas de servicios públicos, multinivel y otros regímenes específicos

**Normatividad:** Ley 1700 de 2013, Decreto 24 de 2016, Ley 142 de 1994

**Ejemplos observados:**
- empresas multinivel
- empresas industriales y comerciales del Estado

#### TX.SOC.01.08 — otro_inspeccion_vigilancia
**Nombre:** Otros aspectos de inspección y vigilancia
**Frecuencia estimada:** 0.1% de la categoría

**Definición:** Otros temas relacionados con inspección y vigilancia no cubiertos en los subtemas anteriores, incluyendo aspectos residuales y casos especiales

**Normatividad:** Ley 222 de 1995, Decretos reglamentarios, Normatividad sectorial

**Ejemplos observados:**
- casos atípicos
- consultas diversas no clasificables

---

## TX.SOC.02 — INSOLVENCIA
**Label:** Régimen de insolvencia empresarial
**Frecuencia:** 12.0% (~1,531 documentos estimados)
**Normatividad base:** Ley 1116/2006, Ley 550/1999, Ley 222/1995 (Título II)
**Mapeo Lexia v3.0:** Sin equivalente directo — CT.SOC.07 tangencialmente relacionado

**Definición:** Procesos de reorganización empresarial, liquidación judicial, acuerdos de reestructuración, toma de posesión. Cubre Ley 1116/2006, Ley 550/1999 y concordatos.

### Subtemas

#### TX.SOC.02.01 — admision_reorganizacion
**Nombre:** Admisión y trámite de procesos de reorganización empresarial
**Frecuencia estimada:** 22.0% de la categoría

**Definición:** Aspectos relacionados con requisitos, procedimientos y trámites para acceder al régimen de insolvencia, incluyendo reorganización empresarial bajo Ley 1116 de 2006 y acuerdos de reestructuración bajo Ley 550 de 1999

**Normatividad:** Ley 1116 de 2006, Ley 550 de 1999, Decreto 560 de 2020

**Ejemplos observados:**
- requisitos acceso régimen insolvencia
- procedimientos admisión reorganización
- trámites reestructuración Ley 550

#### TX.SOC.02.02 — acreencias_derechos_voto
**Nombre:** Determinación de acreencias y derechos de voto
**Frecuencia estimada:** 19.0% de la categoría

**Definición:** Procesos de reconocimiento, graduación y calificación de créditos, determinación de derechos de voto, cesión de créditos y prelación de acreencias en procesos concursales

**Normatividad:** Ley 1116 de 2006, Ley 550 de 1999, Ley 222 de 1995

**Ejemplos observados:**
- reconocimiento créditos liquidación
- determinación derechos voto
- cesión créditos proceso reorganización

#### TX.SOC.02.03 — liquidacion_judicial
**Nombre:** Procesos de liquidación judicial y obligatoria
**Frecuencia estimada:** 14.0% de la categoría

**Definición:** Aspectos relacionados con liquidación judicial y obligatoria, incluyendo inventarios, realización de activos, indemnizaciones laborales y terminación por fuerza mayor

**Normatividad:** Ley 1116 de 2006, Ley 222 de 1995, Código Sustantivo del Trabajo

**Ejemplos observados:**
- inventario activos liquidación
- indemnización moratoria laboral
- terminación por fuerza mayor

#### TX.SOC.02.04 — garantias_reales
**Nombre:** Tratamiento de garantías reales en procesos concursales
**Frecuencia estimada:** 11.0% de la categoría

**Definición:** Manejo de garantías hipotecarias, mobiliarias y demás garantías reales en procesos de insolvencia, incluyendo exclusión de bienes y ejecución separada

**Normatividad:** Ley 1116 de 2006, Ley 1676 de 2013, Código Civil

**Ejemplos observados:**
- exclusión bienes hipotecados
- garantías mobiliarias concurso
- ejecución garantías reales

#### TX.SOC.02.05 — funciones_auxiliares_justicia
**Nombre:** Funciones y actuaciones de auxiliares de la justicia
**Frecuencia estimada:** 9.0% de la categoría

**Definición:** Roles, competencias y limitaciones de promotores, liquidadores y demás auxiliares de la justicia en procesos concursales, incluyendo patrimonios autónomos

**Normatividad:** Ley 1116 de 2006, Ley 1564 de 2012

**Ejemplos observados:**
- funciones promotor reorganización
- naturaleza promotor patrimonios autónomos
- limitaciones funciones jurisdiccionales

#### TX.SOC.02.06 — acuerdos_aprobacion_modificacion
**Nombre:** Aprobación y modificación de acuerdos concursales
**Frecuencia estimada:** 8.0% de la categoría

**Definición:** Mayorías requeridas, votación, reforma y modificación de acuerdos de reorganización y reestructuración, incluyendo quitas y descarga de pasivos

**Normatividad:** Ley 1116 de 2006, Ley 550 de 1999, Decreto 560 de 2020

**Ejemplos observados:**
- mayorías descarga pasivos
- votos extemporáneos acuerdos
- reforma acuerdos reestructuración

#### TX.SOC.02.07 — efectos_procesos_ejecutivos
**Nombre:** Efectos en procesos ejecutivos y jurisdiccionales
**Frecuencia estimada:** 8.0% de la categoría

**Definición:** Impacto de los procesos concursales en procesos ejecutivos, acciones judiciales, competencia jurisdiccional y contratación con el Estado

**Normatividad:** Ley 1116 de 2006, Ley 80 de 1993, Código General del Proceso

**Ejemplos observados:**
- procesos ejecutivos durante reestructuración
- contratación Estado reorganización
- retención dineros deudor

#### TX.SOC.02.08 — regimenes_especiales
**Nombre:** Regímenes especiales y decretos de emergencia
**Frecuencia estimada:** 6.0% de la categoría

**Definición:** Aplicación de mecanismos extraordinarios de salvamento por emergencia económica, COVID-19 y otros regímenes especiales de insolvencia

**Normatividad:** Decreto 560 de 2020, Decreto 772 de 2020, Ley 1116 de 2006

**Ejemplos observados:**
- mecanismos extraordinarios salvamento COVID-19
- renegociación categorías decreto 560
- aplicación decretos emergencia

#### TX.SOC.02.09 — indexacion_obligaciones
**Nombre:** Indexación y actualización de obligaciones
**Frecuencia estimada:** 3.0% de la categoría

**Definición:** Tratamiento de la indexación, actualización monetaria y reconocimiento de intereses en obligaciones dentro de procesos concursales

**Normatividad:** Jurisprudencia Corte Constitucional, Ley 1116 de 2006, Ley 550 de 1999

**Ejemplos observados:**
- indexación obligaciones acuerdos reorganización
- fórmula cálculo indexación
- reliquidación acuerdos

#### TX.SOC.02.10 — otro_insolvencia
**Nombre:** Otros aspectos de insolvencia empresarial
**Frecuencia estimada:** 3.0% de la categoría

**Definición:** Aspectos residuales de insolvencia no clasificados en otros subtemas, incluyendo competencias especiales y situaciones particulares

**Normatividad:** Ley 1116 de 2006, Ley 550 de 1999, Ley 222 de 1995

**Ejemplos observados:**
- insolvencia personas naturales no comerciantes
- competencia vivienda
- consorcios uniones temporales

---

## TX.SOC.03 — SOCIOS_ACCIONISTAS
**Label:** Derechos de socios y accionistas
**Frecuencia:** 11.3% (~1,442 documentos estimados)
**Normatividad base:** C.Co. arts. 369-380, 397-417, Ley 1258/2008, Ley 222/1995 art. 48
**Mapeo Lexia v3.0:** → CT.SOC.01, .02, .03, .08 (superconjunto)

**Definición:** Derechos, obligaciones e interacciones de socios y accionistas. Incluye inspección, preferencia, cesión, exclusión, retiro.

### Subtemas

#### TX.SOC.03.01 — derecho_retiro
**Nombre:** Derecho de retiro
**Frecuencia estimada:** 8.8% de la categoría

**Definición:** Ejercicio del derecho de los socios o accionistas a retirarse de la sociedad en casos específicos contemplados en la ley, sus condiciones, procedimiento y efectos patrimoniales.

**Normatividad:** Ley 222 de 1995 art. 12, Código de Comercio

**Ejemplos observados:**
- Retiro por capitalización que reduce participación
- Indivisibilidad de acciones en retiro

#### TX.SOC.03.02 — derecho_preferencia
**Nombre:** Derecho de preferencia
**Frecuencia estimada:** 20.6% de la categoría

**Definición:** Derecho de los socios o accionistas a adquirir preferencialmente las participaciones o acciones que otros socios deseen enajenar, incluyendo procedimientos, plazos, peritajes y renuncias.

**Normatividad:** Código de Comercio art. 407, Código de Comercio art. 385

**Ejemplos observados:**
- Peritaje para fijación de precio
- Renuncia tácita por firmar acta
- Designación de peritos judiciales

#### TX.SOC.03.03 — cesion_negociacion_participaciones
**Nombre:** Cesión y negociación de participaciones
**Frecuencia estimada:** 17.6% de la categoría

**Definición:** Transferencia de cuotas sociales o acciones entre socios o a terceros, incluyendo dación en pago, adjudicación judicial, inscripción en libros y efectos jurídicos de la enajenación.

**Normatividad:** Código de Comercio art. 366, Código de Comercio art. 403

**Ejemplos observados:**
- Cesión por dación en pago
- Adjudicación judicial
- Inscripción en libro de registro

#### TX.SOC.03.04 — derecho_inspeccion_informacion
**Nombre:** Derecho de inspección e información
**Frecuencia estimada:** 11.8% de la categoría

**Definición:** Derecho de los socios o accionistas a examinar libros, papeles de comercio, correspondencia y obtener información sobre los negocios sociales, incluyendo sus limitaciones y alcances.

**Normatividad:** Código de Comercio art. 422, Ley 222 de 1995

**Ejemplos observados:**
- Alcance de correspondencia comercial
- Know how y confidencialidad
- Obligaciones de administradores

#### TX.SOC.03.05 — exclusion_socios
**Nombre:** Exclusión de socios
**Frecuencia estimada:** 8.8% de la categoría

**Definición:** Procedimientos y causales para la exclusión de socios de la sociedad, incluyendo casos de no concretarse cesiones de cuotas y exclusión de socios gestores en comanditas.

**Normatividad:** Código de Comercio, Estatutos sociales

**Ejemplos observados:**
- Exclusión por no cesión de cuotas
- Permanencia de socio gestor

#### TX.SOC.03.06 — derechos_gravamenes_participaciones
**Nombre:** Derechos reales y gravámenes sobre participaciones
**Frecuencia estimada:** 8.8% de la categoría

**Definición:** Constitución y efectos de usufructos, prendas, embargos y otros gravámenes sobre cuotas sociales o acciones, incluyendo el ejercicio de derechos societarios bajo estas figuras.

**Normatividad:** Código Civil art. 825, Código de Comercio

**Ejemplos observados:**
- Usufructo de acciones
- Prenda sobre cuotas sociales
- Embargo de participaciones

#### TX.SOC.03.07 — responsabilidad_socios
**Nombre:** Responsabilidad de socios
**Frecuencia estimada:** 5.9% de la categoría

**Definición:** Alcance y límites de la responsabilidad patrimonial de los socios según el tipo societario, incluyendo responsabilidad limitada y casos especiales de responsabilidad ampliada.

**Normatividad:** Código de Comercio art. 353, Ley 1258 de 2008

**Ejemplos observados:**
- Responsabilidad limitada por aportes
- Límites de responsabilidad

#### TX.SOC.03.08 — representacion_acreditacion_socios
**Nombre:** Representación y acreditación de socios
**Frecuencia estimada:** 11.8% de la categoría

**Definición:** Formas de acreditar la calidad de socio o accionista, representación en asambleas, situaciones especiales como fallecimiento, cónyuge adjudicatario y socios extranjeros.

**Normatividad:** Código de Comercio, Código Civil

**Ejemplos observados:**
- Representación de socio fallecido
- Cónyuge adjudicatario sin aprobación
- Socios extranjeros

#### TX.SOC.03.09 — derechos_politicos_voto
**Nombre:** Derechos políticos y de voto
**Frecuencia estimada:** 8.8% de la categoría

**Definición:** Ejercicio del derecho de voto, fraccionamiento de voto, cláusulas discriminatorias, restricciones al voto y participación en órganos sociales según tipos societarios.

**Normatividad:** Código de Comercio, Ley 1258 de 2008

**Ejemplos observados:**
- Prohibición fraccionamiento de voto
- Cláusulas discriminatorias
- Inhabilitación por deudas

#### TX.SOC.03.10 — otro_socios_accionistas
**Nombre:** Otros temas de socios y accionistas
**Frecuencia estimada:** 2.9% de la categoría

**Definición:** Temas residuales relacionados con socios y accionistas que no se clasifican en las categorías anteriores, incluyendo contratos aleatorios, abuso del derecho y temas diversos.

**Normatividad:** Código Civil, Código de Comercio

**Ejemplos observados:**
- Compraventa de acciones como contrato aleatorio
- Abuso del derecho de litigar

---

## TX.SOC.04 — DISOLUCION_LIQUIDACION
**Label:** Disolución y liquidación de sociedades
**Frecuencia:** 11.3% (~1,442 documentos estimados)
**Normatividad base:** C.Co. arts. 218-233, 457-460, Ley 1258/2008 arts. 34-36, Ley 222/1995 arts. 225-259
**Mapeo Lexia v3.0:** → CT.SOC.07 (disolución y liquidación)

**Definición:** Causales de disolución, enervatoria, liquidación voluntaria/judicial, funciones del liquidador, adjudicación, reactivación.

### Subtemas

#### TX.SOC.04.01 — liquidacion_voluntaria_privada
**Nombre:** Liquidación voluntaria o privada de sociedades
**Frecuencia estimada:** 35.0% de la categoría

**Definición:** Procesos de liquidación iniciados por decisión de los socios, incluyendo procedimientos, adjudicación de activos, manejo de pasivos, funciones del liquidador, distribución de remanentes y cuenta final de liquidación

**Normatividad:** Código de Comercio Arts. 218-242, Ley 222 de 1995, Ley 1258 de 2008

**Ejemplos observados:**
- adjudicación de activos en liquidación privada
- distribución del remanente y acta final
- actuación del representante legal como liquidador

#### TX.SOC.04.02 — liquidacion_judicial_forzosa
**Nombre:** Liquidación judicial y forzosa
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Procesos de liquidación ordenados judicialmente o por autoridad administrativa, incluyendo avalúos, adjudicación de bienes por liquidador, vinculación de controlantes y tránsito entre tipos de liquidación

**Normatividad:** Ley 1116 de 2006, Ley 222 de 1995, Código de Comercio

**Ejemplos observados:**
- avalúos técnicos en liquidación obligatoria
- adjudicación de acciones en liquidación judicial
- vinculación de controlante en liquidación

#### TX.SOC.04.03 — causales_disolucion
**Nombre:** Causales de disolución societaria
**Frecuencia estimada:** 18.0% de la categoría

**Definición:** Análisis de las distintas causales que generan la disolución de sociedades, incluyendo pérdidas, vencimiento de término, imposibilidad de desarrollar objeto social, no operatividad y mecanismos para enervarlas

**Normatividad:** Código de Comercio Arts. 457-459, Ley 1258 de 2008 Art. 34, Ley 2069 de 2020

**Ejemplos observados:**
- disolución por pérdidas y su enervación
- disolución por vencimiento de término
- causal de no operatividad

#### TX.SOC.04.04 — reactivacion_societaria
**Nombre:** Reactivación y reconstitución societaria
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Procedimientos para revertir la decisión de liquidación, reactivar sociedades disueltas o en liquidación, y reconstitución de sociedades que han cumplido su término de duración

**Normatividad:** Ley 1429 de 2010 Art. 29, Código de Comercio, Jurisprudencia de Supersociedades

**Ejemplos observados:**
- revocación de liquidación voluntaria
- reactivación de sociedad por no operatividad
- reconstitución por vencimiento de término

#### TX.SOC.04.05 — problemas_procedimentales
**Nombre:** Problemas procedimentales en liquidación
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Situaciones anómalas durante procesos liquidatorios como ausencia de socios, imposibilidad de localizar representantes legales, nombramiento de liquidadores cuando no hay órganos sociales funcionando

**Normatividad:** Código de Comercio, Código General del Proceso, Ley 222 de 1995

**Ejemplos observados:**
- liquidación cuando no se ubica socio mayoritario
- nombramiento de liquidador sin representante legal
- acciones judiciales para disolución

#### TX.SOC.04.06 — aspectos_especiales_liquidacion
**Nombre:** Aspectos especiales en liquidación
**Frecuencia estimada:** 8.0% de la categoría

**Definición:** Temas específicos como obligaciones ambientales, pensionales, construcción con propiedad horizontal, sociedades de hecho, competencias entre superintendencias y actos permitidos durante liquidación

**Normatividad:** Ley 675 de 2001, Normatividad ambiental, Sistema de Seguridad Social

**Ejemplos observados:**
- obligaciones ambientales en liquidación
- liquidación de constructora con propiedad horizontal
- obligaciones pensionales y venta de activos

---

## TX.SOC.05 — ORGANOS_SOCIALES
**Label:** Órganos sociales y gobierno interno
**Frecuencia:** 9.0% (~1,148 documentos estimados)
**Normatividad base:** C.Co. arts. 181-198, 434-439, Ley 222/1995 arts. 18-25, Ley 1258/2008 arts. 17-27
**Mapeo Lexia v3.0:** → CT.SOC.05, B6.05, B6.06, S-ABV

**Definición:** Funcionamiento de asamblea, junta de socios, junta directiva, representante legal. Convocatorias, quórum, mayorías, actas.

### Subtemas

#### TX.SOC.05.01 — convocatorias_y_reuniones
**Nombre:** Convocatorias y reuniones de órganos sociales
**Frecuencia estimada:** 30.0% de la categoría

**Definición:** Aspectos relativos a las formalidades, plazos, términos, segunda convocatoria y procedimientos para convocar y realizar reuniones de asambleas, juntas de socios y juntas directivas

**Normatividad:** artículo 424 C.Co., artículo 429 C.Co., artículo 68 Ley 222/95

**Ejemplos observados:**
- reuniones de segunda convocatoria y cómputo de días hábiles
- formalidades de convocatoria a asamblea
- citación a segunda convocatoria en sociedades limitadas

#### TX.SOC.05.02 — quorum_y_mayorias
**Nombre:** Quórum, mayorías y validez de decisiones
**Frecuencia estimada:** 22.0% de la categoría

**Definición:** Reglas sobre quórum deliberativo y decisorio, cálculo de mayorías absolutas, mayorías especiales para reformas y validez de las decisiones adoptadas por los órganos sociales

**Normatividad:** artículo 437 C.Co., artículo 68 Ley 222/95, artículo 184 C.Co.

**Ejemplos observados:**
- mayorías en juntas directiva
- cálculo de quórum cuando acciones son impares
- mayorías en juntas de socios y protección contra abuso

#### TX.SOC.05.03 — junta_directiva
**Nombre:** Junta directiva - composición y funcionamiento
**Frecuencia estimada:** 18.5% de la categoría

**Definición:** Aspectos específicos del funcionamiento de juntas directivas incluyendo actuación de suplentes, nombramiento, remoción, incompatibilidades, remuneración y delegación de funciones

**Normatividad:** artículo 437 C.Co., artículo 22 Ley 222/95, artículo 197 C.Co.

**Ejemplos observados:**
- actuación de suplentes numéricos
- renuncia a junta directiva
- compatibilidad representante legal y miembro junta
- remuneración de miembros

#### TX.SOC.05.04 — actas_y_registro
**Nombre:** Actas y registro mercantil
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Obligaciones de elaboración, contenido, aprobación y registro de actas de reuniones de órganos sociales, así como las formalidades para su inscripción en el registro mercantil

**Normatividad:** artículo 189 C.Co., artículo 19 C.Co., artículo 45 Ley 1258/08

**Ejemplos observados:**
- actas en SAS con accionista único
- firmas necesarias para inscripción
- consecuencias por no llevar actas
- valor probatorio de actas

#### TX.SOC.05.05 — representacion_y_poderes
**Nombre:** Representación legal y poderes
**Frecuencia estimada:** 11.0% de la categoría

**Definición:** Aspectos relacionados con la representación en órganos sociales, designación y efectos del registro de representantes legales, apoderados generales y representación de acciones ajenas

**Normatividad:** artículo 184 C.Co., artículo 197 C.Co., Ley 1258/08

**Ejemplos observados:**
- representación cuando accionista en coma
- incompatibilidades de apoderados
- efectos del registro de remoción
- apoderados generales en junta directiva

#### TX.SOC.05.06 — otro_organos_sociales
**Nombre:** Otros aspectos de órganos sociales
**Frecuencia estimada:** 3.5% de la categoría

**Definición:** Temas residuales relacionados con órganos sociales no contemplados en los subtemas anteriores, incluyendo situaciones especiales de tipos societarios específicos

**Normatividad:** Código de Comercio, Ley 222/95, Ley 1258/08

**Ejemplos observados:**
- fondos ganaderos bajo reorganización
- designación presidente asamblea
- capacidad societaria para participar en juntas

---

## TX.SOC.06 — TIPOS_SOCIETARIOS
**Label:** Tipos societarios y constitución
**Frecuencia:** 8.3% (~1,059 documentos estimados)
**Normatividad base:** C.Co. Libros II-III, Ley 1258/2008, Ley 222/1995 arts. 71-81, Ley 1014/2006
**Mapeo Lexia v3.0:** Sin equivalente directo — contexto estructural

**Definición:** Características, constitución, requisitos y diferencias entre tipos: SAS, SA, Ltda, SCA, EU, sucursales extranjeras, SEM.

### Subtemas

#### TX.SOC.06.01 — sociedades_anonimas
**Nombre:** Sociedades Anónimas
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Consultas sobre constitución, características, clasificación (abiertas/cerradas), funcionamiento y regulación de sociedades anónimas

**Normatividad:** Código de Comercio Libro II, Ley 222 de 1995

**Ejemplos observados:**
- diferencias entre SA abiertas y cerradas
- aplicación normativa supletoria

#### TX.SOC.06.02 — sociedades_limitada
**Nombre:** Sociedades de Responsabilidad Limitada
**Frecuencia estimada:** 16.0% de la categoría

**Definición:** Aspectos constitutivos, operativos y normativos de sociedades limitadas, incluyendo responsabilidad de socios y aportes

**Normatividad:** Código de Comercio art. 353 y ss., art. 372 del C.Co.

**Ejemplos observados:**
- constitución con aportes en especie e industria
- responsabilidad limitada de socios
- normatividad aplicable supletoria

#### TX.SOC.06.03 — sociedades_comandita
**Nombre:** Sociedades en Comandita
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Características, funcionamiento, responsabilidad de socios gestores y comanditarios en sociedades en comandita simple y por acciones

**Normatividad:** Código de Comercio Título V, arts. 323 y ss. del C.Co.

**Ejemplos observados:**
- problemas de gestión y control
- fallecimiento del socio gestor
- responsabilidad del socio gestor

#### TX.SOC.06.04 — sociedades_sas
**Nombre:** Sociedades por Acciones Simplificada - SAS
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Constitución, características, normatividad y funcionamiento de las SAS, incluyendo SAS unipersonales

**Normatividad:** Ley 1258 de 2008

**Ejemplos observados:**
- normatividad y características SAS
- constitución SAS unipersonal con socio extranjero
- diferencias con empresa unipersonal

#### TX.SOC.06.05 — empresa_unipersonal
**Nombre:** Empresa Unipersonal
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Constitución, funcionamiento, terminación y aspectos jurídicos de empresas unipersonales creadas bajo la Ley 222 de 1995

**Normatividad:** Ley 222 de 1995 art. 71 y ss.

**Ejemplos observados:**
- conversión de sociedad limitada unisocial
- titular persona jurídica
- terminación e impugnación de actas
- clasificación en liquidación judicial

#### TX.SOC.06.06 — sociedades_extranjeras_sucursales
**Nombre:** Sociedades Extranjeras y Sucursales
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Establecimiento, funcionamiento, responsabilidad, cierre y aspectos jurídicos de sociedades extranjeras y sus sucursales en Colombia

**Normatividad:** Código de Comercio Título VIII art. 469 y ss., art. 485, 492, 497

**Ejemplos observados:**
- enajenación y tratamiento contable
- mandatario general
- consolidación estados financieros
- responsabilidad por obligaciones
- cierre de sucursal

#### TX.SOC.06.07 — sociedades_economia_mixta
**Nombre:** Sociedades de Economía Mixta
**Frecuencia estimada:** 4.0% de la categoría

**Definición:** Aspectos jurídicos específicos de sociedades de economía mixta, incluyendo negociación de acciones y procedimientos especiales

**Normatividad:** Ley 489 de 1998 arts. 68-69, Ley 226 de 1995

**Ejemplos observados:**
- negociación de acciones en liquidación
- clasificación de empresa unipersonal con capital público

#### TX.SOC.06.08 — elementos_constitutivos_generales
**Nombre:** Elementos Constitutivos Generales
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Aspectos transversales de constitución societaria: razón social, denominación, objeto social, capital mínimo y máximo

**Normatividad:** Código de Comercio art. 110, Decreto 410 de 1971 Libro II

**Ejemplos observados:**
- razón y denominación social con nombres propios
- objeto social con múltiples actividades
- tipos societarios y capital mínimo/máximo

#### TX.SOC.06.09 — otro_tipos_societarios
**Nombre:** Otros Aspectos de Tipos Societarios
**Frecuencia estimada:** 2.0% de la categoría

**Definición:** Consultas sobre tipos societarios no clasificadas en las categorías anteriores o aspectos residuales de derecho societario

**Normatividad:** Código de Comercio, Leyes especiales

**Ejemplos observados:**
- aspectos normativos generales no específicos

---

## TX.SOC.07 — REFORMAS_ESTATUTARIAS
**Label:** Reformas estatutarias y reorganizaciones corporativas
**Frecuencia:** 6.0% (~765 documentos estimados)
**Normatividad base:** C.Co. arts. 158-177, 172-180, Ley 222/1995 arts. 4-12
**Mapeo Lexia v3.0:** Parcial — CT.SOC.02 incluye M&A

**Definición:** Modificación de estatutos, fusión, escisión, transformación, aumento/disminución de capital como reforma.

### Subtemas

#### TX.SOC.07.01 — fusion_escision_autorizacion
**Nombre:** Fusión y escisión - Autorizaciones y procedimientos
**Frecuencia estimada:** 35.0% de la categoría

**Definición:** Comprende los procesos de fusión y escisión de sociedades, incluyendo requisitos de autorización por parte de Supersociedades, procedimientos administrativos, publicidad a acreedores, garantías y aspectos técnicos del trámite.

**Normatividad:** Ley 222 de 1995 art. 84-86, Código de Comercio art. 170-180, Decreto 4350 de 2006, Circular Externa 07 de 2001

**Ejemplos observados:**
- autorización fusiones sociedades vigiladas
- publicidad acreedores en escisión
- garantías en procesos de fusión

#### TX.SOC.07.02 — transformacion_societaria
**Nombre:** Transformación de tipos societarios
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Abarca los procesos de transformación entre diferentes tipos societarios, especialmente de sociedades limitadas y anónimas a SAS, incluyendo efectos sobre órganos sociales, revisoría fiscal y continuidad jurídica.

**Normatividad:** Ley 1258 de 2008, Código de Comercio Título II, Ley 222 de 1995

**Ejemplos observados:**
- transformación limitada a SAS
- comandita simple a SAS
- continuidad revisoría fiscal

#### TX.SOC.07.03 — capital_social_modificaciones
**Nombre:** Modificaciones del capital social
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Incluye procesos de aumento y disminución del capital social, readquisición de acciones, reembolso de aportes y los requisitos de autorización según el tipo societario y sector de actividad.

**Normatividad:** Código de Comercio art. 122, 145, Ley 222 de 1995 art. 86, Decreto 1086 de 1996

**Ejemplos observados:**
- reducción capital con reembolso
- autorización disminución capital EPS
- readquisición de acciones

#### TX.SOC.07.04 — reconstitucion_reactivacion
**Nombre:** Reconstitución y reactivación societaria
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Comprende los mecanismos de reconstitución de sociedades disueltas y reactivación de sociedades, incluyendo las diferencias conceptuales con la fusión impropia y sus respectivos procedimientos legales.

**Normatividad:** Código de Comercio art. 250, Ley 1429 de 2010 art. 29, Código de Comercio art. 180

**Ejemplos observados:**
- reconstitución sociedad vencida
- diferencias fusión impropia-reconstitución
- reactivación vs reconstitución

#### TX.SOC.07.05 — otros_aspectos_reformas
**Nombre:** Otros aspectos de reformas estatutarias
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Incluye modificaciones de denominación o razón social, procedimientos de convocatoria para reformas, antelación de proyectos, experiencia contractual en procesos societarios y otros aspectos diversos de reformas estatutarias.

**Normatividad:** Código de Comercio art. 110, 303, 357, 373, Ley 222 de 1995, normativa de contratación pública

**Ejemplos observados:**
- modificación razón social
- antelación proyectos reformas
- experiencia contractual en escisión

---

## TX.SOC.08 — CAPITAL_APORTES
**Label:** Capital social, aportes y acciones
**Frecuencia:** 5.7% (~727 documentos estimados)
**Normatividad base:** C.Co. arts. 122-135, 375-395, Ley 1258/2008 arts. 4-9
**Mapeo Lexia v3.0:** Parcial — CT.SOC.02 cubre valoración

**Definición:** Capital social, aportes en dinero/especie/industria, emisión y colocación de acciones, prima en colocación, avalúo.

### Subtemas

#### TX.SOC.08.01 — emision_colocacion_acciones
**Nombre:** Emisión y colocación de acciones
**Frecuencia estimada:** 35.0% de la categoría

**Definición:** Procesos de emisión, colocación y suscripción de acciones, incluyendo reglamentos, autorizaciones requeridas, acciones en reserva y competencias de órganos sociales

**Normatividad:** Código de Comercio arts. 385, 390, Ley 222 de 1995 arts. 82, 83

**Ejemplos observados:**
- emisión sin reglamento
- autorización Supersociedades
- acciones en reserva

#### TX.SOC.08.02 — aportes_tipos_bienes
**Nombre:** Aportes de bienes y derechos
**Frecuencia estimada:** 18.0% de la categoría

**Definición:** Aportes al capital social mediante diferentes tipos de bienes, incluyendo bienes en especie, derechos hereditarios, nuda propiedad, acciones de otras sociedades y bienes en comodato

**Normatividad:** Código de Comercio art. 98, Código de Comercio arts. 135-142

**Ejemplos observados:**
- aportes derechos hereditarios
- bienes en comodato
- aportes de acciones

#### TX.SOC.08.03 — modificaciones_capital
**Nombre:** Modificaciones del capital social
**Frecuencia estimada:** 24.0% de la categoría

**Definición:** Aumentos y disminuciones del capital autorizado, suscrito y pagado, incluyendo capitalizaciones, reembolso de aportes y restricciones durante procesos especiales

**Normatividad:** Código de Comercio arts. 454-466, Ley 1116 de 2006

**Ejemplos observados:**
- aumento durante liquidación
- capitalización sociedades
- disminución con reembolso

#### TX.SOC.08.04 — acciones_privilegiadas_especiales
**Nombre:** Acciones privilegiadas y especiales
**Frecuencia estimada:** 12.0% de la categoría

**Definición:** Emisión, características y derechos de acciones privilegiadas, preferenciales y otras clases especiales de acciones con derechos diferenciados

**Normatividad:** Código de Comercio arts. 379, 381, Decreto 410 de 1971

**Ejemplos observados:**
- acciones privilegiadas
- derechos preferenciales
- liquidación preferencial

#### TX.SOC.08.05 — incumplimiento_pagos
**Nombre:** Incumplimiento en pago de acciones
**Frecuencia estimada:** 6.0% de la categoría

**Definición:** Consecuencias del incumplimiento en el pago de acciones suscritas, incluyendo presunciones de perjuicios, mora e imputación de pagos parciales

**Normatividad:** Código de Comercio art. 397, Código de Comercio arts. 395-398

**Ejemplos observados:**
- presunción perjuicios 20%
- obligaciones vencidas
- imputación pagos

#### TX.SOC.08.06 — otro_capital_aportes
**Nombre:** Otros aspectos de capital y aportes
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Aspectos específicos del régimen de capital y aportes no cubiertos en los subtemas anteriores, incluyendo proporción capital-patrimonio y temas especiales de SAS

**Normatividad:** Ley 1258 de 2008, Código de Comercio

**Ejemplos observados:**
- proporción capital-patrimonio
- inversión suplementaria sucursales

---

## TX.SOC.09 — ADMINISTRADORES
**Label:** Deberes y responsabilidad de administradores
**Frecuencia:** 4.7% (~600 documentos estimados)
**Normatividad base:** Ley 222/1995 arts. 22-25, Decreto 1925/2009, C.Co. art. 200
**Mapeo Lexia v3.0:** → CT.SOC.06, .10, S-COI, B6.05-B6.07

**Definición:** Deberes de diligencia, lealtad, no competencia. Conflicto de intereses, responsabilidad civil, administrador de hecho.

### Subtemas

#### TX.SOC.09.01 — responsabilidad_administradores
**Nombre:** Responsabilidad de administradores
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Régimen de responsabilidad civil de administradores, incluye acción social de responsabilidad, administradores de hecho, criterios de imputación y procedimientos

**Normatividad:** Ley 222 de 1995 art. 23-25, Código de Comercio art. 200

**Ejemplos observados:**
- acción social de responsabilidad contra administradores
- administrador de hecho y responsabilidad por acciones y omisiones

#### TX.SOC.09.02 — incompatibilidades_prohibiciones
**Nombre:** Incompatibilidades y prohibiciones
**Frecuencia estimada:** 30.0% de la categoría

**Definición:** Incompatibilidades legales para ejercer cargos de administración, prohibiciones específicas como votación de balances, conflictos de interés y restricciones societarias

**Normatividad:** Código de Comercio art. 185, Ley 222 de 1995 art. 23

**Ejemplos observados:**
- incompatibilidad de administradores en sociedades de familia
- prohibición de votar balances cuando el administrador es socio mayoritario
- conflicto de intereses en contratación con sociedades vinculadas

#### TX.SOC.09.03 — representacion_legal
**Nombre:** Representación legal
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Aspectos del ejercicio de la representación legal, incluyendo nombramiento, registro, efectos, renuncia, representantes suplentes y ejercicio simultáneo en múltiples sociedades

**Normatividad:** Código de Comercio art. 196-199, Decreto 410 de 1971

**Ejemplos observados:**
- ejercicio de representación legal por representantes suplentes
- efectos del registro de nombramiento
- renuncia del representante legal
- ejercicio simultáneo en múltiples empresas

#### TX.SOC.09.04 — compatibilidad_cargos
**Nombre:** Compatibilidad de cargos
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Compatibilidad para el ejercicio simultáneo de diferentes cargos dentro de la misma sociedad o entre distintas entidades, incluyendo aspectos profesionales y administrativos

**Normatividad:** Ley 43 de 1990, Código de Comercio

**Ejemplos observados:**
- compatibilidad entre ser contador y representante legal
- compatibilidad entre miembro de junta directiva y representante legal
- diferencia entre representante legal y mandatario

#### TX.SOC.09.05 — otro_administradores
**Nombre:** Otros aspectos de administradores
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Temas residuales relacionados con administradores que no encajan en los subtemas anteriores, incluyendo aspectos específicos de deberes fiduciarios y otras materias conexas

**Normatividad:** Código de Comercio, Ley 222 de 1995

**Ejemplos observados:**
- deber de lealtad societario
- inhabilidades para empleados administrativos como socios

---

## TX.SOC.10 — GRUPOS_EMPRESARIALES
**Label:** Grupos empresariales y situaciones de control
**Frecuencia:** 3.3% (~421 documentos estimados)
**Normatividad base:** Ley 222/1995 arts. 26-33, C.Co. arts. 260-265
**Mapeo Lexia v3.0:** Sin equivalente directo — contexto regulatorio

**Definición:** Configuración, registro y efectos de situaciones de control y grupos empresariales. Subordinación, consolidación.

### Subtemas

#### TX.SOC.10.01 — configuracion_requisitos_grupo
**Nombre:** Configuración y requisitos de grupo empresarial
**Frecuencia estimada:** 30.0% de la categoría

**Definición:** Análisis de los elementos constitutivos del grupo empresarial: control, unidad de propósito y dirección unificada, incluyendo criterios para determinar su existencia y diferenciación con otras figuras societarias

**Normatividad:** Art. 260-264 Código de Comercio, Ley 222 de 1995

**Ejemplos observados:**
- unidad de propósito con entidades sin ánimo de lucro
- diferencias entre SAS y grupo empresarial

#### TX.SOC.10.02 — situacion_control_presupuestos
**Nombre:** Situación de control y sus presupuestos legales
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Determinación y análisis de las situaciones de control bajo los presupuestos del artículo 27 de la Ley 222 de 1995, incluyendo participaciones mayoritarias, mayorías decisorias y presunciones de control

**Normatividad:** Art. 27 Ley 222 de 1995, Art. 260-261 Código de Comercio

**Ejemplos observados:**
- control por accionista único
- mayorías decisorias superiores al 50%

#### TX.SOC.10.03 — registro_obligaciones_formales
**Nombre:** Registro y obligaciones formales de grupos empresariales
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Procedimientos de registro ante Cámara de Comercio, obligaciones de información, estados financieros consolidados y cumplimiento de deberes formales derivados de la situación de control o grupo empresarial

**Normatividad:** Art. 29-30 Ley 222 de 1995, Circular Externa 100-000003 de 2021

**Ejemplos observados:**
- inscripción situación de control
- estados financieros consolidados

#### TX.SOC.10.04 — plan_normalizacion_registro
**Nombre:** Plan de normalización del registro de control y grupos
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Aspectos específicos del plan de normalización establecido en la Circular 100-000003 de 2021, incluyendo procedimientos, plazos, capacitaciones y regularización de registros pendientes

**Normatividad:** Circular Externa 100-000003 de 2021

**Ejemplos observados:**
- normalización con sociedades controlantes extranjeras
- poderes especiales para representación

#### TX.SOC.10.05 — sociedades_extranjeras_sucursales
**Nombre:** Grupos empresariales con sociedades extranjeras y sucursales
**Frecuencia estimada:** 8.0% de la categoría

**Definición:** Aspectos específicos del control y grupos empresariales cuando intervienen sociedades extranjeras, sucursales de sociedades extranjeras y la aplicación de la normativa colombiana en estos casos

**Normatividad:** Art. 27 Ley 222 de 1995, Art. 260 Código de Comercio

**Ejemplos observados:**
- control entre sucursales extranjeras
- registro de situaciones con matriz extranjera

#### TX.SOC.10.06 — otro_grupos_empresariales
**Nombre:** Otros aspectos de grupos empresariales
**Frecuencia estimada:** 2.0% de la categoría

**Definición:** Temas residuales relacionados con grupos empresariales que no se enmarcan en las demás categorías específicas

**Normatividad:** Código de Comercio, Ley 222 de 1995

**Ejemplos observados:**
- solicitudes de información documental
- aspectos procedimentales varios

---

## TX.SOC.11 — CONTRATACION_COMERCIAL
**Label:** Contratación y garantías comerciales
**Frecuencia:** 2.7% (~345 documentos estimados)
**Normatividad base:** C.Co. Libro IV, Ley 1676/2013, Ley 1700/2013
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Contratos comerciales en contexto societario: fiducia, garantías mobiliarias, mutuo, multinivel, distribución.

### Subtemas

#### TX.SOC.11.01 — convenios_comerciales_objeto_social
**Nombre:** Convenios Comerciales y Objeto Social
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Legalidad y conformidad de convenios comerciales con el objeto social de las sociedades, incluyendo programas de financiación y alianzas estratégicas entre entidades

**Normatividad:** Código de Comercio, Estatutos societarios

**Ejemplos observados:**
- convenios de financiación a clientes
- alianzas entre compañías de financiamiento

#### TX.SOC.11.02 — contratos_prenda_garantias_reales
**Nombre:** Contratos de Prenda y Garantías Reales
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Aspectos jurídicos de contratos de prenda, garantías reales y su constitución, incluyendo la revisión de conceptos previos sobre estos contratos

**Normatividad:** Código Civil, Código de Comercio, Ley de Garantías Mobiliarias

**Ejemplos observados:**
- revisión de conceptos sobre prenda
- constitución de garantías reales

#### TX.SOC.11.03 — mercadeo_multinivel_distribucion
**Nombre:** Mercadeo Multinivel y Contratos de Distribución
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Actividades de comercialización en red o mercadeo multinivel, contratos de distribución y cesión de derechos bajo el régimen de la Ley 1700

**Normatividad:** Ley 1700 de 2013, Código de Comercio

**Ejemplos observados:**
- cesión de contratos con distribuidores
- contratos de venta vs distribución

#### TX.SOC.11.04 — fiducia_mercantil_garantia
**Nombre:** Fiducia Mercantil con Fines de Garantía
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Contratos de fiducia mercantil constituidos con fines de garantía, su inscripción en registro mercantil vs registro de garantías mobiliarias y efectos de la publicidad

**Normatividad:** Código de Comercio, Ley de Garantías Mobiliarias, Estatuto Orgánico del Sistema Financiero

**Ejemplos observados:**
- inscripción en registro mercantil
- publicidad en registro de garantías

#### TX.SOC.11.05 — mutuo_objeto_social_principal
**Nombre:** Contrato de Mutuo como Objeto Social
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Viabilidad del contrato de mutuo o préstamo de dinero como actividad principal en el objeto social de sociedades del sector real, aplicable a todos los tipos societarios

**Normatividad:** Código de Comercio, Estatuto Orgánico del Sistema Financiero

**Ejemplos observados:**
- mutuo como actividad principal en SAS
- préstamos en sociedades comerciales

#### TX.SOC.11.06 — libranza_captacion_recursos
**Nombre:** Libranza y Captación de Recursos
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Operaciones de libranza, su relación con la captación masiva de recursos del público y limitaciones para entidades no vigiladas por la Superintendencia Financiera

**Normatividad:** Ley 1527 de 2012, Estatuto Orgánico del Sistema Financiero, Código Sustantivo del Trabajo

**Ejemplos observados:**
- libranza y acceso al crédito
- captación masiva de recursos

#### TX.SOC.11.07 — garantias_mobiliarias_salarios
**Nombre:** Garantías Mobiliarias sobre Salarios
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Constitución de garantías mobiliarias sobre salarios, limitaciones del Código Sustantivo del Trabajo y procedimientos de constitución

**Normatividad:** Ley de Garantías Mobiliarias, Código Sustantivo del Trabajo

**Ejemplos observados:**
- garantías sobre salarios
- limitaciones laborales en garantías

#### TX.SOC.11.08 — garantias_mobiliarias_fusion
**Nombre:** Garantías Mobiliarias en Procesos de Fusión
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Cancelación y tratamiento de garantías mobiliarias en procesos de fusión por absorción, cuando la entidad beneficiaria pierde su personalidad jurídica

**Normatividad:** Ley de Garantías Mobiliarias, Código de Comercio, Ley 222 de 1995

**Ejemplos observados:**
- cancelación post-fusión
- absorción de entidades garantes

#### TX.SOC.11.09 — otro_contratacion_comercial
**Nombre:** Otros Aspectos de Contratación Comercial
**Frecuencia estimada:** 12.5% de la categoría

**Definición:** Otros temas relacionados con contratación comercial que no encajan en las categorías anteriores

**Normatividad:** Código de Comercio, Normatividad comercial general

**Ejemplos observados:**
- consultas generales sobre contratos
- aspectos no clasificados

---

## TX.SOC.12 — REVISOR_FISCAL
**Label:** Revisoría fiscal
**Frecuencia:** 2.3% (~294 documentos estimados)
**Normatividad base:** Ley 222/1995 art. 13, C.Co. arts. 203-217, Ley 43/1990
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Nombramiento, funciones, inhabilidades, obligatoriedad y responsabilidad del revisor fiscal.

### Subtemas

#### TX.SOC.12.01 — obligatoriedad_revisor_fiscal
**Nombre:** Obligatoriedad del revisor fiscal
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Eventos, requisitos y condiciones en los que las sociedades deben tener revisor fiscal según el tipo societario, patrimonio bruto o decisión de socios

**Normatividad:** art. 203 Código de Comercio, art. 13 parágrafo 2 Ley 43/1993

**Ejemplos observados:**
- requisitos para tener revisor fiscal en empresas
- obligatoriedad en sociedades por acciones

#### TX.SOC.12.02 — eleccion_mayorias_revisor
**Nombre:** Elección y mayorías del revisor fiscal
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Procedimientos, mayorías requeridas, voto en blanco y demás aspectos relacionados con la elección del revisor fiscal por los órganos sociales

**Normatividad:** Código de Comercio, estatutos sociales

**Ejemplos observados:**
- mayorías para elección del revisor fiscal
- incidencia del voto en blanco

#### TX.SOC.12.03 — incompatibilidades_conflictos
**Nombre:** Incompatibilidades y conflictos de interés
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Situaciones de incompatibilidad, conflictos de interés, prohibiciones y limitaciones para el ejercicio simultáneo del cargo de revisor fiscal en diferentes sociedades

**Normatividad:** art. 207 Código de Comercio, Ley 43/1993

**Ejemplos observados:**
- revisor fiscal simultáneo en matriz y subordinadas
- incompatibilidades legales

#### TX.SOC.12.04 — funciones_deberes_liquidacion
**Nombre:** Funciones en liquidación y situaciones especiales
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Deberes, funciones y actuaciones del revisor fiscal en procesos de liquidación voluntaria, sociedades desaparecidas u otras situaciones societarias especiales

**Normatividad:** art. 233 Código de Comercio, art. 210 Código de Comercio

**Ejemplos observados:**
- funciones en liquidación voluntaria
- actuación frente a sociedades desaparecidas

#### TX.SOC.12.05 — procedimientos_supervision
**Nombre:** Procedimientos de supervisión y control
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Aspectos relacionados con la supervisión, firmas conjuntas, auditorías externas y otros procedimientos de control que involucran al revisor fiscal

**Normatividad:** art. 37 Ley 222/1995, art. 33 Decreto 2649/1993

**Ejemplos observados:**
- firmas conjuntas con representante legal
- auditorías externas por socios minoritarios

#### TX.SOC.12.99 — otro_revisor_fiscal
**Nombre:** Otros temas de revisor fiscal
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Aspectos relacionados con el revisor fiscal no cubiertos en los subtemas anteriores, incluyendo temas residuales y consultas específicas menores

**Normatividad:** Código de Comercio, normatividad contable

**Ejemplos observados:**
- consultas menores sobre revisoría fiscal
- temas no clasificados

---

## TX.SOC.13 — UTILIDADES_DIVIDENDOS
**Label:** Utilidades, dividendos y reservas
**Frecuencia:** 1.7% (~217 documentos estimados)
**Normatividad base:** C.Co. arts. 149-157, 451-456, Ley 222/1995 art. 240
**Mapeo Lexia v3.0:** → CT.SOC.04

**Definición:** Distribución de utilidades, reservas, dividendos, absorción de pérdidas, recompra de acciones.

### Subtemas

#### TX.SOC.13.01 — proteccion_accionistas_minoritarios
**Nombre:** Protección de Accionistas Minoritarios en Distribución de Utilidades
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Mecanismos legales para proteger los derechos de accionistas minoritarios frente a decisiones abusivas de no distribución de utilidades o ejercicio indebido del derecho de voto en la distribución

**Normatividad:** Código de Comercio, Ley 222 de 1995, Ley 1258 de 2008

**Ejemplos observados:**
- ejercicio abusivo del derecho de voto
- no distribución injustificada de utilidades

#### TX.SOC.13.02 — titularidad_dividendos_transferencia
**Nombre:** Titularidad de Dividendos en Transferencia de Acciones
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Determinación de la titularidad de dividendos pendientes durante procesos de negociación, transferencia o enajenación de acciones, incluyendo derechos y obligaciones de cedente y cesionario

**Normatividad:** Código de Comercio, Código Civil

**Ejemplos observados:**
- dividendos pendientes en negociación de acciones
- derechos del adquirente de acciones

#### TX.SOC.13.03 — pago_dividendos_acciones
**Nombre:** Pago de Dividendos en Acciones
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Modalidades y requisitos para el pago de dividendos mediante entrega de acciones, incluyendo valoración a valor intrínseco y procedimientos especiales para sociedades de economía mixta

**Normatividad:** Artículo 455 del Código de Comercio, Ley 489 de 1998

**Ejemplos observados:**
- dividendos en acciones a valor intrínseco
- sociedades de economía mixta

#### TX.SOC.13.04 — dividendos_no_reclamados_intereses
**Nombre:** Dividendos No Reclamados e Intereses
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Régimen jurídico de dividendos no reclamados por los accionistas, incluyendo causación de intereses por mora, consentimiento presunto y obligaciones de la sociedad

**Normatividad:** Código de Comercio, Código Civil

**Ejemplos observados:**
- intereses por atraso en pago
- consentimiento de accionistas

#### TX.SOC.13.05 — reservas_estatutarias_sucursales
**Nombre:** Reservas Estatutarias en Sucursales
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Constitución y manejo de reservas estatutarias en sucursales de sociedades extranjeras, incluyendo requisitos y limitaciones según estatutos de la casa matriz

**Normatividad:** Decreto 2349 de 1993, Código de Comercio

**Ejemplos observados:**
- reservas en sucursales de sociedad extranjera
- diferencias con casa matriz

#### TX.SOC.13.99 — otro_utilidades_dividendos
**Nombre:** Otros Aspectos de Utilidades y Dividendos
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Otros aspectos relacionados con distribución de utilidades y dividendos no contemplados en los subtemas anteriores

**Normatividad:** Código de Comercio, Legislación societaria

**Ejemplos observados:**
- consultas especiales sobre utilidades
- casos atípicos de dividendos

---

## TX.SOC.14 — LIBROS_CONTABILIDAD
**Label:** Libros de comercio y contabilidad
**Frecuencia:** 1.7% (~217 documentos estimados)
**Normatividad base:** C.Co. arts. 48-74, Ley 1314/2009
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Libros de comercio, obligaciones contables, estados financieros, NIIF, conservación documental.

### Subtemas

#### TX.SOC.14.01 — correccion_estados_financieros
**Nombre:** Corrección de Estados Financieros
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Procedimientos y requisitos para la corrección de errores en estados financieros ya aprobados, incluyendo el reconocimiento de errores contables y la aplicación de principios de materialidad

**Normatividad:** Decreto 2649 de 1993, Decreto 2650 de 1993, Principios de Contabilidad Generalmente Aceptados

**Ejemplos observados:**
- corrección de pasivos no contabilizados
- ajustes posteriores a la aprobación

#### TX.SOC.14.02 — libros_electronicos
**Nombre:** Libros de Comercio en Archivos Electrónicos
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Regulación sobre el manejo de libros oficiales en formato electrónico, incluyendo requisitos técnicos, formatos permitidos y validación de la información digital

**Normatividad:** Decreto 019 de 2012, Código de Comercio Art. 56, Circular 100

**Ejemplos observados:**
- generación de archivos PDF
- garantía de reproducción electrónica

#### TX.SOC.14.03 — inscripcion_libros_actas
**Nombre:** Inscripción de Libros de Actas
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Obligaciones y procedimientos relacionados con la inscripción de libros de actas en el registro mercantil, incluyendo modificaciones normativas recientes sobre su exigibilidad

**Normatividad:** Código de Comercio Art. 28, Decreto 019 de 2012, Circular Básica Jurídica

**Ejemplos observados:**
- eliminación de obligación de registro de actas de junta directiva
- fundamentos legales para exigir inscripción

#### TX.SOC.14.04 — conservacion_destruccion_libros
**Nombre:** Conservación y Destrucción de Libros
**Frecuencia estimada:** 35.0% de la categoría

**Definición:** Términos y procedimientos para la conservación, reproducción y destrucción de libros y papeles del comerciante, tanto en formato físico como digital

**Normatividad:** Código de Comercio Art. 60 (derogado), Decreto 2649 de 1993 Art. 134 (derogado), Ley 962 de 2005

**Ejemplos observados:**
- términos de conservación de archivos físicos y digitales
- derogación de normas sobre destrucción
- reproducción por medios técnicos

#### TX.SOC.14.05 — otro_libros_contabilidad
**Nombre:** Otros Aspectos de Libros y Contabilidad
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Otros temas relacionados con libros de comercio y contabilidad que no se enmarcan en las categorías específicas anteriores

**Normatividad:** Código de Comercio, Decretos 2649 y 2650 de 1993

**Ejemplos observados:**
- consultas generales sobre libros
- aspectos procedimentales diversos

---

## TX.SOC.15 — PROCEDIMIENTO
**Label:** Aspectos procesales y jurisdiccionales
**Frecuencia:** 1.3% (~166 documentos estimados)
**Normatividad base:** CGP, Ley 1258/2008 arts. 40-43, Ley 222/1995 arts. 133-141
**Mapeo Lexia v3.0:** → CT.GEN.08, .10

**Definición:** Competencia jurisdiccional, acciones judiciales, impugnación, conciliación, velo corporativo.

### Subtemas

#### TX.SOC.15.01 — impugnacion_decisiones_sociales
**Nombre:** Impugnación de decisiones sociales
**Frecuencia estimada:** 50.0% de la categoría

**Definición:** Procedimientos para impugnar actas y decisiones de órganos sociales (asambleas, juntas de socios, juntas de asociados), incluyendo requisitos de procedibilidad como la conciliación extrajudicial, competencia judicial y trámites aplicables

**Normatividad:** Código de Comercio art. 191, Ley 1563 de 2012, Ley 1258 de 2008

**Ejemplos observados:**
- impugnación de actas de uniones temporales
- conciliación extrajudicial como requisito de procedibilidad para SAS

#### TX.SOC.15.02 — notificaciones_administrativas
**Nombre:** Notificaciones administrativas
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Procedimientos y modalidades de notificaciones administrativas realizadas por la Superintendencia de Sociedades, incluyendo notificaciones por medios electrónicos y aplicación del Código de Procedimiento Administrativo

**Normatividad:** Ley 1437 de 2011 (CPACA), Decreto 1081 de 2015

**Ejemplos observados:**
- notificaciones por medios electrónicos
- tipos de notificación según CPACA

#### TX.SOC.15.03 — levantamiento_velo_corporativo
**Nombre:** Levantamiento del velo corporativo
**Frecuencia estimada:** 15.0% de la categoría

**Definición:** Procedimientos y criterios para el levantamiento del velo corporativo, incluyendo la superación de la separación patrimonial entre sociedad y socios cuando se configuren supuestos de abuso o fraude

**Normatividad:** Código de Comercio, Jurisprudencia de la Corte Suprema, Doctrina de la Supersociedades

**Ejemplos observados:**
- separación patrimonial entre sociedad y socios
- criterios para levantamiento del velo

#### TX.SOC.15.04 — otro_procedimiento
**Nombre:** Otros aspectos procedimentales
**Frecuencia estimada:** 10.0% de la categoría

**Definición:** Otros temas relacionados con procedimientos societarios, administrativos y judiciales no cubiertos en los subtemas anteriores

**Normatividad:** Código de Comercio, Ley 1437 de 2011, Normatividad específica

**Ejemplos observados:**
- procedimientos especiales
- trámites diversos ante Supersociedades

---

## TX.SOC.16 — ENTIDADES_SIN_ANIMO_LUCRO
**Label:** Entidades sin ánimo de lucro
**Frecuencia:** 1.3% (~166 documentos estimados)
**Normatividad base:** Decreto 2150/1995, C.C. arts. 633-652
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** ESAL, fundaciones, asociaciones, cooperativas — en la medida en que Supersociedades tenga competencia.

### Subtemas

#### TX.SOC.16.01 — competencia_supersociedades
**Nombre:** Competencia de la Superintendencia sobre ESAL
**Frecuencia estimada:** 30.0% de la categoría

**Definición:** Determinación de la competencia de la Superintendencia de Sociedades sobre entidades sin ánimo de lucro, incluyendo federaciones, asociaciones, cooperativas y otras organizaciones que escapan a su jurisdicción

**Normatividad:** Ley 222/1995 arts. 82-85, Constitución Política art. 189, Decreto 1080/2015

**Ejemplos observados:**
- Federaciones como FENALCO
- Cooperativas y confederaciones

#### TX.SOC.16.02 — gobierno_corporativo_esal
**Nombre:** Gobierno corporativo en ESAL
**Frecuencia estimada:** 40.0% de la categoría

**Definición:** Aspectos relacionados con derechos de voto, impugnación de actos, inspección de libros y documentos, y funcionamiento de asambleas en fundaciones, asociaciones y corporaciones sin ánimo de lucro

**Normatividad:** Código Civil, Código de Comercio (analogía), Ley 222/1995

**Ejemplos observados:**
- Derechos de voto en reorganización de pasivos
- Impugnación en clubes sociales y deportivos

#### TX.SOC.16.03 — liquidacion_esal
**Nombre:** Liquidación de entidades sin ánimo de lucro
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Procedimientos y aspectos legales relacionados con el proceso liquidatorio de entidades sin ánimo de lucro, incluyendo competencias y normatividad aplicable

**Normatividad:** Código Civil, Ley 222/1995, Decreto 1080/2015

**Ejemplos observados:**
- Proceso liquidatorio general de ESAL

#### TX.SOC.16.04 — otro_esal
**Nombre:** Otros aspectos de ESAL
**Frecuencia estimada:** 10.0% de la categoría

**Definición:** Otros temas relacionados con entidades sin ánimo de lucro que no se enmarcan en las categorías anteriores

**Normatividad:** Normatividad diversa según el caso

**Ejemplos observados:**
- Consultas diversas sobre ESAL

---

## TX.SOC.17 — REGIMEN_CAMBIARIO
**Label:** Régimen cambiario e inversión extranjera
**Frecuencia:** 1.0% (~128 documentos estimados)
**Normatividad base:** Decreto 119/2017, Ley 9/1991
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Inversión extranjera directa, régimen cambiario, registro de inversión en contexto societario.

### Subtemas

#### TX.SOC.17.01 — inversion_extranjera_directa
**Nombre:** Inversión Extranjera Directa
**Frecuencia estimada:** 40.0% de la categoría

**Definición:** Consultas sobre el régimen, registro, declaración y modificaciones de la inversión extranjera directa en Colombia, incluyendo pérdida de calidad de residente cambiario y constitución de IED

**Normatividad:** Decreto 1068 de 2015, Circular Reglamentaria Externa DCIN-83, Ley 9 de 1991

**Ejemplos observados:**
- residente que pierde calidad cambiaria
- constitución de IED en SAS

#### TX.SOC.17.02 — capitalizacion_deuda_sucursales
**Nombre:** Capitalización de Deuda en Sucursales
**Frecuencia estimada:** 30.0% de la categoría

**Definición:** Procedimientos cambiarios para capitalización de deudas en sucursales de sociedades extranjeras, registro ante Banco de la República y reversión de capitalizaciones rechazadas

**Normatividad:** Decreto 1068 de 2015, Circular Reglamentaria Externa DCIN-83

**Ejemplos observados:**
- capitalización rechazada por Banco de la República
- reversión de capitalización en sucursal

#### TX.SOC.17.03 — garantias_fiduciarias_cambio_titular
**Nombre:** Garantías Fiduciarias y Cambio de Titularidad
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Aspectos cambiarios relacionados con ejecución de garantías fiduciarias y sustitución de titulares de inversión extranjera, incluyendo registros y reportes obligatorios

**Normatividad:** Decreto 1068 de 2015, Circular Reglamentaria Externa DCIN-83

**Ejemplos observados:**
- ejecución de garantía fiduciaria
- sustitución de titulares de IED

#### TX.SOC.17.04 — otro_regimen_cambiario
**Nombre:** Otros Aspectos del Régimen Cambiario
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Consultas sobre régimen cambiario societario no clasificadas en los subtemas anteriores, incluyendo operaciones de cambio especiales y procedimientos cambiarios diversos

**Normatividad:** Decreto 1068 de 2015, Estatuto Orgánico del Sistema Financiero

---

## TX.SOC.18 — REGISTRO_MERCANTIL
**Label:** Registro mercantil y matrícula
**Frecuencia:** 0.3% (~38 documentos estimados)
**Normatividad base:** C.Co. arts. 26-47
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Inscripción, renovación, cancelación de matrícula mercantil, certificados.

*Sin subtemas — muestra insuficiente para subdivisión.*

---

## TX.SOC.19 — PROPIEDAD_INTELECTUAL
**Label:** Propiedad intelectual en contexto societario
**Frecuencia:** 0.0% (~0 documentos estimados)
**Normatividad base:** Decisión Andina 486
**Mapeo Lexia v3.0:** Sin equivalente directo

**Definición:** Marcas, nombres comerciales en contexto societario. No observada en muestra — candidata a eliminación.

*Sin subtemas — muestra insuficiente para subdivisión.*

---

## TX.SOC.20 — OTRO
**Label:** Otros temas
**Frecuencia:** 1.3% (~166 documentos estimados)
**Normatividad base:** Varia
**Mapeo Lexia v3.0:** Residual

**Definición:** Conceptos que no encajan en categorías anteriores.

### Subtemas

#### TX.SOC.20.01 — programas_etica_empresarial
**Nombre:** Programas de Ética y Transparencia Empresarial
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Consultas sobre la implementación, adopción y aplicación de programas de ética empresarial, transparencia corporativa y prevención de prácticas corruptas en sociedades comerciales

**Normatividad:** Ley 1778 de 2016, Código Penal, Ley 80 de 1993

**Ejemplos observados:**
- adopción de programas de ética empresarial
- prevención de soborno transnacional

#### TX.SOC.20.02 — uniones_temporales
**Nombre:** Uniones Temporales y Figuras Contractuales Especiales
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Aspectos jurídicos relacionados con la naturaleza, constitución, funcionamiento y características de uniones temporales, consorcios y otras figuras contractuales especiales en el derecho societario

**Normatividad:** Ley 80 de 1993, Ley 1150 de 2007, Código Civil

**Ejemplos observados:**
- naturaleza jurídica de uniones temporales
- diferenciación entre entes jurídicos

#### TX.SOC.20.03 — normatividad_decretos_reglamentarios
**Nombre:** Normatividad y Decretos Reglamentarios del Sector
**Frecuencia estimada:** 25.0% de la categoría

**Definición:** Consultas sobre decretos reglamentarios, normatividad general del sector comercio, industria y turismo, y disposiciones normativas que afectan el derecho societario

**Normatividad:** Decreto 1074 de 2015, Código de Comercio, Ley 222 de 1995

**Ejemplos observados:**
- decreto único reglamentario del sector comercio
- modificaciones normativas sectoriales

#### TX.SOC.20.04 — investigacion_academica
**Nombre:** Investigación Académica y Metodología Jurídica
**Frecuencia estimada:** 20.0% de la categoría

**Definición:** Respuestas a solicitudes de investigación académica, tesis de grado, estudios metodológicos en derecho procesal y comercial, y orientaciones para investigaciones jurídicas

**Normatividad:** Ley 1755 de 2015, Código General del Proceso, Ley Estatutaria 1581 de 2012

**Ejemplos observados:**
- investigación en procesos concursales
- metodología para tesis de grado

#### TX.SOC.20.05 — otro_consultas_diversas
**Nombre:** Otras Consultas Diversas
**Frecuencia estimada:** 5.0% de la categoría

**Definición:** Consultas que no se enmarcan en las categorías específicas anteriores, incluyendo temas residuales, consultas atípicas o materias no clasificadas en otros subtemas del derecho societario

**Normatividad:** Código de Comercio, Ley 222 de 1995, Normatividad general

**Ejemplos observados:**
- consultas atípicas
- temas no clasificados

---

# PARTE II: MAPEO CRUZADO CON LEXIA v3.0

| Código TX.SOC | Subtema | Equivalente Lexia v3.0 | Tipo de relación |
|---------------|---------|------------------------|------------------|
| TX.SOC.03.01 | Derecho de retiro | CT.SOC.03 | Equivalente directo |
| TX.SOC.03.02 | Derecho de preferencia | CT.SOC.08 | Equivalente directo |
| TX.SOC.03.03 | Cesión de participaciones | CT.SOC.02 (parcial) | Solapamiento parcial |
| TX.SOC.03.05 | Exclusión de socios | CT.SOC.03 | Equivalente directo |
| TX.SOC.03.09 | Derechos de voto | S-ABV, B6.07 | Contexto de abuso |
| TX.SOC.04.01–06 | Disolución/Liquidación | CT.SOC.07 | Superconjunto |
| TX.SOC.05.01 | Convocatorias | B6.05 | Falla vs. doctrina |
| TX.SOC.05.02 | Quórum y mayorías | B6.05, B6.06 | Falla vs. doctrina |
| TX.SOC.05.05 | Representación legal | B6.06 | Falla vs. doctrina |
| TX.SOC.09.01 | Responsabilidad admin. | CT.SOC.06 | Equivalente directo |
| TX.SOC.09.02 | Incompatibilidades | S-COI | Contexto normativo |
| TX.SOC.10.01–02 | Grupos/Control | — | Sin equivalente |
| TX.SOC.13.01–05 | Utilidades/Dividendos | CT.SOC.04 | Superconjunto |

**Observación:** La taxonomía TX.SOC es significativamente más amplia que CT.SOC. Solo ~30% de los subtemas tienen equivalente en el universo arbitral. Esto es esperable: los conceptos de Supersociedades cubren el espectro regulatorio completo, mientras que los laudos arbitrales solo ven las controversias que llegan a tribunal.

---

# PARTE III: REGLAS DE CLASIFICACIÓN

## Regla 1: Tema principal = consulta central
Asignar el tema que describe la **consulta central** del concepto, no temas mencionados incidentalmente.

## Regla 2: Competencia vs. tema sustantivo
Si el concepto trata sobre la competencia de Supersociedades para intervenir en tema X → TX.SOC.01, no X.

## Regla 3: Subtema = aspecto específico más relevante
Dentro de la categoría, elegir el subtema que mejor capture el aspecto específico consultado.

## Regla 4: Desambiguación por pares comunes

| Situación | Clasificar como | No como |
|-----------|-----------------|---------|
| Disolución por pérdidas + enervatoria por capitalización | TX.SOC.04.03 (causales) | TX.SOC.08 (capital) |
| Fusión que requiere autorización de Supersociedades | TX.SOC.07.01 (fusión) | TX.SOC.01 (inspección) |
| Derechos de accionista en asamblea | TX.SOC.03 si foco = derecho del socio | TX.SOC.05 si foco = funcionamiento órgano |
| Administrador en conflicto de intereses | TX.SOC.09.02 (incompatibilidades) | TX.SOC.05 (órganos) |
| Revisor fiscal en liquidación | TX.SOC.12.04 (RF especial) | TX.SOC.04 (liquidación) |
| Grupo empresarial con sucursal extranjera | TX.SOC.10.05 (grupos + extranjera) | TX.SOC.06.06 (tipos) |
| SAS unipersonal + constitución | TX.SOC.06.04 (SAS) | TX.SOC.06.05 (EU) |
| Emisión de acciones en aumento de capital | TX.SOC.08.01 (emisión) | TX.SOC.07.03 (reforma capital) |
| Cesión de cuotas con derecho de preferencia | TX.SOC.03.02 (preferencia) | TX.SOC.03.03 (cesión) |
| Insolvencia + efectos en contratos estatales | TX.SOC.02.07 (efectos jurisdiccionales) | TX.SOC.11 (contratación) |

## Regla 5: Tema secundario
Asignar solo si el concepto desarrolla sustancialmente dos temas distintos. No asignar por mención incidental.

## Regla 6: Ilegibles
Si el texto está vacío, corrupto o en formato no legible → no clasificar. Marcar como `ILEGIBLE`.

---

# PARTE IV: ESTADÍSTICAS Y COBERTURA

## Distribución estimada del corpus completo (12,758 documentos)

| Categoría | % | Docs est. | Subtemas |
|-----------|---|-----------|----------|
| TX.SOC.01 Inspección, vigilancia y control de Supersociedades | 14.0% | ~1,786 | 8 |
| TX.SOC.02 Régimen de insolvencia empresarial | 12.0% | ~1,531 | 10 |
| TX.SOC.03 Derechos de socios y accionistas | 11.3% | ~1,442 | 10 |
| TX.SOC.04 Disolución y liquidación de sociedades | 11.3% | ~1,442 | 6 |
| TX.SOC.05 Órganos sociales y gobierno interno | 9.0% | ~1,148 | 6 |
| TX.SOC.06 Tipos societarios y constitución | 8.3% | ~1,059 | 9 |
| TX.SOC.07 Reformas estatutarias y reorganizaciones corporativas | 6.0% | ~765 | 5 |
| TX.SOC.08 Capital social, aportes y acciones | 5.7% | ~727 | 6 |
| TX.SOC.09 Deberes y responsabilidad de administradores | 4.7% | ~600 | 5 |
| TX.SOC.10 Grupos empresariales y situaciones de control | 3.3% | ~421 | 6 |
| TX.SOC.11 Contratación y garantías comerciales | 2.7% | ~345 | 9 |
| TX.SOC.12 Revisoría fiscal | 2.3% | ~294 | 6 |
| TX.SOC.13 Utilidades, dividendos y reservas | 1.7% | ~217 | 6 |
| TX.SOC.14 Libros de comercio y contabilidad | 1.7% | ~217 | 5 |
| TX.SOC.15 Aspectos procesales y jurisdiccionales | 1.3% | ~166 | 4 |
| TX.SOC.16 Entidades sin ánimo de lucro | 1.3% | ~166 | 4 |
| TX.SOC.17 Régimen cambiario e inversión extranjera | 1.0% | ~128 | 4 |
| TX.SOC.18 Registro mercantil y matrícula | 0.3% | ~38 | 0 |
| TX.SOC.19 Propiedad intelectual en contexto societario | 0.0% | ~0 | 0 |
| TX.SOC.20 Otros temas | 1.3% | ~166 | 5 |
| **TOTAL** | **100%** | **~12,758** | **114** |

## Métricas de la taxonomía

- **Categorías gruesas:** 20 (TX.SOC.01 – TX.SOC.20)
- **Subtemas totales:** 114
- **Categorías con subtemas:** 18
- **Promedio subtemas/categoría:** 6.3
- **Rango:** 4–10 subtemas por categoría
- **Tasa de ilegibles:** ~0.7% (~89 docs)
- **Muestra de validación:** 300 documentos (IC 95% ±5.6%)

---

# PARTE V: PRÓXIMOS PASOS

1. **Clasificación completa:** Aplicar TX.SOC a los 12,758 conceptos jurídicos usando Claude API batch
2. **Validación cruzada:** Muestra de 50 conceptos clasificados manualmente para medir concordancia inter-anotador
3. **Conceptos contables (TX.CON):** Crear serie equivalente para los 441 conceptos contables
4. **Refinamiento:** Evaluar fusión de TX.SOC.18/19 si no aparecen en clasificación completa
5. **Integración Lexia:** Alimentar la capa de contexto regulatorio del análisis de laudos con esta taxonomía

---

## HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-04-05 | Versión inicial — 20 categorías gruesas |
| 2.0 | 2026-04-05 | 114 subtemas añadidos, normatividad por subtema, reglas de desambiguación |