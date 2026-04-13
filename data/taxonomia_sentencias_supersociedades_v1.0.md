# Taxonomía Canónica de Sentencias — Superintendencia de Sociedades
## Tipos de Acción Societaria (Serie AS)

**Versión:** 1.0
**Fecha:** 2026-04-05
**Estado:** Propuesta — pendiente validación con corpus completo
**Validada con:** 87 sentencias extraídas + análisis de competencias Art. 24 CGP y Ley 1258/2008
**Complementa:** taxonomia_lexia_v3.0_canonica.md (series CT.SOC, B6)
**Reemplaza:** Las 5 definiciones dispersas en supersociedadesChatGPT (TaxonomyClient.tsx, upload/route.ts, extract_cases.js, generate50cases.js, tribunal/ingest/route.ts)

---

## PROBLEMA QUE RESUELVE

El campo `actionType` en la base de datos de sentencias tiene **5 fuentes de ingesta** que producen **nombres distintos** para el mismo tipo de acción:

| Variante en DB | Fuente | Canónico propuesto |
|----------------|--------|--------------------|
| `Responsabilidad de administradores` | TaxonomyClient.tsx | AS.05 |
| `Responsabilidad de Administradores` | upload/route.ts | AS.05 |
| `Acción Social de Responsabilidad` | tribunal/ingest (Gemini free-text) | AS.05 |
| `Responsabilidad civil de administradores` | Gemini variante | AS.05 |
| `Impugnación de decisiones sociales` | extract_cases.js | AS.03 |
| `Nulidad o Inexistencia de Decisiones` | upload/route.ts reclassifier | AS.03 |
| `Impugnación de Actos de Asamblea` | tribunal/ingest (Gemini free-text) | AS.03 |
| `Reconocimiento de presupuestos de ineficacia` | TaxonomyClient.tsx | AS.02 |
| `Ineficacia de Decisiones Sociales` | upload/route.ts reclassifier | AS.02 |
| `Conflictos Societarios (Residual)` | upload/route.ts reclassifier | AS.04 |
| `Disputas societarias` | extract_cases.js | AS.04 |

Este documento define **una sola fuente de verdad** que todas las pipelines deben usar.

---

## PRINCIPIOS DE DISEÑO

1. **Código estable:** cada tipo de acción tiene un código `AS.XX` que nunca cambia, aunque el label sí pueda ajustarse
2. **Exhaustividad:** todo proceso jurisdiccional societario ante Supersociedades cae en exactamente 1 código
3. **Basada en competencia legal:** los códigos reflejan las competencias del Art. 24 CGP y leyes especiales, no categorías inventadas
4. **Auditable:** definición tan clara que dos analistas clasifiquen igual
5. **Aliases explícitos:** cada código lista TODAS las variantes conocidas para mapeo automático
6. **Compatible con Lexia:** mapeo cruzado con CT.SOC, B6, TX.SOC
7. **Regla de estabilización:** un código necesita aparecer en 3+ sentencias independientes para justificar código propio

---

## ESQUEMA DE CLASIFICACIÓN

Cada sentencia clasificada produce:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `action_type_code` | AS.XX | Código canónico — exactamente uno |
| `action_type_label` | string | Label canónico (el que se muestra en UI) |
| `action_type_raw` | string | Valor original extraído por Gemini (para auditoría) |
| `subtopics` | string[] | Subtemas específicos dentro del tipo de acción |
| `legal_basis` | string[] | Normas que fundamentan la competencia |

---

## CATÁLOGO DE TIPOS DE ACCIÓN (SERIE AS)

### Distribución observada (corpus n=87)

