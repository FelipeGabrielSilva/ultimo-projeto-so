const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { pool } = require('./config/database');
const { requireAuth, requireAdmin, redirectIfAuthenticated } = require('./middleware/authMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Configurar trust proxy para ambiente com proxy reverso (Coolify / Traefik / Nginx)
app.set('trust proxy', 1);

// Cabeçalhos de segurança HTTP com Helmet configurado para suportar CDN do Bootstrap
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

// Logging de requisições HTTP
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Interpretação de requisições com corpo JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (CSS, JS, Assets)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de Sessão no PostgreSQL via connect-pg-simple
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: false, // Gerenciada pelo init.sql
    }),
    secret: process.env.SESSION_SECRET || 'chave_padrao_super_secreta_mini_gestao_2026',
    resave: false,
    saveUninitialized: false,
    name: 'mini_gestao_sid',
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: Number(process.env.SESSION_MAX_AGE) || 86400000, // 24 horas padrão
    },
  })
);

// ==========================================
// Rotas de Páginas HTML (Views)
// ==========================================
const viewsPath = path.join(__dirname, 'views');

// Rota raiz: redireciona para o painel se autenticado, ou para o login
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

// Tela de Login
app.get('/login', redirectIfAuthenticated, (req, res) => {
  res.sendFile(path.join(viewsPath, 'login.html'));
});

// Tela do Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(viewsPath, 'dashboard.html'));
});

// Tela de Clientes
app.get('/clients', requireAuth, (req, res) => {
  res.sendFile(path.join(viewsPath, 'clients.html'));
});

// Tela de Tarefas
app.get('/tasks', requireAuth, (req, res) => {
  res.sendFile(path.join(viewsPath, 'tasks.html'));
});

// Tela de Usuários (restrita a Administradores)
app.get('/users', requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(viewsPath, 'users.html'));
});

// ==========================================
// Rotas da API REST
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);

// Endpoint de verificação de integridade (Healthcheck para Docker / Coolify)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// Tratamento de rotas inexistentes (404) e erros globais
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

