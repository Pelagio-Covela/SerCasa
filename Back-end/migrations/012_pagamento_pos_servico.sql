-- Suporte a: (1) email do cliente para envio da fatura + link de pagamento
-- após o check-out, (2) duração estimada definida pelo profissional (não
-- mais pelo cliente no agendamento) usada para calcular a disponibilidade.
USE servcasa;

ALTER TABLE agendamentos
  ADD COLUMN email_cliente VARCHAR(150) NULL,
  ADD COLUMN duracao_estimada_minutos INT NULL,
  ADD COLUMN token_pagamento VARCHAR(64) NULL UNIQUE,
  ADD COLUMN metodo_pagamento VARCHAR(30) NULL,
  ADD COLUMN detalhes_pagamento TEXT NULL,
  ADD COLUMN pagamento_submetido_em TIMESTAMP NULL;
