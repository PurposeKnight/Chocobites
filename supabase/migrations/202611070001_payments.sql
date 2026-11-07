-- Chocobites secure order/payment foundation. Run in Supabase before enabling checkout.
create extension if not exists pgcrypto;

create type public.payment_method as enum ('cod','upi');
create type public.payment_status as enum ('unpaid','pending_verification','paid','rejected');
create type public.order_status as enum ('placed','awaiting_payment','payment_under_review','confirmed','payment_rejected','expired','cancelled');

create table public.products (
  id uuid primary key default gen_random_uuid(), sku text not null unique, name text not null,
  description text not null default '', price_paise integer not null check (price_paise > 0),
  stock integer not null default 0 check (stock >= 0), active boolean not null default true,
  image_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_settings (
  singleton boolean primary key default true check (singleton), cod_enabled boolean not null default true,
  upi_enabled boolean not null default true, upi_id text not null default '', upi_payee_name text not null default 'Chocobites',
  cod_shipping_paise integer not null default 0 check (cod_shipping_paise >= 0),
  upi_shipping_paise integer not null default 0 check (upi_shipping_paise >= 0),
  payment_instructions text not null default 'Pay the exact amount shown. Your order is confirmed only after verification.',
  pending_expiry_minutes integer not null default 30 check (pending_expiry_minutes between 10 and 1440), updated_at timestamptz not null default now()
);
insert into public.payment_settings(singleton) values (true) on conflict do nothing;
insert into public.products(id,sku,name,description,price_paise,stock,image_url) values
 ('11111111-1111-4111-8111-111111111111','SIGNATURE-12','The Signature Box','Twelve hand-finished pralines with ganache, caramel and roasted nuts.',129900,40,null),
 ('22222222-2222-4222-8222-222222222222','TRUFFLE-16','Midnight Truffles','Sixteen dark chocolate truffles dusted with fine cocoa.',149900,35,null),
 ('33333333-3333-4333-8333-333333333333','CELEBRATION-24','Celebration Collection','A generous twenty-four piece assortment made for gifting.',219900,25,null)
on conflict (id) do nothing;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique,
  customer_name text not null, customer_email text not null, customer_phone text not null,
  address jsonb not null, subtotal_paise integer not null check (subtotal_paise >= 0),
  shipping_paise integer not null check (shipping_paise >= 0), total_paise integer not null check (total_paise > 0),
  payment_method public.payment_method not null, payment_status public.payment_status not null,
  status public.order_status not null, idempotency_key uuid not null unique,
  access_token_hash text not null, expires_at timestamptz, stock_released_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict, sku text not null, product_name text not null,
  unit_price_paise integer not null check (unit_price_paise > 0), quantity integer not null check (quantity > 0),
  line_total_paise integer generated always as (unit_price_paise * quantity) stored
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete restrict,
  method public.payment_method not null, amount_paise integer not null check (amount_paise > 0),
  status public.payment_status not null, upi_reference text, submitted_at timestamptz,
  verified_at timestamptz, verified_by uuid references auth.users(id), rejection_reason text,
  version integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index payments_unique_utr on public.payments(upper(upi_reference)) where upi_reference is not null;
create table public.payment_audit_events (
  id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
  event_type text not null, from_status public.payment_status, to_status public.payment_status not null,
  actor_id uuid references auth.users(id), metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(), event_key text not null unique, template text not null,
  recipient text not null, subject text not null, payload jsonb not null, status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(), sent_at timestamptz,
  last_error text, provider_message_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.request_limits (key text primary key, hits integer not null default 1, window_started_at timestamptz not null default now());

create or replace function public.consume_rate_limit(p_key text,p_max integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare r request_limits;
begin
 insert into request_limits(key,hits,window_started_at) values(p_key,1,now())
 on conflict(key) do update set
   hits=case when request_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then 1 else request_limits.hits+1 end,
   window_started_at=case when request_limits.window_started_at < now()-make_interval(secs=>p_window_seconds) then now() else request_limits.window_started_at end
 returning * into r;
 return r.hits<=p_max;
end $$;

alter table public.products enable row level security; alter table public.payment_settings enable row level security;
alter table public.admin_users enable row level security; alter table public.orders enable row level security;
alter table public.order_items enable row level security; alter table public.payments enable row level security;
alter table public.payment_audit_events enable row level security; alter table public.email_outbox enable row level security;
create policy "active products are readable" on public.products for select using (active);
create policy "payment availability is readable" on public.payment_settings for select using (true);
create policy "admins read orders" on public.orders for select using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
create policy "admins read items" on public.order_items for select using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
create policy "admins read payments" on public.payments for select using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
create policy "admins read audit" on public.payment_audit_events for select using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
revoke all on public.orders, public.order_items, public.payments, public.payment_audit_events, public.email_outbox from anon, authenticated;

create or replace function public.new_order_number() returns text language sql volatile as $$
  select 'CB-' || to_char(now(),'YYMMDD') || upper(substr(encode(gen_random_bytes(6),'hex'),1,10));
$$;

create or replace function public.create_checkout_order(p_payload jsonb, p_ip text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s payment_settings; existing orders; item jsonb; p products; subtotal integer:=0; shipping integer; total integer;
  oid uuid:=gen_random_uuid(); ono text:=new_order_number(); token text:=encode(gen_random_bytes(32),'hex'); method payment_method;
begin
  if not consume_rate_limit('checkout:'||p_ip,8,600) then raise exception 'Too many checkout attempts'; end if;
  select * into s from payment_settings where singleton for share;
  method := (p_payload->>'paymentMethod')::payment_method;
  if (method='cod' and not s.cod_enabled) or (method='upi' and not s.upi_enabled) then raise exception 'Payment method unavailable'; end if;
  select * into existing from orders where idempotency_key=(p_payload->>'idempotencyKey')::uuid;
  if found then return jsonb_build_object('order_number',existing.order_number,'access_token','already-created','amount_paise',existing.total_paise,'payment_method',existing.payment_method); end if;
  for item in select * from jsonb_array_elements(p_payload->'items') loop
    select * into p from products where id=(item->>'productId')::uuid and active for update;
    if not found or p.stock < (item->>'quantity')::int then raise exception 'A product is unavailable'; end if;
    subtotal := subtotal + p.price_paise * (item->>'quantity')::int;
  end loop;
  shipping := case when method='cod' then s.cod_shipping_paise else s.upi_shipping_paise end; total:=subtotal+shipping;
  insert into orders(id,order_number,customer_name,customer_email,customer_phone,address,subtotal_paise,shipping_paise,total_paise,payment_method,payment_status,status,idempotency_key,access_token_hash,expires_at)
  values(oid,ono,p_payload#>>'{customer,name}',lower(p_payload#>>'{customer,email}'),p_payload#>>'{customer,phone}',p_payload->'address',subtotal,shipping,total,method,case when method='cod' then 'unpaid' else 'unpaid' end,case when method='cod' then 'placed' else 'awaiting_payment' end,(p_payload->>'idempotencyKey')::uuid,crypt(token,gen_salt('bf')),case when method='upi' then now()+make_interval(mins=>s.pending_expiry_minutes) end);
  for item in select * from jsonb_array_elements(p_payload->'items') loop
    select * into p from products where id=(item->>'productId')::uuid for update;
    update products set stock=stock-(item->>'quantity')::int,updated_at=now() where id=p.id;
    insert into order_items(order_id,product_id,sku,product_name,unit_price_paise,quantity) values(oid,p.id,p.sku,p.name,p.price_paise,(item->>'quantity')::int);
  end loop;
  insert into payments(order_id,method,amount_paise,status) values(oid,method,total,'unpaid');
  insert into email_outbox(event_key,template,recipient,subject,payload)
    values('order:'||oid||':owner',case when method='cod' then 'cod_owner' else 'upi_created' end,current_setting('app.owner_email',true),case when method='cod' then 'New Chocobites COD Order — #'||ono else 'New UPI order — #'||ono end,jsonb_build_object('order_id',oid));
  if method='cod' then insert into email_outbox(event_key,template,recipient,subject,payload) values('order:'||oid||':customer','cod_customer',lower(p_payload#>>'{customer,email}'),'Your Chocobites Order Is Confirmed!',jsonb_build_object('order_id',oid)); end if;
  return jsonb_build_object('order_number',ono,'access_token',token,'amount_paise',total,'payment_method',method,'upi_id',s.upi_id,'payee_name',s.upi_payee_name,'instructions',s.payment_instructions);
end $$;

create or replace function public.submit_upi_payment(p_order_number text,p_access_token text,p_utr text,p_ip text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o orders; pay payments;
begin
 if not consume_rate_limit('upi-submit:'||p_ip,10,600) then raise exception 'Too many payment submissions'; end if;
 select * into o from orders where order_number=p_order_number for update;
 if not found or o.payment_method<>'upi' or not (o.access_token_hash=crypt(p_access_token,o.access_token_hash)) then raise exception 'Invalid order'; end if;
 if o.expires_at < now() then raise exception 'Order expired'; end if;
 select * into pay from payments where order_id=o.id for update;
 if pay.status='paid' then return jsonb_build_object('status','paid','order_number',o.order_number); end if;
 if pay.status='pending_verification' and upper(pay.upi_reference)=upper(p_utr) then return jsonb_build_object('status','pending_verification','order_number',o.order_number); end if;
 update payments set upi_reference=upper(p_utr),submitted_at=now(),status='pending_verification',rejection_reason=null,version=version+1,updated_at=now() where id=pay.id;
 update orders set payment_status='pending_verification',status='payment_under_review',updated_at=now() where id=o.id;
 insert into payment_audit_events(payment_id,event_type,from_status,to_status,metadata) values(pay.id,'customer_submitted',pay.status,'pending_verification',jsonb_build_object('ip',p_ip));
 insert into email_outbox(event_key,template,recipient,subject,payload) values('payment:'||pay.id||':submitted:'||(pay.version+1),'upi_owner',current_setting('app.owner_email',true),'UPI Payment Verification Required — #'||o.order_number,jsonb_build_object('order_id',o.id,'payment_id',pay.id)) on conflict do nothing;
 insert into email_outbox(event_key,template,recipient,subject,payload) values('payment:'||pay.id||':customer-submitted:'||(pay.version+1),'upi_submitted_customer',o.customer_email,'We''ve Received Your Chocobites Payment Details!',jsonb_build_object('order_id',o.id)) on conflict do nothing;
 return jsonb_build_object('status','pending_verification','order_number',o.order_number);
exception when unique_violation then raise exception 'This transaction reference has already been submitted'; end $$;

create or replace function public.verify_upi_payment(p_payment_id uuid,p_action text,p_reason text,p_admin_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare pay payments; o orders; target payment_status;
begin
 if not exists(select 1 from admin_users where user_id=p_admin_id) then raise exception 'Unauthorized'; end if;
 select * into pay from payments where id=p_payment_id for update;
 if not found or pay.status<>'pending_verification' then raise exception 'Payment is no longer awaiting verification'; end if;
 select * into o from orders where id=pay.order_id for update; target:=case when p_action='approve' then 'paid'::payment_status else 'rejected'::payment_status end;
 update payments set status=target,verified_at=case when p_action='approve' then now() end,verified_by=p_admin_id,rejection_reason=case when p_action='reject' then p_reason end,version=version+1,updated_at=now() where id=pay.id and version=pay.version;
 update orders set payment_status=target,status=case when p_action='approve' then 'confirmed'::order_status else 'payment_rejected'::order_status end,updated_at=now() where id=o.id;
 insert into payment_audit_events(payment_id,event_type,from_status,to_status,actor_id,metadata) values(pay.id,'admin_'||p_action,pay.status,target,p_admin_id,jsonb_build_object('reason',p_reason));
 insert into email_outbox(event_key,template,recipient,subject,payload) values('payment:'||pay.id||':'||p_action,'upi_'||case when p_action='approve' then 'approved' else 'rejected' end,o.customer_email,case when p_action='approve' then 'Payment Confirmed! Your Chocobites Order Is Being Prepared 🍫' else 'Update about your Chocobites payment' end,jsonb_build_object('order_id',o.id,'payment_id',pay.id)) on conflict do nothing;
 return jsonb_build_object('status',target,'order_number',o.order_number);
end $$;

create or replace function public.release_expired_upi_stock() returns integer language plpgsql security definer set search_path=public as $$
declare o orders; n integer:=0;
begin for o in select * from orders where status='awaiting_payment' and expires_at<now() and stock_released_at is null for update skip locked loop
 update products p set stock=p.stock+i.quantity from order_items i where i.order_id=o.id and i.product_id=p.id;
 update orders set status='expired',stock_released_at=now(),updated_at=now() where id=o.id; n:=n+1; end loop; return n; end $$;

revoke all on function public.create_checkout_order(jsonb,text) from public;
revoke all on function public.submit_upi_payment(text,text,text,text) from public;
revoke all on function public.verify_upi_payment(uuid,text,text,uuid) from public;
revoke all on function public.release_expired_upi_stock() from public;
revoke all on function public.consume_rate_limit(text,integer,integer) from public;
