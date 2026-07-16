-- Até agora só rastreávamos se o CLIENTE pagou a ServCasa (status_pagamento).
-- Faltava rastrear separadamente se a ServCasa já repassou a parte do
-- PROFISSIONAL — são dois pagamentos distintos e podem acontecer em
-- momentos diferentes.
USE servcasa;

ALTER TABLE agendamentos
  ADD COLUMN pago_ao_profissional BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN pago_ao_profissional_em TIMESTAMP NULL;
