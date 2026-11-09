/**
 * Mini Gestão - Gerenciamento de Usuários (Administrativo)
 */

let userModal;
let deleteUserModal;
let userToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  deleteUserModal = new bootstrap.Modal(document.getElementById('deleteUserConfirmModal'));

  loadUsers();

  // Formulário de Criação/Edição
  document.getElementById('userForm').addEventListener('submit', handleSaveUser);

  // Confirmação de exclusão
  document.getElementById('btnConfirmDeleteUser').addEventListener('click', handleConfirmDeleteUser);
});

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Carregando usuários...
      </td>
    </tr>
  `;

  try {
    const users = await fetchApi('/api/users');

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-people fs-3 d-block mb-1"></i>
            Nenhum usuário cadastrado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td class="fw-semibold">
          ${escapeHtml(u.name)}
          ${window.CURRENT_USER && window.CURRENT_USER.id === u.id ? '<span class="badge bg-primary-subtle text-primary border ms-1">Você</span>' : ''}
        </td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">
            ${u.role === 'admin' ? 'Administrador' : 'Operador'}
          </span>
        </td>
        <td>
          <span class="badge ${u.is_active ? 'badge-status-active' : 'badge-status-inactive'}">
            ${u.is_active ? 'Ativo' : 'Desativado'}
          </span>
        </td>
        <td class="text-muted small">${new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditUser(${u.id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button 
            class="btn btn-sm btn-outline-danger" 
            onclick="openDeleteUser(${u.id}, '${escapeHtml(u.name)}')" 
            ${window.CURRENT_USER && window.CURRENT_USER.id === u.id ? 'disabled title="Você não pode excluir a si mesmo"' : 'title="Excluir"'}
          >
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle fs-3 d-block mb-1"></i>
          Erro ao carregar usuários: ${err.message}
        </td>
      </tr>
    `;
    showToast(err.message, 'danger');
  }
}

function openCreateUser() {
  document.getElementById('userModalLabel').textContent = 'Novo Usuário';
  document.getElementById('userId').value = '';
  document.getElementById('userForm').reset();
  document.getElementById('userPassword').required = true;
  document.getElementById('passwordHelpText').textContent = 'Mínimo de 6 caracteres.';
  document.getElementById('userRole').value = 'user';
  document.getElementById('userActive').checked = true;
  userModal.show();
}

async function openEditUser(id) {
  try {
    const user = await fetchApi(`/api/users/${id}`);
    document.getElementById('userModalLabel').textContent = 'Editar Usuário';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHelpText').textContent = 'Deixe em branco para manter a senha atual.';
    document.getElementById('userRole').value = user.role || 'user';
    document.getElementById('userActive').checked = user.is_active !== false;
    userModal.show();
  } catch (err) {
    showToast('Erro ao carregar usuário: ' + err.message, 'danger');
  }
}

async function handleSaveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  const is_active = document.getElementById('userActive').checked;

  const payload = {
    name,
    email,
    role,
    is_active,
  };

  if (password && password.trim().length > 0) {
    payload.password = password;
  }

  const submitBtn = document.getElementById('btnSaveUser');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

  try {
    if (id) {
      await fetchApi(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Usuário atualizado com sucesso!', 'success');
    } else {
      if (!password) {
        throw new Error('A senha é obrigatória para novos usuários.');
      }
      await fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Usuário cadastrado com sucesso!', 'success');
    }

    userModal.hide();
    loadUsers();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Usuário';
  }
}

function openDeleteUser(id, name) {
  userToDeleteId = id;
  document.getElementById('deleteUserName').textContent = name;
  deleteUserModal.show();
}

async function handleConfirmDeleteUser() {
  if (!userToDeleteId) return;

  const btn = document.getElementById('btnConfirmDeleteUser');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Excluindo...';

  try {
    await fetchApi(`/api/users/${userToDeleteId}`, {
      method: 'DELETE',
    });

    showToast('Usuário excluído com sucesso.', 'success');
    deleteUserModal.hide();
    loadUsers();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Excluir Usuário';
    userToDeleteId = null;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
