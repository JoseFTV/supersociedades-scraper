# Taxonomía Lexia v3.0 — Documento Canónico
## Fallas Jurídicas, Fallas Operacionales y Tipos de Controversia

**Versión:** 3.0
**Fecha:** 2026-04-05
**Estado:** Producción (series A, B5, B6, CT.SOC, CT.CON estabilizadas)
**Validada con:** 35 laudos (16 societarios, 13 infraestructura, 5 seguros, 1 comercial)
**Reemplaza:** taxonomia_fallas_v2.0.md, taxonomia_fallas_v2.1_update.md, taxonomia_controversias_v1.0.md, taxonomia_controversias_v1.1_update.md, decisiones de briefs sesiones 3 y 4

---

## CHANGELOG v2.x/v1.x → v3.0

### Códigos de fallas NUEVOS (creados en sesiones 2-4)
- A2.07: prueba_dano_insuficiente (antes A2.04b — renumerado para evitar conflicto con A2.04)
- A3.04: excepcion_impertinente (antes A3.03b — renumerado para evitar conflicto con A3.03)
- B5.09: entrega_tardia_predios (promovido de watchlist — validación de dominio)
- B6.05: gobierno_corporativo_deficiente
- B6.06: representacion_indebida_organo_social
- B6.07: abuso_derecho_voto

### Códigos de controversias NUEVOS (creados en sesiones 1-4)
- CT.GEN.14: Obligación condicional / condición suspensiva
- CT.GEN.15: Gastos precontractuales o de preparación
- CT.GEN.16: Deber de información precontractual
- CT.CON.13: Distribución de riesgos / imprevisión
- CT.CON.14: Mayor permanencia en obra
- CT.CON.15: Reclamaciones de terceros / subcontratistas
- CT.SOC.06a → S-COI: Conflicto de intereses de administradores (renombrado)
- S-ABV: Abuso del derecho de voto

### Códigos REDEFINIDOS
- CT.SOC.02: de `valoracion_acciones_o_participaciones` → `compraventa_y_valoracion_participaciones` (cubre M&A y compraventa inter-socios)

### Subcampos agregados
- A4.01: `timing_subtype` (prescripcion_extintiva, caducidad_impugnacion, caducidad_contractual, caducidad_administrativa, prescripcion_ordinaria_seguros, prescripcion_extraordinaria_seguros, otro)

### Campos enriquecidos por código (v3.0)
Cada código ahora puede incluir: `legal_basis[]`, `procedural_action`, `limitation_period`, `related_codes[]`, `sanction_type`, `mechanism`

### Corrección normativa
- La ineficacia SÍ caduca en 2 meses (STC14279-2025 Corte Suprema, M.P. Octavio Tejeiro Duque)

### Rechazados
- S-REG (efecto registro mercantil): solo 1 caso, subtipo de S-GOB
- CT.GEN.15b (coligación contractual): 1/13 laudos infra, cubierto por CT.GEN.03
- CT.GEN.16b (patrimonios autónomos): standby — capturar como campo `contract_structure` en schema
- B5.07-B5.10 propuestos por Cowork para infra (excepto B5.09): cubiertos por códigos existentes en combinación

---

## PRINCIPIOS DE DISEÑO

1. **Mutua exclusividad:** cada falla cae en exactamente 1 código
2. **Exhaustividad:** no debe quedar falla sin código
3. **Generalizable:** cada código funciona para cualquier tipo de arbitraje
4. **Auditable:** definición tan clara que dos analistas clasifiquen igual
5. **Accionable:** cada falla señala algo que alguien pudo haber hecho diferente
6. **Evidence-backed:** toda falla asignada debe incluir `evidence_quote`, `page_number`, `confidence`
7. **Regla de estabilización:** un código necesita aparecer en 3+ laudos independientes para justificar código propio

---

## CÓMO USAR ESTA TAXONOMÍA

El extractor de IA lee el laudo y produce:
1. **Fallas** (serie A + B): qué se hizo mal y quién lo hizo
2. **Controversias** (serie CT): qué se discutió

Cada falla asignada incluye: `failure_code`, `description`, `party_affected`, `is_focal_party_failure`, `severity`, `impact_on_outcome`, `evidence_quote`, `page_number`, `confidence`, `related_codes[]`

Cada controversia incluye: `code`, `description`, `confidence`

**No toda derrota es una falla.** Solo clasificar si el laudo describe o permite inferir razonablemente una deficiencia.

---

# PARTE I: FALLAS JURÍDICAS (SERIE A)

Errores o deficiencias en la estrategia legal, argumentación, manejo probatorio o cumplimiento procesal.

---

## A1. ARGUMENTACIÓN Y TEORÍA DEL CASO

### A1.01 — teoria_caso_inadecuada
**Label:** Teoría del caso inadecuada o desalineada
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** ~80% societario, 62% infra, presente en seguros y comercial

**Definición:** La estrategia procesal general no fue apropiada para el tipo de controversia, los hechos, o la normatividad aplicable. Incluye: enfoque defensivo/ofensivo contraproducente, pretensiones que por naturaleza jurídica no pueden prosperar en el contexto planteado, confusión sobre el tipo de acción procesal.

