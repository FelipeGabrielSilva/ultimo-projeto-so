const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AuthService {
  /**
   * Criptografa uma senha em texto plano com salt
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara uma senha em texto plano com o hash criptografado
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Busca usuário por e-mail
   */
  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, name, email, password, role, is_active, created_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca usuário por ID (sem senha)
   */
  async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Valida credenciais e retorna os dados do usuário para a sessão
   */
  async validateCredentials(email, password) {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    if (!user.is_active) {
      throw new Error('Este usuário está desativado. Contate o administrador.');
    }

    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciais inválidas.');
    }

    // Retorna dados seguros para guardar na sessão
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

module.exports = new AuthService();

