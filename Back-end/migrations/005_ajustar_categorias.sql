-- Ajusta as categorias para exatamente as 5 pedidas, com os nomes certos.
-- Os "id" internos (domestica, encanador...) não mudam — só o texto
-- exibido — para não quebrar profissionais/agendamentos já ligados a eles.
USE servcasa;

UPDATE categorias SET nome = 'Profissional Doméstico' WHERE id = 'domestica';
UPDATE categorias SET nome = 'Canalisador'            WHERE id = 'encanador';
UPDATE categorias SET nome = 'Cozinheiro'              WHERE id = 'cozinheiro';
UPDATE categorias SET nome = 'Jardineiro'              WHERE id = 'jardineiro';
UPDATE categorias SET nome = 'Eletricista'             WHERE id = 'eletricista';

-- Remove as categorias extra adicionadas antes — só apaga se não houver
-- nenhum profissional ou agendamento já ligado a elas (seguro rodar).
DELETE c FROM categorias c
WHERE c.id IN ('pintor', 'pedreiro', 'marceneiro', 'ar_condicionado', 'seguranca', 'motorista', 'ama', 'passadeira')
  AND NOT EXISTS (SELECT 1 FROM profissionais p WHERE p.categoria_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM agendamentos a WHERE a.categoria_id = c.id);