**Criterios de inclusión:**
- El tribunal señala que la tesis principal fue desacertada
- La parte alegó por una vía jurídica cuando otra era más apropiada
- Confundir obligación accesoria con principal para pedir resolución (comercial)
- Pedir nulidad cuando el vicio es ineficacia (societario)
- Confusión acción social vs individual (art. 25 Ley 222, societario)
- Fundar pretensiones en Ley 80 cuando el tribunal la declara inaplicable (infra/fiducia)

**Criterios de exclusión:**
- Tesis correcta pero faltó prueba → A2.xx
- Tesis correcta pero presentada tarde → A4.01
- Tribunal no acogió la tesis pero reconoce que era plausible → no es falla

### A1.02 — arg_contradictoria
**Label:** Argumentación contradictoria o inconsistente
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 15% infra

**Definición:** La parte presentó argumentos que se contradicen entre sí, o su argumentación contradice la prueba que ella misma aportó.

**Criterios de inclusión:**
- Contradicción explícita entre dos tesis de la misma parte
- Contradicción entre lo alegado y lo probado por la misma parte

**Criterios de exclusión:**
- Tesis alternativas o subsidiarias claramente planteadas como tales → no es falla

### A1.03 — arg_insustancial
**Label:** Argumentación jurídica débil o insuficiente
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** Fundamentos jurídicos superficiales, incompletos, o sin desarrollo adecuado de los elementos de la pretensión o excepción.

**Criterios de inclusión:**
- Tribunal dice que los argumentos carecen de sustento jurídico
- Alegaciones genéricas sin conexión con los hechos

**Criterios de exclusión:**
- Argumento sólido pero falta prueba → A2.xx
- Norma invocada inaplicable → A1.04

### A1.04 — norma_inaplicable
**Label:** Norma o jurisprudencia invocada inaplicable
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** La parte invocó normas, doctrina o jurisprudencia que no regulan el supuesto de hecho del caso, o que fueron derogadas/modificadas.

**Criterios de exclusión:**
- Norma aplica pero interpretación diferente → A1.05

### A1.05 — interpretacion_contractual_perdida
**Label:** Controversia interpretativa perdida
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 54% infra

**Definición:** El tribunal adoptó la interpretación contractual o normativa de la contraparte. Aplica a controversias contractuales, de póliza, de reglamento, otrosíes, modificaciones.

**Criterios de exclusión:**
- No hubo controversia interpretativa → no es falla
- Clausulado genuinamente ambiguo → combinar con B2.01

### A1.06 — falta_subsidiariedad
**Label:** Ausencia de tesis subsidiarias o alternativas
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** No se plantearon pretensiones o excepciones subsidiarias que habrían protegido en caso de fracasar la tesis principal.

---

## A2. PRUEBA

### A2.01 — prueba_no_aportada
**Label:** Prueba crítica no aportada al proceso
**Severity:** critical | **Applicable_to:** [todas]
**Frecuencia observada:** 31% infra

**Definición:** Un documento, dictamen, testimonio u otro medio de prueba esencial NO fue allegado al proceso. El tribunal lo señala como determinante.

**Criterios de exclusión:**
- Prueba aportada pero insuficiente → A2.02
- Prueba rechazada por extemporánea → A2.03
- Prueba no existía (no se generó) → evaluar B3.01

### A2.02 — prueba_insuficiente
**Label:** Prueba insuficiente para soportar la pretensión o excepción
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 23% infra

**Definición:** Hay prueba pero es insuficiente para soportar la pretensión o excepción. Diferente de A2.01 donde la prueba no existe.

### A2.03 — prueba_extemporanea
**Label:** Prueba aportada fuera de la oportunidad procesal
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** Prueba rechazada por extemporánea o por no cumplir requisitos formales.

### A2.04 — carga_probatoria_incumplida
**Label:** Incumplimiento de carga de la prueba
**Severity:** critical | **Applicable_to:** [todas]

**Definición:** El tribunal determina que la parte no satisfizo su carga probatoria respecto a un hecho que le correspondía demostrar. El tribunal invoca formalmente la regla de carga probatoria (art. 167 CGP).

**Criterios de exclusión:**
- Prueba existe pero es insuficiente → A2.02
- Discusión sobre distribución dinámica de la carga → evaluar caso por caso

### A2.05 — pericia_mal_manejada
**Label:** Dictamen pericial mal objetado o mal contrastado
**Severity:** high | **Applicable_to:** [todas]

**Definición:** No se objetó eficazmente un dictamen pericial adverso, o no se aportó contra-dictamen cuando era necesario.

**Nota analytics:** has_counter_expert = false correlaciona con condena en 100% de la muestra.

### A2.06 — prueba_tecnica_ausente
**Label:** Prueba técnica o pericial necesaria no aportada
**Severity:** high | **Applicable_to:** [construcción, concesiones, energía, seguros, salud]

**Definición:** En controversia que requería demostración técnica, la parte no aportó dictamen pericial o prueba técnica.

**Criterios de exclusión:**
- Dictamen aportado pero insuficiente → A2.05 o A2.02