| # | Código | Label canónico | n | % | Base legal de competencia |
|---|--------|----------------|---|---|---------------------------|
| 1 | AS.01 | Abuso del derecho de voto | 12 | 13.8% | Art. 43 Ley 1258/2008 |
| 2 | AS.02 | Reconocimiento de presupuestos de ineficacia | 34 | 39.1% | Art. 24 num. 1 CGP |
| 3 | AS.03 | Impugnación de decisiones sociales | 32 | 36.8% | Art. 24 num. 2 CGP, Art. 191 C.Co. |
| 4 | AS.04 | Disputas societarias | 3 | 3.4% | Art. 24 num. 5.d CGP |
| 5 | AS.05 | Responsabilidad de administradores | 5 | 5.7% | Art. 24 num. 5.b CGP, Art. 25 Ley 222/1995 |
| 6 | AS.06 | Desestimación de la personalidad jurídica | 1 | 1.1% | Art. 42 Ley 1258/2008 |
| 7 | AS.07 | Designación de peritos | 0 | 0.0% | Art. 24 num. 3 CGP |
| 8 | AS.08 | Disputas sobre causales de disolución | 0 | 0.0% | Art. 24 num. 4 CGP |
| 9 | AS.09 | Cumplimiento de acuerdos de accionistas | 0 | 0.0% | Art. 24 num. 5.a CGP |
| 10 | AS.10 | Responsabilidad de socios y liquidadores | 0 | 0.0% | Art. 24 num. 5.c CGP |
| 11 | AS.11 | Oposición a reactivación societaria | 0 | 0.0% | Art. 24 num. 6 CGP |
| 12 | AS.12 | Conflicto de intereses de administradores | 0 | 0.0% | Art. 23 num. 7 Ley 222/1995 |
| 13 | AS.13 | Responsabilidad de matrices y controlantes | 0 | 0.0% | Art. 61 Ley 1116/2006, Art. 265 C.Co. |
| 14 | AS.14 | Ejecución de pactos parasociales | 0 | 0.0% | Art. 70 Ley 222/1995 |
| 15 | AS.99 | Requiere revisión manual | 0 | 0.0% | — |

---

## DEFINICIONES DETALLADAS

### AS.01 — abuso_derecho_voto
**Label:** Abuso del derecho de voto
**Frecuencia:** 13.8%

**Definición:** Acción mediante la cual un accionista o grupo de accionistas alega que otro ha ejercido el derecho de voto en beneficio propio y en perjuicio de la sociedad o de los demás accionistas. Requiere prueba de estándar dual: perjuicio objetivo + intención subjetiva.

**Base legal:** Art. 43 Ley 1258/2008, Art. 830 C.Co. (abuso del derecho)

**Subtemas:**
- `abuso_mayoria` — Mayoritario impone decisiones en perjuicio de minoritarios
- `abuso_minoria` — Minoritario bloquea decisiones legítimas
- `abuso_paridad` — Socio paritario usa voto para paralizar la sociedad
- `veto_injustificado` — Bloqueo de decisiones sin justificación legítima

**Aliases conocidos (para mapeo automático):**
- `Abuso del derecho de voto`
- `Abuso de mayoría`
- `Abuso de minoría`
- `Abuso del voto`
- `Abuso de voto`
- `Art. 43 Ley 1258`

**Criterios de inclusión:**
- La pretensión principal invoca abuso del derecho de voto (Art. 43 Ley 1258)
- Se discute si una decisión de asamblea fue adoptada con abuso

**Criterios de exclusión:**
- Si la pretensión principal es nulidad/ineficacia de la decisión (no abuso) → AS.02 o AS.03
- Si es conflicto de intereses del administrador (no accionista) → AS.12

**Mapeo Lexia v3.0:** → S-ABV, B6.07
**Mapeo TX.SOC:** → TX.SOC.03.09 (derechos políticos y de voto)

---

### AS.02 — ineficacia_decisiones
**Label:** Reconocimiento de presupuestos de ineficacia
**Frecuencia:** 39.1% (tipo más frecuente)

**Definición:** Acción para que se declare la ineficacia de pleno derecho de decisiones de órganos sociales adoptadas en contravención de normas imperativas (convocatoria irregular, quórum insuficiente, representación indebida). La ineficacia opera ipso iure pero requiere reconocimiento judicial.

