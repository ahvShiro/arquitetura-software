const express = require("express");
const axios = require("axios");
const db = require("./db");

const app = express();

const PRODUTOS_URL = process.env.PRODUTOS_URL || "http://localhost:3001";
const CLIENTES_URL = process.env.CLIENTES_URL || "http://localhost:3003";

app.use(express.json());

app.get("/pedidos", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM pedidos ORDER BY id");

    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar pedidos",
    });
  }
});

const getClienteInfo = async (clienteId) =>  {
  try {
    return await axios.get(
      `${CLIENTES_URL}/clientes/${clienteId}`,
      {
        timeout: 3000,
      },
    );

  } catch (e) {
    if (e.response?.status === 404) {
      throw { status: 400, mensagem: "Cliente não encontrado" };
    }

    if (e.code === "ECONNREFUSED" || e.code === "ECONNABORTED" || e.response?.status === 500) {
      throw { status: 503, mensagem: "Serviço de Clientes indisponível" };
    }

    throw e;
  }
}

const getProdutoInfo = async (produtoId) =>  {
  try {
    return await axios.get(
      `${PRODUTOS_URL}/produtos/${produtoId}`,
      {
        timeout: 3000,
      },
    );

  } catch (e) {
    if (e.response?.status === 404) {
      throw { status: 400, mensagem: "Produto não encontrado" };
    }

    if (e.code === "ECONNREFUSED" || e.code === "ECONNABORTED" || e.response?.status === 500) {
      throw { status: 503, mensagem: "Serviço de Produtos indisponível" };
    }

    throw e;
  }
}

app.post("/pedidos", async (req, res) => {
  const { produtoId, clienteId, quantidade } = req.body;

  if (!produtoId || !clienteId || !quantidade || quantidade <= 0) {
    return res.status(400).json({
      erro: "produtoId, clienteId e quantidade válida são obrigatórios",
    });
  }

  try {
    const [{ data: cliente }, { data: produto }] = await Promise.all([
      getClienteInfo(clienteId),
      getProdutoInfo(produtoId),
    ]);

    const total = produto.preco * quantidade;

    const resultado = await db.query(
      `INSERT INTO pedidos (produto_id, cliente_id, nome_produto, preco_unitario, quantidade, total)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [produto.id, cliente.id, produto.nome, produto.preco, quantidade, total],
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    if (erro.status) {
      return res.status(erro.status).json({
        erro: erro.mensagem,
      });
    }

    return res.status(500).json({
      erro: "Erro ao criar pedido",
    });
  }
});

app.get("/pedidos/:id", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM pedidos WHERE id = $1", [
      req.params.id,
    ]);

    const pedido = resultado.rows[0];

    if (!pedido) {
      return res.status(404).json({
        erro: "Pedido não encontrado",
      });
    }

    res.json(pedido);
  } catch (erro) {
    res.status(500).json({
      erro: "Erro ao buscar pedido",
    });
  }
});

app.use(express.json());

async function criarTabela() {
  await db.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        produto_id INTEGER NOT NULL,
        cliente_id INTEGER NOT NULL,
        nome_produto VARCHAR(100) NOT NULL,
        preco_unitario NUMERIC(10, 2) NOT NULL,
        quantidade INTEGER NOT NULL,
        total NUMERIC(10, 2) NOT NULL
        )
    `);

  console.log("Tabela de pedidos pronta");
}

criarTabela();

app.listen(3002, () => {
  console.log("Pedidos rodando na porta 3002");
});
