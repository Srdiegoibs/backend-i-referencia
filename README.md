# Back-End I — Repositório de referência

CEEP Pedro Boaretto Neto — Técnico em Desenvolvimento de Sistemas
Prof. Diego Silva

Este repositório tem duas funções:

1. **Gabarito por aula.** O `servidor.js` como ele deve ficar ao fim de cada aula, marcado por tag: `aula-02`, `aula-03`, `aula-04`…
   Quem se perdeu abre a tag da aula anterior e volta pro trilho.
2. **Testes oficiais.** A pasta `testes/` tem um arquivo por aula. O GitHub Actions de cada aluno baixa esses arquivos e roda contra o código dele.

## Como os testes funcionam

Eles **não importam** o `servidor.js`. Sobem o servidor do aluno como um programa à parte e fazem requisições HTTP de verdade contra `http://localhost:3000`.

Ou seja: cobram só o **contrato das rotas** — método, caminho, status e corpo. Nunca a organização do código. Quando o projeto for quebrado em camadas na Aula 04, os testes continuam passando sem uma linha de ajuste.

## Rodar os testes localmente

Dentro da pasta do projeto do aluno:

```
node --test caminho/para/testes/aula02.test.js
```

## Publicar uma aula nova

1. Atualiza o `servidor.js` até o estado da aula
2. Cria `testes/aulaNN.test.js`
3. Commita e cria a tag: `git tag aula-NN && git push --tags`

A partir do push seguinte de cada aluno, os testes novos já valem — ninguém precisa copiar nada.