**Base legal:** Art. 24 num. 1 CGP, Art. 190 C.Co., Art. 433 C.Co. (SA), Art. 897 C.Co.

**Subtemas:**
- `convocatoria_irregular` — Falta de convocatoria o convocatoria defectuosa
- `quorum_insuficiente` — Decisión sin quórum deliberativo o decisorio
- `representacion_indebida` — Quórum aparente ≠ quórum real por poderes inválidos
- `reunion_no_universal` — Reunión sin convocatoria que no fue universal
- `mayorias_insuficientes` — Decisión sin las mayorías legales o estatutarias
- `violacion_derecho_preferencia` — Emisión o cesión sin respetar preferencia

**Aliases conocidos:**
- `Reconocimiento de presupuestos de ineficacia`
- `Ineficacia de Decisiones Sociales`
- `Ineficacia de decisiones sociales`
- `Ineficacia`
- `Declaratoria de ineficacia`
- `Presupuestos de ineficacia`
- `Ineficacia de pleno derecho`

**Criterios de inclusión:**
- La pretensión invoca ineficacia (Art. 190, 433, 897 C.Co.)
- Se discuten vicios formales que generan ineficacia de pleno derecho

**Criterios de exclusión:**
- Si se invoca nulidad absoluta o relativa (no ineficacia) → AS.03
- Si el vicio es abuso del voto (no formal) → AS.01
- Si es inoponibilidad por falta de registro → AS.03

**Nota normativa:** La ineficacia SÍ caduca en 2 meses (STC14279-2025 Corte Suprema, M.P. Octavio Tejeiro Duque).

**Mapeo Lexia v3.0:** → CT.SOC.05 (gobierno corporativo), B6.05 (gobierno deficiente), B6.06 (representación indebida)
**Mapeo TX.SOC:** → TX.SOC.05.02 (quórum y mayorías), TX.SOC.05.01 (convocatorias)

---

### AS.03 — impugnacion_decisiones
**Label:** Impugnación de decisiones sociales
**Frecuencia:** 36.8%

**Definición:** Acción para declarar la nulidad absoluta, nulidad relativa o inoponibilidad de decisiones de asamblea o junta directiva por vicios sustanciales (no meramente formales). Diferente de ineficacia (AS.02) porque requiere sentencia constitutiva.

**Base legal:** Art. 24 num. 2 CGP, Art. 191-193 C.Co., Art. 900-901 C.Co.

**Subtemas:**
- `nulidad_absoluta` — Decisión contraria a norma imperativa (Art. 899 C.Co.)
- `nulidad_relativa` — Vicio del consentimiento, incapacidad (Art. 900 C.Co.)
- `inoponibilidad` — Decisión válida pero inoponible a terceros o ausentes
- `objeto_ilicito` — Decisión con objeto o causa ilícita
- `exceso_facultades` — Órgano decidió fuera de sus competencias

**Aliases conocidos:**
- `Impugnación de decisiones sociales`
- `Nulidad o Inexistencia de Decisiones`
- `Nulidad de decisiones sociales`
- `Impugnación de Actos de Asamblea`
- `Impugnación de actos sociales`
- `Impugnación de actas`
- `Nulidad de asamblea`
- `Nulidad absoluta de decisiones`
- `Inoponibilidad de decisiones`

**Criterios de inclusión:**
- La pretensión invoca nulidad (absoluta o relativa) de una decisión social
- Se discute inoponibilidad de la decisión
- Se alega que la decisión excede las facultades del órgano

**Criterios de exclusión:**
- Si el vicio es puramente formal (convocatoria, quórum) → AS.02
- Si la controversia central es el abuso del voto → AS.01
- Si se impugna el incumplimiento de un acuerdo parasocial → AS.09 o AS.14

**Mapeo Lexia v3.0:** → CT.SOC.05 (gobierno corporativo)
**Mapeo TX.SOC:** → TX.SOC.05.02 (quórum y mayorías), TX.SOC.15.01 (impugnación)

---

