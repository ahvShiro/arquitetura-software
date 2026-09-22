const express = require("express");
const db = require("./db");

const app = express();

const CLIENTES_URL = process.env.CLIENTES_URL || "http://localhost:3003";

app.use(express.json());

app.get("/clientes", async (req, res) => {
  try {

    const result = await db.query("SELECT * FROM clientes ORDER BY id");
    res.json(res.rows);

  } catch (e) {

    res.status(500).json({
      erro: "Erro ao buscar clientes",
    });

  }
});

async function criarTabela() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cpf VARCHAR(11) NOT NULL,
        )
    `);

    console.log("Tabela de produtos pronta");
}

criarTabela();

app.listen(3003, () => {
    console.log("Clientes rodando na porta 3003");
});