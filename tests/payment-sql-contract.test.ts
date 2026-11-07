import test from "node:test";import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const sql=readFileSync(new URL("../supabase/migrations/202611070001_payments.sql",import.meta.url),"utf8");
test("duplicate UTRs are blocked",()=>assert.match(sql,/unique index payments_unique_utr[\s\S]*upper\(upi_reference\)/));
test("verification locks payment and enforces pending state",()=>{assert.match(sql,/where id=p_payment_id for update/);assert.match(sql,/pay\.status<>'pending_verification'/)});
test("public roles cannot mutate payments",()=>assert.match(sql,/revoke all on public\.orders[\s\S]*from anon, authenticated/));
test("abandoned stock can be released once",()=>{assert.match(sql,/release_expired_upi_stock/);assert.match(sql,/stock_released_at is null/)});