### AS.04 — disputas_societarias
**Label:** Disputas societarias
**Frecuencia:** 3.4%

**Definición:** Controversias generales entre socios o entre socios y la sociedad sobre el desarrollo del contrato social, los estatutos o la relación societaria. Categoría residual para conflictos que no encajan en tipos más específicos. Incluye: conflictos sobre administración de la sociedad, distribución de utilidades, derecho de inspección, rendición de cuentas.

**Base legal:** Art. 24 num. 5.d CGP

**Subtemas:**
- `conflicto_entre_socios` — Deadlock o conflicto personal entre socios
- `distribucion_utilidades` — Disputa sobre reparto de dividendos
- `derecho_inspeccion` — Restricción del derecho de inspección del socio
- `rendicion_cuentas` — Demanda de rendición de cuentas al administrador
- `exclusion_socio` — Procedimiento de exclusión de socio
- `retiro_socio` — Ejercicio del derecho de retiro

**Aliases conocidos:**
- `Disputas societarias`
- `Conflictos Societarios (Residual)`
- `Conflictos societarios`
- `Conflicto entre socios`
- `Controversia societaria`
- `Conflicto de Intereses` (cuando NO es Art. 23 Ley 222)

**Criterios de inclusión:**
- Conflicto derivado del contrato social o estatutos
- Controversia sobre derechos de socio que no tiene tipo específico

**Criterios de exclusión:**
- Si es sobre voto abusivo → AS.01
- Si es sobre una decisión social específica → AS.02 o AS.03
- Si es sobre cumplimiento de acuerdo parasocial → AS.09 o AS.14
- Si es sobre responsabilidad del administrador → AS.05

**Mapeo Lexia v3.0:** → CT.SOC.01, CT.SOC.03, CT.SOC.04, CT.SOC.09, CT.SOC.10
**Mapeo TX.SOC:** → TX.SOC.03 (socios/accionistas), TX.SOC.13 (utilidades)

---

### AS.05 — responsabilidad_administradores
**Label:** Responsabilidad de administradores
**Frecuencia:** 5.7%

**Definición:** Acción social de responsabilidad o acción individual contra administradores (directores, gerentes, representantes legales, liquidadores) por incumplimiento de deberes de diligencia, lealtad o no competencia. Incluye administradores de hecho.

**Base legal:** Art. 24 num. 5.b CGP, Arts. 22-25 Ley 222/1995, Art. 200 C.Co.

**Subtemas:**
- `accion_social_responsabilidad` — Acción de la sociedad contra el administrador (Art. 25 Ley 222)
- `accion_individual_responsabilidad` — Acción del socio individualmente perjudicado
- `conflicto_intereses` — Administrador actuó en situación de conflicto (Art. 23 num. 7)
- `usurpacion_oportunidad` — Administrador se apropió de oportunidad corporativa
- `apropiacion_activos` — Administrador dispuso indebidamente de activos
- `extralimitacion_funciones` — Administrador actuó fuera de sus facultades
- `administrador_de_hecho` — Persona que ejerce funciones sin nombramiento formal

**Aliases conocidos:**
- `Responsabilidad de administradores`
- `Responsabilidad de Administradores`
- `Responsabilidad Civil de Administradores`
- `Acción Social de Responsabilidad`
- `Acción social de responsabilidad`
- `Accion social de responsabilidad`
- `Responsabilidad de directores`
- `Responsabilidad del representante legal`
- `Art. 25 Ley 222`
- `Deberes fiduciarios de administradores`

**Criterios de inclusión:**
- La pretensión se dirige contra un administrador (persona natural) por daño derivado de sus funciones
- Se invocan los deberes del Art. 23 Ley 222/1995

**Criterios de exclusión:**
- Si la acción es contra la sociedad (no el administrador) → AS.04
- Si es sobre conflicto de intereses puro (Art. 23 num. 7) sin pretensión de condena → AS.12
- Si es responsabilidad de matriz/controlante → AS.13