### A2.07 — prueba_dano_insuficiente ⭐ NUEVO v3.0
**Label:** Prueba de daño insuficiente (quantum no probado)
**Severity:** critical | **Applicable_to:** [todas]
**Frecuencia observada:** ~50% societario, presente en seguros
**Antes:** A2.04b (renumerado para evitar conflicto con A2.04)

**Definición:** Se probó la conducta ilícita o el incumplimiento, pero NO se probó el quantum del daño → $0 indemnización. Genera victorias pyrrhicas: ganar en lo declarativo pero perder en lo económico.

**Criterios de inclusión:**
- Tribunal declara el incumplimiento/ilegalidad pero niega indemnización por falta de prueba del daño
- "Se acreditó la conducta pero no se demostró el perjuicio"
- Nulidad declarada pero $0 concedido (patrón CSS Constructores)
- Reclamación sin facturas/soportes que acrediten quantum (patrón Fidubogotá)

**Criterios de exclusión:**
- Si no se probó la conducta ilícita → A2.04
- Si se probó el daño pero en monto menor → A4.02

**Related_codes:** A4.02 (frecuentemente concurren)

---

## A3. EXCEPCIONES Y DEFENSAS

### A3.01 — excepcion_improcedente
**Label:** Excepción de mérito improcedente o mal configurada
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 38% infra

**Definición:** La excepción no aplicaba al caso, estaba mal configurada jurídicamente, o sus elementos no correspondían a los hechos.

**Criterios de exclusión:**
- Excepción bien planteada pero mal probada → A3.02
- Excepción simplemente no prosperó por mérito → no es falla

### A3.02 — excepcion_mal_probada
**Label:** Excepción bien planteada pero sin soporte probatorio suficiente
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 15% infra, patrón fuerte en entidades públicas (75% excepciones no probadas)

**Definición:** Excepción jurídicamente válida y pertinente, pero sin prueba suficiente para acreditarla.

### A3.03 — clausula_no_vinculada
**Label:** Cláusula contractual relevante no vinculada a la defensa
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** Existía cláusula contractual que habría fortalecido la defensa, pero la parte no la invocó o no la conectó con su tesis.

### A3.04 — excepcion_impertinente ⭐ NUEVO v3.0
**Label:** Excepción impertinente al debate
**Severity:** medium | **Applicable_to:** [todas]
**Antes:** A3.03b (renumerado para evitar conflicto con A3.03)

**Definición:** Excepción que no guarda relación con las pretensiones ni con el debate probatorio. Diferente de A3.01 (mal configurada) — aquí la excepción ni siquiera toca el tema en discusión.

**Criterios de inclusión:**
- Saturación de excepciones impertinentes (patrón: 22 excepciones = 21 negadas en Mejía)
- Excepciones que no tocan el debate real

---

## A4. ASPECTOS PROCEDIMENTALES

### A4.01 — termino_vencido
**Label:** Incumplimiento de término procesal (prescripción/caducidad)
**Severity:** medium (pero impacto económico puede ser critical)
**Applicable_to:** [todas]
**Frecuencia observada:** recurrente en 3/5 laudos societarios, falla MÁS COSTOSA del corpus

**Definición:** Prescripción, caducidad u otro término procesal venció por mala gestión temporal.

**Subcampo `timing_subtype`:**
- `prescripcion_extintiva`: prescripción general
- `caducidad_impugnacion`: caducidad de 2 meses para impugnación de decisiones de asamblea/junta (aplica a NULIDAD e INEFICACIA — STC14279-2025)
- `caducidad_contractual`: plazo contractual vencido
- `caducidad_administrativa`: caducidad administrativa (2 años)
- `prescripcion_ordinaria_seguros`: 2 años desde conocimiento del siniestro (art. 1081 C.Co.)
- `prescripcion_extraordinaria_seguros`: 5 años desde hecho base de la acción (art. 1081 C.Co.)
- `otro`

### A4.02 — error_cuantificacion
**Label:** Error en cuantificación de pretensiones o perjuicios
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 54% infra (empatada con A1.05 como segunda más frecuente)

**Definición:** Errores en la cuantificación de pretensiones, perjuicios, o cálculos financieros que resultaron en reducción significativa del monto concedido.

### A4.03 — recurso_mal_planteado
**Label:** Recurso de impugnación mal fundamentado
**Severity:** low | **Applicable_to:** [todas]

**Definición:** Recurso de anulación u otro medio de impugnación mal fundamentado.

---

# PARTE II: FALLAS OPERACIONALES (SERIE B)

Deficiencias en procesos de negocio, documentación, gestión contractual y decisiones operativas que debilitaron la posición en el arbitraje.

---

## B1. DOCUMENTACIÓN Y REGISTRO

### B1.01 — expediente_contractual_incompleto
**Label:** Expediente contractual incompleto
**Severity:** critical | **Applicable_to:** [todas]

**Definición:** Documentos clave del contrato, póliza, o relación no obran en el expediente.

### B1.02 — decisiones_sin_registro
**Label:** Decisiones internas sin documentación
**Severity:** high | **Applicable_to:** [todas]

**Definición:** Decisiones internas relevantes no documentadas formalmente.

