# APEX Supabase Setup Guide

## Purpose

This guide explains the Supabase values used by the APEX prototype, what each one means, and exactly where to find them in the Supabase dashboard.

This is written for the current dashboard and historical food-log prototype work, where APEX may read selected nutrition data from Supabase.

## The Values You Need

### `VITE_SUPABASE_URL`

What it is:

- The base URL of your Supabase project.
- It usually looks like:
  `https://your-project-ref.supabase.co`

Why APEX needs it:

- The frontend uses it to know which Supabase project to query.

Where to find it in Supabase:

1. Open your Supabase project.
2. Go to `Settings`.
3. Open `API`.
4. Copy the `Project URL`.

Example:

```bash
VITE_SUPABASE_URL="https://kaminspwatitpgyujzct.supabase.co"
```

### `VITE_SUPABASE_ANON_KEY`

What it is:

- The public client key for your Supabase project.
- This key is intended for frontend/browser use.

Why APEX needs it:

- The frontend prototype uses it to read allowed data from Supabase.

Where to find it in Supabase:

1. Open your Supabase project.
2. Go to `Settings`.
3. Open `API`.
4. Find the key labeled `anon` or `publishable`.

Example:

```bash
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

Important:

- This key can be used in the frontend.
- It is still a real project credential, so avoid committing it to Git if possible.

### `APEX_SUPABASE_SERVICE_ROLE_KEY`

What it is:

- The private admin-level key for your Supabase project.
- This key has elevated privileges.

Why APEX may need it:

- Only for backend/server-side work.
- Useful if we later move writes, protected reads, or RPC calls behind FastAPI.

Where to find it in Supabase:

1. Open your Supabase project.
2. Go to `Settings`.
3. Open `API`.
4. Find the key labeled `service_role`.

Example:

```bash
APEX_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Important:

- Never place this key in the frontend.
- Never expose it in browser code.
- Never commit it into the repo.

### `APEX_SUPABASE_SCHEMA`

What it is:

- The Postgres schema name that contains your tables and views.

Why APEX may need it:

- Backend or data-adapter code may use it to target the correct schema explicitly.

What to use for your current SQL:

- Your SQL creates tables in the default schema.
- For that setup, the correct value is:

```bash
APEX_SUPABASE_SCHEMA="public"
```

Where to find or confirm it:

- If you did not intentionally create custom schemas, it is almost certainly `public`.
- You can also confirm in the Supabase table editor by checking where your tables were created.

### `VITE_SUPABASE_USER_ID`

What it is:

- This is not a Supabase platform setting.
- It is an application-level value used by your schema.

Why APEX needs it:

- Your prototype tables use a `user_id` column such as `sergio`.
- The frontend can use that value to query the correct records during the prototype phase.

What to use for your current SQL:

Your schema inserts rows like:

```sql
user_id = 'sergio'
```

So your current prototype value is:

```bash
VITE_SUPABASE_USER_ID="sergio"
```

Where to find it:

- In your SQL inserts
- In your own app data
- This is something you define, not something Supabase generates for you

### Supabase Project Ref / Supabase ID

What it is:

- The short identifier inside your project URL.

Example:

From:

```text
https://kaminspwatitpgyujzct.supabase.co
```

The project ref is:

```text
kaminspwatitpgyujzct
```

Where to find it:

- In the project URL
- In `Settings` → `General`
- In `Settings` → `API`

Why it matters:

- It helps identify the correct project.
- It is also part of the Supabase URL.

## What Goes In Each Environment File

### Frontend

Put these in `frontend/.env`:

```bash
VITE_API_URL="http://localhost:8000/v1"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_USER_ID="sergio"
```

### Backend

Put these in `backend/.env`:

```bash
APEX_SUPABASE_URL="https://your-project-ref.supabase.co"
APEX_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
APEX_SUPABASE_SCHEMA="public"
```

## Safety Rules

- `VITE_SUPABASE_ANON_KEY` can be used in the frontend.
- `APEX_SUPABASE_SERVICE_ROLE_KEY` must stay on the backend only.
- Do not commit real Supabase secrets into the repository.
- If the prototype expands into writes or privileged reads, prefer routing that through FastAPI instead of calling Supabase directly from the browser.

## Quick Dashboard Path In Supabase

If you just want the shortest route:

1. Open your project.
2. Go to `Settings`.
3. Open `API`.
4. Copy:
   - `Project URL`
   - `anon` key
   - `service_role` key
5. Use `public` as the schema unless you created a different one.
6. Use `sergio` as the prototype `user_id` because that is what your SQL uses today.
