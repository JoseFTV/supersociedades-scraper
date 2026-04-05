# Taxonomía de Conceptos Jurídicos — Superintendencia de Sociedades
## Clasificación temática para corpus doctrinal

**Versión:** 1.0
**Fecha:** 2026-04-05
**Estado:** Inicial — validada con muestra de 300/12,758 conceptos jurídicos
**Método:** Extracción de texto de muestra estratificada por año + clasificación supervisada con Claude Sonnet 4
**Corpus:** 12,758 conceptos jurídicos (1999–2026), 441 conceptos contables (pendientes)
**Complementa:** taxonomia_lexia_v3.0_canonica.md (series CT.SOC, B6)

---

## PRINCIPIOS DE DISEÑO

1. **Exhaustividad:** todo concepto jurídico de Supersociedades debe caer en exactamente una categoría principal
2. **Mutua exclusividad:** las categorías gruesas no se solapan; la ambigüedad se resuelve con tema secundario
3. **Jerarquía de dos niveles:** categoría gruesa (20 temas) → subtemas (por descubrir en fase 2)
4. **Basada en evidencia:** distribución derivada de muestra estratificada real, no de supuestos teóricos
5. **Compatible con Lexia:** los códigos mapean a CT.SOC y B6 de la taxonomía Lexia v3.0
6. **Extensible:** diseñada para agregar subtemas sin romper la estructura

---

## ESQUEMA DE CLASIFICACIÓN