**Mapeo Lexia v3.0:** → CT.SOC.06 (deber fiduciario), CT.SOC.10 (rendición de cuentas), S-COI, B6.05-B6.07
**Mapeo TX.SOC:** → TX.SOC.09 (administradores)

---

### AS.06 — desestimacion_personalidad_juridica
**Label:** Desestimación de la personalidad jurídica
**Frecuencia:** 1.1%

**Definición:** Acción para desconocer la separación patrimonial entre la sociedad y sus socios o controlantes, cuando la estructura societaria se ha utilizado en fraude a la ley o en perjuicio de terceros ("levantamiento del velo corporativo").

**Base legal:** Art. 42 Ley 1258/2008, Art. 24 num. 5.e CGP (por extensión jurisprudencial)

**Subtemas:**
- `fraude_ley` — Uso de la sociedad para eludir normas imperativas
- `perjuicio_terceros` — Uso de la sociedad en detrimento de acreedores o terceros
- `confusión_patrimonial` — Mezcla de patrimonios sociedad/socio
- `subcapitalización` — Sociedad sin recursos propios suficientes

**Aliases conocidos:**
- `Desestimación de la personalidad jurídica`
- `Desestimación de la Personalidad Jurídica`
- `Levantamiento del Velo Corporativo`
- `Levantamiento del velo corporativo`
- `Desestimación de personalidad`
- `Inoponibilidad de la personalidad jurídica`
- `Velo corporativo`
- `Art. 42 Ley 1258`

**Mapeo Lexia v3.0:** → Sin equivalente directo (tangencial a CT.SOC.06)
**Mapeo TX.SOC:** → TX.SOC.15.03 (levantamiento del velo)

---

### AS.07 — designacion_peritos
**Label:** Designación de peritos
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Solicitud de nombramiento de peritos para avalúo de acciones, cuotas o participaciones, típicamente en contexto de derecho de retiro o resolución de conflictos sobre valor.

**Base legal:** Art. 24 num. 3 CGP

**Subtemas:**
- `avaluo_acciones` — Avalúo para ejercicio de derecho de retiro
- `avaluo_cuotas` — Avalúo de cuotas en sociedad limitada
- `discrepancia_valor` — Peritos por discrepancia sobre valor de participaciones

**Aliases conocidos:**
- `Designación de peritos`
- `Nombramiento de peritos`
- `Avalúo de acciones`
- `Peritaje de acciones`

**Mapeo Lexia v3.0:** → CT.SOC.02 (valoración de participaciones)
**Mapeo TX.SOC:** → TX.SOC.03.01 (derecho de retiro)

---

### AS.08 — causales_disolucion
**Label:** Disputas sobre causales de disolución
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Controversias sobre si se ha configurado una causal de disolución, si fue enervada oportunamente, o si la sociedad debe ser liquidada.

**Base legal:** Art. 24 num. 4 CGP, Art. 218 C.Co., Art. 457 C.Co.

**Subtemas:**
- `perdidas_patrimonio` — Pérdidas que reducen patrimonio neto por debajo del 50%
- `imposibilidad_objeto` — Imposibilidad de desarrollar el objeto social
- `enervacion` — Disputa sobre si se enervó válidamente la causal
- `inactividad` — Sociedad que no ejerce actividad por tiempo prolongado

**Aliases conocidos:**
- `Disputas sobre causales de disolución`
- `Causales de disolución`
- `Disolución societaria`
- `Reconocimiento de causal de disolución`

**Mapeo Lexia v3.0:** → CT.SOC.07 (disolución y liquidación)
**Mapeo TX.SOC:** → TX.SOC.04.03 (causales de disolución)

---

### AS.09 — cumplimiento_acuerdos_accionistas
**Label:** Cumplimiento de acuerdos de accionistas
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Acción para exigir el cumplimiento específico de las obligaciones contenidas en un acuerdo de accionistas debidamente depositado ante la sociedad.

**Base legal:** Art. 24 num. 5.a CGP, Art. 70 Ley 222/1995

