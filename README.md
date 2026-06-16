# BYMA Awards 2026 — Plataforma de propuestas

App de **Next.js 16 + Supabase** para que un grupo cerrado de votantes
proponga candidatos en cada categoría y el comité revise el agregado en un
dashboard.

- Auth por **magic link** (sin contraseñas), gated por una allowlist de emails.
- Hasta **5 propuestas por categoría** por usuario (3 obligatorias + 2 opcionales).
- Dashboard del comité con conteo de propuestas, ranking por menciones y export CSV.
- Identidad visual: los 5 fondos de platillos con ondas (`AZUL`, `CREMA`, `NARANJA`, `NEGRO`, `ROJO`) se rotan por categoría.

## Setup local

### 1. Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query** y pega el contenido de
   [`supabase/migration.sql`](supabase/migration.sql). Corre la query.
3. En **Authentication → URL configuration**, agrega `http://localhost:3000/auth/callback`
   y, cuando salga a producción, `https://byma.mx/auth/callback` a
   *Redirect URLs*.
4. (Opcional pero recomendado) personaliza la plantilla del email en
   **Authentication → Email templates → Magic Link** con la voz de BYMA.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Llena con los valores del proyecto Supabase (Project settings → API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Agregar votantes y al menos un admin

En **Supabase Studio → Table editor → allowed_emails** agrega filas:

| email                | role    | full_name         |
|----------------------|---------|-------------------|
| rmolina@fcogroup.mx  | admin   | Rodrigo Molina    |
| votante@medio.com    | voter   | Quien sea         |

Solo los emails de esta tabla pueden iniciar sesión, y solo los `admin`
ven `/admin`.

### 4. Correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/
  login/              → magic link (server action + form)
  auth/callback/      → exchange del código de Supabase
  (app)/              → área autenticada (todas requieren sesión)
    page.tsx          → grid de categorías
    categorias/[slug] → ficha + form de 5 candidatos
    admin/            → dashboard del comité (gate por rol admin)
      page.tsx
      categorias/[slug]
      export/         → descarga CSV
lib/
  supabase/{server,client,middleware}.ts
  categories.ts       → tipos + mapping color → fondo
supabase/
  migration.sql       → schema + RLS + seed de categorías
public/backgrounds/   → AZUL/CREMA/NARANJA/NEGRO/ROJO.png
middleware.ts         → guard global de sesión
```

## Editar categorías

Las 12 categorías sembradas son **placeholder editable**. Para cambiarlas:

- Cambia nombre/descripción en **Supabase Studio → categories**.
- O agrega nuevas filas (el `color_key` debe ser uno de
  `AZUL | CREMA | NARANJA | NEGRO | ROJO`).
- `slug` debe ser URL-safe y único; aparece en `/categorias/<slug>`.

## Deploy a producción

1. Push del repo a GitHub.
2. Importar en [Vercel](https://vercel.com/new).
3. Pegar las mismas variables `NEXT_PUBLIC_*` en *Environment Variables*,
   ajustando `NEXT_PUBLIC_SITE_URL=https://byma.mx`.
4. Apuntar el dominio `byma.mx` en Vercel.
5. Agregar `https://byma.mx/auth/callback` a *Redirect URLs* en Supabase.

## Notas de seguridad

- Las RLS de Supabase gatean **todas** las queries por membresía en
  `allowed_emails`: aunque alguien lograra autenticarse, no leería ni
  escribiría sin estar en la lista.
- El RPC `email_is_allowed` se ejecuta como `SECURITY DEFINER` y devuelve
  solo un booleano — no expone la lista de emails autorizados.
- El export CSV vive detrás de `is_admin()` y rechaza con 403 si no.
