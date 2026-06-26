# 🔌 Infraestructura y Conexiones — Guía de despliegue

Documentación técnica para configurar **MongoDB**, **Google Cloud Storage (GCS)**, webhooks **n8n** y el resto de servicios externos que usa el backend.

> Archivos clave en el repo: `src/config/env.js`, `src/services/storage.service.js`, `src/config/database.js`, `.env.example`.

---

## Índice

- [Arquitectura de servicios](#arquitectura-de-servicios)
- [Variables de entorno](#variables-de-entorno)
- [MongoDB](#mongodb)
- [Google Cloud Storage (GCS)](#google-cloud-storage-gcs)
- [Rutas y objetos en el bucket](#rutas-y-objetos-en-el-bucket)
- [Flujo de subida de archivos (API)](#flujo-de-subida-de-archivos-api)
- [AWS S3 (alternativa)](#aws-s3-alternativa)
- [Webhooks n8n](#webhooks-n8n)
- [Checklist de puesta en marcha](#checklist-de-puesta-en-marcha)
- [Errores frecuentes](#errores-frecuentes)

---

## Arquitectura de servicios

```mermaid
flowchart LR
  PWA[PWA / Front] -->|JWT + JSON/multipart| API[Express API]
  API -->|Mongoose| MONGO[(MongoDB Atlas / Local)]
  API -->|@google-cloud/storage| GCS[(GCS Bucket)]
  API -->|fetch POST| N8N[n8n Webhook]
  API -->|seed script| GEO[Catálogo geo VE]
  GEO --> MONGO
```

| Servicio | Paquete npm | Archivo principal | Obligatorio |
|----------|-------------|-------------------|-------------|
| MongoDB | `mongoose` | `src/config/database.js` | **Sí** |
| GCS | `@google-cloud/storage` | `src/services/storage.service.js` | **Sí** (fotos/actas) |
| AWS S3 | `@aws-sdk/client-s3` | `src/services/storage.service.js` | No (alternativa) |
| n8n | `fetch` nativo | `src/services/n8nWebhook.service.js` | No (alertas) |
| JWT | `jsonwebtoken` | `src/services/auth.service.js` | **Sí** |

El proveedor de almacenamiento se elige con **`STORAGE_PROVIDER`** (`gcs` o `s3`). Para este proyecto en producción se recomienda **`gcs`**.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
# Servidor
PORT=4000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/hogarparavenezuela

# JWT
JWT_SECRET=genera-un-secreto-largo-y-aleatorio
JWT_EXPIRES_IN=8h

# Almacenamiento — usar gcs en producción
STORAGE_PROVIDER=gcs

# Google Cloud Storage
GCS_PROJECT_ID=tu-proyecto-gcp
GCS_BUCKET=hogarparavenezuela-media
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcs-service-account.json

# Webhooks n8n (opcional)
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/alertas-nna
N8N_WEBHOOK_SECRET=clave-compartida-opcional

# CORS — URL del front / PWA
CORS_ORIGIN=https://tu-front.com
```

| Variable | Descripción | Default en código |
|----------|-------------|-------------------|
| `MONGODB_URI` | URI de conexión MongoDB | `mongodb://localhost:27017/hogarparavenezuela` |
| `STORAGE_PROVIDER` | `gcs` o `s3` | `s3` |
| `GCS_PROJECT_ID` | ID del proyecto GCP | — |
| `GCS_BUCKET` | Nombre del bucket | — |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON de cuenta de servicio | — |
| `JWT_SECRET` | Firma de tokens | `dev-secret-change-me` ⚠️ |

> **Seguridad:** nunca subas `.env` ni `credentials/` a git. Ya están en `.gitignore`.

---

## MongoDB

### Colecciones que usa el backend

| Colección Mongoose | Modelo | Contenido |
|--------------------|--------|-----------|
| `users` | `User` | Operadores (rescatistas, CPNNA, etc.) |
| `nnarecords` | `NnaRecord` | Registros NNA + timeline + cierre legal |
| `countries` | `Country` | Países (Venezuela) |
| `states` | `State` | Estados |
| `municipalities` | `Municipality` | Municipios |
| `parishes` | `Parish` | Parroquias |
| `cities` | `City` | Ciudades |

### Opción A — Local (desarrollo)

1. Instala [MongoDB Community](https://www.mongodb.com/try/download/community) o usa Docker:

```powershell
docker run -d --name mongo-hogar -p 27017:27017 mongo:7
```

2. En `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/hogarparavenezuela
```

3. Carga el catálogo geográfico:

```powershell
npm run seed:geo
```

### Opción B — MongoDB Atlas (producción recomendada)

1. Crea un cluster en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → usuario con rol `readWrite` sobre la BD.
3. **Network Access** → permite la IP del servidor (o `0.0.0.0/0` solo en pruebas).
4. **Connect** → copia la URI `mongodb+srv://...` y ponla en `MONGODB_URI`.
5. Ejecuta el seed geo **una vez** contra Atlas:

```powershell
npm run seed:geo
```

### Índices importantes (automáticos vía Mongoose)

- `NnaRecord`: `hallazgo.posicionGps` (**2dsphere**), `timeline.eventoId`, `ubicacion.state/city`
- `User`: `cedula` (único)
- Geo: índices únicos por `state+name`, `municipality+name`, etc.

### Verificar conexión

```powershell
npm run dev
```

Si MongoDB no responde verás:

```text
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

---

## Google Cloud Storage (GCS)

### Recursos GCP necesarios

| Recurso GCP | Nombre sugerido | Propósito |
|-------------|-----------------|-----------|
| **Proyecto** | `hogarparavenezuela-prod` | Contenedor de recursos |
| **Bucket Cloud Storage** | `hogarparavenezuela-media` | Fotos de rostro, actas PDF, pre-subidas |
| **Service Account** | `hogarparavenezuela-backend` | Credenciales del API para escribir/leer |
| **Rol IAM** | `Storage Object Admin` (o `Storage Object Creator` + `Viewer`) | Subida y URLs firmadas |

### Paso 1 — Crear proyecto y bucket

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona un proyecto → anota el **Project ID** → `GCS_PROJECT_ID`.
3. **Cloud Storage → Buckets → Create**:
   - **Name:** `hogarparavenezuela-media` (globalmente único)
   - **Location:** región cercana (ej. `southamerica-east1` São Paulo o `us-east1`)
   - **Storage class:** Standard
   - **Access control:** Uniform (recomendado)
   - **Public access:** Prevent public access (el API usa URLs firmadas)

### Paso 2 — Cuenta de servicio

1. **IAM & Admin → Service Accounts → Create**.
2. Nombre: `hogarparavenezuela-backend`.
3. Rol: **Storage Object Admin** sobre el bucket (o a nivel proyecto si prefieres).
4. **Keys → Add key → JSON** → descarga el archivo.
5. Guárdalo en el servidor:

```text
hogarparavenezuela-back/
  credentials/
    gcs-service-account.json   ← NO commitear
```

6. En `.env`:

```env
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=hogarparavenezuela-prod
GCS_BUCKET=hogarparavenezuela-media
GOOGLE_APPLICATION_CREDENTIALS=./credentials/gcs-service-account.json
```

### Paso 3 — Instalar dependencia (ya en el proyecto)

```powershell
npm install
```

Paquete usado: `@google-cloud/storage` (ver `package.json`).

### Paso 4 — Cómo se autentica el código

```54:91:src/services/storage.service.js
const gcsStorage = {
  uploadStream: async ({ key, stream, contentType }) => {
    // ...
    const storage = createGcsClient();
    const file = storage.bucket(env.gcs.bucket).file(key);
    // pipe del stream HTTP → GCS
    // ...
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: ... });
    return { storagePath: key, url: signedUrl };
  },
  // ...
};
```

El cliente se crea con:

- `projectId` → `GCS_PROJECT_ID`
- `keyFilename` → `GOOGLE_APPLICATION_CREDENTIALS`

### Paso 5 — URLs de lectura

Tras subir un archivo, el API devuelve:

| Campo | Descripción |
|-------|-------------|
| `storagePath` | Ruta interna en el bucket (ej. `nna/previa/V12345678-uuid.jpg`) |
| `url` / `fotoUrl` | **URL firmada** válida ~1 hora (lectura temporal) |

> Las URLs firmadas expiran. Para producción a largo plazo conviene:
> - regenerar URL con `storageService.getSignedUrl({ key })` al servir detalle, o
> - configurar un CDN / bucket policy según política institucional.

### Paso 6 — CORS del bucket (si el front sube directo a GCS en el futuro)

Hoy el front sube vía **multipart al API** (`POST /api/nna/subir-foto`), no directo a GCS. Si más adelante usas subida directa desde el navegador, configura CORS en el bucket:

```json
[
  {
    "origin": ["https://tu-front.com", "http://localhost:3000"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

```powershell
# Ejemplo con gcloud CLI
gcloud storage buckets update gs://hogarparavenezuela-media --cors-file=cors.json
```

### Paso 7 — Despliegue en GCP (Cloud Run / GCE / GKE)

En lugar de archivo JSON puedes usar **Application Default Credentials**:

- En Cloud Run: adjunta la service account al servicio (sin `GOOGLE_APPLICATION_CREDENTIALS`).
- El SDK `@google-cloud/storage` detecta credenciales del entorno automáticamente.

Para Cloud Run, asigna a la service account del servicio el rol **Storage Object Admin** en el bucket.

---

## Rutas y objetos en el bucket

Rastreo completo desde el código:

| Ruta GCS (`storagePath`) | Endpoint API | Tipo MIME | Uso |
|--------------------------|--------------|-----------|-----|
| `nna/previa/{cedula}-{uuid}.{ext}` | `POST /api/nna/subir-foto` | JPEG, PNG, WebP | Foto previa antes de crear NNA |
| `nna/{nnaId}/foto_rostro-{uuid}.{ext}` | `POST /api/nna/:id/archivos` (`tipo=FOTO_ROSTRO`) | JPEG, PNG, WebP | Actualizar foto del registro |
| `nna/{nnaId}/acta_entrega-{uuid}.{ext}` | `POST /api/nna/:id/archivos` (`tipo=ACTA_ENTREGA`) | PDF (típico) | Acta escaneada → `scannedActaUrl` |

### Límites de subida (middleware)

Definidos en `src/middleware/upload.js`:

| Regla | Valor |
|-------|-------|
| Tamaño máximo | **10 MB** por archivo |
| MIME permitidos | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Campo multipart | `archivo` |
| Auth | JWT obligatorio en todos los endpoints de subida |

### Dónde se guardan las URLs en MongoDB

| Campo MongoDB | Origen | Modelo |
|---------------|--------|--------|
| `fotoUrl` | Subida foto rostro | `NnaRecord` (obligatorio) |
| `cierreLegal.scannedActaUrl` | Subida acta + cierre legal | `NnaRecord` |
| `hallazgo.posicionGps` | GPS del dispositivo (GeoJSON) | `NnaRecord` (no es GCS) |

---

## Flujo de subida de archivos (API)

### Flujo A — Registrar NNA con foto (recomendado)

```text
1. POST /api/nna/subir-foto     (multipart, JWT)
   → respuesta: { fotoUrl, storagePath }

2. POST /api/nna                (JSON, JWT)
   body: { fotoUrl, datosNna, hallazgo, ubicacion, ... }
```

### Flujo B — Acta de entrega oficial

```text
1. POST /api/nna/:id/archivos  (tipo=ACTA_ENTREGA, PDF)
   → respuesta: { archivo: { url, storagePath } }

2. POST /api/nna/:id/cierre-legal  (JWT + rol autorizado)
   body: { scannedActaUrl: "<url del paso 1>", codigoActaEntrega, ... }
```

### Ejemplo Postman — subir foto previa

| Campo | Valor |
|--------|--------|
| Método | `POST` |
| URL | `http://localhost:4000/api/nna/subir-foto` |
| Authorization | Bearer `<JWT>` |
| Body | form-data |

| KEY | TYPE | VALUE |
|-----|------|--------|
| `archivo` | File | `rostro.jpg` |

Respuesta **201**:

```json
{
  "success": true,
  "data": {
    "fotoUrl": "https://storage.googleapis.com/...",
    "storagePath": "nna/previa/V12345678-a1b2c3d4.jpg"
  },
  "message": "Usa fotoUrl al crear el registro NNA."
}
```

---

## AWS S3 (alternativa)

Si `STORAGE_PROVIDER=s3`, configura:

```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=hogarparavenezuela-media
```

El código usa `@aws-sdk/client-s3`. Las rutas (`nna/previa/...`, `nna/{id}/...`) son **idénticas** en ambos proveedores.

En S3 la URL pública devuelta es:

```text
https://{bucket}.s3.{region}.amazonaws.com/{key}
```

(sin firma; valora hacer el bucket privado + CloudFront en producción).

---

## Webhooks n8n

Integración saliente para alertas (SMS, Telegram, email, etc.).

| Evento | Cuándo se dispara |
|--------|-------------------|
| `NNA_REGISTRADO` | Tras crear un NNA |
| `NNA_TIMELINE_ACTUALIZADO` | Tras agregar hito al timeline |
| `NNA_CIERRE_LEGAL` | Tras cierre legal |

### Configuración

```env
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/alertas-nna
N8N_WEBHOOK_SECRET=opcional-clave-compartida
```

Payload enviado:

```json
{
  "eventType": "NNA_REGISTRADO",
  "emittedAt": "2026-06-26T14:00:00.000Z",
  "payload": {
    "idUnico": "DC-CCS-260626-001",
    "statusActual": "EN_SITIO",
    "datosNna": { "...": "..." },
    "hallazgo": { "...": "..." },
    "ubicacion": { "...": "..." }
  }
}
```

Header opcional: `X-Webhook-Secret: {N8N_WEBHOOK_SECRET}`.

> Si `N8N_WEBHOOK_URL` está vacía, el API **no falla**; solo omite el envío (modo degradado).

---

## Checklist de puesta en marcha

### Desarrollo local

- [ ] `npm install`
- [ ] MongoDB corriendo (`docker` o local)
- [ ] `.env` con `MONGODB_URI`
- [ ] `npm run seed:geo`
- [ ] GCS configurado **o** S3 para probar subidas
- [ ] `npm run dev` → `GET /api/health` responde 200

### Producción

- [ ] MongoDB Atlas con URI en `MONGODB_URI`
- [ ] `npm run seed:geo` ejecutado contra Atlas
- [ ] Proyecto GCP + bucket + service account
- [ ] `STORAGE_PROVIDER=gcs` y credenciales en servidor
- [ ] `JWT_SECRET` fuerte y único
- [ ] `CORS_ORIGIN` apuntando al dominio del front/PWA
- [ ] n8n webhook configurado (si aplica alertas)
- [ ] Carpeta `credentials/` con permisos restringidos (chmod 600)

### Comandos útiles

```powershell
# Instalar dependencias
npm install

# Arrancar API
npm run dev

# Cargar catálogo geográfico Venezuela
npm run seed:geo

# Recargar catálogo desde cero
npm run seed:geo:drop

# Tests (no requieren Mongo ni GCS)
npm test
```

---

## Errores frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB no corre | Levantar Mongo o usar Atlas URI |
| `Bucket GCS no configurado` (503) | Falta `GCS_BUCKET` | Completar `.env` |
| `Could not load the default credentials` | JSON de service account inválido o ruta incorrecta | Verificar `GOOGLE_APPLICATION_CREDENTIALS` |
| `403 Forbidden` al subir a GCS | Service account sin permisos | Rol Storage Object Admin en el bucket |
| `Catálogo geográfico no inicializado` (503) | Sin seed geo | `npm run seed:geo` |
| `Tipo de archivo no permitido` (400) | MIME no soportado | Solo JPEG, PNG, WebP, PDF |
| URL de foto expirada en el front | URL firmada GCS (~1h) | Regenerar con nuevo upload o `getSignedUrl` |

---

## Referencias cruzadas

| Tema | Documento |
|------|-----------|
| Endpoints de subida NNA | [API-NNA.md](./API-NNA.md) |
| Catálogo geo / ubicación | [API-Geo.md](./API-Geo.md) |
| Auth JWT | [API-Users-Auth.md](./API-Users-Auth.md) |
| Variables base | `.env.example` |

Con esta guía tienes el mapa completo de **qué servicios conectar**, **cómo instalarlos** y **cómo los consume el código** del backend.
