-- Permite ao profissional marcar-se manualmente como disponível/indisponível
-- a qualquer momento (independente da agenda), tipo "ficar online/offline".
USE servcasa;

ALTER TABLE profissionais
  ADD COLUMN disponivel_agora BOOLEAN NOT NULL DEFAULT TRUE;
