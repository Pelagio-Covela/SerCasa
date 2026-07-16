-- Adiciona o papel "admin" (sysadmin) acima do gerente.
USE servcasa;

-- Amplia o ENUM de papéis para incluir "admin"
ALTER TABLE usuarios
  MODIFY COLUMN papel ENUM('admin', 'gerente', 'trabalhador') NOT NULL;

-- Guarda quem criou cada conta (auditoria) — NULL para contas já existentes
ALTER TABLE usuarios
  ADD COLUMN criado_por INT NULL,
  ADD CONSTRAINT fk_usuario_criado_por
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL;

-- Primeira conta de administrador (troque a senha depois do primeiro login)
-- email: admin@servcasa.co.mz | senha: admin123
INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES
('Administrador ServCasa', 'admin@servcasa.co.mz', '$2b$10$QZTQPalI0ApKOSf1MhohLOS8htPR1g4Yy/yi2schuOXkByIA9Cyim', 'admin')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