### B1.03 — bitacora_actas_deficientes
**Label:** Bitácora, actas o registros operativos deficientes
**Severity:** high | **Applicable_to:** [todas]
**Frecuencia observada:** 15% infra

**Definición:** Registros operativos (bitácora de obra, actas de inspección, informes de siniestro, seguimiento) con vacíos.

---

## B2. CLAUSULADO Y CONTRATOS

### B2.01 — clausulado_ambiguo
**Label:** Clausulado ambiguo
**Severity:** high | **Applicable_to:** [todas]

**Definición:** Cláusulas redactadas de forma ambigua, interpretadas contra la parte que las redactó. En seguros: interpretatio contra stipulatorem.

### B2.02 — clausula_proteccion_ausente
**Label:** Cláusula de protección ausente
**Severity:** high | **Applicable_to:** [todas]

**Definición:** Falta cláusula que habría protegido a la parte (exclusión faltante, sublímite, limitación de responsabilidad).

### B2.03 — clausula_inadecuada_riesgo
**Label:** Cláusula inadecuada para el riesgo
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** La cláusula existe pero no es adecuada para el riesgo específico.

---

## B3. GESTIÓN OPERACIONAL

### B3.01 — investigacion_evento_insuficiente
**Label:** Investigación del evento insuficiente
**Severity:** high | **Applicable_to:** [todas]

**Definición:** Investigación del evento (siniestro, incumplimiento, daño) superficial o incompleta.

### B3.02 — demora_gestion
**Label:** Demora en gestión o respuesta
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** Demoras internas significativas que agravaron la controversia o debilitaron la posición.

### B3.03 — evaluacion_riesgo_deficiente
**Label:** Evaluación de riesgo o due diligence insuficiente
**Severity:** high | **Applicable_to:** [seguros, financiero, construcción]
**Frecuencia observada:** 15% infra

**Definición:** Evaluación inadecuada del riesgo al momento de suscripción, contratación o renovación.

### B3.04 — falta_coordinacion_areas
**Label:** Falta de coordinación entre áreas internas
**Severity:** medium | **Applicable_to:** [todas]

**Definición:** Desconexión entre áreas internas (legal, operaciones, técnica, comercial, siniestros).

### B3.05 — proceso_interno_deficiente
**Label:** Proceso de negocio con deficiencias sistémicas
**Severity:** high | **Applicable_to:** [todas]

**Definición:** Debilidad estructural en un proceso interno que genera riesgo recurrente — no un error puntual sino un patrón.

---

## B4. MÓDULO SECTORIAL: SEGUROS

Fallas específicas del negocio asegurador. Solo aplican cuando la parte focal es una aseguradora.

### B4.01 — reticencia_no_detectada
**Label:** Reticencia del asegurado no detectada en suscripción
**Severity:** high | **Applicable_to:** [seguros]

**Definición:** El asegurado/tomador no declaró información material y la aseguradora no lo detectó.

### B4.02 — reticencia_mal_gestionada
**Label:** Reticencia detectada pero mal documentada o gestionada
**Severity:** high | **Applicable_to:** [seguros]

**Definición:** Se identificó posible reticencia pero la aseguradora no la documentó adecuadamente, no la invocó oportunamente, o la gestión fue deficiente.

### B4.03 — emision_erronea
**Label:** Error en emisión de póliza o endoso
**Severity:** medium | **Applicable_to:** [seguros]

**Definición:** Errores materiales en emisión de póliza, anexos, endosos o condiciones. Incluye modificaciones consensuales no formalizadas con endoso.

### B4.04 — reservas_inadecuadas
**Label:** Reservas técnicas mal calculadas o no documentadas
**Severity:** medium | **Applicable_to:** [seguros]

**Definición:** Reservas técnicas mal calculadas, no documentadas o no trazables.

---

## B5. MÓDULO SECTORIAL: CONSTRUCCIÓN / CONCESIONES

Fallas específicas de contratos de construcción, obra e infraestructura.
**Estado:** ESTABILIZADO con 13 laudos.

### B5.01 — gestion_cambios_deficiente
**Label:** Gestión de cambios, mayores cantidades u obras adicionales deficiente
**Severity:** high | **Applicable_to:** [construcción, concesiones]
**Frecuencia observada:** 38% infra

**Definición:** Cambios al alcance, mayores cantidades u obras adicionales no formalizados, documentados o aprobados según procedimiento contractual.

### B5.02 — actas_recibo_deficientes
**Label:** Actas de recibo, entrega o liquidación deficientes
**Severity:** medium | **Applicable_to:** [construcción, concesiones]

**Definición:** Actas de recibo parcial/final, entrega, o liquidación bilateral con vacíos.

### B5.03 — interventoria_debil
**Label:** Interventoría o supervisión contractual débil
**Severity:** medium | **Applicable_to:** [construcción, concesiones]
**Frecuencia observada:** 31% infra

**Definición:** Interventoría o supervisión del contrato deficiente.

### B5.09 — entrega_tardia_predios ⭐ NUEVO v3.0
**Label:** Entrega tardía de predios, áreas o sitios de trabajo
**Severity:** high | **Applicable_to:** [construcción, concesiones]
**Promovido de watchlist:** validación de dominio + 2/13 laudos infra

