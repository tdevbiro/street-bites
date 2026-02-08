-- StreetBites Database Schema for Supabase
-- Run this in your Supabase SQL Editor after creating a project

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text not null check (role in ('customer', 'owner')),
  gender text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'plus', 'pro')),
  taste_preferences jsonb default '[]'::jsonb,
  stats jsonb default '{
    "visitedCount": 0,
    "reviewCount": 0,
    "messageCount": 0,
    "uniqueCategories": [],
    "passportStamps": []
  }'::jsonb,
  notifications_enabled boolean default true,
  following text[] default array[]::text[],
  friends text[] default array[]::text[],
  friend_requests text[] default array[]::text[],
  is_ghost_mode boolean default false,
  direct_messages jsonb default '{}'::jsonb,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- BUSINESSES TABLE
-- =====================================================
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  driver_id uuid references public.profiles(id) on delete set null,
  driver_name text,
  name text not null,
  category text not null,
  status text not null default 'offline' check (status in ('busy', 'moderate', 'empty', 'offline')),
  rating numeric(3,2) default 0.00,
  description text,
  image_url text,
  opening_hours text,
  weekly_hours jsonb default '{
    "mon": "11:00 AM - 9:00 PM",
    "tue": "11:00 AM - 9:00 PM",
    "wed": "11:00 AM - 9:00 PM",
    "thu": "11:00 AM - 10:00 PM",
    "fri": "11:00 AM - 11:00 PM",
    "sat": "10:00 AM - 11:00 PM",
    "sun": "10:00 AM - 8:00 PM"
  }'::jsonb,
  favorite_count integer default 0,
  current_visitors integer default 0,
  tags text[] default array[]::text[],
  invite_code text unique,
  checked_in_users text[] default array[]::text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- LOCATIONS TABLE (Real-time GPS tracking)
-- =====================================================
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  position geography(Point, 4326) not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  heading double precision,
  speed double precision,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create spatial index for fast geospatial queries
create index locations_position_idx on public.locations using gist(position);
create index locations_business_id_idx on public.locations(business_id);
create index locations_timestamp_idx on public.locations(timestamp desc);

-- =====================================================
-- ROUTES TABLE (Planned stops and schedules)
-- =====================================================
create table public.routes (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  location_name text not null,
  position geography(Point, 4326) not null,
  latitude double precision not null,
  longitude double precision not null,
  scheduled_start timestamp with time zone not null,
  scheduled_end timestamp with time zone not null,
  is_current boolean default false,
  rsvps integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index routes_business_id_idx on public.routes(business_id);
create index routes_scheduled_start_idx on public.routes(scheduled_start);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  price numeric(10,2) not null,
  image_url text,
  description text,
  is_available boolean default true,
  category text,
  dietary_tags text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index products_business_id_idx on public.products(business_id);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  owner_response text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index reviews_business_id_idx on public.reviews(business_id);
create index reviews_user_id_idx on public.reviews(user_id);

-- =====================================================
-- MESSAGES TABLE (Business chat)
-- =====================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  text text not null,
  is_plus boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index messages_business_id_idx on public.messages(business_id);
create index messages_created_at_idx on public.messages(created_at desc);

-- =====================================================
-- POSTS TABLE (Business updates and social feed)
-- =====================================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  content text not null,
  is_important boolean default false,
  type text check (type in ('announcement', 'social', 'update')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index posts_business_id_idx on public.posts(business_id);
create index posts_created_at_idx on public.posts(created_at desc);

-- =====================================================
-- AI PREDICTIONS TABLE (Route and schedule predictions)
-- =====================================================
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  predicted_location geography(Point, 4326) not null,
  latitude double precision not null,
  longitude double precision not null,
  predicted_time timestamp with time zone not null,
  confidence_score numeric(3,2) not null,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  hour_of_day integer not null check (hour_of_day >= 0 and hour_of_day <= 23),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index predictions_business_id_idx on public.predictions(business_id);
create index predictions_predicted_time_idx on public.predictions(predicted_time);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.locations enable row level security;
alter table public.routes enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.predictions enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Businesses policies
create policy "Businesses are viewable by everyone"
  on public.businesses for select
  using (is_active = true);

create policy "Owners can insert their businesses"
  on public.businesses for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their businesses"
  on public.businesses for update
  using (auth.uid() = owner_id);

-- Locations policies
create policy "Locations are viewable by everyone"
  on public.locations for select
  using (true);

create policy "Business owners can insert locations"
  on public.locations for insert
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Routes policies
create policy "Routes are viewable by everyone"
  on public.routes for select
  using (true);

create policy "Business owners can manage routes"
  on public.routes for all
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Products policies
create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Business owners can manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Reviews policies
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

-- Messages policies
create policy "Messages are viewable by everyone"
  on public.messages for select
  using (true);

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- Posts policies
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Business owners can manage posts"
  on public.posts for all
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Predictions policies
create policy "Predictions are viewable by everyone"
  on public.predictions for select
  using (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_businesses_updated
  before update on public.businesses
  for each row execute procedure public.handle_updated_at();

create trigger on_reviews_updated
  before update on public.reviews
  for each row execute procedure public.handle_updated_at();

-- Function to update business rating when new review is added
create or replace function public.update_business_rating()
returns trigger as $$
begin
  update public.businesses
  set rating = (
    select coalesce(avg(rating), 0)
    from public.reviews
    where business_id = new.business_id
  )
  where id = new.business_id;
  return new;
end;
$$ language plpgsql;

create trigger on_review_insert_update_rating
  after insert or update on public.reviews
  for each row execute procedure public.update_business_rating();

-- Function to get nearby businesses
create or replace function public.get_nearby_businesses(
  lat double precision,
  lng double precision,
  radius_meters integer default 5000
)
returns setof public.businesses as $$
begin
  return query
  select b.*
  from public.businesses b
  inner join (
    select distinct on (business_id) business_id, position
    from public.locations
    order by business_id, timestamp desc
  ) l on l.business_id = b.id
  where st_dwithin(
    l.position,
    st_makepoint(lng, lat)::geography,
    radius_meters
  )
  and b.is_active = true
  and b.status != 'offline';
end;
$$ language plpgsql;

-- Function to get business current location
create or replace function public.get_business_current_location(business_uuid uuid)
returns table(latitude double precision, longitude double precision, ts timestamp with time zone) as $$
begin
  return query
  select l.latitude, l.longitude, l.timestamp
  from public.locations l
  where l.business_id = business_uuid
  order by l.timestamp desc
  limit 1;
end;
$$ language plpgsql;
