-- Dados de teste completos: 5 categorias, 3 profissionais em cada.
-- Rode isto DEPOIS de 000_schema_base.sql e 001_auth_geolocalizacao.sql
USE servcasa;

-- Limpa dados de teste anteriores (mantém a estrutura das tabelas)
DELETE FROM competencias;
DELETE FROM disponibilidade;
DELETE FROM agendamentos;
DELETE FROM profissionais;
DELETE FROM usuarios WHERE email = 'gerente@servcasa.co.mz';
ALTER TABLE profissionais AUTO_INCREMENT = 1;
ALTER TABLE competencias AUTO_INCREMENT = 1;
ALTER TABLE disponibilidade AUTO_INCREMENT = 1;
ALTER TABLE agendamentos AUTO_INCREMENT = 1;

-- Categorias (as 5 que o Front-end do cliente usa)
INSERT INTO categorias (id, nome, icone, descricao, cor) VALUES
('domestica', 'Profissional Doméstico', 'home', 'Limpeza e organização da casa', 'bg-blue-500'),
('encanador', 'Canalisador', 'droplet', 'Reparos e instalações hidráulicas', 'bg-cyan-500'),
('cozinheiro', 'Cozinheiro', 'chef-hat', 'Preparação de refeições', 'bg-orange-500'),
('jardineiro', 'Jardineiro', 'leaf', 'Cuidados com jardim e plantas', 'bg-green-500'),
('eletricista', 'Eletricista', 'zap', 'Manutenção elétrica', 'bg-yellow-500')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Empregadas Domésticas (1, 2, 3)
INSERT INTO profissionais (nome, categoria_id, avaliacao, total_avaliacoes, preco_por_hora, foto, experiencia, descricao, telefone) VALUES
('Maria Silva',   'domestica', 4.9, 127, 45, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', '8 anos de experiência',  'Profissional dedicada e experiente em limpeza residencial e organização.', '+258 84 111 1001'),
('Ana Costa',     'domestica', 4.8, 95,  40, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', '5 anos de experiência',  'Especializada em limpeza detalhada e organização de ambientes.',          '+258 82 111 1002'),
('Joana Santos',  'domestica', 5.0, 143, 50, 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb', '10 anos de experiência', 'Profissional qualificada, atenção aos detalhes e ótimas referências.',    '+258 86 111 1003');

-- Encanadores (4, 5, 6)
INSERT INTO profissionais (nome, categoria_id, avaliacao, total_avaliacoes, preco_por_hora, foto, experiencia, descricao, telefone) VALUES
('Carlos Oliveira', 'encanador', 4.7, 89,  80, 'https://images.unsplash.com/photo-1560250097-0b93528c311a', '12 anos de experiência', 'Especialista em instalações hidráulicas e manutenção preventiva.', '+258 84 222 2001'),
('Roberto Lima',     'encanador', 4.9, 156, 90, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', '15 anos de experiência', 'Encanador master, atende emergências 24h.',                        '+258 82 222 2002'),
('Ernesto Chuabo',   'encanador', 4.8, 90,  85, NULL,                                                            '12 anos de experiência', 'Especialista em canalização e desentupimento.',                    '+258 86 222 2003');

-- Cozinheiros (7, 8, 9)
INSERT INTO profissionais (nome, categoria_id, avaliacao, total_avaliacoes, preco_por_hora, foto, experiencia, descricao, telefone) VALUES
('Chef Paula Mendes', 'cozinheiro', 5.0, 78, 120, 'https://images.unsplash.com/photo-1595475884562-073c30d45670', '10 anos de experiência', 'Chef profissional em culinária moçambicana e internacional.', '+258 84 333 3001'),
('Fernando Alves',    'cozinheiro', 4.8, 92, 100, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', '8 anos de experiência',  'Cozinheiro experiente em refeições diárias e eventos.',        '+258 82 333 3002'),
('Isabel Machava',    'cozinheiro', 4.9, 64, 110, NULL,                                                            '6 anos de experiência',  'Especialista em dietas especiais e menus personalizados.',     '+258 86 333 3003');

-- Jardineiros (10, 11, 12)
INSERT INTO profissionais (nome, categoria_id, avaliacao, total_avaliacoes, preco_por_hora, foto, experiencia, descricao, telefone) VALUES
('Pedro Jardim',   'jardineiro', 4.9, 134, 60, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', '9 anos de experiência', 'Especialista em paisagismo, poda e manutenção de jardins.', '+258 84 444 4001'),
('Lucas Verde',    'jardineiro', 4.7, 87,  55, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', '6 anos de experiência', 'Conhecimento em plantas ornamentais e hortas.',             '+258 82 444 4002'),
('Sofia Nhampossa','jardineiro', 4.8, 51,  58, NULL,                                                              '4 anos de experiência', 'Irrigação, adubação e manutenção geral de jardins.',         '+258 86 444 4003');

-- Eletricistas (13, 14, 15)
INSERT INTO profissionais (nome, categoria_id, avaliacao, total_avaliacoes, preco_por_hora, foto, experiencia, descricao, telefone) VALUES
('Marcos Volt',     'eletricista', 4.9, 167, 85, 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5', '10 anos de experiência', 'Instalações residenciais e comerciais, quadros de força.', '+258 84 555 5001'),
('André Energia',   'eletricista', 4.6, 73,  75, 'https://images.unsplash.com/photo-1566492031773-4f4e44671857', '7 anos de experiência',  'Reparos, instalação de tomadas e chuveiros elétricos.',    '+258 82 555 5002'),
('Armindo Macuácua','eletricista', 4.8, 201, 95, NULL,                                                            '12 anos de experiência', 'Equipa certificada, automação e emergências.',             '+258 86 555 5003');

-- Competências por profissional (associadas pelo id gerado acima, na ordem de inserção)
INSERT INTO competencias (profissional_id, nome) VALUES
(1, 'Limpeza profunda'), (1, 'Organização'), (1, 'Cuidado com roupas'),
(2, 'Limpeza'), (2, 'Organização'), (2, 'Passar roupas'),
(3, 'Limpeza profunda'), (3, 'Cuidados especiais'), (3, 'Gestão doméstica'),
(4, 'Vazamentos'), (4, 'Instalação'), (4, 'Desentupimento'),
(5, 'Instalação completa'), (5, 'Reparos'), (5, 'Emergências 24h'),
(6, 'Vazamentos'), (6, 'Desentupimento'), (6, 'Manutenção'),
(7, 'Cozinha moçambicana'), (7, 'Cozinha internacional'), (7, 'Eventos'),
(8, 'Comida caseira'), (8, 'Eventos'), (8, 'Organização'),
(9, 'Dietas especiais'), (9, 'Menu personalizado'), (9, 'Eventos'),
(10, 'Paisagismo'), (10, 'Poda'), (10, 'Plantio'),
(11, 'Jardinagem'), (11, 'Hortas'), (11, 'Irrigação'),
(12, 'Irrigação'), (12, 'Adubação'), (12, 'Manutenção'),
(13, 'Instalação elétrica'), (13, 'Quadros de força'), (13, 'Iluminação'),
(14, 'Reparos'), (14, 'Instalação de tomadas'), (14, 'Chuveiros'),
(15, 'Automação'), (15, 'Emergências'), (15, 'Manutenção');

-- Disponibilidade por profissional
INSERT INTO disponibilidade (profissional_id, dia_semana) VALUES
(1, 'Segunda'), (1, 'Terça'), (1, 'Quarta'), (1, 'Quinta'), (1, 'Sexta'),
(2, 'Segunda'), (2, 'Quarta'), (2, 'Sexta'), (2, 'Sábado'),
(3, 'Segunda'), (3, 'Terça'), (3, 'Quinta'), (3, 'Sexta'),
(4, 'Segunda'), (4, 'Terça'), (4, 'Quarta'), (4, 'Quinta'), (4, 'Sexta'),
(5, 'Segunda'), (5, 'Terça'), (5, 'Quarta'), (5, 'Quinta'), (5, 'Sexta'), (5, 'Sábado'),
(6, 'Segunda'), (6, 'Quarta'), (6, 'Sexta'),
(7, 'Terça'), (7, 'Quarta'), (7, 'Quinta'), (7, 'Sexta'), (7, 'Sábado'),
(8, 'Segunda'), (8, 'Terça'), (8, 'Quarta'), (8, 'Quinta'), (8, 'Sexta'),
(9, 'Quinta'), (9, 'Sexta'), (9, 'Sábado'),
(10, 'Segunda'), (10, 'Terça'), (10, 'Quarta'), (10, 'Quinta'), (10, 'Sexta'),
(11, 'Quarta'), (11, 'Quinta'), (11, 'Sexta'), (11, 'Sábado'),
(12, 'Segunda'), (12, 'Terça'), (12, 'Sexta'),
(13, 'Segunda'), (13, 'Terça'), (13, 'Quarta'), (13, 'Quinta'), (13, 'Sexta'), (13, 'Sábado'),
(14, 'Segunda'), (14, 'Quarta'), (14, 'Quinta'), (14, 'Sexta'),
(15, 'Segunda'), (15, 'Terça'), (15, 'Quarta'), (15, 'Quinta'), (15, 'Sexta'), (15, 'Sábado');

-- Utilizador gerente para testar o login do backoffice
-- email: gerente@servcasa.co.mz | senha: admin123
INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES
('Gerente ServCasa', 'gerente@servcasa.co.mz', '$2b$10$.Emlgs3E1Qx/eYDXh93XpepahvvmNPo/x26SpAo1qOtIP.03FXog2', 'gerente');
