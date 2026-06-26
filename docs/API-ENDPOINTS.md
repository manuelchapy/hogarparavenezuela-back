# API — Referencia completa de endpoints

Documento maestro con **todos los endpoints** del backend, organizados por módulo y audiencia. Para profundizar en un dominio, consulta los documentos específicos enlazados al final.

---

## Índice

- [Convenciones globales](#convenciones-globales)
- [Códigos HTTP y manejo de errores](#códigos-http-y-manejo-de-errores)
- [1. Infraestructura y catálogos (público)](#1-infraestructura-y-catálogos-público)
- [2. Usuarios operativos — rescatistas y campo](#2-usuarios-operativos--rescatistas-y-campo)
- [3. NNA — trazabilidad operativa](#3-nna--trazabilidad-operativa)
- [4. Administradores](#4-administradores)
- [Matriz rápida por rol](#matriz-rápida-por-rol)
- [Documentos relacionados](#documentos-relacionados)

---

## Convenciones globales

| Concepto | Valor |
|----------|-------|
| Base URL local | `http://localhost:4000` |
| Prefijo API | `/api` |
| Auth | JWT — header `Authorization: Bearer <token>` |
| Content-Type JSON | `application/json` |
| Multipart | `multipart/form-data` (subida de archivos) |

### Formato de respuesta

**Éxito:**

```json
{ "success": true, "data": { } }
```

**Error:**

```json
{ "success": false, "message": "Descripción legible.", "data": { } }
```

El campo `data` en errores es opcional (p. ej. `errors` de validación Zod).

---

## Códigos HTTP y manejo de errores

| Código | Cuándo ocurre | Ejemplo de `message` |
|--------|---------------|----------------------|
| **200** | Operación exitosa (lectura, actualización, idempotencia) | — |
| **201** | Recurso creado | Bootstrap admin, registro NNA, subida de archivo |
| **202** | Solicitud aceptada (procesamiento posterior) | Alta pública `PENDIENTE` |
| **400** | Body/query/params inválidos (Zod, reglas de negocio) | `Datos de entrada inválidos.` |
| **401** | Sin token, token inválido o expirado | `Token no enviado...` / `Credenciales incorrectas.` |
| **403** | Sin permiso de rol, cuenta no activa, destino no autorizado | `No tienes permiso...` / `Cuenta en revisión...` |
| **404** | Recurso o ruta inexistente | `Registro NNA no encontrado.` / `Ruta no encontrada: GET ...` |
| **409** | Conflicto (duplicado) | `La cédula ya está registrada.` |
| **500** | Error interno no controlado | `Error interno del servidor.` |
| **503** | Storage no configurado | `Bucket S3/GCS no configurado.` |

### Validación Zod (400)

```json
{
  "success": false,
  "message": "Datos de entrada inválidos.",
  "data": {
    "errors": {
      "fieldErrors": { "cedula": ["Formato de cédula inválido."] },
      "formErrors": []
    }
  }
}
```

### Advertencias operativas

| Situación | Comportamiento | Acción frontend |
|-----------|----------------|-----------------|
| Retry registro NNA con mismo `idOfflineFallback` | **200**, `created: false` | No duplicar en UI |
| Retry timeline con mismo `eventoId` | **200**, `duplicated: true` | Marcar evento como sincronizado |
| Cierre legal ya registrado | **200**, `duplicated: true` | Mostrar estado final |
| Usuario `PENDIENTE` intenta `/api/nna/*` | **403** | Redirigir a pantalla de espera |
| Traslado sin `entidadAtencionId` | **400** | Exigir destino del catálogo |
| Entidad no autorizada | **403** | Solo destinos de `/api/entidades-atencion` |

---

## 1. Infraestructura y catálogos (público)

> **Auth:** ninguna. Ideal para precargar en PWA al arrancar.

### `GET /api/health`

**Response 200:**

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

---

### `GET /api/catalog`

Índice de dominios de enums normalizados.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "module": "catalog",
    "count": 9,
    "domains": [
      { "key": "nna-status", "name": "Estados operativos del NNA", "field": "statusActual", "itemCount": 4 }
    ],
    "routes": {
      "domains": "GET /api/catalog",
      "full": "GET /api/catalog/all",
      "byKey": "GET /api/catalog/:key"
    }
  }
}
```

| Errores | Código |
|---------|--------|
| Clave `:key` inválida (`EN_SITIO` en lugar de `nna-status`) | **400** |
| Ruta inexistente bajo `/api/catalog/...` | **404** |

> Detalle completo: [API-Catalog.md](./API-Catalog.md)

---

### `GET /api/catalog/all`

**Response 200:** todos los catálogos (`nna-status`, `timeline-events`, `roles`, etc.) en una sola respuesta.

---

### `GET /api/catalog/:key`

Claves válidas: `nna-status`, `timeline-events`, `estado-salud`, `roles`, `account-status`, `institution-types`, `entidad-atencion-types`, `edad-aparente`, `sexo-nna`.

**Response 200 (ejemplo `nna-status`):**

```json
{
  "success": true,
  "data": {
    "catalog": {
      "key": "nna-status",
      "field": "statusActual",
      "items": [
        { "code": "EN_SITIO", "label": "En sitio de hallazgo", "description": "...", "order": 1 }
      ],
      "transitions": [
        { "eventType": "TRASLADO", "statusCode": "EN_TRANSITO" }
      ]
    }
  }
}
```

---

### Geo — `/api/geo/*`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/geo` | Índice del módulo |
| `GET` | `/api/geo/countries` | Países |
| `GET` | `/api/geo/states` | Estados (`?search=&limit=`) |
| `GET` | `/api/geo/states/:stateId/cities` | Ciudades por estado |
| `GET` | `/api/geo/states/:stateId/municipalities` | Municipios por estado |
| `GET` | `/api/geo/municipalities/:municipalityId/parishes` | Parroquias |

**Response 200 (estados):**

```json
{
  "success": true,
  "data": {
    "country": { "id": "...", "name": "Venezuela", "code": "VE" },
    "count": 24,
    "items": [{ "id": "...", "name": "Aragua", "iso_31662": "VE-D" }]
  }
}
```

| Errores | Código |
|---------|--------|
| `stateId` / `municipalityId` inválido o inexistente | **404** |
| Query fuera de rango | **400** |

> Detalle: [API-Geo.md](./API-Geo.md)

---

### Instituciones — `/api/institutions`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/institutions` | No | Listado (`?stateId=&search=&activa=true&limit=`) |
| `GET` | `/api/institutions/:id` | No | Detalle |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "count": 2,
    "items": [
      {
        "id": "507f1f77bcf86cd799439012",
        "nombre": "Protección Civil Girardot",
        "tipo": "PROTECCION_CIVIL",
        "codigoOficial": "PC-GIR-001",
        "rolesPermitidos": ["RESCATISTA_CIVIL", "PROTECCION_CIVIL"],
        "activa": true
      }
    ]
  }
}
```

| Errores | Código |
|---------|--------|
| Institución no encontrada | **404** |

---

### Entidades de atención — `/api/entidades-atencion`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/entidades-atencion` | No | Listado (`?stateId=&autorizada=true&search=`) |
| `GET` | `/api/entidades-atencion/:id` | No | Detalle |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "count": 1,
    "items": [
      {
        "id": "507f1f77bcf86cd799439013",
        "nombre": "Refugio Central Maracay",
        "tipo": "REFUGIO_OFICIAL",
        "autorizada": true,
        "state": "..."
      }
    ]
  }
}
```

| Errores | Código |
|---------|--------|
| Entidad no encontrada | **404** |

> Usar `entidadAtencionId` en traslados e ingresos a refugio (NNA).

---

## 2. Usuarios operativos — rescatistas y campo

Roles operativos: `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`. También aplica a `CONSEJERO_CPNNA` y `ADMINISTRADOR` cuando operan en campo.

> Detalle auth: [API-Users-Auth.md](./API-Users-Auth.md)

### `GET /api/auth`

Índice del módulo. **Sin auth.**

---

### `POST /api/auth/solicitud`

Alta pública. Solo roles operativos.

**Request:**

```json
{
  "nombreCompleto": "Carlos Méndez",
  "cedula": "V18765432",
  "telefono": "+584129998877",
  "rolSolicitado": "RESCATISTA_CIVIL",
  "institucion": "Brigada Voluntaria Rescate Aragua",
  "institucionId": "507f1f77bcf86cd799439012",
  "fotoCedulaUrl": "https://storage.googleapis.com/.../cedula.jpg",
  "ubicacion": {
    "state": "69a2171c6997fcf9e1ceea61",
    "city": "69a2171d6997fcf9e1ceea66"
  }
}
```

**Response 202:**

```json
{
  "success": true,
  "data": {
    "user": { "estadoCuenta": "PENDIENTE", "rol": "RESCATISTA_CIVIL" },
    "message": "Solicitud recibida. Un administrador revisará tu cuenta."
  }
}
```

| Errores | Código | Causa |
|---------|--------|-------|
| Validación Zod | **400** | Campos faltantes, foto sin credencial, etc. |
| Cédula duplicada | **409** | `La cédula ya está registrada.` |
| Rol no operativo | **400** | `Rol solicitado no válido para alta pública.` |
| Institución inválida | **400** / **403** | ID inactivo o rol no permitido en institución |

---

### `POST /api/auth/login`

**Request:**

```json
{
  "cedula": "V18765432",
  "credencialOficialId": "RC-AR-0012"
}
```

> `credencialOficialId` solo si el usuario la tiene registrada.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "nombreCompleto": "Carlos Méndez",
      "cedula": "V18765432",
      "rol": "RESCATISTA_CIVIL",
      "estadoCuenta": "ACTIVO"
    }
  }
}
```

| Errores | Código | Causa |
|---------|--------|-------|
| Credenciales incorrectas | **401** | Cédula o credencial no coinciden |
| Cuenta PENDIENTE | **403** | `Cuenta en revisión institucional...` |
| Cuenta RECHAZADA | **403** | Motivo de rechazo |
| Cuenta SUSPENDIDA | **403** | `Usuario suspendido o inactivo.` |

---

### `GET /api/auth/me`

**Auth:** JWT + cuenta activa implícita en login (pero ruta no exige `requireActiveAccount`).

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "nombreCompleto": "Carlos Méndez",
      "rol": "RESCATISTA_CIVIL",
      "estadoCuenta": "ACTIVO",
      "ubicacion": { "display": "San Cristóbal, Táchira, Venezuela" }
    }
  }
}
```

| Errores | Código |
|---------|--------|
| Sin token / token inválido | **401** |
| Usuario eliminado | **404** |

---

### `PATCH /api/auth/me`

**Request (al menos un campo):**

```json
{
  "telefono": "+584121112233",
  "ubicacion": { "state": "...", "city": "..." }
}
```

**Response 200:** `{ "success": true, "data": { "user": { ... } } }`

| Errores | Código |
|---------|--------|
| Body vacío | **400** |
| Ubicación geo inconsistente | **400** |

---

## 3. NNA — trazabilidad operativa

**Auth:** JWT + `estadoCuenta: ACTIVO` (middleware `requireActiveAccount`).

> Detalle completo: [API-NNA.md](./API-NNA.md) · Enums: [API-Catalog.md](./API-Catalog.md)

### `GET /api/nna/meta`

Índice del módulo. **Sin auth.**

---

### `POST /api/nna/subir-foto`

**Auth:** JWT + cuenta activa.  
**Content-Type:** `multipart/form-data` — campo `archivo`.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "fotoUrl": "https://bucket.../nna/previa/V18765432-uuid.jpg",
    "storagePath": "nna/previa/V18765432-uuid.jpg"
  },
  "message": "Usa fotoUrl al crear el registro NNA."
}
```

| Errores | Código |
|---------|--------|
| Sin archivo | **400** |
| Storage no configurado | **503** |

---

### `GET /api/nna`

**Query:** `page`, `limit` (máx. 50), `status`, `stateId`, `cityId`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "67a1b2c3d4e5f6789012345a",
        "idUnico": "DC-CCS-260626-001",
        "statusActual": "EN_SITIO",
        "datosNna": { "nombre": "Ana", "edadAparente": "ESCOLAR" },
        "fotoUrl": "https://..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "hasNextPage": false }
  }
}
```

---

### `POST /api/nna`

**Roles:** `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`, `ADMINISTRADOR`.

**Request:**

```json
{
  "idOfflineFallback": "V18765432-1719412345678",
  "fotoUrl": "https://bucket.../foto.jpg",
  "datosNna": {
    "sexo": "F",
    "edadAparente": "ADOLESCENTE",
    "rasgosIdentificativos": "Camiseta roja, cicatriz en frente"
  },
  "vozDelNna": {
    "fueEscuchado": true,
    "manifestacion": "Quiere encontrar a su madre"
  },
  "hallazgo": {
    "fechaHora": "2026-06-26T08:30:00.000Z",
    "lugarExacto": "Av. Principal frente al hospital",
    "posicionGps": { "coordinates": [-67.6061, 10.2469] }
  },
  "ubicacion": {
    "state": "69a2171c6997fcf9e1ceea61",
    "city": "69a2171d6997fcf9e1ceea66"
  },
  "eventoInicial": {
    "eventoId": "550e8400-e29b-41d4-a716-446655440000",
    "tipoEvent": "REGISTRO_INICIAL",
    "ubicacionNombre": "Sitio de hallazgo",
    "estadoSalud": "ESTABLE"
  }
}
```

**Response 201:**

```json
{
  "success": true,
  "data": {
    "created": true,
    "nna": {
      "_id": "...",
      "idUnico": "DC-CCS-260626-001",
      "statusActual": "EN_SITIO",
      "timeline": [{ "tipoEvent": "REGISTRO_INICIAL" }]
    }
  }
}
```

**Response 200 (retry offline):** `{ "created": false, "nna": { ... } }`

| Errores | Código | Causa |
|---------|--------|-------|
| Adolescente sin `vozDelNna` | **400** | Art. 80 LOPNNA |
| GPS inválido | **400** | Coordenadas fuera de rango |
| Rol no autorizado | **403** | `No tienes permiso...` |
| Cuenta no activa | **403** | PENDIENTE / RECHAZADO / SUSPENDIDO |

---

### `GET /api/nna/:id`

**Response 200:** `{ "success": true, "data": { "nna": { ... timeline, cierreLegal } } }`

| Errores | Código |
|---------|--------|
| ID inválido (no 24 chars) | **400** |
| NNA no encontrado | **404** |

---

### `PATCH /api/nna/:id/ubicacion`

**Roles:** operadores de registro NNA.

**Request:**

```json
{
  "ubicacion": {
    "state": "...",
    "city": "..."
  }
}
```

**Response 200:** `{ "success": true, "data": { "nna": { ... } } }`

---

### `PATCH /api/nna/:id/timeline`

Hito **idempotente** por `eventoId` (UUID v4).

**Request (traslado con destino institucional):**

```json
{
  "eventoId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "tipoEvent": "TRASLADO",
  "ubicacionNombre": "Refugio Central Maracay",
  "entidadAtencionId": "507f1f77bcf86cd799439013",
  "estadoSalud": "ESTABLE",
  "observaciones": "Traslado coordinado"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "duplicated": false,
    "nna": { "statusActual": "EN_TRANSITO", "...": "..." }
  }
}
```

| `tipoEvent` | `statusActual` auto |
|-------------|---------------------|
| `TRASLADO` | `EN_TRANSITO` |
| `INGRESO_REFUGIO` | `RESGUARDADO` |
| `ENTREGA_OFICIAL` | `ENTREGADO_AUTORIDAD` |
| `ATENCION_MEDICA` | Sin cambio |

| Errores | Código | Causa |
|---------|--------|-------|
| Sin `entidadAtencionId` en TRASLADO/INGRESO_REFUGIO | **400** | Validación Zod |
| Entidad no autorizada | **403** | Destino no registrado |
| Rol no puede registrar evento | **403** | Matriz LOPNNA |
| NNA no encontrado | **404** | — |

> Permisos por evento: ver [PROTOCOLO-LOPNNA-API.md](./PROTOCOLO-LOPNNA-API.md)

---

### `POST /api/nna/:id/cierre-legal`

**Roles:** solo `CONSEJERO_CPNNA` y `ADMINISTRADOR`.

**Request:**

```json
{
  "eventoId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "codigoActaEntrega": "ACTA-2026-0045",
  "autoridadReceptora": {
    "nombre": "Lic. Patricia Rojas",
    "credencial": "CPNNA-AR-009"
  },
  "scannedActaUrl": "https://bucket.../acta.pdf",
  "notificadoAlCpnna": true,
  "fechaHoraNotificacion": "2026-06-26T14:00:00.000Z"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "duplicated": false,
    "nna": {
      "statusActual": "ENTREGADO_AUTORIDAD",
      "cierreLegal": { "codigoActaEntrega": "ACTA-2026-0045" }
    }
  }
}
```

| Errores | Código | Causa |
|---------|--------|-------|
| Adolescente sin `vozDelNna` previo | **400** | No se puede cerrar legalmente |
| Rol no CPNNA/Admin | **403** | Competencia exclusiva |
| `scannedActaUrl` faltante | **400** | Acta obligatoria |
| NNA no encontrado | **404** | — |

---

### `POST /api/nna/:id/archivos`

**Content-Type:** `multipart/form-data` — campos `archivo` + `tipo` (`FOTO_ROSTRO` | `ACTA_ENTREGA`).

**Response 201 (ACTA_ENTREGA):**

```json
{
  "success": true,
  "data": {
    "archivo": {
      "tipo": "ACTA_ENTREGA",
      "url": "https://bucket.../acta.pdf"
    }
  },
  "message": "Usa scannedActaUrl al registrar el cierre legal."
}
```

| Errores | Código |
|---------|--------|
| `tipo` inválido | **400** |
| Sin archivo | **400** |

---

## 4. Administradores

**Auth:** JWT + rol `ADMINISTRADOR` en todas las rutas `/api/admin/*`.

### `GET /api/admin`

Índice del módulo admin.

---

### `POST /api/auth/bootstrap-admin`

Primer administrador (una sola vez). Requiere `BOOTSTRAP_SECRET` en body.

**Request:**

```json
{
  "nombreCompleto": "Manuel Chaparro",
  "cedula": "V24781279",
  "telefono": "+584121234567",
  "rol": "ADMINISTRADOR",
  "bootstrapSecret": "tu-secreto-del-env",
  "fotoCedulaUrl": "https://...",
  "ubicacion": { "state": "...", "city": "..." }
}
```

**Response 201:** token + usuario admin activo.

| Errores | Código |
|---------|--------|
| Secreto inválido | **403** |
| Ya existe admin activo | **409** |

---

### `POST /api/auth/register`

Alta directa de cualquier rol por admin autenticado.

**Response 201:** token + usuario creado en `ACTIVO`.

---

### `GET /api/admin/usuarios`

**Query:** `estadoCuenta`, `rol`, `page`, `limit`.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "nombreCompleto": "Carlos Méndez",
        "cedula": "V18765432",
        "rol": "RESCATISTA_CIVIL",
        "estadoCuenta": "PENDIENTE"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "hasNextPage": false }
  }
}
```

---

### `PATCH /api/admin/usuarios/:id/aprobar`

**Response 200:**

```json
{
  "success": true,
  "data": { "user": { "estadoCuenta": "ACTIVO" } },
  "message": "Cuenta aprobada. El operador ya puede iniciar sesión."
}
```

| Errores | Código |
|---------|--------|
| Usuario no encontrado | **404** |
| No está en PENDIENTE | **400** |

---

### `PATCH /api/admin/usuarios/:id/rechazar`

**Request:**

```json
{
  "motivoRechazo": "Documentación de credencial ilegible o vencida."
}
```

**Response 200:** `{ "success": true, "data": { "user": { "estadoCuenta": "RECHAZADO" } } }`

---

### `POST /api/admin/instituciones`

**Request:**

```json
{
  "nombre": "Protección Civil Girardot",
  "tipo": "PROTECCION_CIVIL",
  "codigoOficial": "PC-GIR-001",
  "state": "69a2171c6997fcf9e1ceea61",
  "rolesPermitidos": ["RESCATISTA_CIVIL", "PROTECCION_CIVIL"],
  "activa": true
}
```

**Response 201:** `{ "success": true, "data": { "institution": { ... } } }`

| Errores | Código |
|---------|--------|
| Código oficial duplicado | **409** |

---

### `POST /api/admin/entidades-atencion`

**Request:**

```json
{
  "nombre": "Refugio Central Maracay",
  "tipo": "REFUGIO_OFICIAL",
  "state": "69a2171c6997fcf9e1ceea61",
  "direccion": "Av. Las Delicias",
  "autorizada": true
}
```

**Response 201:** `{ "success": true, "data": { "entidad": { ... } } }`

---

### Operaciones NNA como administrador

El admin usa los **mismos endpoints** de la sección 3 (`GET /api/nna`, filtros por `status`, `stateId`, `cityId`). No existe ruta `/api/admin/nna` separada.

---

## Matriz rápida por rol

| Endpoint | Rescatista | Prot. Civil | Médico | CPNNA | Admin |
|----------|:----------:|:-----------:|:------:|:-----:|:-----:|
| Catálogos públicos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Solicitud alta | ✓ | ✓ | ✓ | — | — |
| Login / me | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registrar NNA | ✓ | ✓ | ✓ | — | ✓ |
| Timeline operativo | ✓* | ✓* | ✓* | ✓* | ✓ |
| Ingreso refugio | — | ✓ | — | ✓ | ✓ |
| Cierre legal | — | — | — | ✓ | ✓ |
| Admin usuarios | — | — | — | — | ✓ |

\* Según matriz por `tipoEvent` — ver protocolo LOPNNA.

---

## Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [API-Users-Auth.md](./API-Users-Auth.md) | Auth, solicitud, login, perfil |
| [API-NNA.md](./API-NNA.md) | NNA en profundidad, PWA offline, ejemplos Axios |
| [API-Catalog.md](./API-Catalog.md) | Enums normalizados (`statusActual`, roles, etc.) |
| [API-Geo.md](./API-Geo.md) | Geografía administrativa Venezuela |
| [PROTOCOLO-LOPNNA-API.md](./PROTOCOLO-LOPNNA-API.md) | Permisos, voz NNA, traslados, cierre legal |
| [INFRAESTRUCTURA-CONEXIONES.md](./INFRAESTRUCTURA-CONEXIONES.md) | MongoDB, GCS/S3, n8n, `.env` |

---

## Resumen total de rutas

| # | Método | Ruta | Auth |
|---|--------|------|------|
| 1 | GET | `/api/health` | — |
| 2 | GET | `/api/catalog` | — |
| 3 | GET | `/api/catalog/all` | — |
| 4 | GET | `/api/catalog/:key` | — |
| 5 | GET | `/api/geo` | — |
| 6 | GET | `/api/geo/countries` | — |
| 7 | GET | `/api/geo/states` | — |
| 8 | GET | `/api/geo/states/:stateId/cities` | — |
| 9 | GET | `/api/geo/states/:stateId/municipalities` | — |
| 10 | GET | `/api/geo/municipalities/:municipalityId/parishes` | — |
| 11 | GET | `/api/institutions` | — |
| 12 | GET | `/api/institutions/:id` | — |
| 13 | GET | `/api/entidades-atencion` | — |
| 14 | GET | `/api/entidades-atencion/:id` | — |
| 15 | GET | `/api/auth` | — |
| 16 | POST | `/api/auth/solicitud` | — |
| 17 | POST | `/api/auth/bootstrap-admin` | — |
| 18 | POST | `/api/auth/login` | — |
| 19 | POST | `/api/auth/register` | Admin |
| 20 | GET | `/api/auth/me` | JWT |
| 21 | PATCH | `/api/auth/me` | JWT |
| 22 | GET | `/api/nna/meta` | — |
| 23 | POST | `/api/nna/subir-foto` | JWT + ACTIVO |
| 24 | GET | `/api/nna` | JWT + ACTIVO |
| 25 | POST | `/api/nna` | JWT + ACTIVO + rol registro |
| 26 | GET | `/api/nna/:id` | JWT + ACTIVO |
| 27 | PATCH | `/api/nna/:id/ubicacion` | JWT + ACTIVO + rol registro |
| 28 | PATCH | `/api/nna/:id/timeline` | JWT + ACTIVO + permiso evento |
| 29 | POST | `/api/nna/:id/cierre-legal` | JWT + ACTIVO + CPNNA/Admin |
| 30 | POST | `/api/nna/:id/archivos` | JWT + ACTIVO + rol registro |
| 31 | GET | `/api/admin` | Admin |
| 32 | GET | `/api/admin/usuarios` | Admin |
| 33 | PATCH | `/api/admin/usuarios/:id/aprobar` | Admin |
| 34 | PATCH | `/api/admin/usuarios/:id/rechazar` | Admin |
| 35 | POST | `/api/admin/instituciones` | Admin |
| 36 | POST | `/api/admin/entidades-atencion` | Admin |

**Total: 36 endpoints** de negocio bajo `/api`.
