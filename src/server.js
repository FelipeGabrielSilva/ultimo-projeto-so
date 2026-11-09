require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3333;

/**
 * Tenta conectar ao banco de dados com repetições automáticas (essencial para ambientes em nuvem / Coolify)
 */
async function connectWithRetry() {
  const maxRetries = 15;
  const retryInterval = 2000;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      const res = await pool.query('SELECT NOW() AS current_time');
      console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso:', res.rows[0].current_time);
      return;
    } catch (err) {
      console.log(`⏳ Aguardando banco de dados ficar pronto (${i}/${maxRetries})... (${err.message})`);
      if (i === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
}

/**
 * Garante que as tabelas e dados iniciais existam caso o script do Docker não tenha executado
 */
async function ensureDatabaseSchema() {
  try {
    const check = await pool.query(`
      SELECT to_regclass('public.users') AS table_exists;
    `);

    if (!check.rows[0] || !check.rows[0].table_exists) {
      console.log('📋 Inicializando tabelas do banco de dados a partir de database/init.sql...');
      const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Tabelas e dados iniciais criados com sucesso!');
      } else {
        console.warn('⚠️ Arquivo database/init.sql não encontrado para auto-migração.');
      }
    }
  } catch (err) {
    console.warn('⚠️ Aviso ao verificar schema do banco de dados:', err.message);
  }
}

async function startServer() {
  try {
    // 1. Conexão resiliente com repetições
    await connectWithRetry();

    // 2. Garantir schema do banco
    await ensureDatabaseSchema();

    // 3. Inicializar servidor Express
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor Mini Gestão em execução na porta ${PORT}`);
      console.log(`🌐 Acesse: http://localhost:${PORT}`);
      console.log(`⚙️  Modo: ${process.env.NODE_ENV || 'development'}`);
    });

    // Tratamento de encerramento gracioso (Graceful Shutdown)
    const shutdown = async (signal) => {
      console.log(`\n🛑 Sinal ${signal} recebido. Encerrando servidor graciosamente...`);
      server.close(async () => {
        console.log('🔌 Servidor HTTP encerrado.');
        try {
          await pool.end();
          console.log('📦 Pool de conexões do PostgreSQL finalizado.');
        } catch (err) {
          console.error('Erro ao finalizar pool:', err);
        }
        process.exit(0);
      });

      // Timeout forçado caso demore mais de 10 segundos
      setTimeout(() => {
        console.error('⚠️ Encerramento forçado por timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco de dados:', err.message);
    console.error('Verifique se as variáveis de ambiente e o PostgreSQL estão ativos.');
    process.exit(1);
  }
}

startServer();
