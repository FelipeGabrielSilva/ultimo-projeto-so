/**
 * Mini Gestão - Utilitários de Autenticação e Interface
 */

// Helper para exibir notificações Toast do Bootstrap
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const bgClass = type === 'success' ? 'bg-success text-white' : 
                  type === 'danger' ? 'bg-danger text-white' : 
                  type === 'warning' ? 'bg-warning text-dark' : 'bg-primary text-white';

  const icon = type === 'success' ? 'bi-check-circle-fill' :
               type === 'danger' ? 'bi-exclamation-triangle-fill' :
               type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center ${bgClass} border-0 shadow mb-2`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icon} fs-5"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// Helper seguro para fechar modais do Bootstrap e remover backdrops presos
function hideModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getInstance(el) || bootstrap.Modal.getOrCreateInstance(el);
  if (instance) {
    instance.hide();
  }
  // Limpeza de segurança para evitar páginas travadas por backdrops órfãos
  setTimeout(() => {
    if (!document.querySelector('.modal.show')) {
      document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
    }
  }, 350);
}

// Helper para abrir modais de forma garantida
function showModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return null;
  const instance = bootstrap.Modal.getOrCreateInstance(el);
  instance.show();
  return instance;
}

// Helper para exibir mensagens de erro dentro do próprio modal
function setModalAlert(alertId, message) {
  const el = document.getElementById(alertId);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove('d-none');
  } else {
    el.textContent = '';
    el.classList.add('d-none');
  }
}

// Wrapper centralizado de chamadas de API com tratamento de sessão
async function fetchApi(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  options.headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  try {
    const response = await fetch(url, options);

    // Se a sessão expirou ou não está autenticado
    if (response.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=1';
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erro HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Carregar informações do usuário logado na interface
async function initCurrentUser() {
  try {
    const data = await fetchApi('/api/auth/me');
    const user = data.user;

    // Atualiza nome e papel
    const userNameElements = document.querySelectorAll('.current-user-name');
    userNameElements.forEach((el) => (el.textContent = user.name));

    const userEmailElements = document.querySelectorAll('.current-user-email');
    userEmailElements.forEach((el) => (el.textContent = user.email));

    const userRoleElements = document.querySelectorAll('.current-user-role');
    userRoleElements.forEach((el) => {
      el.textContent = user.role === 'admin' ? 'Administrador' : 'Operador';
      el.className = `badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`;
    });

    // Iniciais para avatar
    const initials = user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const avatarElements = document.querySelectorAll('.avatar-circle');
    avatarElements.forEach((el) => (el.textContent = initials || 'U'));

    // Exibir menus restritos caso seja admin
    if (user.role === 'admin') {
      document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('d-none'));
    } else {
      document.querySelectorAll('.admin-only').forEach((el) => el.classList.add('d-none'));
    }

    window.CURRENT_USER = user;
  } catch (err) {
    console.warn('Não foi possível obter usuário atual:', err.message);
  }
}

// Ação de Logout
async function handleLogout() {
  try {
    await fetchApi('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  } catch (err) {
    console.error('Erro ao efetuar logout:', err);
    window.location.href = '/login';
  }
}

// Inicializações de layout e eventos
document.addEventListener('DOMContentLoaded', () => {
  // Configurar botão de logout se existir
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });

  // Configurar toggle de menu mobile
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      if (backdrop) backdrop.classList.toggle('show');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }

  // Carrega usuário caso não esteja na tela de login
  if (!window.location.pathname.includes('/login')) {
    initCurrentUser();
  }

  // Configura submit da tela de login caso exista o formulário
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorAlert = document.getElementById('loginAlert');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (errorAlert) errorAlert.classList.add('d-none');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';

      try {
        await fetchApi('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        window.location.href = '/dashboard';
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Erro ao realizar login.';
          errorAlert.classList.remove('d-none');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Entrar';
      }
    });
  }
});

