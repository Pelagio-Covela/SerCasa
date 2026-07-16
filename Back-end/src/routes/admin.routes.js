const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/baseDados");
const { verificarToken, verificarPapel } = require("../middlewares/auth.middleware");

const router = express.Router();

// todas as rotas abaixo são exclusivas do administrador (acima do gerente)
router.use(verificarToken, verificarPapel("admin"));

// ─── Contas do sistema (visão geral) ────────────────────────────────────────

// LISTAR TODAS AS CONTAS (admin, gestores, trabalhadores), com filtro opcional por papel
router.get("/usuarios", async (req, res) => {
  try {
    const { papel } = req.query;
    let query = "SELECT id, nome, email, papel, ativo, criado_em FROM usuarios";
    const valores = [];
    if (papel) {
      query += " WHERE papel = ?";
      valores.push(papel);
    }
    query += " ORDER BY papel ASC, nome ASC";
    const [linhas] = await pool.query(query, valores);
    res.json({ total: linhas.length, usuarios: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter contas do sistema" });
  }
});

// ─── Gestores ────────────────────────────────────────────────────────────────

// LISTAR GESTORES
router.get("/gestores", async (req, res) => {
  try {
    const [linhas] = await pool.query(
      "SELECT id, nome, email, ativo, criado_em FROM usuarios WHERE papel = 'gerente' ORDER BY nome ASC"
    );
    res.json({ total: linhas.length, gestores: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter gestores" });
  }
});

// CRIAR GESTOR
router.post("/gestores", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: "Nome, email e senha são obrigatórios" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      "INSERT INTO usuarios (nome, email, senha_hash, papel, criado_por) VALUES (?, ?, ?, 'gerente', ?)",
      [nome, email, senhaHash, req.usuario.id]
    );

    res.status(201).json({ mensagem: "Gestor cadastrado com sucesso" });
  } catch (erro) {
    console.error(erro);
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Este email já está em uso" });
    }
    res.status(500).json({ mensagem: "Erro ao cadastrar gestor" });
  }
});

// EDITAR DADOS DE UM GESTOR (nome / email)
router.put("/gestores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ mensagem: "Nome e email são obrigatórios" });
    }

    await pool.query(
      "UPDATE usuarios SET nome = ?, email = ? WHERE id = ? AND papel = 'gerente'",
      [nome, email, id]
    );

    res.json({ mensagem: "Gestor atualizado com sucesso" });
  } catch (erro) {
    console.error(erro);
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Este email já está em uso" });
    }
    res.status(500).json({ mensagem: "Erro ao atualizar gestor" });
  }
});

// ATIVAR / DESATIVAR GESTOR
router.put("/gestores/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    await pool.query(
      "UPDATE usuarios SET ativo = ? WHERE id = ? AND papel = 'gerente'",
      [ativo, id]
    );

    res.json({ mensagem: "Estado do gestor atualizado" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar estado do gestor" });
  }
});

// RESETAR SENHA DE UM GESTOR (define uma senha temporária nova)
router.put("/gestores/:id/resetar-senha", async (req, res) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;

    if (!senha || senha.length < 6) {
      return res.status(400).json({ mensagem: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultado] = await pool.query(
      "UPDATE usuarios SET senha_hash = ? WHERE id = ? AND papel = 'gerente'",
      [senhaHash, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Gestor não encontrado" });
    }

    res.json({ mensagem: "Senha do gestor redefinida com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao redefinir senha" });
  }
});

// ─── Categorias de serviço (o admin gere sem precisar mexer no banco) ──────

// CRIAR CATEGORIA
router.post("/categorias", async (req, res) => {
  try {
    const { id, nome, icone, descricao, cor } = req.body;

    if (!id || !nome) {
      return res.status(400).json({ mensagem: "Id e nome da categoria são obrigatórios" });
    }

    await pool.query(
      "INSERT INTO categorias (id, nome, icone, descricao, cor) VALUES (?, ?, ?, ?, ?)",
      [id, nome, icone || null, descricao || null, cor || null]
    );

    res.status(201).json({ mensagem: "Categoria criada com sucesso" });
  } catch (erro) {
    console.error(erro);
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Já existe uma categoria com este id" });
    }
    res.status(500).json({ mensagem: "Erro ao criar categoria" });
  }
});

// EDITAR CATEGORIA
router.put("/categorias/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, icone, descricao, cor } = req.body;

    await pool.query(
      "UPDATE categorias SET nome = ?, icone = ?, descricao = ?, cor = ? WHERE id = ?",
      [nome, icone || null, descricao || null, cor || null, id]
    );

    res.json({ mensagem: "Categoria atualizada com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar categoria" });
  }
});

// REMOVER CATEGORIA (só se não estiver em uso)
router.delete("/categorias/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[emUsoProfissionais]] = await pool.query(
      "SELECT COUNT(*) AS total FROM profissionais WHERE categoria_id = ?",
      [id]
    );
    const [[emUsoAgendamentos]] = await pool.query(
      "SELECT COUNT(*) AS total FROM agendamentos WHERE categoria_id = ?",
      [id]
    );

    if (emUsoProfissionais.total > 0 || emUsoAgendamentos.total > 0) {
      return res.status(409).json({
        mensagem: `Não é possível remover: existem ${emUsoProfissionais.total} profissional(is) e ${emUsoAgendamentos.total} agendamento(s) usando esta categoria.`,
      });
    }

    await pool.query("DELETE FROM categorias WHERE id = ?", [id]);
    res.json({ mensagem: "Categoria removida com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao remover categoria" });
  }
});

// ─── Configurações do sistema (taxa da app, etc.) ──────────────────────────

// LISTAR CONFIGURAÇÕES
router.get("/configuracoes", async (req, res) => {
  try {
    const [linhas] = await pool.query("SELECT chave, valor, descricao, atualizado_em FROM configuracoes");
    res.json({ configuracoes: linhas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao obter configurações (a migração 009 foi aplicada?)" });
  }
});

// ATUALIZAR UMA CONFIGURAÇÃO
router.put("/configuracoes/:chave", async (req, res) => {
  try {
    const { chave } = req.params;
    const { valor } = req.body;

    if (valor === undefined || valor === null || String(valor).trim() === "") {
      return res.status(400).json({ mensagem: "Valor é obrigatório" });
    }

    // validação específica da taxa: precisa ser um número entre 0 e 100
    if (chave === "taxa_app_percentual") {
      const numero = Number(valor);
      if (!Number.isFinite(numero) || numero < 0 || numero > 100) {
        return res.status(400).json({ mensagem: "A taxa deve ser um número entre 0 e 100" });
      }
    }

    const [resultado] = await pool.query(
      "UPDATE configuracoes SET valor = ? WHERE chave = ?",
      [String(valor), chave]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Configuração não encontrada" });
    }

    res.json({ mensagem: "Configuração atualizada com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: "Erro ao atualizar configuração" });
  }
});

module.exports = router;
