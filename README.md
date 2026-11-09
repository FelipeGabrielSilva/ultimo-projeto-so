# Mini Gestão — Sistema Web de Gerenciamento

**Versão:** 1.0  
**Tipo:** Aplicação Web Full Stack  
**Deploy:** Docker + Coolify  
**Stack:** Node.js, Express, PostgreSQL, Bootstrap 5, JavaScript puro

---

## 1. Visão Geral

O **Mini Gestão** é um sistema web intuitivo e completo para administração de clientes e controle de tarefas operacionais. Desenvolvido com foco em simplicidade arquitetural, segurança, manutenibilidade e facilidade de publicação em servidores através de containers Docker e orquestração pelo Coolify.

### Principais Recursos
- **Autenticação Segura:** Login/Logout com proteção contra ataques de força bruta (rate limiting), senhas protegidas com bcrypt e sessões salvas no PostgreSQL (`connect-pg-simple`).
- **Controle de Acesso por Perfil:** Administradores possuem controle total (incluindo gestão de usuários); Operadores gerenciam clientes e tarefas.
- **Gestão de Clientes:** Cadastro, edição, listagem com pesquisa em tempo real (nome, CPF/CNPJ, e-mail) e filtros por situação.
- **Segurança de Integridade Relacional:** Bloqueio inteligente de exclusão de clientes com tarefas pendentes ou vinculadas.
- **Gestão de Tarefas:** Criação, edição, prazos, atribuição de usuários responsáveis e múltiplos status (*Pendente*, *Em Andamento*, *Concluída*, *Cancelada*).
- **Filtros Avançados:** Filtragem de tarefas por cliente, responsável, situação e intervalos de datas.
- **Painel de Indicadores (Dashboard):** Contadores rápidos em tempo real, lista de últimas tarefas e alertas com contagem regressiva para tarefas próximas do vencimento ou atrasadas.
- **Pronto para Produção:** Dockerfile leve em Alpine Linux, Docker Compose com healthcheck e volumes persistentes, e compatibilidade nativa com Coolify.

---

## 2. Tecnologias Utilizadas

| Camada | Tecnologia | Descrição |
|---|---|---|
| **Frontend** | HTML5 + JavaScript Puro | Interface sem a sobrecarga de frameworks pesados |
| **Estilização** | Bootstrap 5 + Bootstrap Icons | Componentes responsivos, modais, alertas e badges modernos |
| **Backend** | Node.js (LTS) + Express | API REST ágil e entrega dos arquivos estáticos |
| **Banco de Dados** | PostgreSQL 16 | Banco relacional robusto com integridade referencial |
| **Sessões** | Express-Session + Connect-PG-Simple | Sessões autenticadas salvas na tabela `sessions` do PostgreSQL |
| **Criptografia** | bcryptjs | Hashing de senhas com salt rounds |
| **Segurança** | Helmet + Express-Rate-Limit | Cabeçalhos de segurança HTTP e mitigação de ataques de força bruta |
| **Containerização** | Docker & Docker Compose | Ambientes isolados para a aplicação e para o banco de dados |
| **Deploy** | Coolify | Publicação simplificada com proxy reverso e SSL automático |

---

## 3. Estrutura de Diretórios

