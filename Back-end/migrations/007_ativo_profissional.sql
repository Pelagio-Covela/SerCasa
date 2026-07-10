-- O estado ativo/inativo do profissional passa a ficar na própria tabela
-- profissionais, em vez de depender só de existir uma conta em "usuarios"
-- ligada a ele. Isso corrige o botão de ativar/desativar não funcionar
-- para profissionais que não têm login (ex: cadastrados direto por SQL).
USE servcasa;

ALTER TABLE profissionais
  ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Sincroniza com o estado que já existia via usuarios, para quem já tinha conta
UPDATE profissionais p
JOIN usuarios u ON u.id = p.usuario_id
SET p.ativo = u.ativo;
