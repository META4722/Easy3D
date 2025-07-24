-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  email text unique not null,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Models table
create table public.models (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  prompt text not null,
  file_url text,
  preview_url text,
  status text default 'generating' check (status in ('generating', 'completed', 'failed')),
  parameters jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  model_id uuid references public.models(id) on delete cascade not null,
  material text not null default 'PLA',
  quantity integer not null default 1,
  price decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'paid', 'printing', 'shipped', 'completed', 'cancelled')),
  shipping_address jsonb not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Error logs table
create table public.error_logs (
  id uuid default uuid_generate_v4() primary key,
  source text not null,
  payload jsonb,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.models enable row level security;
alter table public.orders enable row level security;
alter table public.error_logs enable row level security;

-- Users policies
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Models policies
create policy "Users can view own models" on public.models
  for select using (auth.uid() = user_id);

create policy "Users can create models" on public.models
  for insert with check (auth.uid() = user_id);

create policy "Users can update own models" on public.models
  for update using (auth.uid() = user_id);

create policy "Users can delete own models" on public.models
  for delete using (auth.uid() = user_id);

-- Orders policies
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Users can create orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own orders" on public.orders
  for update using (auth.uid() = user_id);

-- Admin policies
create policy "Admins can view all orders" on public.orders
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all orders" on public.orders
  for update using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Error logs policies (admin only)
create policy "Admins can view error logs" on public.error_logs
  for select using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "System can insert error logs" on public.error_logs
  for insert with check (true);

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
