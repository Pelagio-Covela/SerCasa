const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const testeRotas = require("./routes/teste.routes");
const categoriasRotas = require("./routes/categorias.routes");
const profissionaisRotas = require("./routes/profissionais.routes");
const agendamentosRotas = require("./routes/agendamentos.routes");
const contactoRotas = require("./routes/contacto.routes");
const authRotas = require("./routes/auth.routes");
const gerenteRotas = require("./routes/gerente.routes");
const trabalhadorRotas = require("./routes/trabalhador.routes");
const adminRotas = require("./routes/admin.routes");

const app = express();

app.use(
  cors({
    // aceita várias origens: o site do cliente e o backoffice do gestor
    // no .env: FRONTEND_URL=http://localhost:5173,http://localhost:5174
    origin: (process.env.FRONTEND_URL || "").split(",").map((s) => s.trim()),
  })
);

// limite maior que o padrão (100kb) porque as fotos de perfil chegam
// como texto base64 dentro do JSON
app.use(express.json({ limit: "5mb" }));

// Rotas da API
app.use("/api/teste", testeRotas);
app.use("/api/categorias", categoriasRotas);
app.use("/api/profissionais", profissionaisRotas);
app.use("/api/agendamentos", agendamentosRotas);
app.use("/api/contacto", contactoRotas);
app.use("/api/auth", authRotas);
app.use("/api/gerente", gerenteRotas);
app.use("/api/trabalhador", trabalhadorRotas);
app.use("/api/admin", adminRotas);

module.exports = app;