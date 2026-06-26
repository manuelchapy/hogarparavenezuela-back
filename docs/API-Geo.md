# 📚 API de Geolocalización - Documentación para Frontend

Catálogo administrativo de Venezuela y ubicación estructurada en usuarios y NNA.

## Jerarquía

```
País (Venezuela — default)
 └── Estado (obligatorio)
      ├── Ciudad (obligatoria)
      ├── Municipio (opcional)
      │    └── Parroquia (opcional, requiere municipio)
      └── hallazgo.posicionGps (GPS exacto del NNA — opcional)
```

## Endpoints públicos (catálogo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/geo` | Info del módulo |
| `GET` | `/api/geo/countries` | Lista países |
| `GET` | `/api/geo/states` | Estados de Venezuela |
| `GET` | `/api/geo/states/:stateId/cities` | Ciudades por estado |
| `GET` | `/api/geo/states/:stateId/municipalities` | Municipios por estado |
| `GET` | `/api/geo/municipalities/:municipalityId/parishes` | Parroquias por municipio |

Query opcional en listados: `search`, `limit` (máx. 200).

### Ejemplo — estados

```http
GET /api/geo/states
```

```json
{
  "success": true,
  "data": {
    "country": { "id": "...", "name": "Venezuela", "code": "VE" },
    "count": 24,
    "items": [
      {
        "id": "69a2171c6997fcf9e1ceea61",
        "name": "Amazonas",
        "iso_31662": "VE-X",
        "capital": "Puerto Ayacucho",
        "id_estado": 1
      }
    ]
  }
}
```

## Body `ubicacion` (usuarios y NNA)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `state` | Sí | ObjectId del estado |
| `city` | Sí | ObjectId de la ciudad |
| `country` | No | Default: Venezuela (`VE`) |
| `municipality` | No | ObjectId del municipio |
| `parish` | No | ObjectId de la parroquia (requiere municipio) |

```json
{
  "ubicacion": {
    "state": "69a2171c6997fcf9e1ceea61",
    "city": "69a2171d6997fcf9e1ceea66",
    "municipality": "69a2171d6997fcf9e1ceea70",
    "parish": "69a2171d6997fcf9e1ceea71"
  }
}
```

## Respuesta enriquecida

```json
{
  "ubicacion": {
    "country": { "id": "...", "name": "Venezuela", "code": "VE" },
    "state": { "id": "...", "name": "Amazonas", "iso_31662": "VE-X" },
    "city": { "id": "...", "name": "Maroa" },
    "municipality": { "id": "...", "name": "Maroa" },
    "parish": null,
    "display": "Maroa, Maroa, Amazonas, Venezuela"
  }
}
```

## Endpoints actualizados

### Usuarios
- `POST /api/auth/register` — incluye `ubicacion` obligatoria
- `PATCH /api/auth/me` — actualiza perfil y/o `ubicacion` (requiere JWT)
- `GET /api/auth/me` — devuelve `ubicacion` enriquecida

### NNA
- `POST /api/nna` — incluye `ubicacion` obligatoria (+ `hallazgo` con GPS opcional)
- `PATCH /api/nna/:id/ubicacion` — actualiza ubicación administrativa (JWT)
- `GET /api/nna` — filtros `stateId`, `cityId` en query
- `GET /api/nna/:id` — devuelve `ubicacion` enriquecida

## Flujo UI recomendado (cascada)

1. `GET /api/geo/states` → selector de estado
2. `GET /api/geo/states/{stateId}/cities` → selector de ciudad
3. (Opcional) `GET /api/geo/states/{stateId}/municipalities`
4. (Opcional) `GET /api/geo/municipalities/{municipalityId}/parishes`
5. Enviar ObjectIds en `ubicacion` al registrar usuario o NNA

> Ejecutar `npm run seed:geo` antes de usar el catálogo en desarrollo.
