/**
 * Mini Gestão - Gerenciamento de Clientes
 */

let clientsModal;
let deleteModal;
let clientToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  clientsModal = new bootstrap.Modal(document.getElementById('clientModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

  loadClients();

  // Busca e Filtros
  const searchInput = document.getElementById('searchClientInput');
  const statusFilter = document.getElementById('filterClientStatus');

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadClients(), 300);
  });

  statusFilter.addEventListener('change', () => {
    loadClients();
  });

  // Formulário de Criação/Edição
  document.getElementById('clientForm').addEventListener('submit', handleSaveClient);

  // Confirmação de exclusão
  document.getElementById('btnConfirmDelete').addEventListener('click', handleConfirmDelete);
});

async function loadClients() {
  const search = document.getElementById('searchClientInput').value.trim();
  const status = document.getElementById('filterClientStatus').value;

  const tbody = document.getElementById('clientsTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Carregando clientes...
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const clients = await fetchApi(`/api/clients?${params.toString()}`);

    if (clients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-people fs-3 d-block mb-1"></i>
            Nenhum cliente encontrado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = clients
      .map(
        (c) => `
      <tr>
        <td class="fw-semibold">${escapeHtml(c.name)}</td>
        <td>${c.document ? escapeHtml(c.document) : '<span class="text-muted">-</span>'}</td>
        <td>${c.email ? `<a href="mailto:${escapeHtml(c.email)}" class="text-decoration-none">${escapeHtml(c.email)}</a>` : '<span class="text-muted">-</span>'}</td>
        <td>${c.phone ? escapeHtml(c.phone) : '<span class="text-muted">-</span>'}</td>
        <td>
          <span class="badge ${c.status === 'active' ? 'badge-status-active' : 'badge-status-inactive'}">
            ${c.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <span class="badge bg-light text-dark border">
            ${c.total_tasks} tarefa(s)
          </span>
          ${c.open_tasks > 0 ? `<span class="badge bg-warning text-dark ms-1">${c.open_tasks} aberta(s)</span>` : ''}
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditClient(${c.id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteClient(${c.id}, '${escapeHtml(c.name)}')" title="Excluir">
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
          Erro ao carregar clientes: ${err.message}
        </td>
      </tr>
    `;
    showToast(err.message, 'danger');
  }
}

function openCreateClient() {
  document.getElementById('clientModalLabel').textContent = 'Novo Cliente';
  document.getElementById('clientId').value = '';
  document.getElementById('clientForm').reset();
  document.getElementById('clientStatus').value = 'active';
  clientsModal.show();
}

async function openEditClient(id) {
  try {
    const client = await fetchApi(`/api/clients/${id}`);
    document.getElementById('clientModalLabel').textContent = 'Editar Cliente';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientDocument').value = client.document || '';
    document.getElementById('clientStatus').value = client.status || 'active';
    clientsModal.show();
  } catch (err) {
    showToast('Erro ao buscar dados do cliente: ' + err.message, 'danger');
  }
}

async function handleSaveClient(e) {
  e.preventDefault();
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const documentNum = document.getElementById('clientDocument').value.trim();
  const status = document.getElementById('clientStatus').value;

  const payload = { name, email, phone, document: documentNum, status };
  const submitBtn = document.getElementById('btnSaveClient');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

  try {
    if (id) {
      await fetchApi(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Cliente atualizado com sucesso!', 'success');
    } else {
      await fetchApi('/api/clients', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Cliente cadastrado com sucesso!', 'success');
    }

    clientsModal.hide();
    loadClients();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
  }
}

function openDeleteClient(id, name) {
  clientToDeleteId = id;
  document.getElementById('deleteClientName').textContent = name;
  deleteModal.show();
}

async function handleConfirmDelete() {
  if (!clientToDeleteId) return;

  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Excluindo...';

  try {
    await fetchApi(`/api/clients/${clientToDeleteId}`, {
      method: 'DELETE',
    });

    showToast('Cliente excluído com sucesso.', 'success');
    deleteModal.hide();
    loadClients();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Excluir Cliente';
    clientToDeleteId = null;
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