**Definición:** La entidad contratante no entregó oportunamente los predios, áreas, servidumbres o sitios de trabajo necesarios para la ejecución del contrato, generando retrasos y sobrecostos al contratista.

**Criterios de inclusión:**
- Entrega tardía de predios para obra
- Falta de gestión predial (licencias, servidumbres, accesos)
- Demora en liberación de áreas de intervención
- Tribunal reconoce que la demora no es imputable al contratista

---

## B6. MÓDULO SECTORIAL: SOCIETARIO ⭐ NUEVO v3.0

Fallas operacionales específicas de conflictos societarios y gobierno corporativo.
**Estado:** ESTABILIZADO con 16 laudos (10 consecutivos sin código nuevo).

### B6.05 — gobierno_corporativo_deficiente
**Label:** Incumplimiento de normas de gobierno corporativo
**Severity:** high | **Applicable_to:** [societario]

**Definición:** Incumplimiento de normas estatutarias o legales en la administración del órgano societario. Incluye: convocatorias defectuosas, quórum irregular, actas inexistentes o deficientes, decisiones sin los votos requeridos.

**Legal_basis:** Arts. 23 Ley 222/1995, arts. 186/190/191/192/897/899 C.Co., art. 27 Ley 1258/2008.
**Sanction_type:** En S.A.: ineficacia (arts. 427, 433 C.Co.). En Ltda. y demás: nulidad.

### B6.06 — representacion_indebida_organo_social
**Label:** Representación indebida en órgano social
**Severity:** critical | **Applicable_to:** [societario]

**Definición:** Personas sin poder válido actuando en órganos sociales. Quórum aparente ≠ quórum real. Incluye: poderes vencidos, representación de sucesiones sin legitimación, mandatos sin facultades suficientes.

**Legal_basis:** Art. 184 C.Co.
**Mechanism:** quorum_aparente (el mecanismo del vicio, no la consecuencia jurídica)

### B6.07 — abuso_derecho_voto
**Label:** Abuso del derecho de voto por accionista mayoritario
**Severity:** critical | **Applicable_to:** [societario]

**Definición:** Accionista mayoritario usa el voto en beneficio propio y en perjuicio de la sociedad o de los minoritarios. Requiere prueba de estándar dual: elemento objetivo (perjuicio) + subjetivo (intención de dañar o beneficiarse).

**Legal_basis:** Art. 43 Ley 1258/2008, art. 830 C.Co.
**Nota analytics:** S-ABV como pretensión del demandante: 3/3 demandantes PERDIERON en el corpus. Estándar probatorio casi imposible de superar.
**Related_codes:** B6.05, S-COI (cuando mayoritario es también administrador)

---

## C. DIMENSIONES DE ANÁLISIS

Dimensiones transversales para clasificar cada falla. No son fallas en sí.

### C1. Impacto en outcome
`determino_derrota` | `contribuyo_derrota` | `debilito_posicion` | `elevo_monto` | `sin_impacto_claro`

### C2. Nivel causal
`sintoma` | `causa_proxima` | `causa_raiz`

### C3. Área responsable
`apoderado_externo` | `juridico_interno` | `area_tecnica` | `area_comercial` | `suscripcion` | `siniestros` | `emision` | `gerencia_proyecto` | `alta_direccion` | `contraparte` | `multiple` | `indeterminada`

### C4. Severity
`critical` (explica derrota por sí sola) | `high` (contribuyó significativamente) | `medium` (debilitó posición) | `low` (menor, sin impacto claro)

---

# PARTE III: TIPOS DE CONTROVERSIA (SERIE CT)

Clasificación de QUÉ se discutió en el laudo. Separada de fallas (qué se hizo mal).
Cada laudo recibe 1 controversia principal + 0-3 secundarias.

---

## CT.GEN — CONTROVERSIAS GENERALES

Aplican a cualquier tipo de contrato o relación.

| Código | Label | Definición |
|--------|-------|------------|
| CT.GEN.01 | Incumplimiento contractual | Una parte alega que la otra no cumplió obligaciones contractuales |
| CT.GEN.02 | Terminación contractual | Disputa sobre validez, causas o efectos de la terminación del contrato |
| CT.GEN.03 | Interpretación contractual | Las partes discrepan sobre significado o alcance de cláusulas |
| CT.GEN.04 | Nulidad contractual | Se alega nulidad absoluta o relativa del contrato o cláusula |
| CT.GEN.05 | Resolución contractual | Solicitud de resolución por incumplimiento (art. 1546 CC) |
| CT.GEN.06 | Indemnización de perjuicios | Disputa sobre existencia, tipo o cuantificación de daños |
| CT.GEN.07 | Cláusula penal o multa | Aplicación, validez o reducción de cláusula penal |
| CT.GEN.08 | Prescripción o caducidad | Disputa sobre si la acción prescribió o caducó |
| CT.GEN.09 | Liquidación del contrato | Disputa sobre liquidación bilateral o judicial |
| CT.GEN.10 | Competencia del tribunal | Objeción a la competencia del tribunal arbitral |
| CT.GEN.11 | Responsabilidad civil extracontractual | Responsabilidad por fuera de la relación contractual |
| CT.GEN.12 | Enriquecimiento sin causa | Restitución por enriquecimiento injustificado |
| CT.GEN.13 | Cesión contractual o de derechos | Validez o efectos de cesión de contrato o posición contractual |
| CT.GEN.14 | Obligación condicional / condición suspensiva | Disputa sobre si las obligaciones nacieron o son exigibles |
| CT.GEN.15 | Gastos precontractuales | Reclamo de gastos incurridos en preparación de contrato frustrado |
| CT.GEN.16 | Deber de información precontractual | Calidad o veracidad de información en etapa precontractual |

