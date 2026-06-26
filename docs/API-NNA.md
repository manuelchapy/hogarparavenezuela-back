# 📚 API de NNA - Documentación para Frontend

Plataforma de **Rescate y Trazabilidad de NNA** — alineada al modelo `NnaRecord` (`src/models/Nna.js`).

## Índice
- [Seguridad y contexto](#-seguridad-y-contexto)
- [Sincronización offline (PWA)](#sincronización-offline-pwa)
- [Fotografía obligatoria](#fotografía-obligatoria)
- [Resumen de endpoints](#-resumen-de-endpoints)
- [GET /api/nna — Listado](#-get-apinna--listado)
- [Endpoints detallados](#-endpoints-detallados)
- [Modelo de datos (NnaRecord)](#-modelo-de-datos-nnarecord)
- [Estados, eventos y salud](#estados-eventos-y-salud)
- [Flujos recomendados](#-flujos-recomendados)
- [Ejemplos Axios](#-ejemplos-axios)

---

## 🔐 **Seguridad y contexto**

- **Auth**: JWT — ver [API-Users-Auth.md](./API-Users-Auth.md).
- **Enums**: `statusActual`, timeline, salud → [API-Catalog.md](./API-Catalog.md) (`GET /api/catalog/nna-status`).
- **Ruta crítica por rol**: `POST /api/nna/:id/cierre-legal` → solo `CONSEJERO_CPNNA` y `ADMINISTRADOR`.
- **Referencia completa**: [API-ENDPOINTS.md](./API-ENDPOINTS.md).

---

## Sincronización offline (PWA)

| Campo | Formato | Comportamiento en retry |
|-------|---------|-------------------------|
| `idOfflineFallback` | `CEDULA_RESCATISTA-TIMESTAMP` | Si existe → **200**, `created: false` |
| `eventoId` (timeline) | UUID v4 | Si existe → **200**, `duplicated: true` |

---

## Fotografía obligatoria

`fotoUrl` es **obligatoria** en el modelo. Flujo recomendado:

1. `POST /api/nna/subir-foto` (multipart) → obtienes `fotoUrl`.
2. `POST /api/nna` con ese `fotoUrl` en el body JSON.

Alternativa: subir después con `POST /api/nna/:id/archivos` (`tipo=FOTO_ROSTRO`) solo si el registro ya existe.

---

## 🚀 **Resumen de Endpoints**

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/nna/meta` | Info del módulo (sin auth) |
| `POST` | `/api/nna/subir-foto` | Subir foto previa al registro |
| `GET` | `/api/nna` | Listado paginado (`status`, `stateId`, `cityId`) |
| `POST` | `/api/nna` | Crear registro NNA |
| `GET` | `/api/nna/:id` | Detalle con timeline y cierre legal |
| `PATCH` | `/api/nna/:id/ubicacion` | Actualizar ubicación administrativa |
| `PATCH` | `/api/nna/:id/timeline` | Agregar hito (**idempotente**) |
| `POST` | `/api/nna/:id/cierre-legal` | Cierre jurídico LOPNNA |
| `POST` | `/api/nna/:id/archivos` | Foto rostro o acta escaneada |

---

## 📡 **GET /api/nna — Listado**

**Query**: `page`, `limit`, `status` (`EN_SITIO` \| `EN_TRANSITO` \| `RESGUARDADO` \| `ENTREGADO_AUTORIDAD`), `stateId`, `cityId`.

> Valores de `status` normalizados: `GET /api/catalog/nna-status`.

**Response 200** (ejemplo):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "67a1b2c3d4e5f6789012345a",
        "idUnico": "DC-CCS-260626-001",
        "datosNna": {
          "nombre": "Ana",
          "edadAparente": "ESCOLAR"
        },
        "statusActual": "RESGUARDADO",
        "fotoUrl": "https://bucket.../nna/previa/foto.jpg",
        "hallazgo": { "lugarExacto": "Av. Principal, edificio 12" },
        "createdAt": "2026-06-26T08:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "hasNextPage": false }
  }
}
```

---

## 📡 **Endpoints detallados**

### 1. `POST /api/nna/subir-foto`

| KEY | TYPE | VALUE |
|-----|------|--------|
| `archivo` | File | `rostro.jpg` |

**Response 201**:
```json
{
  "success": true,
  "data": {
    "fotoUrl": "https://bucket.../nna/previa/V12345678-uuid.jpg",
    "storagePath": "nna/previa/V12345678-uuid.jpg"
  },
  "message": "Usa fotoUrl al crear el registro NNA."
}
```

---

### 2. `POST /api/nna` – Crear registro

#### **Body completo**

```json
{
  "idOfflineFallback": "V12345678-1719412345678",
  "idUnico": "DC-CCS-260626-001",
  "fotoUrl": "https://bucket.../nna/previa/foto.jpg",
  "datosNna": {
    "nombre": "Ana",
    "nombrePadres": "Desconocido/No recuerda",
    "sexo": "F",
    "edadAparente": "ESCOLAR",
    "rasgosIdentificativos": "Cicatriz en frente, camiseta roja"
  },
  "hallazgo": {
    "fechaHora": "2026-06-26T08:30:00.000Z",
    "lugarExacto": "Av. Principal frente al hospital",
    "posicionGps": {
      "coordinates": [-67.6061, 10.2469]
    }
  },
  "ubicacion": {
    "state": "69a2171c6997fcf9e1ceea61",
    "city": "69a2171d6997fcf9e1ceea66"
  },
  "vozDelNna": {
    "fueEscuchado": true,
    "manifestacion": "Quiere encontrar a su madre"
  },
  "eventoInicial": {
    "eventoId": "550e8400-e29b-41d4-a716-446655440000",
    "tipoEvent": "REGISTRO_INICIAL",
    "ubicacionNombre": "Sitio de hallazgo — Av. Principal",
    "estadoSalud": "ESTABLE",
    "observaciones": "Menor encontrado solo, consciente"
  }
}
```

> `posicionGps.coordinates` = `[longitud, latitud]`.

#### **Campos `datosNna`**

| Campo | Obligatorio | Valores |
|-------|-------------|---------|
| `nombre` | No | Default: `"Desconocido/No recuerda"` |
| `nombrePadres` | No | Default: `"Desconocido/No recuerda"` |
| `sexo` | Sí | `F`, `M`, `DESCONOCIDO` |
| `edadAparente` | Sí | `LACTANTE`, `PREESCOLAR`, `ESCOLAR`, `ADOLESCENTE` — ver `/api/catalog/edad-aparente` |
| `rasgosIdentificativos` | Sí | Señas particulares |
| `vozDelNna` | Sí si `ADOLESCENTE` | Art. 80 LOPNNA — ver [PROTOCOLO-LOPNNA-API.md](./PROTOCOLO-LOPNNA-API.md) |
| `ubicacion` | Sí | `state` + `city` (ObjectId geo) |

#### **Response 201**

```json
{
  "success": true,
  "data": {
    "created": true,
    "nna": {
      "_id": "67a1b2c3d4e5f6789012345a",
      "idUnico": "DC-CCS-260626-001",
      "statusActual": "EN_SITIO",
      "fotoUrl": "https://...",
      "datosNna": { "...": "..." },
      "hallazgo": { "...": "..." },
      "timeline": [
        {
          "eventoId": "550e8400-e29b-41d4-a716-446655440000",
          "tipoEvent": "REGISTRO_INICIAL",
          "ubicacionNombre": "Sitio de hallazgo — Av. Principal",
          "estadoSalud": "ESTABLE",
          "custodioResponsable": {
            "nombre": "María González",
            "cedula": "V12345678",
            "telefono": "+584121234567",
            "institucion": "Protección Civil Municipio Girardot"
          }
        }
      ],
      "cierreLegal": {}
    }
  }
}
```

---

### 3. `PATCH /api/nna/:id/timeline` – Hito idempotente

#### **Body — traslado**

```json
{
  "eventoId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "tipoEvent": "TRASLADO",
  "ubicacionNombre": "Refugio Central Maracay",
  "entidadAtencionId": "507f1f77bcf86cd799439013",
  "estadoSalud": "ESTABLE",
  "custodioResponsable": {
    "nombre": "Carlos Méndez",
    "cedula": "V87654321",
    "telefono": "+584129998877",
    "institucion": "Protección Civil"
  },
  "observaciones": "Traslado coordinado con CPNNA"
}
```

| `tipoEvent` | `statusActual` resultante (auto) |
|-------------|----------------------------------|
| `TRASLADO` | `EN_TRANSITO` |
| `INGRESO_REFUGIO` | `RESGUARDADO` |
| `ENTREGA_OFICIAL` | `ENTREGADO_AUTORIDAD` |
| `ATENCION_MEDICA` | Sin cambio automático |

Puedes forzar estado con `nuevoStatus` opcional.

> `TRASLADO` e `INGRESO_REFUGIO` **requieren** `entidadAtencionId` de `/api/entidades-atencion?autorizada=true`.

#### **Response 200**

```json
{
  "success": true,
  "data": {
    "duplicated": false,
    "nna": { "...": "..." }
  }
}
```

#### **Errores frecuentes**

| Código | Causa |
|--------|-------|
| **400** | Sin `entidadAtencionId` en traslado/refugio |
| **403** | Rol no puede registrar ese `tipoEvent` |
| **403** | Entidad destino no autorizada |
| **404** | NNA no encontrado |

---

### 4. `POST /api/nna/:id/cierre-legal` – Cierre jurídico

Solo roles: `CONSEJERO_CPNNA`, `ADMINISTRADOR`. **Acta escaneada obligatoria** (`scannedActaUrl`).

```json
{
  "eventoId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "notificadoAlCpnna": true,
  "fechaHoraNotificacion": "2026-06-26T14:00:00.000Z",
  "codigoActaEntrega": "ACTA-2026-0045",
  "autoridadReceptora": {
    "nombre": "Lic. Patricia Rojas",
    "credencial": "CPNNA-AR-009"
  },
  "scannedActaUrl": "https://bucket.../nna/67a1.../acta.pdf",
  "archivadoPorRescatista": true
}
```

Actualiza `cierreLegal` y `statusActual: ENTREGADO_AUTORIDAD`. El lapso de 6 horas se audita con `fechaHoraNotificacion`.

---

### 5. `POST /api/nna/:id/archivos`

| `tipo` | Efecto |
|--------|--------|
| `FOTO_ROSTRO` | Actualiza `fotoUrl` del registro |
| `ACTA_ENTREGA` | Devuelve URL para usar en `scannedActaUrl` del cierre legal |

---

## 🧱 **Modelo de datos (NnaRecord)**

Colección: **`nnarecords`** (Mongoose: `NnaRecord`).

### Raíz

| Campo | Tipo | Notas |
|-------|------|-------|
| `idUnico` | String | Formato `DC-CCS-260626-001` |
| `idOfflineFallback` | String | `CEDULA-TIMESTAMP` |
| `statusActual` | Enum | Ver tabla de estados |
| `fotoUrl` | String | **Obligatoria** |
| `datosNna` | Object | Embebido |
| `hallazgo` | Object | `fechaHora`, `lugarExacto`, `posicionGps` |
| `timeline` | Array | Eventos de trazabilidad |
| `cierreLegal` | Object | Cierre LOPNNA |

### `timeline[]`

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `eventoId` | Sí | UUID — idempotencia |
| `tipoEvent` | Sí | Tipo de hito |
| `fechaHora` | Auto | Fecha del evento |
| `ubicacionNombre` | Sí | Centro o sitio oficial |
| `estadoSalud` | Sí | Estado clínico aparente |
| `custodioResponsable` | Sí | Quien recibe al NNA en ese punto |
| `observaciones` | No | Notas libres |

### `cierreLegal`

| Campo | Descripción |
|-------|-------------|
| `notificadoAlCpnna` | Boolean |
| `fechaHoraNotificacion` | Auditoría lapso 6 h |
| `codigoActaEntrega` | ID acta física |
| `autoridadReceptora` | `{ nombre, credencial }` |
| `scannedActaUrl` | PDF/imagen en S3/GCS |
| `archivadoPorRescatista` | Boolean |

---

## Estados, eventos y salud

### `statusActual`

Consultar catálogo: `GET /api/catalog/nna-status`.

| Valor | UI |
|-------|-----|
| `EN_SITIO` | En sitio de hallazgo |
| `EN_TRANSITO` | En traslado |
| `RESGUARDADO` | En refugio |
| `ENTREGADO_AUTORIDAD` | Entregado a autoridad |

### `estadoSalud` (timeline)

`ESTABLE` \| `REQUIERE_ATENCION_URGENTE` \| `CON_LESIONES_VISIBLES`

### TypeScript

```typescript
type NnaStatus = 'EN_SITIO' | 'EN_TRANSITO' | 'RESGUARDADO' | 'ENTREGADO_AUTORIDAD';

type TimelineEvent = {
  eventoId: string;
  tipoEvent: 'REGISTRO_INICIAL' | 'TRASLADO' | 'ATENCION_MEDICA' | 'INGRESO_REFUGIO' | 'ENTREGA_OFICIAL';
  ubicacionNombre: string;
  estadoSalud: 'ESTABLE' | 'REQUIERE_ATENCION_URGENTE' | 'CON_LESIONES_VISIBLES';
  custodioResponsable: {
    nombre: string;
    cedula: string;
    telefono: string;
    institucion: string;
  };
  observaciones?: string;
};
```

---

## 🔄 **Flujos recomendados**

### Registro en campo
1. `POST /api/nna/subir-foto`
2. Generar `idOfflineFallback` + `eventoId` localmente
3. `POST /api/nna` con GPS, `datosNna` y `fotoUrl`
4. Mostrar `idUnico` o `_id` para seguimiento

### Atención médica
`PATCH .../timeline` con `tipoEvent: ATENCION_MEDICA` y `estadoSalud` actualizado.

### Cierre legal
1. Subir acta → `POST .../archivos` (`ACTA_ENTREGA`)
2. `POST .../cierre-legal` con `scannedActaUrl` y `codigoActaEntrega`

---

## 🧪 **Ejemplos Axios**

```javascript
export const crearNnaEnCampo = async (api, payload) => {
  const { data: foto } = await api.post('/api/nna/subir-foto', formDataConArchivo);
  const { data } = await api.post('/api/nna', {
    ...payload,
    fotoUrl: foto.data.fotoUrl,
    idOfflineFallback: `${rescatistaCedula}-${Date.now()}`,
  });
  return data.data;
};

export const agregarHito = async (api, nnaId, evento) => {
  const { data } = await api.patch(`/api/nna/${nnaId}/timeline`, {
    eventoId: crypto.randomUUID(),
    ...evento,
  });
  return data.data;
};
```

Autenticación: **[API-Users-Auth.md](./API-Users-Auth.md)**.
