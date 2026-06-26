# Protocolo LOPNNA — Reglas de la API

Documentación de cumplimiento normativo implementado en el backend. Cruza principios del protocolo sísmico con endpoints, roles y validaciones.

---

## Índice

- [Modelo de alta de operadores](#modelo-de-alta-de-operadores)
- [Matriz de roles y permisos](#matriz-de-roles-y-permisos)
- [Voz del NNA (Art. 80 LOPNNA)](#voz-del-nna-art-80-lopnna)
- [Traslados institucionales (§3)](#traslados-institucionales-3)
- [Cierre legal y CPNNA (arts. 158–160)](#cierre-legal-y-cpnna-arts-158160)
- [Auditoría](#auditoría)
- [Flujo operativo recomendado](#flujo-operativo-recomendado)

---

## Modelo de alta de operadores

### Solicitud pública (roles operativos)

```http
POST /api/auth/solicitud
```

Solo roles: `RESCATISTA_CIVIL`, `PROTECCION_CIVIL`, `PERSONAL_MEDICO`.

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `cedula` | Sí | Formato `V12345678` |
| `credencialOficialId` | No | Placa / código institucional |
| `fotoCedulaUrl` | Sí* | Foto de la cédula (*si no hay credencial) |
| `fotoCredencialUrl` | Sí** | Foto de la credencial (**si hay `credencialOficialId`) |
| `institucion` | No | Texto libre (nombre del grupo/institución) |
| `institucionId` | No | Catálogo opcional `/api/institutions` |

**Respuesta:** `202` — cuenta en `estadoCuenta: PENDIENTE`. **Sin token operativo.**

### Aprobación administrativa

```http
PATCH /api/admin/usuarios/:id/aprobar
Authorization: Bearer <token ADMINISTRADOR>
```

Tras aprobación: `estadoCuenta: ACTIVO` → el operador puede hacer `POST /api/auth/login`.

### Alta directa (admin)

```http
POST /api/auth/register
Authorization: Bearer <token ADMINISTRADOR>
```

Permite cualquier rol, incluido `CONSEJERO_CPNNA`. Cuenta activa inmediata.

### Bootstrap inicial

```http
POST /api/auth/bootstrap-admin
```

Solo funciona si **no existe** un administrador activo. Requiere `BOOTSTRAP_SECRET` en `.env`.

---

## Matriz de roles y permisos

| Acción | Roles permitidos |
|--------|------------------|
| `POST /api/nna` | Rescatista, PC, Médico, Admin |
| `PATCH /api/nna/:id/timeline` `REGISTRO_INICIAL` | Rescatista, PC, Médico, Admin |
| `PATCH .../timeline` `TRASLADO` | Rescatista, PC, Médico, Admin + **entidadAtencionId** |
| `PATCH .../timeline` `ATENCION_MEDICA` | Médico, PC, Admin |
| `PATCH .../timeline` `INGRESO_REFUGIO` | PC, CPNNA, Admin + **entidadAtencionId** |
| `PATCH .../timeline` `ENTREGA_OFICIAL` | **Solo CPNNA, Admin** |
| `POST /api/nna/:id/cierre-legal` | **Solo CPNNA, Admin** |

> Protección Civil **ya no** puede cerrar legalmente. Su función es operativa de auxilio.

---

## Voz del NNA (Art. 80 LOPNNA)

En `POST /api/nna`, si `datosNna.edadAparente === 'ADOLESCENTE'`:

```json
{
  "vozDelNna": {
    "fueEscuchado": true,
    "manifestacion": "Quiere buscar a su tía en el refugio",
    "nivelComprension": "ADOLESCENTE"
  }
}
```

Si `fueEscuchado: false`, obligatorio `justificacionNoEscucha`.

El cierre legal de un adolescente **exige** que exista `vozDelNna` en el registro.

---

## Traslados institucionales (§3)

Eventos `TRASLADO` e `INGRESO_REFUGIO` requieren:

```json
{
  "entidadAtencionId": "507f1f77bcf86cd799439013",
  "ubicacionNombre": "Refugio Municipal Los Teques"
}
```

La entidad debe existir en `/api/entidades-atencion` con `autorizada: true`.

Entrega a particulares (sin `entidadAtencionId`) → **403**.

---

## Cierre legal y CPNNA (arts. 158–160)

`POST /api/nna/:id/cierre-legal` — campos **obligatorios**:

```json
{
  "codigoActaEntrega": "ACTA-2026-0045",
  "scannedActaUrl": "https://storage.googleapis.com/.../acta.pdf",
  "autoridadReceptora": {
    "nombre": "Ana Rodríguez",
    "credencial": "CPNNA-AR-008"
  }
}
```

Registra evento `ENTREGA_OFICIAL` y estado `ENTREGADO_AUTORIDAD`.

---

## Auditoría

Colección `auditlogs`. Acciones registradas:

| Acción | Cuándo |
|--------|--------|
| `USUARIO_SOLICITUD` | Alta pública |
| `USUARIO_APROBADO` / `USUARIO_RECHAZADO` | Admin |
| `NNA_REGISTRADO` | Crear NNA |
| `NNA_TIMELINE` | Hito en timeline |
| `NNA_CIERRE_LEGAL` | Cierre legal |
| `NNA_UBICACION` | Cambio ubicación administrativa |

---

## Flujo operativo recomendado

```text
1. npm run seed:geo
2. npm run seed:institutions
3. POST /api/auth/bootstrap-admin  (primera vez)
4. POST /api/auth/solicitud        (operadores)
5. PATCH /api/admin/usuarios/:id/aprobar
6. POST /api/auth/login
7. POST /api/nna                   (registro + vozDelNna si adolescente)
8. PATCH /api/nna/:id/timeline     (traslado con entidadAtencionId)
9. POST /api/nna/:id/cierre-legal  (CPNNA + acta escaneada)
```

Ver también: [API-Users-Auth.md](./API-Users-Auth.md), [API-NNA.md](./API-NNA.md).