Cada concepto clasificado incluye:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tema_principal` | string (código) | Categoría gruesa — exactamente una |
| `tema_secundario` | string \| null | Categoría gruesa secundaria si aplica |
| `subtema` | string | Descripción libre del subtema específico |
| `confianza` | float 0-1 | Confianza de la clasificación |
| `fundamentacion_legal` | string[] | Normas principales referenciadas |

---

## CATEGORÍAS GRUESAS (SERIE TX.SOC)

### Distribución observada (muestra n=300)

| # | Código | Label | n | % | Descripción |
|---|--------|-------|---|---|-------------|
| 1 | TX.SOC.01 | INSPECCION_VIGILANCIA | 42 | 14.0 | Funciones, competencia y facultades de Supersociedades |
| 2 | TX.SOC.02 | INSOLVENCIA | 36 | 12.0 | Reorganización (Ley 1116), liquidación judicial, Ley 550, concordatos |
| 3 | TX.SOC.03 | SOCIOS_ACCIONISTAS | 34 | 11.3 | Derechos, cesión, inspección, exclusión, retiro, libro de accionistas |
| 4 | TX.SOC.04 | DISOLUCION_LIQUIDACION | 34 | 11.3 | Causales, enervatoria, liquidación voluntaria/judicial, reactivación |
| 5 | TX.SOC.05 | ORGANOS_SOCIALES | 27 | 9.0 | Asamblea, junta directiva, representante legal, quórum, actas |
| 6 | TX.SOC.06 | TIPOS_SOCIETARIOS | 25 | 8.3 | SAS, SA, Ltda, EU, SCA, sucursales extranjeras, constitución |
| 7 | TX.SOC.07 | REFORMAS_ESTATUTARIAS | 18 | 6.0 | Fusión, escisión, transformación, aumento/disminución de capital |
| 8 | TX.SOC.08 | CAPITAL_APORTES | 17 | 5.7 | Aportes, acciones, cuotas, prima, emisión, colocación |
| 9 | TX.SOC.09 | ADMINISTRADORES | 14 | 4.7 | Deberes, responsabilidad, conflicto de intereses, inhabilidades |
| 10 | TX.SOC.10 | GRUPOS_EMPRESARIALES | 10 | 3.3 | Control, subordinación, grupo empresarial, consolidación |
| 11 | TX.SOC.11 | CONTRATACION_COMERCIAL | 8 | 2.7 | Contratos comerciales, fiducia, garantías mobiliarias |
| 12 | TX.SOC.12 | REVISOR_FISCAL | 7 | 2.3 | Nombramiento, funciones, inhabilidades, obligatoriedad |
| 13 | TX.SOC.13 | UTILIDADES_DIVIDENDOS | 5 | 1.7 | Distribución, reservas, dividendos, absorción de pérdidas |
| 14 | TX.SOC.14 | LIBROS_CONTABILIDAD | 5 | 1.7 | Libros de comercio, estados financieros, NIIF |
| 15 | TX.SOC.15 | PROCEDIMIENTO | 4 | 1.3 | Acciones judiciales, impugnación, conciliación, velo corporativo |
| 16 | TX.SOC.16 | ENTIDADES_SIN_ANIMO_LUCRO | 4 | 1.3 | ESAL, fundaciones, cooperativas |
| 17 | TX.SOC.17 | REGIMEN_CAMBIARIO | 3 | 1.0 | Inversión extranjera, régimen cambiario |
| 18 | TX.SOC.18 | REGISTRO_MERCANTIL | 1 | 0.3 | Matrícula, inscripción, certificados |
| 19 | TX.SOC.19 | PROPIEDAD_INTELECTUAL | 0 | 0.0 | Marcas, nombres comerciales en contexto societario |
| 20 | TX.SOC.20 | OTRO | 4 | 1.3 | Temas que no encajan en categorías anteriores |

---

## DEFINICIONES DETALLADAS

### TX.SOC.01 — INSPECCION_VIGILANCIA
**Label:** Inspección, vigilancia y control de Supersociedades
**Frecuencia:** 14.0% (categoría más frecuente)

**Definición:** Conceptos sobre las funciones, competencias, alcance y facultades administrativas de la Superintendencia de Sociedades. Incluye: causales de vigilancia, umbrales, sanciones, multas, requerimientos, visitas, competencia sobre tipos específicos de entidades.

**Subtemas observados:**
- Alcance de funciones de inspección, vigilancia y control
- Competencia sobre tipos específicos de entidades (EPS, servicios públicos, economía mixta, ESAL)
- Causales de vigilancia (Decreto 4350/2006, umbrales de activos e ingresos)
- Facultades sancionatorias y administrativas
- Competencia frente a cámaras de comercio
- Verificación de origen de capital societario
- Clasificación de empresas (microempresa, etc.)
- Notificaciones electrónicas

**Normatividad frecuente:** Ley 222/1995 (arts. 82-87), Decreto 4350/2006, Ley 1258/2008

**Mapeo Lexia v3.0:** Sin equivalente directo — no es controversia arbitral

---

### TX.SOC.02 — INSOLVENCIA
**Label:** Régimen de insolvencia empresarial
**Frecuencia:** 12.0%

**Definición:** Conceptos sobre procesos de reorganización empresarial, liquidación judicial, acuerdos de reestructuración, toma de posesión e intervención. Cubre tanto el régimen vigente (Ley 1116/2006) como regímenes anteriores (Ley 550/1999, Ley 222/1995 concordatos).

**Subtemas observados:**
- Reorganización empresarial (Ley 1116): admisión, trámite, efectos
- Liquidación judicial: inventario, adjudicación, prelación de créditos
- Acuerdos de reestructuración (Ley 550): derechos de voto, acreencias, fecha de corte
- Validación judicial de acuerdos extrajudiciales
- Toma de posesión de personas jurídicas
- Cesión de créditos en reorganización
- Consorcios y uniones temporales en insolvencia
- Contratación con el Estado durante reestructuración
- Pago por terceros (art. 17 Ley 1116)
- Transición entre regímenes concursales

**Normatividad frecuente:** Ley 1116/2006, Ley 550/1999, Ley 222/1995 (Título II), Decreto 1730/2009

**Mapeo Lexia v3.0:** Sin equivalente directo — CT.SOC.07 (disolución) es tangencialmente relacionado

---

### TX.SOC.03 — SOCIOS_ACCIONISTAS
**Label:** Derechos de socios y accionistas
**Frecuencia:** 11.3%

**Definición:** Conceptos sobre los derechos, obligaciones e interacciones de socios y accionistas. Incluye: derecho de inspección, derecho de preferencia, cesión de cuotas/acciones, exclusión, retiro, libro de accionistas, representación en asambleas.

**Subtemas observados:**
- Derecho de inspección e información
- Cesión de cuotas y acciones (requisitos, restricciones, dación en pago)
- Derecho de preferencia en transferencias
- Exclusión de socios
- Derecho de retiro e indivisibilidad de acciones
- Representación de socios extranjeros
- Cláusulas estatutarias discriminatorias
- Abuso del derecho de litigar por minoritarios
- Acreditación de calidad de accionista
- Compraventa de acciones como contrato

**Normatividad frecuente:** C.Co. arts. 369-380 (Ltda), 397-417 (SA), Ley 1258/2008 (SAS), Ley 222/1995 art. 48

**Mapeo Lexia v3.0:**
- → CT.SOC.01 (acuerdo de accionistas)
- → CT.SOC.02 (compraventa y valoración)
- → CT.SOC.03 (exclusión o retiro)
- → CT.SOC.08 (derecho de preferencia)

---

### TX.SOC.04 — DISOLUCION_LIQUIDACION
**Label:** Disolución y liquidación de sociedades
**Frecuencia:** 11.3%

**Definición:** Conceptos sobre causales de disolución, proceso de enervatoria, liquidación voluntaria (privada) y judicial, funciones del liquidador, adjudicación de activos, reactivación societaria.

**Subtemas observados:**
- Causales de disolución (pérdidas, inactividad, vencimiento del término)
- Enervatoria: disminución de capital, capitalización para superar causal
- Liquidación privada/voluntaria: procedimiento, representante legal, rendición de cuentas
- Adjudicación de bienes en liquidación
- Reactivación de sociedades disueltas
- Liquidación de sociedades con propiedad horizontal
- Resciliación del contrato social antes de inscripción
- Sociedades de hecho en liquidación

**Normatividad frecuente:** C.Co. arts. 218-233, 457-460, Ley 1258/2008 art. 34-36, Ley 222/1995 arts. 225-259

**Mapeo Lexia v3.0:** → CT.SOC.07 (disolución y liquidación)

---

### TX.SOC.05 — ORGANOS_SOCIALES
**Label:** Órganos sociales y gobierno interno
**Frecuencia:** 9.0%

**Definición:** Conceptos sobre funcionamiento de asamblea de accionistas, junta de socios, junta directiva y representante legal. Incluye: convocatorias, quórum, mayorías, actas, suplentes, poderes, reuniones por derecho propio.

**Subtemas observados:**
- Quórum y mayorías en asambleas y juntas de socios
- Convocatorias: términos, segunda convocatoria, reuniones universales
- Actas: requisitos, firmas, inscripción en registro mercantil
- Junta directiva: composición, suplentes numéricos, apoderados, comisiones
- Representación legal: suplentes, ejercicio simultáneo, compatibilidad con junta directiva
- Decisiones de accionista único en SAS
- Reuniones no presenciales y por derecho propio
- Protección contra abuso de mayorías

**Normatividad frecuente:** C.Co. arts. 181-198 (asambleas), 434-439 (junta directiva SA), Ley 222/1995 arts. 18-25, Ley 1258/2008 arts. 17-27

**Mapeo Lexia v3.0:**
- → CT.SOC.05 (gobierno corporativo)
- → B6.05 (gobierno corporativo deficiente)
- → B6.06 (representación indebida en órgano social)
- → S-ABV (abuso del derecho de voto)

---

### TX.SOC.06 — TIPOS_SOCIETARIOS
**Label:** Tipos societarios y constitución
**Frecuencia:** 8.3%

**Definición:** Conceptos sobre características, constitución, requisitos y diferencias entre los distintos tipos societarios. Incluye: SAS, SA, Ltda, SCA, colectiva, empresa unipersonal, sucursales de sociedades extranjeras, sociedades de economía mixta.

**Subtemas observados:**
- SAS: constitución, accionista único, diferencias con EU
- Sociedad anónima: requisitos, responsabilidad limitada
- Sociedad limitada: normatividad, conversión
- Sucursales de sociedades extranjeras: cierre, inversión suplementaria, enajenación
- Empresas unipersonales: clasificación, subordinación, titularidad
- Sociedad en comandita: características, problemas de gestión
- Sociedades de economía mixta: negociación de acciones
- Constitución con aportes en especie e industria

**Normatividad frecuente:** C.Co. Libros II y III, Ley 1258/2008, Ley 222/1995 art. 71-81 (EU), Ley 1014/2006

**Mapeo Lexia v3.0:** Sin equivalente directo — contexto estructural, no controversia

---

### TX.SOC.07 — REFORMAS_ESTATUTARIAS
**Label:** Reformas estatutarias y reorganizaciones corporativas
**Frecuencia:** 6.0%

**Definición:** Conceptos sobre modificación de estatutos, fusión, escisión, transformación, aumento y disminución de capital como reforma. Incluye: autorizaciones de Supersociedades, publicidad a acreedores, garantías.

**Subtemas observados:**
- Fusión: autorización, fusión impropia, publicidad a acreedores, continuación de trámites
- Escisión: requisitos, publicidad, experiencia contractual
- Transformación societaria
- Disminución de capital: autorización, trámites en SA
- Aumento de capital
- Modificación de razón/denominación social
- Autorizaciones especiales para sociedades vigiladas
- Reconstitucion vs. reactivación

**Normatividad frecuente:** C.Co. arts. 158-177 (reformas), 172-180 (fusión/escisión), Ley 222/1995 arts. 4-12

**Mapeo Lexia v3.0:** Parcial — CT.SOC.02 incluye M&A pero no reformas estatutarias genéricas

---

### TX.SOC.08 — CAPITAL_APORTES
**Label:** Capital social, aportes y acciones
**Frecuencia:** 5.7%

**Definición:** Conceptos sobre capital social, aportes en dinero/especie/industria, emisión y colocación de acciones, prima en colocación, acciones privilegiadas, avalúo, capitalización.

**Subtemas observados:**
- Emisión y colocación de acciones (ordinarias, privilegiadas, en reserva)
- Aportes en especie: avalúo, bienes en comodato, derechos hereditarios, nuda propiedad
- Prima en colocación de acciones
- Autorización de Supersociedades para colocación
- Aumento de capital en SAS
- Inversión suplementaria en sucursales extranjeras
- Oferta pública de adquisición
- Competencia de asamblea vs. junta directiva en emisiones

**Normatividad frecuente:** C.Co. arts. 122-135 (aportes), 375-395 (acciones SA), Ley 1258/2008 arts. 4-9

**Mapeo Lexia v3.0:** Parcial — CT.SOC.02 cubre valoración, no estructura de capital

---

### TX.SOC.09 — ADMINISTRADORES
**Label:** Deberes y responsabilidad de administradores
**Frecuencia:** 4.7%

**Definición:** Conceptos sobre deberes de diligencia, lealtad y no competencia de administradores. Incluye: conflicto de intereses, responsabilidad civil, acción social de responsabilidad, inhabilidades, incompatibilidades, administrador de hecho.

**Subtemas observados:**
- Acción social de responsabilidad: mayorías, procedimiento
- Conflicto de intereses: contratación con vinculados, autorización
- Compatibilidad de cargos (representante legal + junta directiva, contador + representante legal)
- Administrador de hecho: criterios de clasificación
- Representante legal vs. mandatario: diferencias
- Ejercicio simultáneo de representación legal en múltiples empresas
- Inhabilidades en sociedades de familia
- Deber de lealtad entre socios

**Normatividad frecuente:** Ley 222/1995 arts. 22-25, Decreto 1925/2009, C.Co. art. 200

**Mapeo Lexia v3.0:**
- → CT.SOC.06 (deber fiduciario)
- → CT.SOC.10 (rendición de cuentas)
- → S-COI (conflicto de intereses)
- → B6.05-B6.07

---

### TX.SOC.10 — GRUPOS_EMPRESARIALES
**Label:** Grupos empresariales y situaciones de control
**Frecuencia:** 3.3%

**Definición:** Conceptos sobre configuración, registro y efectos de situaciones de control y grupos empresariales. Incluye: subordinación, matrices y filiales, unidad de propósito, consolidación de estados financieros.

**Subtemas observados:**
- Configuración de situación de control y grupo empresarial
- Registro en cámara de comercio: documentos soporte, normalización
- Control por accionista único
- Consolidación de estados financieros
- Sucursales extranjeras y situación de control
- Participación de ESAL en grupos empresariales
- Presupuestos legales y mayorías decisorias

**Normatividad frecuente:** Ley 222/1995 arts. 26-33, C.Co. arts. 260-265

**Mapeo Lexia v3.0:** Sin equivalente directo — contexto, no controversia

---

### TX.SOC.11 — CONTRATACION_COMERCIAL
**Label:** Contratación y garantías comerciales
**Frecuencia:** 2.7%

**Definición:** Conceptos sobre contratos comerciales en contexto societario. Incluye: fiducia, garantías mobiliarias, mutuo como objeto social, mercadeo multinivel, distribución.

**Subtemas observados:**
- Garantías mobiliarias: inscripción, limitaciones sobre salarios
- Fiducia mercantil con fines de garantía
- Contrato de mutuo como objeto social
- Mercadeo multinivel y Ley 1700
- Convenios comerciales y relación con objeto social
- Libranza y captación masiva

**Normatividad frecuente:** C.Co. Libro IV, Ley 1676/2013 (garantías mobiliarias), Ley 1700/2013 (multinivel)

**Mapeo Lexia v3.0:** Sin equivalente directo — CT.GEN cubre controversias contractuales genéricas

---

### TX.SOC.12 — REVISOR_FISCAL
**Label:** Revisoría fiscal
**Frecuencia:** 2.3%

**Definición:** Conceptos sobre nombramiento, funciones, inhabilidades, obligatoriedad y responsabilidad del revisor fiscal.

**Subtemas observados:**
- Obligatoriedad según tipo y tamaño de sociedad
- Funciones en liquidación voluntaria
- Inhabilidades: ejercicio simultáneo en matriz y subordinadas
- Mayorías para elección y voto en blanco
- Firmas conjuntas con representante legal
- Auditoría externa por socios minoritarios

**Normatividad frecuente:** Ley 222/1995 art. 13, C.Co. arts. 203-217, Ley 43/1990

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.13 — UTILIDADES_DIVIDENDOS
**Label:** Utilidades, dividendos y reservas
**Frecuencia:** 1.7%

**Definición:** Conceptos sobre distribución de utilidades, reservas legales y estatutarias, pago de dividendos, absorción de pérdidas, recompra de acciones.

**Subtemas observados:**
- Dividendos no reclamados e intereses por mora
- Pago de dividendos en acciones
- Protección de minoritarios frente a no distribución
- Reservas estatutarias en sucursales extranjeras
- Titularidad de dividendos durante negociación

**Normatividad frecuente:** C.Co. arts. 149-157, 451-456, Ley 222/1995 art. 240

**Mapeo Lexia v3.0:** → CT.SOC.04 (distribución de utilidades)

---

### TX.SOC.14 — LIBROS_CONTABILIDAD
**Label:** Libros de comercio y contabilidad
**Frecuencia:** 1.7%

**Definición:** Conceptos sobre libros de comercio, obligaciones contables, estados financieros, NIIF, conservación documental.

**Subtemas observados:**
- Conservación de libros y papeles (físicos y digitales)
- Corrección de estados financieros
- Libros de comercio en formato electrónico
- Inscripción de libros de actas en registro mercantil
- Destrucción de documentos y derogación de normas

**Normatividad frecuente:** C.Co. arts. 48-74, Ley 1314/2009, Decretos reglamentarios NIIF

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.15 — PROCEDIMIENTO
**Label:** Aspectos procesales y jurisdiccionales
**Frecuencia:** 1.3%

**Definición:** Conceptos sobre competencia jurisdiccional, acciones judiciales, requisitos de procedibilidad, impugnación de decisiones sociales, levantamiento del velo corporativo.

**Subtemas observados:**
- Conciliación como requisito de procedibilidad para impugnación
- Impugnación de actas de uniones temporales
- Levantamiento del velo corporativo
- Notificaciones electrónicas en actuaciones administrativas

**Normatividad frecuente:** CGP, Ley 1258/2008 arts. 40-43, Ley 222/1995 arts. 133-141

**Mapeo Lexia v3.0:** → CT.GEN.08 (prescripción/caducidad), CT.GEN.10 (competencia)

---

### TX.SOC.16 — ENTIDADES_SIN_ANIMO_LUCRO
**Label:** Entidades sin ánimo de lucro
**Frecuencia:** 1.3%

**Definición:** Conceptos sobre ESAL, fundaciones, asociaciones, cooperativas y entidades del sector solidario en la medida en que Supersociedades tenga competencia.

**Subtemas observados:**
- Derecho de impugnación en clubes sociales
- Competencia de Supersociedades sobre federaciones y gremios
- Derechos de voto en fundaciones durante reorganización
- Liquidación de ESAL

**Normatividad frecuente:** Decreto 2150/1995, C.C. arts. 633-652

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.17 — REGIMEN_CAMBIARIO
**Label:** Régimen cambiario e inversión extranjera
**Frecuencia:** 1.0%

**Definición:** Conceptos sobre inversión extranjera directa, régimen cambiario, registro de inversión, operaciones en divisas en contexto societario.

**Subtemas observados:**
- Capitalización de deuda en sucursal y registro de inversión
- Ejecución de garantía fiduciaria y sustitución de titulares
- Pérdida de calidad de residente cambiario

**Normatividad frecuente:** Decreto 119/2017, Circular Externa DCIN del Banco de la República, Ley 9/1991

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.18 — REGISTRO_MERCANTIL
**Label:** Registro mercantil y matrícula
**Frecuencia:** 0.3%

**Definición:** Conceptos sobre inscripción, renovación, cancelación de matrícula mercantil, certificados de existencia y representación, registros en cámara de comercio.

**Nota:** Baja frecuencia probablemente porque estos temas los resuelve más la SIC o las propias cámaras de comercio. Candidata a fusionarse con TX.SOC.01 (Inspección/Vigilancia) en futuras versiones si no crece.

**Normatividad frecuente:** C.Co. arts. 26-47, Decreto 2649/1993

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.19 — PROPIEDAD_INTELECTUAL
**Label:** Propiedad intelectual en contexto societario
**Frecuencia:** 0.0% (no observada en muestra)

**Definición:** Conceptos sobre marcas, patentes, nombres comerciales, propiedad industrial en contexto societario. Incluida como categoría preventiva por cercanía temática.

**Nota:** No observada en la muestra de 300. Candidata a eliminación o fusión con OTRO si no aparece en clasificación completa.

**Mapeo Lexia v3.0:** Sin equivalente directo

---

### TX.SOC.20 — OTRO
**Label:** Otros temas
**Frecuencia:** 1.3%

**Definición:** Conceptos que no encajan en ninguna categoría anterior. Incluye: normatividad general, metodología académica, transparencia empresarial, uniones temporales.

**Nota:** Si algún subtema dentro de OTRO alcanza ≥2% en la clasificación completa, promover a categoría propia.

---

## MAPEO CRUZADO CON LEXIA v3.0

| Código TX.SOC | Equivalente Lexia v3.0 | Relación |
|---------------|------------------------|----------|
| TX.SOC.01 | — | Sin equivalente (administrativo, no arbitral) |
| TX.SOC.02 | — | Sin equivalente (insolvencia, no arbitral) |
| TX.SOC.03 | CT.SOC.01, .02, .03, .08 | Superconjunto de controversias de socios |
| TX.SOC.04 | CT.SOC.07 | Equivalente directo |
| TX.SOC.05 | CT.SOC.05, B6.05, B6.06, S-ABV | Equivalente con más detalle operativo |
| TX.SOC.06 | — | Contexto estructural, no controversia |
| TX.SOC.07 | — | Parcial con CT.SOC.02 (M&A) |
| TX.SOC.08 | CT.SOC.02 (parcial) | Estructura de capital vs. valoración |
| TX.SOC.09 | CT.SOC.06, .10, S-COI, B6 | Equivalente con más detalle |
| TX.SOC.10 | — | Contexto regulatorio |
| TX.SOC.11 | CT.GEN (genérico) | Contractual genérico |
| TX.SOC.12 | — | Sin equivalente |
| TX.SOC.13 | CT.SOC.04 | Equivalente directo |
| TX.SOC.14 | — | Sin equivalente |
| TX.SOC.15 | CT.GEN.08, .10 | Procesal genérico |
| TX.SOC.16 | — | Sin equivalente |
| TX.SOC.17 | — | Sin equivalente |
| TX.SOC.18 | — | Sin equivalente |
| TX.SOC.19 | — | Sin equivalente |
| TX.SOC.20 | — | Residual |

**Observación clave:** Solo 6 de 20 categorías tienen equivalente en CT.SOC. El corpus doctrinal de Supersociedades es significativamente más amplio que el universo de controversias arbitrales societarias. Las categorías sin equivalente (insolvencia, inspección/vigilancia, tipos societarios, revisoría fiscal, etc.) representan ~45% del corpus y son terreno regulatorio/administrativo que los arbitrajes no tocan.

---

## REGLAS DE CLASIFICACIÓN

### Regla de tema principal
- Asignar el tema que mejor describe la **consulta central** del concepto, no los temas mencionados incidentalmente.
- Si el concepto trata sobre la competencia de Supersociedades para intervenir en un tema X, clasificar como TX.SOC.01 (INSPECCION_VIGILANCIA), no como X.

### Regla de tema secundario
- Asignar solo si el concepto desarrolla sustancialmente dos temas distintos.
- No asignar tema secundario por mención incidental.

### Regla de ambigüedad
- Disolución por pérdidas + enervatoria por capitalización → TX.SOC.04 (DISOLUCION_LIQUIDACION), no TX.SOC.08
- Fusión que requiere autorización de Supersociedades → TX.SOC.07 (REFORMAS), no TX.SOC.01
- Derechos de accionista en asamblea → TX.SOC.03 (SOCIOS_ACCIONISTAS) si el foco es el derecho del socio; TX.SOC.05 (ORGANOS_SOCIALES) si el foco es el funcionamiento del órgano
- Administrador en conflicto de intereses → TX.SOC.09 (ADMINISTRADORES), no TX.SOC.05

---

## COBERTURA ESTIMADA DEL CORPUS COMPLETO

Basado en la muestra estratificada (n=300, IC 95% ±5.6%):

| Categoría | % estimado | Documentos estimados (de 12,758) |
|-----------|-----------|----------------------------------|
| INSPECCION_VIGILANCIA | 14.0% | ~1,786 |
| INSOLVENCIA | 12.0% | ~1,531 |
| SOCIOS_ACCIONISTAS | 11.3% | ~1,442 |
| DISOLUCION_LIQUIDACION | 11.3% | ~1,442 |
| ORGANOS_SOCIALES | 9.0% | ~1,148 |
| TIPOS_SOCIETARIOS | 8.3% | ~1,059 |
| REFORMAS_ESTATUTARIAS | 6.0% | ~765 |
| CAPITAL_APORTES | 5.7% | ~727 |
| ADMINISTRADORES | 4.7% | ~600 |
| GRUPOS_EMPRESARIALES | 3.3% | ~421 |
| Otros (11 categorías) | 14.3% | ~1,824 |

**Tasa de ilegibles:** 0.7% (~89 documentos probablemente corruptos o en formato legacy)

---

## PRÓXIMOS PASOS (FASE 2)

1. **Subtemas:** Clasificar la muestra de 300 en subtemas dentro de cada categoría gruesa. Las categorías con >5% justifican 5-10 subtemas cada una.
2. **Clasificación completa:** Aplicar la taxonomía a los 12,758 conceptos jurídicos usando Claude API en batch.
3. **Validación cruzada:** Muestra aleatoria de 50 conceptos clasificados manualmente para medir concordancia.
4. **Conceptos contables:** Crear serie TX.CON equivalente para los 441 conceptos contables.
5. **Fusión/eliminación:** Evaluar si TX.SOC.18 (registro) y TX.SOC.19 (PI) deben fusionarse o eliminarse.

---

## HISTORIAL DE CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-04-05 | Versión inicial — 20 categorías gruesas, validada con muestra de 300 documentos |
