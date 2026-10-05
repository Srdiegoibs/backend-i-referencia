// Aula 03, desafios 1 a 6 (nao roda no semaforo, so o professor usa na correcao)
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

before(async () => {
  await subir();
  await post('Peito e triceps', 60);
  await post('Costas', 45);
  await post('Pernas', 50);
  await post('Corrida', 20);
});
after(parar);

test('D1 GET /treinos/total', async () => {
  const todos = await lista();
  const r = await fetch(`${BASE}/treinos/total`);
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(await r.json(), { total: todos.length });
});
test('D2 filtro ?minimo=40', async () => {
  await post('Longo', 90);
  const f = await lista('?minimo=40');
  assert.ok(Array.isArray(f) && f.length > 0);
  assert.ok(f.every(t => t.duracao >= 40));
  const todos = await lista();
  assert.strictEqual(todos.filter(t => t.duracao >= 40).length, f.length);
});
test('D3 ordenacao maior para menor', async () => {
  const l = await lista();
  for (let i = 1; i < l.length; i++) assert.ok(l[i - 1].duracao >= l[i].duracao, 'fora de ordem');
});
test('D4 busca ?busca=peito', async () => {
  const f = await lista('?busca=peito');
  assert.ok(Array.isArray(f) && f.length > 0);
  assert.ok(f.every(t => t.nome.toLowerCase().includes('peito')));
});
test('D5 resumo {total,minutos,media}', async () => {
  const r = await fetch(`${BASE}/treinos/resumo`);
  assert.strictEqual(r.status, 200);
  const j = await r.json(); const l = await lista();
  const soma = l.reduce((s, t) => s + t.duracao, 0);
  assert.strictEqual(j.total, l.length); assert.strictEqual(j.minutos, soma);
  assert.ok(Math.abs(j.media - soma / l.length) < 0.01);
});
test('D6 id invalido 400, inexistente 404', async () => {
  assert.strictEqual((await fetch(`${BASE}/treinos/abc`)).status, 400);
  assert.strictEqual((await fetch(`${BASE}/treinos/99999`)).status, 404);
});
