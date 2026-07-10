-- Migração: autenticação, papéis e geolocalização
-- Rodar diretamente no MySQL (workbench, cli, ou tabela por tabela)

-- 1. Tabela de usuários (login do gerente e do trabalhador)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('gerente', 'trabalhador') NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ligar profissionais a um usuário de login + guardar posição atual
ALTER TABLE profissionais
  ADD COLUMN usuario_id INT NULL AFTER id,
  ADD COLUMN latitude DECIMAL(10, 8) NULL,
  ADD COLUMN longitude DECIMAL(11, 8) NULL,
  ADD COLUMN localizacao_atualizada_em TIMESTAMP NULL,
  ADD CONSTRAINT fk_profissional_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL;

-- 3. Guardar a localização da casa do cliente em cada agendamento
--    (nome_cliente e telefone já são usados na rota mas não existiam na tabela)
ALTER TABLE agendamentos
  ADD COLUMN nome_cliente VARCHAR(100) NULL AFTER profissional_id,
  ADD COLUMN telefone VARCHAR(20) NULL AFTER nome_cliente,
  ADD COLUMN latitude DECIMAL(10, 8) NULL,
  ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- 4. Atualizar o status para cobrir o fluxo completo do trabalhador
--    (pendente -> aceite -> a_caminho -> em_execucao -> concluido / cancelado)
ALTER TABLE agendamentos
  MODIFY COLUMN status VARCHAR(20) DEFAULT 'pendente';

-- 5. Categoria do serviço pedido (pode ser escolhida antes de atribuir um profissional)
--    e motivo de cancelamento, usados pelo backoffice do gerente
ALTER TABLE agendamentos
  ADD COLUMN categoria_id VARCHAR(50) NULL,
  ADD COLUMN motivo_cancelamento TEXT NULL,
  ADD CONSTRAINT fk_agendamento_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE SET NULL;

-- 6. Telefone de contacto do profissional (usado no cadastro do backoffice)
ALTER TABLE profissionais
  ADD COLUMN telefone VARCHAR(20) NULL;

