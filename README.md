# DayOne 🌱

Aplicativo simples para acompanhar uma jornada sem fumar, registrar conquistas e estimar a economia.

## Configurar login e sincronização com Supabase

1. Crie um projeto no Supabase.
2. Em **Project Settings → API**, copie a Project URL e a chave pública `anon`/`publishable`.
3. Cole os dois valores em `js/supabase-config.js`. **Não use a chave `service_role` no navegador.**
4. No SQL Editor do Supabase, execute:

```sql
create table if not exists public.user_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  journey_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_journeys enable row level security;

create policy "Users can read their own journey"
  on public.user_journeys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journey"
  on public.user_journeys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journey"
  on public.user_journeys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

5. Em **Authentication → URL Configuration**, informe a URL de publicação do aplicativo em Site URL e adicione-a aos Redirect URLs.
6. Abra o aplicativo e crie uma conta. Se a confirmação de e-mail estiver habilitada, confirme o endereço antes de entrar.

O DayOne guarda uma cópia local e sincroniza os dados da jornada autenticada na tabela `user_journeys`. Cada conta só pode acessar sua própria linha, conforme as políticas RLS acima.

## Arquivos

- `index.html`: estrutura e tela de acesso.
- `css/style.css` e `scss/style.scss`: estilos.
- `js/app.js`: interface, cálculos e autenticação/sincronização.
- `js/supabase-config.js`: configuração pública do Supabase (preencher antes de usar login).
