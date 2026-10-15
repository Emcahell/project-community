## Proyecto Comunidad

Plataforma web para conectar estudiantes de informática de la UPTYAB y comunidades (instituciones públicas).

### De qué se trata

- Los estudiantes podrán encontrar de manera fácil instituciones donde puedan desarrollar proyectos tecnológicos, de acuerdo a la materia de PST.
- Las comunidades (instituciones públicas) podrán exponer sus necesidades tecnológicas, las cuales los estudiantes podrán ver y solicitar resolver.

### Objetivos

- Facilitar la conexión entre estudiantes de informática y comunidades (instituciones públicas).
- Proporcionar un espacio donde las instituciones puedan exponer sus necesidades tecnológicas.
- Permitir que los estudiantes puedan ver y solicitar resolver las necesidades tecnológicas de las instituciones.
- Ahorrar tiempo en la búsqueda de instituciones que necesiten servicios tecnológicos (sin necesidad de visitar cada una).
- Fomentar el desarrollo de proyectos tecnológicos que beneficien a la comunidad.

## Desarrollo local

Requisitos: Node.js 22+, [pnpm](https://pnpm.io) 10 y un proyecto de [Supabase](https://supabase.com).

```bash
pnpm install
cp .env.example .env.local   # completa las variables de Supabase
pnpm dev                     # http://localhost:3000
```

### Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Comprobación de tipos de TypeScript |
| `pnpm test` | Pruebas unitarias (Vitest) |
| `pnpm check` | Lint + tipos + pruebas (lo mismo que corre la CI) |
| `pnpm db:types` | Regenera los tipos de la base (requiere Supabase CLI y `supabase link`) |

### Base de datos

El esquema, las políticas RLS y los triggers se versionan en `supabase/migrations/`.

1. Instala la [Supabase CLI](https://supabase.com/docs/guides/cli) y vincula el proyecto: `supabase link`.
2. Versiona el esquema actual: `supabase db pull`.
3. Revisa y aplica la migración de seguridad `20261015000000_security_hardening.sql` (primero en un proyecto de pruebas): `supabase db push`.

### Arquitectura

- **Next.js (App Router)** con Server Components para leer datos.
- **Server actions** (`app/actions/`) para toda escritura: cada acción valida con Zod, comprueba rol y propiedad del recurso y devuelve mensajes de error genéricos.
- **Middleware** (`proxy.ts` → `lib/supabase/middleware.ts`): sesión, roles (leídos de `profiles`, nunca de `user_metadata`), onboarding y cuentas inhabilitadas.
- **Supabase** para autenticación, base de datos (con RLS) y almacenamiento de logos.

## Quiénes están detrás de Comunidad

El proyecto está siendo desarrollado por [Emmanuel Castro](https://github.com/Emcahell) y [Wilberk Ledezma](https://github.com/webzma), estudiantes de la Universidad Politécnica Territorial de Yaracuy 'Aristides Bastidas' (UPTYAB) de la carrera de Informática.