**Frecuencia observada (infra, 13 laudos):** CT.GEN.01 = 100%, CT.GEN.03 = 69%, CT.GEN.06 = 62%, CT.GEN.09 = 31%

---

## CT.CON — CONSTRUCCIÓN / INFRAESTRUCTURA / CONCESIONES

| Código | Label | Definición |
|--------|-------|------------|
| CT.CON.01 | Calidad de obra o defectos | Calidad de la obra, defectos constructivos o vicios ocultos |
| CT.CON.02 | Retraso en obra o extensión de plazo | Retrasos, causas del retraso, derecho a extensión de plazo |
| CT.CON.03 | Mayores cantidades de obra | Cantidades ejecutadas en exceso del presupuesto original |
| CT.CON.04 | Obras adicionales o extra-contractuales | Obras no previstas en el contrato original |
| CT.CON.05 | Equilibrio económico del contrato | Restablecimiento del equilibrio económico |
| CT.CON.06 | Diseño defectuoso o incompleto | Errores en diseños, planos o especificaciones técnicas |
| CT.CON.07 | Estabilidad de obra | Estabilidad o durabilidad post-entrega |
| CT.CON.08 | Interventoría o supervisión | Desempeño o responsabilidad del interventor |
| CT.CON.09 | Acta de recibo o entrega | Aceptación, recibo parcial/final, o entrega de la obra |
| CT.CON.10 | Reversión de bienes (concesiones) | Condiciones de reversión al fin de la concesión |
| CT.CON.11 | Modificaciones unilaterales (ius variandi) | Modificaciones impuestas unilateralmente por la entidad |
| CT.CON.12 | Anticipo o financiación del contrato | Manejo, amortización o devolución del anticipo |
| CT.CON.13 | Distribución de riesgos / imprevisión | Quién asume riesgos, imprevisión, fuerza mayor |
| CT.CON.14 | Mayor permanencia en obra | Sobrecostos por permanencia más allá del plazo previsto |
| CT.CON.15 | Reclamaciones de terceros / subcontratistas | Traslado de reclamos de subcontratistas al contratante |

**Frecuencia observada (13 laudos):** CT.CON.05 = 77%, CT.CON.02 = 31%, CT.CON.14 = 23%, CT.CON.01 = 23%

---

## CT.SEG — SEGUROS

| Código | Label | Definición |
|--------|-------|------------|
| CT.SEG.01 | Cobertura del seguro | Disputa sobre si el siniestro está cubierto por la póliza |
| CT.SEG.02 | Exclusión de cobertura | Aseguradora invoca exclusión para negar el reclamo |
| CT.SEG.03 | Cuantía de la indemnización | Discrepancia sobre monto a indemnizar |
| CT.SEG.04 | Reticencia o inexactitud en la declaración | Asegurado no declaró información material |
| CT.SEG.05 | Subrogación | Derecho de subrogación de la aseguradora |
| CT.SEG.06 | Prescripción de la acción de seguro | Prescripción bajo art. 1081 C.Co. |
| CT.SEG.07 | Agravación del riesgo | Agravación del estado del riesgo durante vigencia |
| CT.SEG.08 | Deber de información o buena fe | Deber de información precontractual o contractual |
| CT.SEG.09 | Llamamiento en garantía | Aseguradora llamada en garantía por asegurado demandado |

**Frecuencia observada (5 laudos):** CT.SEG.01 = 100% (como primaria), CT.SEG.03 = 80% (como secundaria)

---

## CT.SOC — SOCIETARIO / ASOCIATIVO

