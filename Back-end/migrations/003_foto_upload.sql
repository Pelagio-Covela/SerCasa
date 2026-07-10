-- Aumenta a coluna "foto" de profissionais para caber a imagem em si
-- (base64), não apenas uma URL curta. TEXT tem limite de ~65KB, o que é
-- pouco para uma foto; MEDIUMTEXT suporta até 16MB.
USE servcasa;

ALTER TABLE profissionais
  MODIFY COLUMN foto MEDIUMTEXT NULL;
