# 📚 API de Users y Autenticación - Documentación para Frontend

## Índice
- [Seguridad y autenticación](#-seguridad-y-autenticación)
- [Resumen de endpoints](#-resumen-de-endpoints)
- [Endpoints detallados](#-endpoints-detallados)
- [Modelo de datos (User)](#-modelo-de-datos-user)
- [Roles operativos](#roles-operativos)
- [Flujos recomendados](#-flujos-recomendados)
- [Ejemplos con Postman / Axios](#-ejemplos-con-postman--axios)

> Cumplimiento LOPNNA: ver [PROTOCOLO-LOPNNA-API.md](./PROTOCOLO-LOPNNA-API.md)  
> Referencia completa de endpoints: [API-ENDPOINTS.md](./API-ENDPOINTS.md)

---

## 🔐 **Seguridad y Autenticación**

### **Tipo de autenticación**
- **Tipo**: JWT firmado por el backend.
- **Header**: `Authorization: Bearer <token>`.
- **Credenciales**: `cedula` + `credencialOficialId`.
- **Rutas públicas**: `GET /api/auth`, `POST /api/auth/solicitud`, `POST /api/auth/login`, `POST /api/auth/bootstrap-admin`, `GET /api/institutions`, `GET /api/entidades-atencion`, `GET /api/catalog/*`.
- **Rutas admin**: `/api/admin/*` (solo `ADMINISTRADOR`).
- **Rutas protegidas operativas**: `GET /api/auth/me`, todo `/api/nna/*` (requiere `estadoCuenta: ACTIVO`).

### **Estados de cuenta**

| Estado | Puede login | Puede operar NNA |
|--------|-------------|------------------|
| `PENDIENTE` | No (403) | No |
| `ACTIVO` | Sí | Sí |
| `RECHAZADO` | No (403) | No |
| `SUSPENDIDO` | No (403) | No |

### **Pasos para autenticación**
1. Enviar solicitud: `POST /api/auth/solicitud` (con foto de cédula o credencial).
2. Tras aprobación admin: `POST /api/auth/login`.
3. Si el usuario tiene `credencialOficialId`, enviarla en login; si no, solo `cedula`.

---

## 🚀 **Resumen de Endpoints**

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/auth` | Info del módulo | No |
| `POST` | `/api/auth/solicitud` | Solicitud de alta (roles operativos) | No |
| `POST` | `/api/auth/bootstrap-admin` | Primer administrador | No* |
| `POST` | `/api/auth/register` | Alta directa por admin | Admin |
| `POST` | `/api/auth/login` | Iniciar sesión | No |
| `GET` | `/api/auth/me` | Perfil autenticado | Sí |
| `PATCH` | `/api/auth/me` | Actualizar perfil | Sí |
| `GET` | `/api/admin/usuarios` | Listar usuarios | Admin |
| `PATCH` | `/api/admin/usuarios/:id/aprobar` | Aprobar solicitud | Admin |
| `PATCH` | `/api/admin/usuarios/:id/rechazar` | Rechazar solicitud | Admin |
| `POST` | `/api/admin/instituciones` | Crear institución | Admin |
| `POST` | `/api/admin/entidades-atencion` | Crear entidad de atención | Admin |
| `GET` | `/api/institutions` | Catálogo instituciones | No |
| `GET` | `/api/entidades-atencion` | Catálogo destinos NNA | No |

> *Bootstrap solo si no hay admin activo + `BOOTSTRAP_SECRET` válido.

---

## 📝 **Endpoints detallados**

### **POST** `/api/auth/solicitud`

#### **Body**
```json
{
  "nombreCompleto": "Carlos Méndez",
  "cedula": "V18765432",
  "telefono": "+584129998877",
  "rolSolicitado": "RESCATISTA_CIVIL",
  "institucion": "Brigada Voluntaria Rescate Aragua",
  "fotoCedulaUrl": "https://storage.googleapis.com/.../cedula.jpg",
  "ubicacion": {
    "state": "69a2171c6997fcf9e1ceea61",
    "city": "69a2171d6997fcf9e1ceea66"
  }
}
```

**Verificación de identidad (obligatorio uno de los dos casos):**

| Caso | Campos requeridos |
|------|-------------------|
| Sin credencial oficial | `cedula` + `fotoCedulaUrl` |
| Con credencial oficial | `cedula` + `credencialOficialId` + `fotoCredencialUrl` |

> `institucionId` es **opcional** (catálogo). Puedes usar solo `institucion` como texto libre, o omitir ambos.

**Ejemplo con credencial:**
```json
{
  "cedula": "V18765432",
  "credencialOficialId": "RC-AR-0012",
  "fotoCredencialUrl": "https://storage.googleapis.com/.../credencial.jpg",
  "...": "..."
}
```

#### **Response 202**
```json
{
  "success": true,
  "data": {
    "user": {
      "estadoCuenta": "PENDIENTE",
      "rol": "RESCATISTA_CIVIL"
    },
    "message": "Solicitud recibida. Un administrador revisará tu cuenta."
  }
}
```

---

### **POST** `/api/auth/login`

#### **Body**
```json
{
  "cedula": "V12345678",
  "credencialOficialId": "PC-AR-0045"
}
```

#### **Errores**

| Código | Situación |
|--------|-----------|
| **401** | Credenciales incorrectas |
| **403** | Cuenta PENDIENTE, RECHAZADA o SUSPENDIDA |

---

### **POST** `/api/auth/register` (solo ADMINISTRADOR)

Mismo body que solicitud pero con campo `rol` (cualquier rol). Respuesta **201** con token inmediato.

---

## 📦 **Modelo de datos (User)**

```json
{
  "id": "67a1b2c3d4e5f6789012345a",
  "nombreCompleto": "María González",
  "cedula": "V12345678",
  "telefono": "+584121234567",
  "rol": "RESCATISTA_CIVIL",
  "institucionId": "507f1f77bcf86cd799439012",
  "institucion": "Protección Civil Municipio Girardot",
  "credencialOficialId": "PC-AR-0045",
  "estadoCuenta": "ACTIVO",
  "activo": true,
  "ubicacion": { "display": "Maracay, Aragua, Venezuela" }
}
```

---

## Roles operativos

| Rol | Alta pública | Cierre legal |
|-----|--------------|--------------|
| `RESCATISTA_CIVIL` | Sí (solicitud) | No |
| `PROTECCION_CIVIL` | Sí | No |
| `PERSONAL_MEDICO` | Sí | No |
| `CONSEJERO_CPNNA` | No (solo admin) | **Sí** |
| `ADMINISTRADOR` | No (bootstrap/register) | **Sí** |

---

## 🔄 **Flujos recomendados**

1. `GET /api/institutions` → elegir `institucionId`.
2. `POST /api/auth/solicitud`.
3. Admin: `PATCH /api/admin/usuarios/:id/aprobar`.
4. `POST /api/auth/login` → operar NNA.

Módulo NNA: **[API-NNA.md](./API-NNA.md)**.