```text
ultimo-projeto-so/
│
├── src/
│   ├── config/
│   │   └── database.js         # Conexão e pool com PostgreSQL
│   ├── controllers/
│   │   ├── authController.js   # Login, logout e status do usuário logado
│   │   ├── userController.js   # CRUD e permissões de usuários (Admin)
│   │   ├── clientController.js # CRUD e regras de integridade de clientes
│   │   └── taskController.js   # CRUD, filtros e métricas do dashboard
│   ├── middleware/
│   │   ├── authMiddleware.js   # Verificação de autenticação e papéis
│   │   └── errorMiddleware.js  # Tratamento centralizado de erros e 404
│   ├── routes/
│   │   ├── authRoutes.js       # Rotas de /api/auth
│   │   ├── userRoutes.js       # Rotas de /api/users
│   │   ├── clientRoutes.js     # Rotas de /api/clients
│   │   └── taskRoutes.js       # Rotas de /api/tasks
│   ├── services/
│   │   └── authService.js      # Hashing de senhas e validação de credenciais
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css       # Estilos da sidebar, tabelas e temas
│   │   └── js/
│   │       ├── auth.js         # Sessão, logout, notificações toast e layout
│   │       ├── dashboard.js    # Consumo da API de métricas e prazos
│   │       ├── clients.js      # Operações assíncronas de clientes e modais
│   │       ├── tasks.js        # Operações de tarefas, filtros e selects
│   │       └── users.js        # Gestão de usuários e permissões
│   ├── views/
│   │   ├── 404.html            # Página de erro amigável
│   │   ├── login.html          # Tela de entrada
│   │   ├── dashboard.html      # Painel de controle e estatísticas
│   │   ├── clients.html        # Tela de clientes
│   │   ├── tasks.html          # Tela de tarefas
│   │   └── users.html          # Tela de usuários (Admin)
│   ├── app.js                  # Configuração do Express, sessões e middlewares
│   └── server.js               # Inicialização com teste de banco e graceful shutdown
│
├── database/
│   └── init.sql                # Criação das tabelas, índices e dados iniciais (Seed)
├── .env.example                # Exemplo das variáveis de ambiente
├── .gitignore                  # Arquivos ignorados pelo Git
├── Dockerfile                  # Imagem otimizada Node.js Alpine
├── docker-compose.yml          # Definição dos containers app e database
├── package.json                # Dependências e scripts do Node.js
└── README.md                   # Documentação completa
```

---

## 4. Como Executar com Docker Compose (Recomendado)

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.

### 1. Iniciar os containers
Na raiz do projeto, execute:

```bash
docker compose up -d --build
```

O Docker Compose irá:
1. Subir o container PostgreSQL (`mini_gestao_db`).
2. Executar o script `database/init.sql` automaticamente, criando as tabelas e inserindo os dados iniciais.
3. Aguardar o banco ficar saudável (`healthy`).
4. Construir e inicializar o container da aplicação (`mini_gestao_app`).

### 2. Acessar o sistema
Abra no navegador:
👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Credenciais de Acesso Padrão

| Perfil | E-mail | Senha |
|---|---|---|
| **Administrador** | `admin@minigestao.local` | `admin123` |
| **Operador Padrão** | `operador@minigestao.local` | `admin123` |

### 4. Parar a aplicação
```bash
docker compose down
```
*(Os dados permanecem seguros no volume Docker `pgdata`).*

---

## 5. Como Executar Localmente sem Docker (Opcional)

1. Tenha o **Node.js (>= 20)** e o **PostgreSQL (>= 15)** instalados localmente.
2. Crie a base de dados no seu PostgreSQL:
   ```sql
   CREATE DATABASE mini_gestao;
   ```
3. Execute o script `database/init.sql` no banco criado.
4. Crie o arquivo `.env` a partir do modelo:
   ```bash
   cp .env.example .env
   ```
   Ajuste a variável `DATABASE_URL` para o endereço do seu PostgreSQL local, por exemplo:
   ```env
   DATABASE_URL=postgresql://postgres:suasenha@localhost:5432/mini_gestao
   ```
5. Instale as dependências e inicialize o servidor:
   ```bash
   npm install
   npm start
   ```

---

## 6. Endpoints da API REST

### Autenticação (`/api/auth`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Autentica e inicia sessão no PostgreSQL |
| `POST` | `/api/auth/logout` | Autenticado | Encerra sessão e remove cookie |
| `GET` | `/api/auth/me` | Autenticado | Retorna dados do usuário conectado |

### Clientes (`/api/clients`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/clients` | Autenticado | Lista clientes (filtros: `search`, `status`) |
| `POST` | `/api/clients` | Autenticado | Cria novo cliente |
| `GET` | `/api/clients/:id` | Autenticado | Detalhes do cliente e suas tarefas vinculadas |
| `PUT` | `/api/clients/:id` | Autenticado | Atualiza dados do cliente |
| `DELETE` | `/api/clients/:id` | Autenticado | Exclui cliente (bloqueia se houver tarefas) |

### Tarefas (`/api/tasks`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/tasks/dashboard-stats` | Autenticado | Totais, últimas tarefas e próximas do vencimento |
| `GET` | `/api/tasks` | Autenticado | Lista tarefas com múltiplos filtros |
| `POST` | `/api/tasks` | Autenticado | Cria nova tarefa |
| `GET` | `/api/tasks/:id` | Autenticado | Detalhes da tarefa |
| `PUT` | `/api/tasks/:id` | Autenticado | Atualiza tarefa |
| `DELETE` | `/api/tasks/:id` | Autenticado | Exclui tarefa |

