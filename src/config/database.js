const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app_user:senha_segura_123@localhost:5432/mini_gestao',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente de banco de dados:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
