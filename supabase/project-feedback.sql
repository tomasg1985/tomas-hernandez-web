create table if not exists public.project_ratings (
    project_type text not null check (project_type in ('web', 'design')),
    project_section text not null,
    project_id text not null,
    visitor_id uuid not null,
    rating smallint not null check (rating between 1 and 5),
    updated_at timestamptz not null default now(),
    primary key (project_type, project_section, project_id, visitor_id)
);

create table if not exists public.project_likes (
    project_type text not null check (project_type in ('web', 'design')),
    project_section text not null,
    project_id text not null,
    visitor_id uuid not null,
    liked boolean not null default true,
    updated_at timestamptz not null default now(),
    primary key (project_type, project_section, project_id, visitor_id)
);

alter table public.project_ratings enable row level security;
alter table public.project_likes enable row level security;

revoke all on table public.project_ratings from anon, authenticated;
revoke all on table public.project_likes from anon, authenticated;
grant select, insert, update, delete on table public.project_ratings to service_role;
grant select, insert, update, delete on table public.project_likes to service_role;

create or replace function public.get_project_feedback(
    p_project_type text,
    p_visitor_id uuid
)
returns table (
    project_section text,
    project_id text,
    average_rating numeric,
    rating_count bigint,
    like_count bigint,
    visitor_rating smallint,
    visitor_liked boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
    with project_keys as (
        select r.project_section, r.project_id
        from public.project_ratings as r
        where r.project_type = p_project_type
        union
        select l.project_section, l.project_id
        from public.project_likes as l
        where l.project_type = p_project_type
    ), rating_summary as (
        select
            r.project_section,
            r.project_id,
            round(avg(r.rating)::numeric, 1) as average_rating,
            count(*) as rating_count,
            max(r.rating) filter (where r.visitor_id = p_visitor_id) as visitor_rating
        from public.project_ratings as r
        where r.project_type = p_project_type
        group by r.project_section, r.project_id
    ), like_summary as (
        select
            l.project_section,
            l.project_id,
            count(*) filter (where l.liked) as like_count,
            coalesce(bool_or(l.liked) filter (where l.visitor_id = p_visitor_id), false) as visitor_liked
        from public.project_likes as l
        where l.project_type = p_project_type
        group by l.project_section, l.project_id
    )
    select
        k.project_section,
        k.project_id,
        r.average_rating,
        coalesce(r.rating_count, 0),
        coalesce(l.like_count, 0),
        r.visitor_rating,
        coalesce(l.visitor_liked, false)
    from project_keys as k
    left join rating_summary as r
        on r.project_section = k.project_section and r.project_id = k.project_id
    left join like_summary as l
        on l.project_section = k.project_section and l.project_id = k.project_id;
$$;

revoke all on function public.get_project_feedback(text, uuid) from public, anon, authenticated;
grant execute on function public.get_project_feedback(text, uuid) to service_role;