| Código | Label | Definición |
|--------|-------|------------|
| CT.SOC.01 | Incumplimiento del acuerdo de accionistas | Violación de pactos de accionistas, parasociales o estatutos |
| CT.SOC.02 | Compraventa y valoración de participaciones | Disputa sobre compraventa, intercambio o valoración de acciones/cuotas, incluyendo due diligence, R&W, pasivos ocultos, precio irrisorio, y desequilibrio en negociación inter-socios ⭐ REDEFINIDO v3.0 |
| CT.SOC.03 | Exclusión o retiro de socio | Exclusión forzosa o retiro voluntario y sus condiciones |
| CT.SOC.04 | Distribución de utilidades o dividendos | Reparto de utilidades/dividendos o decisión de no repartir |
| CT.SOC.05 | Gobierno corporativo | Decisiones de asamblea, junta directiva, administración |
| CT.SOC.06 | Deber fiduciario o lealtad | Incumplimiento de deberes fiduciarios |
| CT.SOC.07 | Disolución y liquidación de sociedad | Procedencia, proceso o resultados de disolución/liquidación |
| CT.SOC.08 | Derecho de preferencia o primera opción | Vulneración del derecho de preferencia en transferencias |
| CT.SOC.09 | Conflicto entre socios (deadlock) | Parálisis societaria por desacuerdo insalvable |
| CT.SOC.10 | Rendición de cuentas | Reclamo de rendición de cuentas de gestor/administrador |
| CT.SOC.11 | Cuentas en participación | Disputa sobre contrato de cuentas en participación |
| S-COI | Conflicto de intereses de administradores | Operaciones con vinculados, autocontratación sin autorización del órgano competente. Art. 23 num. 7 Ley 222/1995, Decreto 1925/2009. ⭐ NUEVO v3.0 |
| S-ABV | Abuso del derecho de voto | Accionista mayoritario usa voto en beneficio propio. Art. 43 Ley 1258/2008. ⭐ NUEVO v3.0 |

**Concurrencia:** S-COI + S-ABV concurren cuando el mayoritario es también administrador. Implementar `related_codes[]`.

---

## CT.COM — COMERCIAL / DISTRIBUCIÓN

| Código | Label | Definición |
|--------|-------|------------|
| CT.COM.01 | Terminación de agencia comercial | Terminación, causas justas, preaviso, indemnización |
| CT.COM.02 | Cesantía comercial o indemnización por clientela | Indemnización por terminación de relación comercial |
| CT.COM.03 | Exclusividad territorial o de producto | Alcance o violación de pactos de exclusividad |
| CT.COM.04 | Incumplimiento de suministro | Calidad, cantidad, oportunidad del suministro |
| CT.COM.05 | Competencia desleal o no competencia | Competencia desleal o cláusula de no competencia |

---

## CT.FID — FIDUCIA / FINANCIERO

| Código | Label | Definición |
|--------|-------|------------|
| CT.FID.01 | Gestión del patrimonio autónomo | Administración del fideicomiso por la fiduciaria |
| CT.FID.02 | Instrucciones del fideicomitente | Cumplimiento o alcance de instrucciones |
| CT.FID.03 | Rendición de cuentas fiduciaria | Rendición de cuentas, informes, transparencia |
| CT.FID.04 | Ejecución de garantías | Procedencia o forma de ejecución de garantías |
| CT.FID.05 | Responsabilidad del fiduciario | Responsabilidad civil de la fiduciaria |

---

## CT.ENE — ENERGÍA / OIL & GAS / MINERÍA

| Código | Label | Definición |
|--------|-------|------------|
| CT.ENE.01 | Regalías o participaciones | Cálculo, pago o distribución de regalías |
| CT.ENE.02 | Exploración y explotación | Obligaciones de exploración o explotación |
| CT.ENE.03 | Transporte de hidrocarburos/gas | Contratos de transporte, acceso a infraestructura |
| CT.ENE.04 | Regulatorio o tarifario | Regulación sectorial, tarifas, cambios regulatorios |

---

## CT.TEL — TELECOMUNICACIONES / TECNOLOGÍA

| Código | Label | Definición |
|--------|-------|------------|
| CT.TEL.01 | Interconexión o acceso | Acceso o interconexión de redes |
| CT.TEL.02 | Licencias o permisos | Licencias de uso, software, permisos |
| CT.TEL.03 | Nivel de servicio (SLA) | Cumplimiento de niveles de servicio |

---

## CT.SAL — SALUD

| Código | Label | Definición |
|--------|-------|------------|
| CT.SAL.01 | Prestación de servicios de salud | Calidad, cobertura, o pago de servicios |
| CT.SAL.02 | Responsabilidad médica | Responsabilidad por acto médico |
| CT.SAL.03 | Contratos con EPS/IPS | Relaciones contractuales del sistema de salud |

---

## CT.INM — INMOBILIARIO / ARRENDAMIENTO

| Código | Label | Definición |
|--------|-------|------------|
| CT.INM.01 | Incumplimiento de promesa de compraventa | Cumplimiento o resolución de promesa de inmueble |
| CT.INM.02 | Arrendamiento comercial | Renovación, terminación, canon, mejoras |
| CT.INM.03 | Propiedad horizontal | Disputas dentro del régimen de P.H. |
| CT.INM.04 | Vicios ocultos en inmueble | Defectos no aparentes en inmueble |

---

# PARTE IV: ÍNDICE RÁPIDO Y CONTEO

## Fallas Jurídicas (Serie A): 20 códigos

