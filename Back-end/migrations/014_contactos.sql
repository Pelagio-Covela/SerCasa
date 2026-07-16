-- A tabela "contactos" nunca tinha sido criada — o formulário de contacto do
-- site estava a tentar gravar numa tabela inexistente e falhava sempre.
USE servcasa;

CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefone VARCHAR(30) NULL,
  assunto VARCHAR(100) NULL,
  mensagem TEXT NOT NULL,
  email_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
