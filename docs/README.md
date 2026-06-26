# Documentación API — Hogar para Venezuela (Backend)

Documentación orientada al **desarrollador frontend** de la plataforma de rescate y trazabilidad de NNA tras el Sismo Central.

## Archivos

| Documento | Descripción |
|-----------|-------------|
| **[API-ENDPOINTS.md](./API-ENDPOINTS.md)** | **Referencia completa** — todos los endpoints por módulo, request/response y errores |
| [API-Users-Auth.md](./API-Users-Auth.md) | Registro, login JWT, sesión y roles |
| [API-NNA.md](./API-NNA.md) | Registro, listado, timeline idempotente, entrega oficial y archivos |
| [API-Geo.md](./API-Geo.md) | Catálogo geográfico y ubicación administrativa |
| [API-Catalog.md](./API-Catalog.md) | Estados NNA, roles, timeline y enums normalizados |
| [PROTOCOLO-LOPNNA-API.md](./PROTOCOLO-LOPNNA-API.md) | Registro verificado, permisos por rol, LOPNNA |
| [INFRAESTRUCTURA-CONEXIONES.md](./INFRAESTRUCTURA-CONEXIONES.md) | MongoDB, GCS, n8n, variables de entorno y despliegue |

## Convenciones globales

### Base URL

| Entorno | URL base |
|---------|----------|
| Local | `http://localhost:4000` |
| Producción | `https://TU-DOMINIO.com` |

Todas las rutas de negocio viven bajo el prefijo **`/api`**.

### Formato de respuesta estándar

**Éxito:**

```json
{
  "success": true,
  "data": { }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Descripción legible del error.",
  "data": { }
}
```

> El campo `data` en errores es opcional (p. ej. detalles de validación Zod).

### Autenticación

- Tipo: **JWT** emitido por `POST /api/auth/login` o `POST /api/auth/register`.
- Header: `Authorization: Bearer <token>`.
- Expiración configurable (`JWT_EXPIRES_IN`, default `8h`).

### Roles del sistema

| Rol | Código | Uso principal |
|-----|--------|---------------|
| Rescatista civil | `RESCATISTA_CIVIL` | Registro y timeline en campo |
| Protección Civil | `PROTECCION_CIVIL` | Registro, traslados e ingreso a refugio |
| Personal médico | `PERSONAL_MEDICO` | Hitos de atención médica |
| Consejero CPNNA | `CONSEJERO_CPNNA` | Cierre legal LOPNNA |
| Administrador | `ADMINISTRADOR` | Gestión de usuarios, catálogos y cierre legal |

### PWA offline / reintentos

| Campo | Formato | Comportamiento |
|-------|---------|----------------|
| `idOfflineFallback` | `CEDULA_RESCATISTA-TIMESTAMP` | Retry → **200**, `created: false` |
| `eventoId` | UUID v4 | Retry timeline → **200**, `duplicated: true` |

### Catálogos normalizados

Los enums del sistema (`statusActual`, roles, timeline, etc.) están centralizados en **`GET /api/catalog`**. No hardcodear strings en el frontend.

Ver [API-Catalog.md](./API-Catalog.md) y la tabla completa en [API-ENDPOINTS.md](./API-ENDPOINTS.md).

### Health check

```http
GET /api/health
```

Respuesta **200**:

```json
{
  "success": true,
  "data": {
    "service": "hogarparavenezuela-back",
    "status": "ok",
    "timestamp": "2026-06-26T12:00:00.000Z"
  }
}
```