**Subtemas:**
- `acuerdos_voto` — Ejecución de compromisos sobre sentido del voto
- `drag_along` — Ejecución de derecho de arrastre
- `tag_along` — Ejecución de derecho de acompañamiento
- `restriccion_transferencia` — Cumplimiento de restricciones de enajenación
- `preferencia_pactada` — Derecho de preferencia convencional

**Aliases conocidos:**
- `Cumplimiento específico de acuerdos de accionistas`
- `Cumplimiento de acuerdos de accionistas`
- `Ejecución de acuerdos parasociales`
- `Acuerdo de accionistas`
- `Pacto parasocial`

**Mapeo Lexia v3.0:** → CT.SOC.01 (incumplimiento de acuerdo de accionistas)
**Mapeo TX.SOC:** → TX.SOC.03.02 (derecho de preferencia)

---

### AS.10 — responsabilidad_socios_liquidadores
**Label:** Responsabilidad de socios y liquidadores
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Acción para hacer efectiva la responsabilidad subsidiaria o solidaria de socios (en tipos societarios con responsabilidad ilimitada) o de liquidadores por actuaciones irregulares en la liquidación.

**Base legal:** Art. 24 num. 5.c CGP, Art. 36 Ley 1258/2008

**Subtemas:**
- `responsabilidad_subsidiaria` — Responsabilidad de socios por pasivos sociales
- `liquidacion_irregular` — Liquidador que incumple deberes legales
- `distribucion_irregular` — Adjudicación de bienes sin pagar pasivos

**Aliases conocidos:**
- `Responsabilidad de socios y liquidadores`
- `Responsabilidad de liquidadores`
- `Responsabilidad subsidiaria de socios`

**Mapeo Lexia v3.0:** → CT.SOC.07 (disolución y liquidación)
**Mapeo TX.SOC:** → TX.SOC.04.01 (liquidación voluntaria), TX.SOC.03.07 (responsabilidad de socios)

---

### AS.11 — oposicion_reactivacion
**Label:** Oposición a reactivación societaria
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Oposición formulada por acreedores o terceros frente a la decisión de una sociedad en liquidación de reactivarse.

**Base legal:** Art. 24 num. 6 CGP, Art. 29 Ley 1429/2010

**Subtemas:**
- `oposicion_acreedores` — Acreedor se opone por riesgo a su crédito
- `oposicion_terceros` — Tercero con interés legítimo se opone

**Aliases conocidos:**
- `Oposición a la reactivación de sociedades o sucursales`
- `Oposición a reactivación`
- `Reactivación societaria`

**Mapeo Lexia v3.0:** → Sin equivalente directo
**Mapeo TX.SOC:** → TX.SOC.04.04 (reactivación)

---

### AS.12 — conflicto_intereses_administradores
**Label:** Conflicto de intereses de administradores
**Frecuencia:** 0.0% (no observada en corpus actual — candidata a fusión con AS.05)

**Definición:** Acción específica por operaciones con vinculados o autocontratación realizadas sin la autorización previa del órgano competente. Diferente de AS.05 porque no necesariamente implica daño — basta la falta de autorización.

**Base legal:** Art. 23 num. 7 Ley 222/1995, Decreto 1925/2009

**Aliases conocidos:**
- `Conflicto de intereses de administradores`
- `Conflicto de Intereses` (cuando ES Art. 23 Ley 222)
- `Operaciones con vinculados`
- `Autocontratación sin autorización`

**Nota:** Si en la clasificación completa este tipo no supera 3 casos independientes, fusionar con AS.05 como subtema.

**Mapeo Lexia v3.0:** → S-COI
**Mapeo TX.SOC:** → TX.SOC.09.02 (incompatibilidades y prohibiciones)

---

### AS.13 — responsabilidad_matrices
**Label:** Responsabilidad de matrices y controlantes
**Frecuencia:** 0.0% (no observada en corpus actual)

**Definición:** Acción para hacer responsable a la sociedad matriz, controlante o grupo empresarial por obligaciones de la subordinada, cuando ha habido abuso de control o confusión patrimonial.

