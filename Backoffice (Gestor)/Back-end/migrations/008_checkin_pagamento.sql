-- Suporte ao app mobile do profissional: check-in/check-out com localização,
-- duração real trabalhada, e o cálculo de pagamento (valor total, parte do
-- profissional, taxa da aplicação).
USE servcasa;

ALTER TABLE agendamentos
  ADD COLUMN checkin_hora TIMESTAMP NULL,
  ADD COLUMN checkin_lat DECIMAL(10, 8) NULL,
  ADD COLUMN checkin_lng DECIMAL(11, 8) NULL,
  ADD COLUMN checkout_hora TIMESTAMP NULL,
  ADD COLUMN checkout_lat DECIMAL(10, 8) NULL,
  ADD COLUMN checkout_lng DECIMAL(11, 8) NULL,
  ADD COLUMN duracao_minutos INT NULL,
  ADD COLUMN valor_total DECIMAL(10, 2) NULL,
  ADD COLUMN valor_profissional DECIMAL(10, 2) NULL,
  ADD COLUMN taxa_app DECIMAL(10, 2) NULL,
  ADD COLUMN status_pagamento VARCHAR(20) NOT NULL DEFAULT 'pendente';
