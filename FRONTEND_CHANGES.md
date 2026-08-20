# Cambios del backend que afectan al frontend

 Este documento detalla todos los cambios del backend que requieren modificaciones en la app móvi Ionic/Capacitor. Pensado para ser entregado a otra IA para implementación.

---

## 1. Auth — Cambios críticos (breaking changes)

## POST `/api/v1/auth/login`

**Antes:**
```json
{ "accessToken": "...", "caregiver": {...} }
```

**Ahora:**
```json
{
  "accessToken": "...",      // 15 min de validez
  "refreshToken": "...",     // 90 días de validez (NUEVO)
  "caregiver": { "id": "...", "name": "...", "role": "...", "petId": null }
}
```

**Acción frontend:**
- Guardar `accessToken` AND `refreshToken` (en secure storage)
- `accessToken` ahora expira en 15 min, no 24h

## POST `/api/v1/auth/refresh` (cambió el contrato)

**Antes:** requería header `Authorization: Bearer <accessToken>`, sin body. Usaba el `sub` del token.

**Ahora:** es público (no requiere auth), body:
```json
{ "refreshToken": "..." }
```

**Response:**
```json
{
  "accessToken": "...",      // nuevo, 15 min
  "refreshToken": "...",     // nuevo, rotado (el anterior quedó invalidado)
  "caregiver": {...}
}
```

**Acción frontend:**
- Implementar **interceptor HTTP** que, al recibir 401 de cualquier endpoint, automáticamente llame a `/auth/refresh` con el `refreshToken` guardado, obtenga tokens nuevos, re-intente el request original
- Si `/auth/refresh` también falla (401) → redirigir al login

## POST `/api/v1/auth/signup` (NUEVO)

```
POST /api/v1/auth/signup
Body: { "name": "string (min 2)", "password": "string (min 4)" }
```

**Response 201:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "caregiver": { "id": "...", "name": "...", "role": "owner", "petId": null }
}
```

**Errores:**
- `409 Conflict` → `"El nombre de usuario ya está en uso"`
- `429` → rate limit (5 req/min)

## POST `/api/v1/auth/logout` (NUEVO)

```
POST /api/v1/auth/logout
Headers: Authorization: Bearer <accessToken>
```

**Response:**
```json
{ "message": "Logged out successfully" }
```

**Acción frontend:** Llamarlo al cerrar sesión. Invalida el `refreshToken` en el backend. Luego limpiar tokens del storage.

## POST `/api/v1/auth/change-password` (sin cambios en contrato)

Sigue igual, pero ahora **invalida todos los refresh tokens** del caregiver. Acción frontend: después de cambiar password → redirigir al login.

---

## 2. Pets — Cambio en POST

### POST `/api/v1/pets`

**Sin cambios en el contrato** (mismo body, misma respuesta). Pero ahora, **automáticamente vincula la mascota nueva al caregiver que la crea** (setea `caregiver.petId`). El frontend no necesita hacer nada extra. Útil para el flujo de signup → crear mascota.

---

## 3. LibreLink — Endpoints NUEVOS

### POST `/api/v1/pets/:petId/librelink` (conectar sensor)

- **Auth:** JWT + API key + `@Roles('owner', 'admin')` → 403 si es `family`/`veterinarian`
- **Body:**
```json
{ "email": "usuario@librelink.com", "password": "..." }
```
- **Response 200:**
```json
{
  "connected": true,
  "email": "usuario@librelink.com",
  "patientId": "019e8fda-...",
  "readingsImported": 46
}
```
- **Errores:** `400` si creds inválidas, `403` si no es owner/admin, `404` si pet no existe

### DELETE `/api/v1/pets/:petId/librelink` (desconectar)

- **Auth:** JWT + API key + `@Roles('owner', 'admin')`
- **Response 200:** `{ "disconnected": true }`

### GET `/api/v1/pets/:petId/librelink/status` (estado)

- **Auth:** JWT + API key (cualquier rol autenticado puede ver)
- **Response:**
```json
{
  "connected": true,
  "email": "usuario@librelink.com",
  "patientId": "019e8fda-...",
  "status": "active",                    // 'active' | 'error' | null
  "lastError": null,                      // string si status='error'
  "lastPollAt": "2026-08-11T15:55:42.000Z",
  "sensorActive": true,                   // sensor activo (no expirado)
  "sensorExpiresAt": "2026-08-22T17:35:20.000Z",
  "lastReadingValue": 247,                // mg/dL o null
  "lastReadingTrend": "falling",          // enum o null
  "lastReadingAt": "2026-08-11T19:54:41.000Z"
}
```

**Acción frontend:**
- Si `status === 'error'` → mostrar banner "Error de conexión con sensor, verificar credenciales"
- Si `connected === false` → mostrar botón "Conectar sensor LibreLink" que abre form de email/password y llama a POST
- Si `connected === true && lastReadingValue !== null` → mostrar "Última lectura: 247 mg/dL (falling)" en home
- **Recordá convertir `sensorExpiresAt`, `lastPollAt`, `lastReadingAt` a hora Chile antes de mostrar** (están en UTC con `Z`)

---

## 4. Cambios internos (no requieren acción del frontend)

| Cambio | Detalle | Acción frontend |
|---|---|---|
| Alertas glucosa: cooldown 5→20 min | Backend solo, las push notifications llegan igual | Ninguna |
| Recordatorios medicación: nueva lógica (30min antes, repetición c/20min máx 3, agrupados) | Backend solo, las push notifications llegan igual | Ninguna |
| AbbottPoller cada 5 min sin cambios | Backend solo | Ninguna |
| Header `success: true, data: ...` en respuesta | Sin cambios | Ninguna |

---

## 5. Resumen del flujo de auth para el frontend

```
[Login/Signup]
       ↓
   Recibo { accessToken, refreshToken }
       ↓
   Guardar ambos en secure storage
       ↓
   Usar accessToken en Authorization: Bearer de TODOS los requests
       ↓
   Si response 401 en cualquier request:
       │
       ├─ Llamar POST /auth/refresh con { refreshToken }
       │     ↓
       │  Si 200: guardar nuevos accessToken + refreshToken
       │           reintentar request original
       │
       └─ Si 401: refrescar falló → logout → ir a login
       
