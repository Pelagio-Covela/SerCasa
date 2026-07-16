-- Adiciona mais categorias de serviço, sem apagar nada que já exista.
-- Seguro rodar mesmo que você já tenha dados reais cadastrados.
USE servcasa;

INSERT INTO categorias (id, nome, icone, descricao, cor) VALUES
('domestica', 'Empregada Doméstica', 'home', 'Limpeza e organização da casa', 'bg-blue-500'),
('encanador', 'Encanador', 'droplet', 'Reparos e instalações hidráulicas', 'bg-cyan-500'),
('cozinheiro', 'Cozinheiro', 'chef-hat', 'Preparação de refeições', 'bg-orange-500'),
('jardineiro', 'Jardineiro', 'leaf', 'Cuidados com jardim e plantas', 'bg-green-500'),
('eletricista', 'Eletricista', 'zap', 'Manutenção elétrica', 'bg-yellow-500'),
('pintor', 'Pintor', 'paint-bucket', 'Pintura residencial e comercial', 'bg-pink-500'),
('pedreiro', 'Pedreiro', 'hammer', 'Construção e reparos de alvenaria', 'bg-stone-500'),
('marceneiro', 'Marceneiro', 'ruler', 'Móveis e trabalhos em madeira', 'bg-amber-700'),
('ar_condicionado', 'Técnico de Ar Condicionado', 'wind', 'Instalação e manutenção de AC', 'bg-sky-500'),
('seguranca', 'Segurança', 'shield', 'Vigilância residencial e patrimonial', 'bg-slate-600'),
('motorista', 'Motorista', 'car', 'Transporte particular e serviços', 'bg-indigo-500'),
('ama', 'Ama / Babysitter', 'baby', 'Cuidados com crianças', 'bg-rose-400'),
('passadeira', 'Passadeira', 'shirt', 'Lavagem e passagem de roupa', 'bg-teal-500')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  icone = VALUES(icone),
  descricao = VALUES(descricao),
  cor = VALUES(cor);