**Base legal:** Art. 61 Ley 1116/2006, Art. 265 C.Co.

**Aliases conocidos:**
- `Responsabilidad de Matrices / Grupos`
- `Responsabilidad de matrices`
- `Responsabilidad del controlante`
- `Abuso de control`
- `Responsabilidad de grupos`

**Mapeo Lexia v3.0:** → Sin equivalente directo
**Mapeo TX.SOC:** → TX.SOC.10 (grupos empresariales)

---

### AS.14 — ejecucion_pactos_parasociales
**Label:** Ejecución de pactos parasociales
**Frecuencia:** 0.0% (no observada en corpus actual — candidata a fusión con AS.09)

**Definición:** Acción para ejecutar obligaciones de pactos entre socios que no fueron depositados como acuerdo de accionistas. A diferencia de AS.09, estos pactos pueden no tener los efectos del Art. 70 Ley 222.

**Base legal:** Art. 70 Ley 222/1995, normas generales de contratos

**Nota:** Si en la clasificación completa no hay distinción práctica con AS.09, fusionar.

**Mapeo Lexia v3.0:** → CT.SOC.01
**Mapeo TX.SOC:** → TX.SOC.03.02

---

### AS.99 — requiere_revision_manual
**Label:** Requiere revisión manual
**Frecuencia:** 0.0%

**Definición:** Sentencia cuyo tipo de acción no pudo ser determinado automáticamente con confianza suficiente. Requiere clasificación manual.

**Aliases conocidos:**
- `Requiere Revisión Manual`
- `Otra`
- `No identificado`
- `N/A`
- (cualquier valor que no matchee ningún alias de AS.01–AS.14)

---

## MAPEO CRUZADO TRIPLE

### AS ↔ CT.SOC (Lexia arbitraje) ↔ TX.SOC (Conceptos SuperSoc)

| AS (Sentencias) | CT.SOC (Laudos) | TX.SOC (Conceptos) | Relación |
|-----------------|-----------------|---------------------|----------|
| AS.01 Abuso de voto | S-ABV | TX.SOC.03.09 | Mismo fenómeno, 3 fuentes |
| AS.02 Ineficacia | CT.SOC.05 + B6.05/06 | TX.SOC.05.01/02 | Gobierno corporativo formal |
| AS.03 Impugnación | CT.SOC.05 | TX.SOC.05.02 + TX.SOC.15.01 | Nulidad vs. ineficacia |
| AS.04 Disputas | CT.SOC.01/03/04/09/10 | TX.SOC.03/13 | Residual amplio |
| AS.05 Resp. admin. | CT.SOC.06 + S-COI | TX.SOC.09 | Deberes fiduciarios |
| AS.06 Velo corp. | — | TX.SOC.15.03 | Solo SuperSoc jurisdiccional |
| AS.07 Peritos | CT.SOC.02 | TX.SOC.03.01 | Valoración |
| AS.08 Disolución | CT.SOC.07 | TX.SOC.04 | Disolución |
| AS.09 Acuerdos acc. | CT.SOC.01 | TX.SOC.03.02 | Pactos parasociales |
| AS.10 Resp. socios | CT.SOC.07 | TX.SOC.04/03.07 | Liquidación |
| AS.13 Resp. matrices | — | TX.SOC.10 | Grupos |

---

## REGLAS DE DESAMBIGUACIÓN

| Situación | Clasificar como | No como |
|-----------|-----------------|---------|
| Pretensión principal = ineficacia por vicio formal + subsidiaria = abuso de voto | AS.02 (ineficacia) | AS.01 |
| Pretensión = nulidad absoluta por objeto ilícito | AS.03 (impugnación) | AS.02 |
| Administrador votó como accionista con abuso | AS.01 (abuso de voto) | AS.05 |
| Administrador contrató consigo mismo sin autorización | AS.12 (conflicto intereses) | AS.05 |
| Socio demanda rendición de cuentas al gerente | AS.04 (disputas) | AS.05 |
| Sociedad demanda al gerente por daño | AS.05 (resp. admin.) | AS.04 |
| Acuerdo de accionistas depositado + incumplimiento | AS.09 | AS.14 |
| Pacto entre socios NO depositado + incumplimiento | AS.14 | AS.09 |
| Ineficacia + se invoca además abuso (acumulación) | AS.02 (pretensión principal) | AS.01 |
| Demanda contra administrador POR abuso de voto | AS.01 (el fenómeno es voto) | AS.05 |

