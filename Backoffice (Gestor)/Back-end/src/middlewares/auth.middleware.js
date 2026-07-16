const jwt = require("jsonwebtoken");

// VERIFICAR SE O TOKEN É VÁLIDO
function verificarToken(req, res, next) {
  const cabecalho = req.headers["authorization"];

  if (!cabecalho) {
    return res.status(401).json({
      mensagem: "Token não fornecido",
    });
  }

  const token = cabecalho.split(" ")[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      mensagem: "Token inválido",
    });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = dados; // { id, papel }
    next();
  } catch (erro) {
    return res.status(401).json({
      mensagem: "Token expirado ou inválido",
    });
  }
}

// VERIFICAR SE O USUÁRIO TEM O PAPEL NECESSÁRIO (gerente / trabalhador)
function verificarPapel(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        mensagem: "Acesso não autorizado para este perfil",
      });
    }
    next();
  };
}

module.exports = { verificarToken, verificarPapel };
