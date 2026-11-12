// Portal del cliente: valida link + PIN en el servidor y entrega solo lo que el cliente puede ver.
// Acciones: open (leer), save (guardar lo que el cliente puede tocar), file (link temporal a un comprobante).
// El PIN nunca viaja al navegador. Se usa la service role key (variable de entorno del servidor, nunca en el repo).
import { createClient } from "npm:@supabase/supabase-js@2";
import { applyPatch, pinOk, portalView, tooManyFails, visibleFileIds } from "./core.mjs";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(url, key, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function findClient(token: string) {
  const { data } = await db.from("records").select("agency_id,id,data,rev,deleted").eq("kind", "client").eq("token", token).eq("deleted", false).maybeSingle();
  return data;
}
async function agencyInfo(agencyId: string) {
  const { data: m } = await db.from("records").select("data").eq("agency_id", agencyId).eq("kind", "meta").eq("id", "state").maybeSingle();
  if (m && m.data && m.data.agency) return m.data.agency;
  const { data: a } = await db.from("agencies").select("name").eq("id", agencyId).maybeSingle();
  return { name: a ? a.name : "" };
}
async function casesOf(agencyId: string, clientId: string) {
  const { data } = await db.from("records").select("id,data,rev").eq("agency_id", agencyId).eq("kind", "case").eq("deleted", false).filter("data->>cid", "eq", clientId);
  return data || [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "pedido inválido" }, 400); }
  const action = String(body.action || "");
  const token = String(body.token || "").slice(0, 80);
  const pin = String(body.pin || "").slice(0, 12);
  if (!token || !["open", "save", "file"].includes(action)) return json({ error: "pedido inválido" }, 400);

  // limpieza barata de intentos viejos
  await db.from("portal_attempts").delete().lt("at", new Date(Date.now() - 864e5).toISOString());

  const since = new Date(Date.now() - 15 * 60000).toISOString();
  const { data: att } = await db.from("portal_attempts").select("ok,at").eq("token", token).gte("at", since);
  if (tooManyFails(att || [], Date.now())) return json({ error: "demasiados intentos", code: "locked" }, 429);

  const row = await findClient(token);
  const good = !!row && pinOk(row.data, pin);
  await db.from("portal_attempts").insert({ token, ok: good });
  if (!good) return json({ error: "link o código incorrecto", code: "bad_pin" }, 401);
  if (row!.data && row!.data.cancel) return json({ error: "Este viaje ya no está disponible. Consultá con la agencia.", code: "cancelled" }, 403);

  const agencyId = row!.agency_id as string;

  if (action === "open") {
    const [cases, agency] = await Promise.all([casesOf(agencyId, row!.id), agencyInfo(agencyId)]);
    return json({ ok: true, view: portalView(row!.data, cases.map((c: any) => c.data), agency) });
  }

  if (action === "file") {
    const fileId = String(body.fileId || "");
    const allowed = visibleFileIds(row!.data);
    if (!allowed[fileId]) return json({ error: "archivo no disponible" }, 404);
    const { data, error } = await db.storage.from("comprobantes").createSignedUrl(`${agencyId}/${fileId}`, 120);
    if (error || !data) return json({ error: "El archivo todavía no está en la nube. Pedíselo a la agencia." }, 404);
    return json({ ok: true, url: data.signedUrl, name: allowed[fileId] });
  }

  // save: se reintenta si la agencia cambió el registro justo en el medio
  for (let i = 0; i < 4; i++) {
    const cur = i === 0 ? row! : await findClient(token);
    if (!cur) return json({ error: "viaje no encontrado" }, 404);
    if (cur.data && cur.data.cancel) return json({ error: "Este viaje ya no está disponible. Consultá con la agencia.", code: "cancelled" }, 403);
    const cases = await casesOf(agencyId, cur.id);
    const res = applyPatch({ ...cur.data, agency_id: agencyId }, cases.map((c: any) => c.data), body.patch, null);
    const { client } = res;
    delete client.agency_id;
    const upd = await db.from("records").update({ data: client, rev: cur.rev + 1, updated_at: new Date().toISOString() })
      .eq("agency_id", agencyId).eq("kind", "client").eq("id", cur.id).eq("rev", cur.rev).select("rev");
    if (upd.error) return json({ error: "no se pudo guardar" }, 500);
    if (!upd.data || !upd.data.length) continue;           // conflicto: otro cambio ganó, reintento con lo nuevo
    for (const op of res.caseOps) {
      if (op.op === "insert") {
        const d = { ...op.data }; delete d.agency_id;
        await db.from("records").insert({ agency_id: agencyId, kind: "case", id: d.id, data: d });
      } else {
        const rec = cases.find((c: any) => c.data.id === op.data.id);
        if (rec) { const d = { ...op.data }; delete d.agency_id; await db.from("records").update({ data: d, rev: rec.rev + 1, updated_at: new Date().toISOString() }).eq("agency_id", agencyId).eq("kind", "case").eq("id", d.id).eq("rev", rec.rev); }
      }
    }
    const [cs, agency] = await Promise.all([casesOf(agencyId, cur.id), agencyInfo(agencyId)]);
    return json({ ok: true, rejected: res.rejected, view: portalView(client, cs.map((c: any) => c.data), agency) });
  }
  return json({ error: "hubo un cambio al mismo tiempo, probá de nuevo" }, 409);
});
