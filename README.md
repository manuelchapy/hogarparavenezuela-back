# Hogar para Venezuela Backend

| English | Español |
|---|---|
| **Hogar para Venezuela** is a nonprofit, emergency-response backend created to support rescue coordination and traceability for children and adolescents (`NNA`) after the seismic emergency reported in Venezuela on **June 25, 2026**. | **Hogar para Venezuela** es un backend sin fines de lucro, creado para apoyar la coordinación de rescate y trazabilidad de niños, niñas y adolescentes (`NNA`) tras la emergencia sísmica reportada en Venezuela el **25 de junio de 2026**. |
| Public news reports describe a severe seismic event affecting areas including Caracas and La Guaira, with significant infrastructure damage and evolving humanitarian needs. This project is a technical response to help organize verified operational information. | Reportes públicos de noticias describen un evento sísmico severo con afectación en zonas como Caracas y La Guaira, daños importantes en infraestructura y necesidades humanitarias en evolución. Este proyecto es una respuesta técnica para organizar información operativa verificada. |
| The project is not a commercial product. It is intended for humanitarian coordination, responsible collaboration, and lawful use by authorized operators and institutions. | El proyecto no es un producto comercial. Está orientado a coordinación humanitaria, colaboración responsable y uso legal por operadores e instituciones autorizadas. |

## Mission / Misión

| English | Español |
|---|---|
| Provide a secure API for registering, locating, transferring, and legally closing NNA rescue records during an emergency response. | Proveer una API segura para registrar, ubicar, trasladar y cerrar legalmente registros de rescate de NNA durante una respuesta de emergencia. |
| Support offline-first field workflows through idempotent registration and timeline events. | Apoyar flujos de campo offline-first mediante registro e hitos de timeline idempotentes. |
| Centralize operational catalogs so frontend applications and field operators use consistent statuses, roles, and event types. | Centralizar catálogos operativos para que aplicaciones frontend y operadores de campo usen estados, roles y tipos de evento consistentes. |
| Preserve traceability and auditability aligned with LOPNNA-oriented operating rules. | Preservar trazabilidad y auditoría alineadas con reglas operativas orientadas a LOPNNA. |

## Scope / Alcance

| Area | English | Español |
|---|---|---|
| Authentication | JWT authentication for verified operators and administrators. | Autenticación JWT para operadores verificados y administradores. |
| Users | Public operator request flow, administrative approval, rejection, and direct admin-created accounts. | Flujo público de solicitud de operadores, aprobación administrativa, rechazo y altas directas por administrador. |
| NNA Traceability | NNA registration, photo upload, administrative location, timeline events, legal closure, and file attachments. | Registro de NNA, subida de fotos, ubicación administrativa, eventos de timeline, cierre legal y archivos adjuntos. |
| Catalogs | Public normalized enums for statuses, roles, health, institutions, NNA age, and sex. | Enums públicos normalizados para estados, roles, salud, instituciones, edad aparente y sexo de NNA. |
| Geo | Public administrative geography catalog for Venezuela. | Catálogo público de geografía administrativa de Venezuela. |
| Infrastructure | MongoDB, object storage, optional n8n webhooks, and environment-based deployment. | MongoDB, almacenamiento de objetos, webhooks n8n opcionales y despliegue basado en variables de entorno. |

## Documentation / Documentación

| English | Español |
|---|---|
| Original developer-facing API documentation remains in `docs/`. | La documentación original para desarrolladores se mantiene en `docs/`. |
| Baseline product and system requirements are defined in `openspec/specs/`. | Los requisitos base de producto y sistema están definidos en `openspec/specs/`. |

### Original Docs / Documentos Originales

| Document | Description |
|---|---|
| `docs/API-ENDPOINTS.md` | Complete API endpoint reference. |
| `docs/API-Users-Auth.md` | Users, authentication, sessions, and roles. |
| `docs/API-NNA.md` | NNA registration, listing, timeline, legal closure, and files. |
| `docs/API-Geo.md` | Venezuela administrative geography. |
| `docs/API-Catalog.md` | Normalized catalogs and enums. |
| `docs/PROTOCOLO-LOPNNA-API.md` | LOPNNA-oriented operational rules. |
| `docs/INFRAESTRUCTURA-CONEXIONES.md` | MongoDB, storage, webhooks, and deployment. |

### OpenSpec Baseline / Línea Base OpenSpec

| Spec | Capability |
|---|---|
| `openspec/specs/platform-overview/spec.md` | Mission, actors, and public-interest operating principles. |
| `openspec/specs/api-contract/spec.md` | Global API conventions, response format, errors, and idempotency. |
| `openspec/specs/authentication-and-users/spec.md` | Auth, users, roles, account lifecycle, and admin user management. |
| `openspec/specs/nna-traceability/spec.md` | NNA records, timeline, offline retry behavior, legal closure, and files. |
| `openspec/specs/catalog/spec.md` | Public catalogs for normalized system enums. |
| `openspec/specs/geo/spec.md` | Venezuela geography catalog and location validation. |
| `openspec/specs/lopnna-compliance/spec.md` | Role permissions, NNA voice, institutional transfers, and audit rules. |
| `openspec/specs/infrastructure/spec.md` | Runtime services, storage, webhooks, deployment, and operational checklist. |

## Responsible Use / Uso Responsable

| English | Español |
|---|---|
| This backend handles sensitive humanitarian and child-protection data. Deployments must restrict access to authorized personnel, protect credentials, and follow applicable legal and institutional protocols. | Este backend maneja datos humanitarios y de protección infantil sensibles. Los despliegues deben restringir el acceso a personal autorizado, proteger credenciales y cumplir protocolos legales e institucionales aplicables. |
| Do not use this system to publish personal information, bypass institutional verification, or coordinate unauthorized transfers. | No uses este sistema para publicar información personal, evadir verificación institucional o coordinar traslados no autorizados. |

## Local Development / Desarrollo Local

| English | Español |
|---|---|
| Install dependencies with `npm install`. | Instala dependencias con `npm install`. |
| Configure environment variables from `.env.example`. | Configura variables de entorno desde `.env.example`. |
| Seed geography data with `npm run seed:geo`. | Carga datos geográficos con `npm run seed:geo`. |
| Start the API with `npm run dev`. | Inicia la API con `npm run dev`. |
| Run tests with `npm test`. | Ejecuta pruebas con `npm test`. |

## Current Status / Estado Actual

| English | Español |
|---|---|
| Backend v1 implements the documented API surface for NNA traceability and LOPNNA-oriented workflows. | Backend v1 implementa la superficie de API documentada para trazabilidad de NNA y flujos orientados a LOPNNA. |
| Contributions should preserve the nonprofit, emergency-response purpose and the baseline OpenSpec requirements. | Las contribuciones deben preservar el propósito sin fines de lucro, de respuesta a emergencia y los requisitos base en OpenSpec. |
