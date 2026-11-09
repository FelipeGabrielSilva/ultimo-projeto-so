/**
 * Mini Gestão - Gerenciamento de Clientes
 */

const clientsMap = new Map();
let clientToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadClients();

  // Busca e Filtros
  const searchInput = document.getElementById('searchClientInput');
  const statusFilter = document.getElementById('filterClientStatus');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadClients(), 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      loadClients();
    });
  }

  // Formulário de Criação/Edição
  const clientForm = document.getElementById('clientForm');
  if (clientForm) {
    clientForm.addEventListener('submit', handleSaveClient);
  }

  // Botão de Confirmação de Exclusão no Modal
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', handleConfirmDelete);
  }

  // Delegação de Eventos na Tabela (garante clique mesmo se clicar no ícone <i> dentro do botão)
  const tbody = document.getElementById('clientsTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id, 10);

      if (action === 'edit' && id) {
        openEditClient(id);
      } else if (action === 'delete' && id) {
        openDeleteClient(id);
      }
    });
  }
});

async function loadClients() {
  const searchInput = document.getElementById('searchClientInput');
  const statusFilter = document.getElementById('filterClientStatus');
  const search = searchInput ? searchInput.value.trim() : '';
  const status = statusFilter ? statusFilter.value : 'all';

  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;

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
    if (status && status !== 'all') params.append('status', status);

    const clients = await fetchApi(`/api/clients?${params.toString()}`);
    clientsMap.clear();

    if (!Array.isArray(clients) || clients.length === 0) {
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

    // Armazena no mapa para acesso rápido e seguro
    clients.forEach((c) => clientsMap.set(c.id, c));

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
            ${c.total_tasks || 0} tarefa(s)
          </span>
          ${c.open_tasks > 0 ? `<span class="badge bg-warning text-dark ms-1">${c.open_tasks} aberta(s)</span>` : ''}
        </td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-id="${c.id}" title="Editar">
            <i class="bi bi-pencil pointer-events-none"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${c.id}" title="Excluir">
            <i class="bi bi-trash pointer-events-none"></i>
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
  setModalAlert('clientModalAlert', '');
  document.getElementById('clientModalLabel').textContent = 'Novo Cliente';
  document.getElementById('clientId').value = '';
  document.getElementById('clientForm').reset();
  document.getElementById('clientStatus').value = 'active';
  showModal('clientModal');
}

async function openEditClient(id) {
  setModalAlert('clientModalAlert', '');
  try {
    let client = clientsMap.get(id);
    if (!client) {
      client = await fetchApi(`/api/clients/${id}`);
    }

    document.getElementById('clientModalLabel').textContent = 'Editar Cliente';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientDocument').value = client.document || '';
    document.getElementById('clientStatus').value = client.status || 'active';

    showModal('clientModal');
  } catch (err) {
    showToast('Erro ao carregar dados do cliente: ' + err.message, 'danger');
  }
}

async function handleSaveClient(e) {
  e.preventDefault();
  setModalAlert('clientModalAlert', '');

  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const documentNum = document.getElementById('clientDocument').value.trim();
  const status = document.getElementById('clientStatus').value;

  if (!name) {
    setModalAlert('clientModalAlert', 'O nome do cliente é obrigatório.');
    return;
  }

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

    hideModal('clientModal');
    loadClients();
  } catch (err) {
    setModalAlert('clientModalAlert', err.message);
    showToast(err.message, 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar';
  }
}

function openDeleteClient(id) {
  clientToDeleteId = id;
  setModalAlert('deleteClientAlert', '');

  const client = clientsMap.get(id);
  const name = client ? client.name : `#${id}`;

  const nameEl = document.getElementById('deleteClientName');
  if (nameEl) nameEl.textContent = name;

  showModal('deleteConfirmModal');
}

async function handleConfirmDelete() {
  if (!clientToDeleteId) return;

  setModalAlert('deleteClientAlert', '');
  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Excluindo...';

  try {
    await fetchApi(`/api/clients/${clientToDeleteId}`, {
      method: 'DELETE',
    });

    showToast('Cliente excluído com sucesso.', 'success');
    hideModal('deleteConfirmModal');
    clientToDeleteId = null;
    loadClients();
  } catch (err) {
    setModalAlert('deleteClientAlert', err.message);
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Excluir Cliente';
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

function exportClientsToCSV() {
  if (clientsMap.size === 0) {
    showToast('Nenhum cliente disponível para exportação.', 'warning');
    return;
  }
  const headers = ['ID', 'Nome', 'CPF_CNPJ', 'Email', 'Telefone', 'Situacao', 'Total_Tarefas'];
  const rows = Array.from(clientsMap.values()).map((c) => [
    c.id,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.document || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    c.status === 'active' ? 'Ativo' : 'Inativo',
    c.total_tasks || 0,
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Planilha CSV de clientes exportada!', 'success');
}

// Exportações explícitas no window para suporte total a chamadas de botões
window.openCreateClient = openCreateClient;
window.openEditClient = openEditClient;
window.openDeleteClient = openDeleteClient;
window.exportClientsToCSV = exportClientsToCSV;
