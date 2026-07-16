-- Corrige erro ortográfico: "Canalisador" (com S) não existe em português;
-- o certo é "Canalizador" (com Z).
USE servcasa;

UPDATE categorias SET nome = 'Canalizador' WHERE id = 'encanador' AND nome = 'Canalisador';
