// ============================================================
// API do Diario de Treinos
// Back-End I - CEEP Pedro Boaretto Neto
// GABARITO da Aula 02 - CRUD em memoria + validacao
// ============================================================

const express = require('express');
const app = express();

app.use(express.json());

// ------------------------------------------------------------
// Os dados moram aqui, na memoria. Somem quando o servidor cai.
// ------------------------------------------------------------
const treinos = [];
let proximoId = 1;

// ------------------------------------------------------------
// Validacao: devolve a mensagem de erro, ou null se estiver tudo certo
// ------------------------------------------------------------
function validarTreino(corpo) {
    if (typeof corpo.nome !== 'string' || corpo.nome.trim() === '') {
        return 'O campo nome e obrigatorio e deve ser um texto.';
    }
    if (typeof corpo.duracao !== 'number' || corpo.duracao <= 0) {
        return 'O campo duracao e obrigatorio e deve ser um numero maior que zero.';
    }
    return null;
}

// ------------------------------------------------------------
// GET /treinos - lista todos
// ------------------------------------------------------------
app.get('/treinos', (req, res) => {
    res.status(200).json(treinos);
});

// ------------------------------------------------------------
// GET /treinos/:id - busca um
// ------------------------------------------------------------
app.get('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    const treino = treinos.find((t) => t.id === id);

    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(200).json(treino);
});

// ------------------------------------------------------------
// POST /treinos - cria
// ------------------------------------------------------------
app.post('/treinos', (req, res) => {
    const erro = validarTreino(req.body);
    if (erro !== null) {
        return res.status(400).json({ erro: erro });
    }

    const treino = {
        id: proximoId,
        nome: req.body.nome,
        duracao: req.body.duracao
    };
    proximoId = proximoId + 1;
    treinos.push(treino);

    res.status(201).json(treino);
});

// ------------------------------------------------------------
// PUT /treinos/:id - substitui
// ------------------------------------------------------------
app.put('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    const treino = treinos.find((t) => t.id === id);

    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }

    const erro = validarTreino(req.body);
    if (erro !== null) {
        return res.status(400).json({ erro: erro });
    }

    treino.nome = req.body.nome;
    treino.duracao = req.body.duracao;

    res.status(200).json(treino);
});

// ------------------------------------------------------------
// DELETE /treinos/:id - remove
// ------------------------------------------------------------
app.delete('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    const posicao = treinos.findIndex((t) => t.id === id);

    if (posicao === -1) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }

    treinos.splice(posicao, 1);
    res.status(204).end();
});

// ------------------------------------------------------------
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