### Usuários (`/api/users`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/users` | Admin | Lista todos os usuários cadastrados |
| `POST` | `/api/users` | Admin | Cadastra novo usuário com senha criptografada |
| `GET` | `/api/users/:id` | Admin | Detalhes do usuário |
| `PUT` | `/api/users/:id` | Admin | Altera nome, e-mail, perfil, status ou senha |
| `DELETE` | `/api/users/:id` | Admin | Exclui usuário (impede auto-exclusão) |

---

## 7. Guia de Deploy com Coolify

O **Coolify** é um painel de gerenciamento de infraestrutura auto-hospedado que gerencia containers, proxies reversos (Traefik) e certificados SSL automáticos via Let's Encrypt.

### Passo 1: Enviar o código para o Git
Suba este repositório para o GitHub, GitLab ou repositório Git de sua preferência:
```bash
git init
git add .
git commit -m "feat: versão 1.0 Mini Gestao"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mini-gestao.git
git push -u origin main
```

### Passo 2: Criar Projeto no Coolify
1. Acesse o painel do seu Coolify.
2. Vá em **Projects** &rarr; selecione seu ambiente (ex: **Production**).
3. Clique em **+ New Resource** e selecione **Docker Compose**.
4. Conecte sua conta do GitHub/GitLab ou insira a URL do repositório público/privado.
5. Selecione a branch `main`.

### Passo 3: Configurar Variáveis de Ambiente no Coolify
No menu **Environment Variables** do Coolify, adicione:

```env
NODE_ENV=production
PORT=3000
POSTGRES_USER=app_user
POSTGRES_PASSWORD=gere_uma_senha_muito_segura_aqui
POSTGRES_DB=mini_gestao
SESSION_SECRET=gere_uma_chave_aleatoria_longa_com_64_caracteres
SESSION_MAX_AGE=86400000
COOKIE_SECURE=true
```

*(O Coolify substituirá automaticamente essas variáveis no arquivo `docker-compose.yml` durante o build).*

### Passo 4: Configurar Domínio e HTTPS
1. No campo **Domains** do serviço `app`, informe seu domínio completo (ex: `https://gestao.seudominio.com.br`).
2. Defina a porta de destino como `3000`.
3. O Coolify configura automaticamente o certificado HTTPS gratuito com Let's Encrypt através do Traefik.

### Passo 5: Executar o Deploy
1. Clique no botão **Deploy**.
2. Acompanhe os logs da compilação e inicialização.
3. Acesse seu domínio configurado e realize o primeiro login com o usuário administrador padrão.
4. **Recomendação de segurança imediata:** Acesse a tela de **Usuários** e altere a senha do usuário `admin@minigestao.local`.

---

## 8. Estratégia de Backup e Restauração

O PostgreSQL armazena todos os registros no volume Docker `pgdata`. Para realizar backups seguros:

### Realizar Backup (Dump)
Execute no terminal do servidor onde o container está rodando:
```bash
docker exec -t mini_gestao_db pg_dump -U app_user mini_gestao > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup
Para restaurar uma base a partir de um arquivo `.sql`:
```bash
cat backup_arquivo.sql | docker exec -i mini_gestao_db psql -U app_user -d mini_gestao
```

---

## 9. Práticas de Segurança Aplicadas

- **Proteção contra SQL Injection:** 100% das consultas utilizam parâmetros nomeados (`$1, $2, ...`) do driver oficial `pg`.
- **Criptografia Forte:** Senhas nunca são gravadas em texto puro, utilizando o algoritmo `bcrypt` com salt rounds.
- **Sessões no Servidor:** Cookies contêm apenas o identificador da sessão (`sid`), protegidos por `HttpOnly` e política `SameSite=Lax`.
- **Mitigação de Brute-Force:** Limite configurado de até 15 tentativas a cada 15 minutos na rota de login.
- **Proteção de Cabeçalhos:** Middleware `helmet` ativo aplicando diretivas de segurança contra clickjacking, MIME sniffing e XSS.
- **Integridade de Dados:** Validações de integridade no backend que impedem exclusão de registros com dependências ativas.