| Código | Label | Severity |
|--------|-------|----------|
| A1.01 | Teoría del caso inadecuada | high |
| A1.02 | Argumentación contradictoria | high |
| A1.03 | Argumentación insustancial | medium |
| A1.04 | Norma inaplicable | medium |
| A1.05 | Interpretación contractual perdida | high |
| A1.06 | Falta de subsidiariedad | medium |
| A2.01 | Prueba crítica no aportada | critical |
| A2.02 | Prueba insuficiente | high |
| A2.03 | Prueba extemporánea | medium |
| A2.04 | Carga probatoria incumplida | critical |
| A2.05 | Pericia mal manejada | high |
| A2.06 | Prueba técnica ausente | high |
| A2.07 | Prueba de daño insuficiente ⭐ | critical |
| A3.01 | Excepción improcedente | high |
| A3.02 | Excepción mal probada | high |
| A3.03 | Cláusula no vinculada a defensa | medium |
| A3.04 | Excepción impertinente ⭐ | medium |
| A4.01 | Término vencido (con timing_subtype) | medium |
| A4.02 | Error en cuantificación | high |
| A4.03 | Recurso mal planteado | low |

## Fallas Operacionales (Serie B): 22 códigos

| Código | Label | Severity | Vertical |
|--------|-------|----------|----------|
| B1.01 | Expediente contractual incompleto | critical | todas |
| B1.02 | Decisiones sin registro | high | todas |
| B1.03 | Bitácora/actas deficientes | high | todas |
| B2.01 | Clausulado ambiguo | high | todas |
| B2.02 | Cláusula de protección ausente | high | todas |
| B2.03 | Cláusula inadecuada para el riesgo | medium | todas |
| B3.01 | Investigación del evento insuficiente | high | todas |
| B3.02 | Demora en gestión | medium | todas |
| B3.03 | Evaluación de riesgo deficiente | high | seguros, financiero, construcción |
| B3.04 | Falta de coordinación entre áreas | medium | todas |
| B3.05 | Proceso interno deficiente | high | todas |
| B4.01 | Reticencia no detectada | high | seguros |
| B4.02 | Reticencia mal gestionada | high | seguros |
| B4.03 | Error en emisión de póliza | medium | seguros |
| B4.04 | Reservas inadecuadas | medium | seguros |
| B5.01 | Gestión de cambios deficiente | high | construcción, concesiones |
| B5.02 | Actas de recibo deficientes | medium | construcción, concesiones |
| B5.03 | Interventoría débil | medium | construcción, concesiones |
| B5.09 | Entrega tardía de predios ⭐ | high | construcción, concesiones |
| B6.05 | Gobierno corporativo deficiente ⭐ | high | societario |
| B6.06 | Representación indebida órgano social ⭐ | critical | societario |
| B6.07 | Abuso del derecho de voto ⭐ | critical | societario |

## Controversias (Serie CT): 82 códigos

| Vertical | Rango | Total |
|----------|-------|-------|
| General (GEN) | CT.GEN.01-16 | 16 |
| Construcción (CON) | CT.CON.01-15 | 15 |
| Seguros (SEG) | CT.SEG.01-09 | 9 |
| Societario (SOC) | CT.SOC.01-11, S-COI, S-ABV | 13 |
| Comercial (COM) | CT.COM.01-05 | 5 |
| Fiducia (FID) | CT.FID.01-05 | 5 |
| Energía (ENE) | CT.ENE.01-04 | 4 |
| Telecom (TEL) | CT.TEL.01-03 | 3 |
| Salud (SAL) | CT.SAL.01-03 | 3 |
| Inmobiliario (INM) | CT.INM.01-04 | 4 |
| **TOTAL** | | **82** |

**GRAN TOTAL: 20 fallas jurídicas + 22 fallas operacionales + 82 controversias = 124 códigos**

---

# PARTE V: ESTADO DE ESTABILIZACIÓN

| Serie | Laudos validados | Consecutivos sin código nuevo | Estado |
|-------|-----------------|------------------------------|--------|
| Serie A (fallas jurídicas) | 35 | 19 | ✅ PRODUCCIÓN |
| Serie B5 (construcción) | 13 | 9 | ✅ PRODUCCIÓN |
| Serie B6 (societario) | 16 | 10 | ✅ PRODUCCIÓN |
| CT.SOC (controversias soc.) | 16 | 10 | ✅ PRODUCCIÓN |
| CT.CON (controversias infra) | 13 | 9 | ✅ PRODUCCIÓN |
| Serie B4 (seguros) | 5 | 5 (pero solo 3 usables) | ⏳ NECESITA MÁS DATA |
| CT.SEG (controversias seg.) | 5 | 5 | ⏳ NECESITA MÁS DATA |
| CT.COM, CT.FID, CT.ENE, etc. | 1 | — | ⏳ NO VALIDADO |

## Watchlist activa

| Candidato | Frecuencia | Umbral | Acción |
|-----------|-----------|--------|--------|
| B4.05: Modificación consensual sin endoso | 1/5 seguros | 3+ | Monitorear |
| CT.SEG.10: Fecha conocimiento claims made | 1/5 seguros | 3+ | Monitorear |
| CT.CON.19: Tarifas y regulación servicios públicos | 1/13 infra | 3+ | Monitorear |
| CT.GEN.16b: Patrimonios autónomos (standby) | 2/13 infra | 3+ | Capturar como campo schema |

---

*Este documento es la fuente de verdad única de la taxonomía Lexia. Todos los prompts de extracción, esquemas de datos y validadores deben referenciar este archivo. Versión actual: v3.0*