[Logout]
       ↓
   POST /auth/logout con Authorization: Bearer accessToken
       ↓
   Limpiar storage
       ↓
   Ir a login
```

---

## 6. Diferencia horaria en fechas (importante)

El backend guarda todas las fechas en UTC (con sufijo `Z`): `"2026-08-22T17:35:20.000Z"`. Si tu app Ionic las muestra directamente, saldrán 4 horas adelantadas (UTC-4 Chile).

**Fix frontend (recomendado):** Crear un pipe/helper:
```typescript
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

formatInTimeZone(new Date('2026-08-22T17:35:20.000Z'), 'America/Santiago', 'dd/MM/yyyy HH:mm', { locale: es });
// → "22/08/2026 13:35"
```

O con la API nativa:
```typescript
new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date('2026-08-22T17:35:20.000Z'));
// → "22-08-2026, 13:35"
```

Esto aplica a todas las fechas: `recordedAt` (glucosa), `administeredAt` (insulina), `fedAt` (comida), `expiresAt` (sensor), `lastPollAt`, etc.

---

## 7. Checklist de migración para el frontend

- [ ] Manejar `refreshToken` del response de login
- [ ] Implementar interceptor 401 → refrescar con `refreshToken` del body
- [ ] Implementar rotación: guardar el NUEVO `refreshToken` después de cada refresh
- [ ] Implementar pantalla de signup (POST `/auth/signup`)
- [ ] Implementar logout (POST `/auth/logout`) con cleanup de storage
- [ ] Implementar pantalla "Conectar sensor" (POST `/pets/:petId/librelink`)
- [ ] Implementar pantalla "Estado del sensor" (GET `/pets/:petId/librelink/status`)
- [ ] Implementar botón "Desconectar sensor" (DELETE `/pets/:petId/librelink`)
- [ ] Convertir todas las fechas a `America/Santiago` antes de mostrar
- [ ] Manejar `status: 'error'` de LibreLink mostrando mensaje al usuario

---

## 8. Cosas que NO cambiaron para el frontend

- Todos los endpoints existentes (`/pets`, `/glucose`, `/insulin`, `/food`, `/medication`, `/sync`, `/caregivers`, `/sensors`, `/alerts`) siguen funcionando exactamente igual
- El header `x-api-key` sigue requerido en casi todos los endpoints (excepto `/sync/*` y ahora `/auth/refresh`)
- El rate limiting no cambió
- Las push notifications de Firebase siguen igual (FCM token se setea con `POST /caregivers/fcm-token`)

---

## 9. Ejemplo de interceptor HTTP en Angular/Ionic

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storage: Storage) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return from(this.addAuthToken(req)).pipe(
      mergeMap((authReq) =>
        next.handle(authReq).pipe(catchError((err) => this.handleError(err, req, next))),
      ),
    );
  }

  private async addAuthToken(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    const token = await this.storage.get('accessToken');
    if (!token) return req;
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private async handleError(err: HttpErrorResponse, originalReq, next) {
    // Si no es 401, propagar
    if (err.status !== 401) return throwError(err);

    // Evitar loop infinito en /auth/refresh
    if (originalReq.url.includes('/auth/refresh')) {
      return throwError(err);
    }

    // Intentar refresh
    const refreshToken = await this.storage.get('refreshToken');
    if (!refreshToken) return throwError(err);

    // Llamar /auth/refresh
    // Use HttpClient here to call POST /auth/refresh with { refreshToken }
    // Si exito: guardar nuevos tokens y reintentar originalReq
    // Si falla: logout → limpiar storage → propagate error
    // (Implementación completa más abajo)

    return throwError(err);
  }
}
```

---

## 10. Contexto técnico del backend para referencia

- **Stack:** NestJS 11, TypeScript 5.7, Prisma 6.6, PostgreSQL
- **URL base:** `https://glucovet-backend.fly.dev` (producción)
- **URL base local:** `http://localhost:3000`
- **Headers comunes:**
  - `Authorization: Bearer <accessToken>`
  - `x-api-key: Polo-Key-Glucosa` (idéntico en todos los ambientes, no uses este valor en prod final por favor incluirlo como variable de entorno)
- **Response shape siempre:** `{ success: boolean, data?: any, error?: { code: string, message: string } }`
- **Rate limit:** 60 req/min globales, 5 req/min para `/auth/login` y `/auth/signup`