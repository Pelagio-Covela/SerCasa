-- Corrige um problema de codificação (encoding): ao importar os SQLs pelo
-- phpMyAdmin, os dias com acento ("Terça", "Sábado") podem ficar gravados
-- com bytes corrompidos, e aí a comparação com o que o servidor envia nunca
-- bate — resultado: "nenhum profissional disponível" às terças e sábados.
--
-- Solução definitiva: guardar os dias SEM acento ("Terca", "Sabado").
-- Os padrões LIKE abaixo apanham qualquer variante (com acento, corrompida
-- ou já sem acento), por isso é seguro executar mais de uma vez.
USE servcasa;

UPDATE disponibilidade SET dia_semana = 'Terca'  WHERE dia_semana LIKE 'Ter%a';
UPDATE disponibilidade SET dia_semana = 'Sabado' WHERE dia_semana LIKE 'S%bado';
