-- Avaliações de satisfação: o cliente avalia depois de pagar o serviço, mas
-- o comentário e as estrelas só ficam visíveis no site depois de um gestor
-- ou admin aprovar no backoffice (evita spam/ofensas publicadas direto).
USE servcasa;

CREATE TABLE IF NOT EXISTS avaliacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agendamento_id INT NOT NULL,
  profissional_id INT NOT NULL,
  nome_cliente VARCHAR(150) NULL,
  nota TINYINT NOT NULL,
  comentario TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente | aprovado | rejeitado
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moderado_em TIMESTAMP NULL,
  UNIQUE KEY unico_por_agendamento (agendamento_id),
  CONSTRAINT fk_avaliacao_agendamento FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id),
  CONSTRAINT fk_avaliacao_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
  CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5)
);