---

## IMPLEMENTACIÓN EN CÓDIGO

### Archivo: `src/lib/taxonomy.ts`

```typescript
export const ACTION_TYPE_CANONICAL: Record<string, {
  code: string;
  label: string;
  description: string;
  legalBasis: string[];
  subtopics: string[];
  aliases: string[];
}> = {
  'AS.01': {
    code: 'AS.01',
    label: 'Abuso del derecho de voto',
    // ... (como se define arriba)
    aliases: ['Abuso del derecho de voto', 'Abuso de mayoría', ...],
  },
  // ... todos los demás
};

// Alias → código canónico (invertido, case-insensitive)
export const ALIAS_MAP: Record<string, string> = {};
for (const [code, cat] of Object.entries(ACTION_TYPE_CANONICAL)) {
  ALIAS_MAP[cat.label.toLowerCase()] = code;
  for (const alias of cat.aliases) {
    ALIAS_MAP[alias.toLowerCase()] = code;
  }
}

export function canonicalize(raw: string): { code: string; label: string } {
  const key = raw.trim().toLowerCase();
  const code = ALIAS_MAP[key];
  if (code) {
    return { code, label: ACTION_TYPE_CANONICAL[code].label };
  }
  return { code: 'AS.99', label: 'Requiere revisión manual' };
}
```

### Migración de datos existentes

```sql
UPDATE "Case" SET "actionType" = 'Reconocimiento de presupuestos de ineficacia'
WHERE lower("actionType") IN ('ineficacia de decisiones sociales', 'ineficacia', 'declaratoria de ineficacia', 'presupuestos de ineficacia');

UPDATE "Case" SET "actionType" = 'Impugnación de decisiones sociales'
WHERE lower("actionType") IN ('nulidad o inexistencia de decisiones', 'nulidad de decisiones sociales', 'impugnación de actos de asamblea', 'nulidad de asamblea');

UPDATE "Case" SET "actionType" = 'Responsabilidad de administradores'
WHERE lower("actionType") IN ('responsabilidad de administradores', 'responsabilidad civil de administradores', 'acción social de responsabilidad', 'accion social de responsabilidad');

UPDATE "Case" SET "actionType" = 'Disputas societarias'
WHERE lower("actionType") IN ('conflictos societarios (residual)', 'conflictos societarios', 'conflicto entre socios', 'controversia societaria');

UPDATE "Case" SET "actionType" = 'Desestimación de la personalidad jurídica'
WHERE lower("actionType") IN ('desestimación de la personalidad jurídica', 'levantamiento del velo corporativo', 'velo corporativo');

-- Limpiar cache de jurisprudencia (keyed por actionType viejo)
DELETE FROM "JurisprudenceCache";
```

---

## HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-04-05 | Versión inicial — 15 tipos de acción, validada con 87 sentencias, aliases de 5 fuentes de ingesta |

---

## PRÓXIMOS PASOS

1. **Implementar `src/lib/taxonomy.ts`** en supersociedadesChatGPT
2. **Correr migración SQL** para normalizar actionTypes existentes
3. **Parchear las 4 rutas de ingesta** para usar `canonicalize()`
4. **Actualizar TaxonomyClient.tsx** para importar de taxonomy.ts
5. **Validar con corpus completo** — cuando haya 200+ sentencias, revisar frecuencias y evaluar fusiones (AS.12→AS.05, AS.14→AS.09)
6. **Añadir campo `action_type_code`** al schema Prisma (migración gradual)
