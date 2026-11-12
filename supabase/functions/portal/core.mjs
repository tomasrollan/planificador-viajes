/* Lógica pura del portal del cliente (sin red ni base de datos), para poder probarla con Node.
   Regla: el cliente NUNCA recibe el registro completo. Se arma una vista con lista blanca de campos,
   y al guardar solo se aceptan los campos que el cliente puede tocar (también con lista blanca). */

export const MAX_JSON = 200000;        // tope de tamaño por campo guardado
export const MAX_LOG_APPEND = 20;
export const MAX_NEW_CASES = 10;
export const MAX_MSGS = 20;

const PRIVATE_CLIENT_KEYS = ['pin', 'notes', 'log', 'stage', 'next', 'docs', 'post', 'famId', 'agency_id', 'budget', 'items', 'pay', 'cancel'];
const WRITABLE = ['days', 'favs', 'intake', 'requests', 'travelers'];

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const clone = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));
const str = (x, n) => String(x == null ? '' : x).slice(0, n);

export function pinOk(client, pin) {
  const a = String((client && client.pin) || ''), b = String(pin == null ? '' : pin).trim();
  if (!a || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);   // comparación en tiempo constante
  return d === 0;
}

/* ids de archivos que el cliente puede abrir (comprobantes de ítems visibles y de cuotas compartidas) */
export function visibleFileIds(client) {
  const ids = {};
  (client.items || []).forEach((i) => { if (i && i.visible && i.file && i.file.id) ids[i.file.id] = i.file.name || 'comprobante'; });
  if (payShared(client)) ((client.pay && client.pay.plan) || []).forEach((q) => { if (q && q.file && q.file.id) ids[q.file.id] = q.file.name || 'comprobante'; });
  return ids;
}
function payShared(c) { return !!(c.pay && Array.isArray(c.pay.plan) && c.pay.plan.length && c.pay.share !== false); }

function fileRef(f) { return f && f.id ? { id: String(f.id), name: str(f.name, 120), type: str(f.type, 60), size: Number(f.size) || 0 } : null; }

/* Vista que recibe el cliente. */
export function portalView(client, cases, agency) {
  const v = clone(client);
  PRIVATE_CLIENT_KEYS.forEach((k) => { delete v[k]; });
  const share = !!(client.budget && client.budget.share);
  if (share) {
    v.budget = clone(client.budget);
    v.items = (client.items || []).map((i) => {
      const o = { id: i.id, cat: i.cat, title: i.title, date: i.date, amount: i.amount, status: i.status, paid: i.paid, credits: i.credits, visible: !!i.visible };
      if (i.visible) { o.conf = i.conf; o.file = fileRef(i.file); }
      return o;
    });
  } else {
    v.items = (client.items || []).filter((i) => i && i.visible).map((i) => ({ id: i.id, cat: i.cat, title: i.title, date: i.date, status: i.status, conf: i.conf, file: fileRef(i.file), visible: true, credits: i.credits }));
  }
  if (payShared(client)) {
    v.pay = { price: client.pay.price, share: true, plan: client.pay.plan.map((q) => ({ id: q.id, n: q.n, due: q.due, amount: q.amount, paidAt: q.paidAt || null, file: fileRef(q.file) })) };
  }
  const mine = (cases || []).filter((k) => k && k.cid === client.id).map((k) => {
    const o = clone(k); delete o.agency_id;
    o.thread = (k.thread || []).filter((m) => m && m.kind !== 'nota').map(clone);
    return o;
  });
  return {
    client: v,
    cases: mine,
    agency: { name: str(agency && agency.name, 120), tagline: str(agency && agency.tagline, 200), tz: str(agency && agency.tz, 60), tzName: str(agency && agency.tzName, 60) }
  };
}

/* Aplica lo que mandó el cliente sobre el registro del servidor. Devuelve {client, caseOps, rejected}.
   caseOps: [{op:'insert'|'update', data}] ya validados. */
