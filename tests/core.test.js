import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import "fake-indexeddb/auto";
import {
  makeFlow,
  templates,
  publicTemplate,
  safeUrl,
} from "../src/flow/catalog.js";
import { readAccount, writeAccount } from "../src/flow/database.js";
import { componentIds, migrateAccount } from "../src/flow/model.js";

test("Flow instances are independent and public models exclude private content", () => {
  const a = makeFlow(templates[0]),
    b = makeFlow(templates[0]);
  a.componentData.tasks.items[0].text = "PRIVATE";
  a.componentData.notes.text = "SECRET";
  a.componentData.links.items = [{ url: "https://private.example" }];
  a.sessions.push({ seconds: 50 });
  assert.notEqual(a.id, b.id);
  assert.notEqual(
    a.componentData.tasks.items[0].text,
    b.componentData.tasks.items[0].text,
  );
  const serialized = JSON.stringify(publicTemplate(a));
  assert.ok(!serialized.includes("PRIVATE"));
  assert.ok(!serialized.includes("SECRET"));
  assert.ok(!serialized.includes("private.example"));
  assert.equal(publicTemplate(a).sessions, undefined);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,x"), null);
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
});
test("Flow v1 migrates without losing component content", () => {
  const account = migrateAccount({
    version: 2,
    name: "Pessoa",
    flows: [
      {
        id: "old",
        name: "Legado",
        category: "Estudos",
        color: "mint",
        icon: "✳",
        components: ["tasks", "notes"],
        data: {
          tasks: [{ id: "t", text: "Preservar", done: false }],
          notesText: "Contexto",
          focusMinutes: 40,
        },
        sessions: [{ id: "s", seconds: 60 }],
      },
    ],
  });
  const flow = account.flows[0];
  assert.equal(account.version, 3);
  assert.equal(flow.schemaVersion, 2);
  assert.equal(flow.identity.name, "Legado");
  assert.deepEqual(componentIds(flow), ["tasks", "notes"]);
  assert.equal(flow.componentData.tasks.items[0].text, "Preservar");
  assert.equal(flow.componentData.notes.text, "Contexto");
  assert.equal(flow.sessions.length, 1);
});
test("IndexedDB survives reads and separates account namespaces", async () => {
  await writeAccount("guest", { account: { name: "Local" } });
  await writeAccount("user:a", { account: { name: "Alice" } });
  assert.equal((await readAccount("guest")).account.name, "Local");
  assert.equal((await readAccount("user:a")).account.name, "Alice");
  assert.equal(await readAccount("user:b"), undefined);
});
test("Postgres migration enforces ownership, public templates and atomic conflicts", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth; create role anon; create role authenticated; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated; insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`,
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609160001_flow_platform.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202609170001_flow_definition_v2.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      `set role authenticated; set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111'; grant insert, update on public.flow_accounts to authenticated;`,
    );
    assert.equal(
      (
        await db.query(
          `select public.save_flow_account('{"flows":[]}'::jsonb,0) as revision`,
        )
      ).rows[0].revision,
      1,
    );
    await assert.rejects(
      db.query(`select public.save_flow_account('{}'::jsonb,0)`),
      /revision_conflict/,
    );
    assert.equal(
      (
        await db.query(
          `select public.save_flow_account('{"flows":[1]}'::jsonb,1) as revision`,
        )
      ).rows[0].revision,
      2,
    );
    await db.query(
      `insert into public.flow_templates(blueprint) values ('{"name":"Public","components":["focus"]}')`,
    );
    await assert.rejects(
      db.query(
        `insert into public.flow_templates(blueprint) values ('{"name":"Invalid"}')`,
      ),
      /flow_templates_blueprint_shape_check/,
    );
    await db.exec(
      `set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222'`,
    );
    assert.equal(
      (await db.query("select * from public.flow_accounts")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        `insert into public.flow_templates(user_id,blueprint) values ('11111111-1111-4111-8111-111111111111','{}')`,
      ),
      /row-level security/,
    );
    assert.equal(
      (await db.query("delete from public.flow_templates returning id")).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query(`update public.flow_accounts set payload='{}'`)).rows
        .length,
      0,
    );
    await db.exec(`set role anon; set request.jwt.claim.sub=''`);
    assert.equal(
      (await db.query("select * from public.flow_templates")).rows.length,
      1,
    );
    await assert.rejects(
      db.query("select * from public.flow_accounts"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(`select public.save_flow_account('{}'::jsonb,0)`),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
