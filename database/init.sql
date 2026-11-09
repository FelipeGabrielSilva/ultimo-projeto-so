-- =====================================================
-- Mini Gestão - Script de Inicialização do Banco de Dados
-- =====================================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    document VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões (utilizada pelo express-session com connect-pg-simple)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR(255) NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);

-- =====================================================
-- Carga Inicial de Dados (Seed)
-- =====================================================

-- Usuário Administrador (senha: admin123)
-- Usuário Operador padrão (senha: admin123)
INSERT INTO users (name, email, password, role, is_active)
VALUES 
    ('Administrador', 'admin@minigestao.local', '$2a$10$2hMXbmxg90BSiQY/pf/VM.66zgbzSWUb3Ac4..dWVbldrIATO8JOO', 'admin', true),
    ('Operador Padrão', 'operador@minigestao.local', '$2a$10$2hMXbmxg90BSiQY/pf/VM.66zgbzSWUb3Ac4..dWVbldrIATO8JOO', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- Clientes Iniciais
INSERT INTO clients (name, email, phone, document, status)
VALUES
    ('Tech Solutions Ltda', 'contato@techsolutions.com.br', '(11) 98765-4321', '12.345.678/0001-90', 'active'),
    ('Comércio Silva & Santos', 'financeiro@silvasantos.com.br', '(18) 3322-1100', '98.765.432/0001-10', 'active'),
    ('Studio Design Criativo', 'contato@studiodesign.com', '(11) 97123-4567', '345.678.901-22', 'inactive')
ON CONFLICT DO NOTHING;

-- Tarefas Iniciais
INSERT INTO tasks (client_id, user_id, title, description, status, due_date)
VALUES
    (1, 1, 'Implantar certificado SSL no domínio', 'Configurar certificado Let''s Encrypt e redirecionamento HTTPS no servidor Nginx.', 'completed', CURRENT_DATE - INTERVAL '2 days'),
    (1, 2, 'Reunião de alinhamento do projeto', 'Apresentar escopo da nova versão do sistema e cronograma de entrega das fases.', 'in_progress', CURRENT_DATE + INTERVAL '1 day'),
    (2, 1, 'Elaborar proposta de manutenção', 'Revisar valores de suporte mensal e enviar proposta comercial atualizada.', 'pending', CURRENT_DATE + INTERVAL '3 days'),
    (2, 2, 'Atualização de dados cadastrais', 'Verificar endereço atualizado e nova inscrição estadual do cliente.', 'pending', CURRENT_DATE + INTERVAL '5 days'),
    (3, 1, 'Auditoria de segurança', 'Análise de conformidade e integridade dos backups do banco de dados.', 'cancelled', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

