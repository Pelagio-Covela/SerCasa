const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    mensagem: "API da ServCasa a funcionar",
    estado: "ok",
  });
});

module.exports = router;