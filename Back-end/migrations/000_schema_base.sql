CREATE DATABASE IF NOT EXISTS servcasa CHARACTER SET utf8mb4;
USE servcasa;

CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(50),
  descricao TEXT,
  cor VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS profissionais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100),
  categoria_id VARCHAR(50),
  avaliacao DECIMAL(2,1),
  total_avaliacoes INT,
  preco_por_hora DECIMAL(10,2),
  foto TEXT,
  experiencia VARCHAR(100),
  descricao TEXT,
  INDEX (categoria_id)
);

CREATE TABLE IF NOT EXISTS competencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profissional_id INT,
  nome VARCHAR(100),
  INDEX (profissional_id)
);

CREATE TABLE IF NOT EXISTS disponibilidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profissional_id INT,
  dia_semana VARCHAR(20),
  INDEX (profissional_id)
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profissional_id INT,
  data DATE,
  hora TIME,
  duracao INT,
  endereco TEXT,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (profissional_id)
);
