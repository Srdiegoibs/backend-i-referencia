// Testes oficiais - Aula 03: banco SQLite no lugar do array (contrato das rotas + persistencia)
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const BASE = 'http://localhost:3000';
let servidor;
const J = { 'Content-Type': 'application/json' };

async function esperar() {
  for (let i = 0; i < 40; i++) {
    try { await fetch(`${BASE}/treinos`); return; } catch { await new Promise(r => setTimeout(r, 250)); }
  }
  throw new Error('servidor nao subiu');
}
function subir() { servidor = spawn('node', ['servidor.js'], { stdio: 'ignore' }); return esperar(); }
async function parar() { if (servidor) { servidor.kill(); await new Promise(r => setTimeout(r, 400)); } }
const post = async (nome, duracao) => (await fetch(`${BASE}/treinos`, { method: 'POST', headers: J, body: JSON.stringify({ nome, duracao }) }));
const lista = async (q = '') => (await fetch(`${BASE}/treinos${q}`)).json();

before(subir);
after(parar);

test('A02 POST cria 201 com id', async () => {
  const r = await post('Peito e triceps', 60);
  assert.strictEqual(r.status, 201);
  const c = await r.json();
  assert.ok(c.id !== undefined); assert.strictEqual(c.nome, 'Peito e triceps'); assert.strictEqual(c.duracao, 60);
});
test('A02 POST invalido 400', async () => {
  assert.strictEqual((await post(undefined, 30)).status, 400);
  assert.strictEqual((await post('X', -5)).status, 400);
});
test('A02 GET /:id 200 e 404 com json erro', async () => {
  const c = await (await post('Costas', 45)).json();
  const r = await fetch(`${BASE}/treinos/${c.id}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.json()).nome, 'Costas');
  const r2 = await fetch(`${BASE}/treinos/99999`);
  assert.strictEqual(r2.status, 404);
  const t = await r2.text(); let j = null; try { j = JSON.parse(t); } catch {}
  assert.ok(j && j.erro !== undefined);
});
test('A02 PUT altera, 404 e 400', async () => {
  const c = await (await post('Pernas', 50)).json();
  const r = await fetch(`${BASE}/treinos/${c.id}`, { method: 'PUT', headers: J, body: JSON.stringify({ nome: 'Pernas pesado', duracao: 75 }) });
  assert.strictEqual(r.status, 200);
  const a = await r.json(); assert.strictEqual(a.nome, 'Pernas pesado'); assert.strictEqual(a.duracao, 75);
  const r2 = await fetch(`${BASE}/treinos/99999`, { method: 'PUT', headers: J, body: JSON.stringify({ nome: 'Q', duracao: 10 }) });
  assert.strictEqual(r2.status, 404);
  const r3 = await fetch(`${BASE}/treinos/${c.id}`, { method: 'PUT', headers: J, body: JSON.stringify({ nome: '', duracao: 10 }) });
  assert.strictEqual(r3.status, 400);
});
test('A02 DELETE 204, depois 404; inexistente 404', async () => {
  const c = await (await post('Ombro', 40)).json();
  assert.strictEqual((await fetch(`${BASE}/treinos/${c.id}`, { method: 'DELETE' })).status, 204);
  assert.strictEqual((await fetch(`${BASE}/treinos/${c.id}`)).status, 404);
  assert.strictEqual((await fetch(`${BASE}/treinos/99999`, { method: 'DELETE' })).status, 404);
});
test('A03 PUT so altera o treino alvo (WHERE id)', async () => {
  const a = await (await post('Alvo', 11)).json();
  const b = await (await post('Intocado', 22)).json();
  await fetch(`${BASE}/treinos/${a.id}`, { method: 'PUT', headers: J, body: JSON.stringify({ nome: 'Alvo2', duracao: 12 }) });
  const bb = await (await fetch(`${BASE}/treinos/${b.id}`)).json();
  assert.strictEqual(bb.nome, 'Intocado'); assert.strictEqual(bb.duracao, 22);
});
test('A03 persiste depois de reiniciar o servidor', async () => {
  const c = await (await post('Persistente', 33)).json();
  await parar(); await subir();
  const r = await fetch(`${BASE}/treinos/${c.id}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.json()).nome, 'Persistente');
});
