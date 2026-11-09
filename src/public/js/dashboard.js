/**
 * Mini Gestão - Dashboard Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    const data = await fetchApi('/api/tasks/dashboard-stats');

    // Atualizar Contadores
    document.getElementById('statTotalClients').textContent = data.totalClients || 0;
    document.getElementById('statTotalTasks').textContent = data.totalTasks || 0;
    document.getElementById('statPendingTasks').textContent = data.pendingTasks || 0;
    document.getElementById('statCompletedTasks').textContent = data.completedTasks || 0;

    // Renderizar Últimas Tarefas
    renderRecentTasks(data.recentTasks || []);

    // Renderizar Tarefas Próximas do Vencimento
    renderDueSoonTasks(data.dueSoonTasks || []);
  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err);
    showToast('Falha ao carregar indicadores do dashboard.', 'danger');
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
  if (!dateStr) return '<span class="text-muted">Sem prazo</span>';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function renderRecentTasks(tasks) {
  const tbody = document.getElementById('recentTasksTableBody');
  if (!tbody) return;

  if (tasks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i>
          Nenhuma tarefa cadastrada recentemente.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tasks
    .map(
      (task) => `
      <tr>
        <td class="fw-medium">${escapeHtml(task.title)}</td>
        <td><i class="bi bi-building me-1 text-muted"></i>${escapeHtml(task.client_name)}</td>
        <td>${task.user_name ? escapeHtml(task.user_name) : '<span class="text-muted">Não atribuído</span>'}</td>
        <td>${getStatusBadge(task.status)}</td>
        <td>${formatDate(task.due_date)}</td>
      </tr>
    `
    )
    .join('');
}

function renderDueSoonTasks(tasks) {
  const tbody = document.getElementById('dueSoonTasksTableBody');
  if (!tbody) return;

  if (tasks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          <i class="bi bi-check2-circle fs-3 d-block text-success mb-1"></i>
          Nenhuma tarefa pendente com prazo próximo.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tasks
    .map((task) => {
      const days = parseInt(task.days_until_due, 10);
      let urgencyBadge = '';

      if (days < 0) {
        urgencyBadge = `<span class="badge bg-danger">Atrasada há ${Math.abs(days)} dia(s)</span>`;
      } else if (days === 0) {
        urgencyBadge = '<span class="badge bg-warning text-dark">Vence hoje!</span>';
      } else if (days === 1) {
        urgencyBadge = '<span class="badge bg-warning text-dark">Vence amanhã</span>';
      } else {
        urgencyBadge = `<span class="badge bg-info text-dark">Em ${days} dias</span>`;
      }

      return `
        <tr>
          <td class="fw-medium">${escapeHtml(task.title)}</td>
          <td>${escapeHtml(task.client_name)}</td>
          <td>${formatDate(task.due_date)}</td>
          <td>${urgencyBadge}</td>
        </tr>
      `;
    })
    .join('');
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

