/**
 * Mini Gestão - Gerenciamento de Tarefas
 */

let taskModal;
let deleteTaskModal;
let taskToDeleteId = null;

let allClientsList = [];
let allUsersList = [];

document.addEventListener('DOMContentLoaded', () => {
  taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
  deleteTaskModal = new bootstrap.Modal(document.getElementById('deleteTaskConfirmModal'));

  // Carregar dados de apoio (clientes e usuários para selects)
  initAuxiliaryData().then(() => {
    loadTasks();
  });

  // Configurar Filtros
  const searchInput = document.getElementById('searchTaskInput');
  const clientFilter = document.getElementById('filterTaskClient');
  const userFilter = document.getElementById('filterTaskUser');
  const statusFilter = document.getElementById('filterTaskStatus');
  const startDateFilter = document.getElementById('filterTaskStartDate');
  const endDateFilter = document.getElementById('filterTaskEndDate');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadTasks(), 300);
  });

  [clientFilter, userFilter, statusFilter, startDateFilter, endDateFilter].forEach((input) => {
    input.addEventListener('change', () => loadTasks());
  });

  // Formulário de Criação/Edição
  document.getElementById('taskForm').addEventListener('submit', handleSaveTask);

  // Confirmação de exclusão
  document.getElementById('btnConfirmDeleteTask').addEventListener('click', handleConfirmDeleteTask);
});

async function initAuxiliaryData() {
  try {
    const [clients, users] = await Promise.all([
      fetchApi('/api/clients'),
      fetchApi('/api/users').catch(() => []), // Se o usuário não for admin, /api/users pode retornar 403
    ]);

    allClientsList = clients;
    allUsersList = users;

    populateSelects();
  } catch (err) {
    console.error('Erro ao carregar dados auxiliares:', err);
  }
}

function populateSelects() {
  // Select de Clientes no Filtro e no Modal
  const filterClient = document.getElementById('filterTaskClient');
  const modalClient = document.getElementById('taskClientId');

  const clientOptions = allClientsList
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');

  filterClient.innerHTML = '<option value="all">Todos os clientes</option>' + clientOptions;
  modalClient.innerHTML = '<option value="">Selecione um cliente...</option>' + clientOptions;

  // Select de Responsáveis no Filtro e no Modal
  const filterUser = document.getElementById('filterTaskUser');
  const modalUser = document.getElementById('taskUserId');

  const userOptions = allUsersList
    .map((u) => `<option value="${u.id}">${escapeHtml(u.name)}</option>`)
    .join('');

  filterUser.innerHTML = '<option value="all">Todos os responsáveis</option>' + userOptions;
  modalUser.innerHTML = '<option value="">Nenhum (não atribuído)</option>' + userOptions;
}

async function loadTasks() {
  const search = document.getElementById('searchTaskInput').value.trim();
  const client_id = document.getElementById('filterTaskClient').value;
  const user_id = document.getElementById('filterTaskUser').value;
  const status = document.getElementById('filterTaskStatus').value;
  const start_date = document.getElementById('filterTaskStartDate').value;
  const end_date = document.getElementById('filterTaskEndDate').value;

  const tbody = document.getElementById('tasksTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Carregando tarefas...
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (client_id && client_id !== 'all') params.append('client_id', client_id);
    if (user_id && user_id !== 'all') params.append('user_id', user_id);
    if (status && status !== 'all') params.append('status', status);
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    const tasks = await fetchApi(`/api/tasks?${params.toString()}`);

    if (tasks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-card-checklist fs-3 d-block mb-1"></i>
            Nenhuma tarefa encontrada para os filtros aplicados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tasks
      .map(
        (t) => `
      <tr>
        <td class="fw-semibold">
          ${escapeHtml(t.title)}
          ${t.description ? `<small class="text-muted d-block text-truncate" style="max-width: 280px;">${escapeHtml(t.description)}</small>` : ''}
        </td>
        <td><i class="bi bi-building me-1 text-muted"></i>${escapeHtml(t.client_name)}</td>
        <td>${t.user_name ? escapeHtml(t.user_name) : '<span class="text-muted fst-italic">Não atribuído</span>'}</td>
        <td>${getStatusBadge(t.status)}</td>
        <td>${formatDate(t.due_date)}</td>
        <td class="text-muted small">${formatDateTime(t.created_at)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditTask(${t.id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteTask(${t.id}, '${escapeHtml(t.title)}')" title="Excluir">
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
        <td colspan="7" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle fs-3 d-block mb-1"></i>
          Erro ao carregar tarefas: ${err.message}
        </td>
      </tr>
    `;
    showToast(err.message, 'danger');
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'pending':
      return '<span class="badge badge-status-pending">Pendente</span>';
    case 'in_progress':
      return '<span class="badge badge-status-in_progress">Em Andamento</span>';
    case 'completed':
      return '<span class="badge badge-status-completed">Concluída</span>';
    case 'cancelled':
      return '<span class="badge badge-status-cancelled">Cancelada</span>';
    default:
      return `<span class="badge bg-light text-dark">${status}</span>`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '<span class="text-muted fst-italic">Sem prazo</span>';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function openCreateTask() {
  document.getElementById('taskModalLabel').textContent = 'Nova Tarefa';
  document.getElementById('taskId').value = '';
  document.getElementById('taskForm').reset();
  document.getElementById('taskStatus').value = 'pending';
  taskModal.show();
}

async function openEditTask(id) {
  try {
    const task = await fetchApi(`/api/tasks/${id}`);
    document.getElementById('taskModalLabel').textContent = 'Editar Tarefa';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskClientId').value = task.client_id || '';
    document.getElementById('taskUserId').value = task.user_id || '';
    document.getElementById('taskStatus').value = task.status || 'pending';
    document.getElementById('taskDueDate').value = task.due_date || '';
    taskModal.show();
  } catch (err) {
    showToast('Erro ao obter detalhes da tarefa: ' + err.message, 'danger');
  }
}

async function handleSaveTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const client_id = document.getElementById('taskClientId').value;
  const user_id = document.getElementById('taskUserId').value || null;
  const status = document.getElementById('taskStatus').value;
  const due_date = document.getElementById('taskDueDate').value || null;

  const payload = {
    title,
    description,
    client_id: parseInt(client_id, 10),
    user_id: user_id ? parseInt(user_id, 10) : null,
    status,
    due_date,
  };

  const submitBtn = document.getElementById('btnSaveTask');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

  try {
    if (id) {
      await fetchApi(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Tarefa atualizada com sucesso!', 'success');
    } else {
      await fetchApi('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Tarefa cadastrada com sucesso!', 'success');
    }

    taskModal.hide();
    loadTasks();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Tarefa';
  }
}

function openDeleteTask(id, title) {
  taskToDeleteId = id;
  document.getElementById('deleteTaskTitle').textContent = title;
  deleteTaskModal.show();
}

async function handleConfirmDeleteTask() {
  if (!taskToDeleteId) return;

  const btn = document.getElementById('btnConfirmDeleteTask');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Excluindo...';

  try {
    await fetchApi(`/api/tasks/${taskToDeleteId}`, {
      method: 'DELETE',
    });

    showToast('Tarefa excluída com sucesso.', 'success');
    deleteTaskModal.hide();
    loadTasks();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Excluir Tarefa';
    taskToDeleteId = null;
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