export function applyPatch(server, serverCases, patch, ids) {
  const out = clone(server), rejected = [];
  patch = isObj(patch) ? patch : {};
  const fields = isObj(patch.fields) ? patch.fields : {};
  WRITABLE.forEach((k) => {
    if (!(k in fields)) return;
    const val = fields[k];
    if (JSON.stringify(val).length > MAX_JSON) { rejected.push(k + ':tamaño'); return; }
    if (k === 'days') {
      if (!Array.isArray(val)) { rejected.push('days:tipo'); return; }
      if (server.mode === 'view') { rejected.push('days:modo'); return; }
      out.days = mergeDays(server, val);
    } else if (k === 'favs' || k === 'intake') {
      if (k === 'favs' && !isObj(val)) { rejected.push('favs:tipo'); return; }
      if (k === 'intake' && val !== null && !isObj(val)) { rejected.push('intake:tipo'); return; }
      out[k] = clone(val);
    } else if (k === 'requests') {
      if (!Array.isArray(val)) { rejected.push('requests:tipo'); return; }
      out.requests = clone(val).slice(0, 200);
    } else if (k === 'travelers') {
      if (!Array.isArray(val)) { rejected.push('travelers:tipo'); return; }
      // el cliente puede corregir nombres/alergias; no puede sumar ni sacar viajeros (cambia el costo del viaje)
      const byId = {}; val.forEach((t) => { if (t && t.id) byId[t.id] = t; });
      out.travelers = (server.travelers || []).map((t) => {
        const n = byId[t.id]; if (!n) return t;
        return Object.assign({}, t, { name: str(n.name, 80) || t.name, allergies: str(n.allergies, 300) });
      });
    }
  });
  // historial: el cliente solo agrega entradas nuevas, siempre marcadas como suyas
  const add = Array.isArray(patch.logAppend) ? patch.logAppend.slice(0, MAX_LOG_APPEND) : [];
  if (add.length) {
    out.log = Array.isArray(out.log) ? out.log : [];
    add.forEach((e) => { if (isObj(e) && e.t) out.log.push({ t: str(e.t, 300), kind: 'evento', by: 'cliente', at: Date.now() }); });
    if (out.log.length > 500) out.log = out.log.slice(-500);
  }
  // casos: solo los de este viaje; mensajes nuevos del cliente y casos nuevos
  const caseOps = [];
  const cs = Array.isArray(patch.cases) ? patch.cases : [];
  let nNew = 0;
  cs.forEach((k) => {
    if (!isObj(k) || !k.id) return;
    const cur = (serverCases || []).filter((x) => x.id === k.id)[0];
    const msgs = (Array.isArray(k.thread) ? k.thread : []).filter((m) => isObj(m) && m.id && m.by === 'cliente' && (m.kind === 'msg' || m.kind === 'pedido' || !m.kind)).slice(0, MAX_MSGS);
    const clean = (m) => ({ id: str(m.id, 40), by: 'cliente', kind: m.kind === 'pedido' ? 'pedido' : 'msg', text: str(m.text, 2000), at: Number(m.at) || Date.now() });
    if (cur) {
      if (cur.cid !== server.id) { rejected.push('case:ajeno'); return; }
      const have = {}; (cur.thread || []).forEach((m) => { have[m.id] = 1; });
      const fresh = msgs.filter((m) => !have[m.id]).map(clean);
      if (fresh.length) { const d = clone(cur); d.thread = (d.thread || []).concat(fresh); d.updated = Date.now(); if (d.status === 'resuelto' || d.status === 'cerrado') d.status = 'en_curso'; caseOps.push({ op: 'update', data: d }); }
    } else {
      if (++nNew > MAX_NEW_CASES) { rejected.push('case:límite'); return; }
      const now = Date.now();
      caseOps.push({
        op: 'insert',
        data: {
          id: str(k.id, 40), agency_id: server.agency_id, cid: server.id, title: str(k.title, 200) || 'Consulta', type: str(k.type, 40) || 'Consulta',
          priority: ['baja', 'normal', 'alta'].indexOf(k.priority) >= 0 ? k.priority : 'normal', status: 'nuevo', created: now, updated: now, due: Number(k.due) || now + 36e5 * 24,
          source: 'cliente', ref: isObj(k.ref) ? clone(k.ref) : null, thread: msgs.map(clean), num: 0
        }
      });
    }
  });
  return { client: out, caseOps, rejected };
}

/* Días: el cliente propone dentro de lo que su modo permite. Las comidas ya reservadas no se tocan. */
function mergeDays(server, incoming) {
  const srvDays = server.days || [];
  const byDate = {}; incoming.forEach((d) => { if (d && d.date) byDate[d.date] = d; });
  return srvDays.map((sd) => {
    const nd = byDate[sd.date]; if (!nd) return sd;
    const out = Object.assign({}, sd, { park: nd.park === undefined ? sd.park : str(nd.park, 60) });
    out.slots = Object.assign({}, sd.slots);
    ['breakfast', 'lunch', 'dinner'].forEach((m) => {
      const cur = (sd.slots || {})[m], nxt = nd.slots ? nd.slots[m] : undefined;
      if (nxt === undefined) return;
      if (cur && cur.state === 'reservada' && server.mode !== 'auto') return;            // la reserva real la maneja la agencia
      if (cur && cur.locked) return;
      if (nxt === null) { out.slots[m] = null; return; }
      if (!isObj(nxt) || !nxt.rid) return;
      const s = { rid: str(nxt.rid, 80), state: 'idea', time: str(nxt.time, 8), conf: cur ? cur.conf || '' : '', by: 'cliente' };
      if (server.mode === 'auto') s.state = nxt.state === 'por_reservar' ? 'por_reservar' : (cur && cur.state === 'reservada' ? 'reservada' : 'idea');
      else s.state = nxt.state === 'por_reservar' ? 'por_reservar' : 'idea';
      if (nxt.note) s.note = str(nxt.note, 300);
      out.slots[m] = s;
    });
    return out;
  });
}

/* límite de intentos de PIN: 5 fallos en 15 minutos por token */
export const MAX_FAILS = 5, WINDOW_MIN = 15;
export function tooManyFails(attempts, now) {
  const since = now - WINDOW_MIN * 60000;
  return attempts.filter((a) => !a.ok && new Date(a.at).getTime() >= since).length >= MAX_FAILS;
}
