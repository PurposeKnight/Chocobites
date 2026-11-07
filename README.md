# Chocobites

A production-oriented chocolate storefront with COD and manually verified UPI payments.

## Configure

1. Create a Supabase project and run the migration in supabase/migrations.
2. Add the first owner to admin_users using their Supabase Auth user ID.
3. Set app.owner_email in the database, then configure the values in .env.example as runtime secrets.
4. Set the UPI ID, payee name, instructions, shipping fees, and method availability in payment_settings.
5. Schedule POST /api/jobs/email-outbox with the CRON_SECRET bearer token every minute.
6. Schedule public.release_expired_upi_stock() every five minutes with Supabase Cron.

The service-role key is server-only. Never expose it with a NEXT_PUBLIC prefix.

## Commands

- npm run dev — local development
- npm test — validation and security-contract tests
- npm run build — production build

Manual UPI payments are never auto-approved. Approval requires an authenticated Supabase user listed in admin_users, explicit independent verification, and an atomic database transition.
