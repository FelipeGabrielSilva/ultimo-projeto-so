require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Testa a conexão com o banco de dados antes de iniciar o servidor
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso:', res.rows[0].current_time);

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
