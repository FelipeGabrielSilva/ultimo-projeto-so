/**
 * Mini Gestão - Utilitários de Interface e Perfil do Sistema
 */

window.CURRENT_USER = {
  id: 1,
  name: 'Administrador',
  email: 'admin@minigestao.local',
  role: 'admin',
};

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

// Wrapper centralizado de chamadas de API
async function fetchApi(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  options.headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erro HTTP ${response.status}`);
  }

  return data;
}

// Carregar informações do usuário padrão na interface
async function initCurrentUser() {
  try {
    const data = await fetchApi('/api/auth/me');
    const user = data.user;

    const userNameElements = document.querySelectorAll('.current-user-name');
    userNameElements.forEach((el) => (el.textContent = user.name));

    const userEmailElements = document.querySelectorAll('.current-user-email');
    userEmailElements.forEach((el) => (el.textContent = user.email));

    const userRoleElements = document.querySelectorAll('.current-user-role');
    userRoleElements.forEach((el) => {
      el.textContent = user.role === 'admin' ? 'Administrador' : 'Operador';
      el.className = `badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`;
    });

    const initials = user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const avatarElements = document.querySelectorAll('.avatar-circle');
    avatarElements.forEach((el) => (el.textContent = initials || 'A'));

    document.querySelectorAll('.admin-only').forEach((el) => el.classList.remove('d-none'));

    window.CURRENT_USER = user;
    ensureProfileModal();
  } catch (err) {
    console.warn('Não foi possível obter perfil do usuário:', err.message);
  }
}

// Criação e controle dinâmico do Modal de Meu Perfil
function ensureProfileModal() {
  if (document.getElementById('profileModal')) return;

  const modalHtml = `
  <div class="modal fade" id="profileModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form id="profileForm">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-person-circle me-2"></i>Meu Perfil</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div id="profileModalAlert" class="alert alert-danger d-none py-2 px-3 small mb-3"></div>
            
            <div class="mb-3">
              <label for="profileEmail" class="form-label small fw-semibold">E-mail</label>
              <input type="text" class="form-control bg-light" id="profileEmail" disabled readonly>
            </div>

            <div class="mb-3">
              <label for="profileName" class="form-label small fw-semibold">Nome Completo *</label>
              <input type="text" class="form-control" id="profileName" required>
            </div>

            <hr class="my-3 text-muted">
            <h6 class="fw-semibold small text-muted text-uppercase mb-2">Alterar Senha (Opcional)</h6>

            <div class="mb-3">
              <label for="profileCurrentPassword" class="form-label small fw-semibold">Senha Atual</label>
              <input type="password" class="form-control" id="profileCurrentPassword" placeholder="••••••••">
            </div>

            <div class="mb-3">
              <label for="profileNewPassword" class="form-label small fw-semibold">Nova Senha</label>
              <input type="password" class="form-control" id="profileNewPassword" placeholder="••••••••">
              <div class="form-text small">Mínimo de 6 caracteres. Deixe em branco se não desejar alterar.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btnSaveProfile">
              <i class="bi bi-check-lg me-1"></i>Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

  const container = document.createElement('div');
  container.innerHTML = modalHtml;
  document.body.appendChild(container.firstElementChild);

  document.getElementById('profileForm').addEventListener('submit', handleSaveProfile);

  document.querySelectorAll('.user-profile').forEach((el) => {
    el.setAttribute('title', 'Clique para editar seu perfil');
    el.style.cursor = 'pointer';
    el.addEventListener('click', openProfileModal);
  });
}

function openProfileModal() {
  if (!window.CURRENT_USER) return;
  setModalAlert('profileModalAlert', '');
  document.getElementById('profileEmail').value = window.CURRENT_USER.email || '';
  document.getElementById('profileName').value = window.CURRENT_USER.name || '';
  document.getElementById('profileCurrentPassword').value = '';
  document.getElementById('profileNewPassword').value = '';
  showModal('profileModal');
}

async function handleSaveProfile(e) {
  e.preventDefault();
  setModalAlert('profileModalAlert', '');

  const name = document.getElementById('profileName').value.trim();
  const currentPassword = document.getElementById('profileCurrentPassword').value;
  const newPassword = document.getElementById('profileNewPassword').value;

  if (!name) {
    setModalAlert('profileModalAlert', 'O nome é obrigatório.');
    return;
  }

  const payload = { name };
  if (newPassword && newPassword.trim().length > 0) {
    payload.currentPassword = currentPassword;
    payload.newPassword = newPassword;
  }

  const submitBtn = document.getElementById('btnSaveProfile');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

  try {
    const res = await fetchApi('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    showToast('Perfil atualizado com sucesso!', 'success');
    hideModal('profileModal');

    if (res.user) {
      window.CURRENT_USER.name = res.user.name;
      document.querySelectorAll('.current-user-name').forEach((el) => (el.textContent = res.user.name));
      const initials = res.user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
      document.querySelectorAll('.avatar-circle').forEach((el) => (el.textContent = initials || 'A'));
    }
  } catch (err) {
    setModalAlert('profileModalAlert', err.message);
    showToast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Alterações';
  }
}

// Inicializações de layout e eventos
document.addEventListener('DOMContentLoaded', () => {
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

  initCurrentUser();
});
