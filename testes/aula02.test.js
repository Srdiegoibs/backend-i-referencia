// ============================================================
// Testes oficiais - Aula 02
// CRUD em memoria + validacao
// ============================================================
// Estes testes NAO importam o servidor.js. Eles sobem o servidor
// do aluno como um programa a parte e fazem requisicoes HTTP de
// verdade. Ou seja: so cobram o contrato das rotas, nunca a
// forma como o codigo esta organizado.

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const BASE = 'http://localhost:3000';
let servidor;

async function esperarServidor() {
    for (let i = 0; i < 60; i++) {
        try {
            await fetch(`${BASE}/treinos`);
            return;
        } catch {
            await new Promise((r) => setTimeout(r, 250));
        }
    }
    throw new Error('O servidor nao respondeu em http://localhost:3000 (rode: npm start)');
}

// Le o corpo como JSON sem quebrar o teste quando a resposta nao e JSON
// (o Express, sem a rota escrita, responde 404 em HTML)
async function corpoJson(r) {
    const texto = await r.text();
    try {
        return JSON.parse(texto);
    } catch {
        return null;
    }
}

before(async () => {
    servidor = spawn('node', ['servidor.js'], { stdio: 'ignore' });
    await esperarServidor();
});

after(() => {
    if (servidor) servidor.kill();
});

test('GET /treinos responde 200 com uma lista', async () => {
    const r = await fetch(`${BASE}/treinos`);
    assert.strictEqual(r.status, 200);
    assert.ok(Array.isArray(await r.json()), 'a resposta deveria ser um array');
});

test('POST /treinos cria e responde 201 com id', async () => {
    const r = await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Peito e triceps', duracao: 60 })
    });
    assert.strictEqual(r.status, 201);

    const criado = await r.json();
    assert.ok(criado.id !== undefined, 'o treino criado deveria ter um id');
    assert.strictEqual(criado.nome, 'Peito e triceps');
    assert.strictEqual(criado.duracao, 60);
});

test('POST /treinos sem nome responde 400', async () => {
    const r = await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duracao: 30 })
    });
    assert.strictEqual(r.status, 400);
});

test('POST /treinos com duracao invalida responde 400', async () => {
    const r = await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Corrida', duracao: -5 })
    });
    assert.strictEqual(r.status, 400);
});

test('GET /treinos/:id devolve o treino criado', async () => {
    const criado = await (await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Costas', duracao: 45 })
    })).json();

    const r = await fetch(`${BASE}/treinos/${criado.id}`);
    assert.strictEqual(r.status, 200);
    assert.strictEqual((await r.json()).nome, 'Costas');
});

test('GET /treinos/:id inexistente responde 404 com json de erro', async () => {
    const r = await fetch(`${BASE}/treinos/99999`);
    assert.strictEqual(r.status, 404);

    const corpo = await corpoJson(r);
    assert.ok(corpo && corpo.erro !== undefined,
        'a resposta 404 deveria ser um JSON com o campo erro');
});

test('PUT /treinos/:id altera o treino', async () => {
    const criado = await (await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Pernas', duracao: 50 })
    })).json();

    const r = await fetch(`${BASE}/treinos/${criado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Pernas pesado', duracao: 75 })
    });
    assert.strictEqual(r.status, 200);

    const atualizado = await r.json();
    assert.strictEqual(atualizado.nome, 'Pernas pesado');
    assert.strictEqual(atualizado.duracao, 75);
});

test('PUT /treinos/:id inexistente responde 404', async () => {
    const r = await fetch(`${BASE}/treinos/99999`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Qualquer', duracao: 10 })
    });
    assert.strictEqual(r.status, 404);

    const corpo = await corpoJson(r);
    assert.ok(corpo && corpo.erro !== undefined,
        'a resposta 404 deveria ser um JSON com o campo erro');
});

test('DELETE /treinos/:id remove o treino', async () => {
    const criado = await (await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Ombro', duracao: 40 })
    })).json();

    const r = await fetch(`${BASE}/treinos/${criado.id}`, { method: 'DELETE' });
    assert.strictEqual(r.status, 204);

    const depois = await fetch(`${BASE}/treinos/${criado.id}`);
    assert.strictEqual(depois.status, 404, 'depois de apagar, o GET deveria dar 404');
});

test('DELETE /treinos/:id inexistente responde 404 com json de erro', async () => {
    const r = await fetch(`${BASE}/treinos/99999`, { method: 'DELETE' });
    assert.strictEqual(r.status, 404);

    const corpo = await corpoJson(r);
    assert.ok(corpo && corpo.erro !== undefined,
        'a resposta 404 deveria ser um JSON com o campo erro');
});
