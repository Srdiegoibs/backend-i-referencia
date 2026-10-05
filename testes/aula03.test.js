// ============================================================
// Testes oficiais - Aula 03
// SQLite dentro da API
// ============================================================
// Como na Aula 02, estes testes sobem o servidor do aluno como um
// programa a parte e fazem requisicoes HTTP de verdade. Eles cobram
// so o que a Aula 03 muda: os dados passam a morar no banco.
// (Os desafios da aula nao entram aqui, para a organizacao em camadas
// da Aula 04 nao deixar o semaforo vermelho.)

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');

const BASE = 'http://localhost:3000';
const JSON_HEADERS = { 'Content-Type': 'application/json' };
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

function subir() {
    servidor = spawn('node', ['servidor.js'], { stdio: 'ignore' });
    return esperarServidor();
}

async function parar() {
    if (servidor) {
        servidor.kill();
        await new Promise((r) => setTimeout(r, 400));
    }
}

async function criar(nome, duracao) {
    const r = await fetch(`${BASE}/treinos`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ nome, duracao })
    });
    assert.strictEqual(r.status, 201, 'POST /treinos deveria responder 201');
    return r.json();
}

before(subir);
after(parar);

test('PUT altera so o treino do id (UPDATE com WHERE)', async () => {
    const alvo = await criar('Alvo', 11);
    const outro = await criar('Intocado', 22);

    const r = await fetch(`${BASE}/treinos/${alvo.id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ nome: 'Alvo editado', duracao: 12 })
    });
    assert.strictEqual(r.status, 200);

    const r2 = await fetch(`${BASE}/treinos/${outro.id}`);
    const intocado = await r2.json();
    assert.strictEqual(intocado.nome, 'Intocado', 'o PUT mexeu em outro treino (faltou o WHERE?)');
    assert.strictEqual(intocado.duracao, 22);
});

test('DELETE remove so o treino do id (DELETE com WHERE)', async () => {
    const alvo = await criar('Para apagar', 15);
    const outro = await criar('Deve ficar', 25);

    const r = await fetch(`${BASE}/treinos/${alvo.id}`, { method: 'DELETE' });
    assert.strictEqual(r.status, 204);

    const r2 = await fetch(`${BASE}/treinos/${outro.id}`);
    assert.strictEqual(r2.status, 200, 'o DELETE apagou outro treino (faltou o WHERE?)');
});

test('os dados continuam la depois de reiniciar o servidor', async () => {
    const c = await criar('Persistente', 33);

    await parar();
    await subir();

    const r = await fetch(`${BASE}/treinos/${c.id}`);
    assert.strictEqual(r.status, 200, 'o treino sumiu ao reiniciar (os dados estao so em memoria?)');
    assert.strictEqual((await r.json()).nome, 'Persistente');
});
