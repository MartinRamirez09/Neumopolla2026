# NeumoPolla 2026 ⚽

Polla mundialista para colaboradores de Neumología.

## Setup local

```bash
npm install
npm run dev
```

## Variables de entorno

Crea un archivo `.env` con:

```
VITE_SUPABASE_URL=https://yjdlqchuomklymjsxnlj.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## Deploy en Vercel

1. Sube este repo a GitHub
2. Conecta el repo en vercel.com
3. En Vercel → Settings → Environment Variables agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automático ✓

## Hacer admin a un usuario

En Supabase → SQL Editor:
```sql
update profiles set is_admin = true where email = 'tu@correo.com';
```
