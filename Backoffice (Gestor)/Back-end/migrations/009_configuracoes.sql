-- Tabela de configurações do sistema, editáveis pelo admin sem mexer no código.
-- Primeira configuração: a percentagem da taxa que a plataforma retém.
USE servcasa;

CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(50) PRIMARY KEY,
  valor VARCHAR(255) NOT NULL,
  descricao VARCHAR(255) NULL,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracoes (chave, valor, descricao) VALUES
('taxa_app_percentual', '20', 'Percentagem retida pela plataforma sobre o valor de cada serviço (o resto vai ao profissional)')
ON DUPLICATE KEY UPDATE chave = chave;
