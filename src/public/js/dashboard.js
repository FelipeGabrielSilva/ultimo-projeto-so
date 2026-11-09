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

    // Renderizar Gráficos Visuais (Chart.js)
    renderCharts(data);
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

let statusChart = null;
let overviewChart = null;

function renderCharts(data) {
  if (typeof Chart === 'undefined') return;

  // 1. Gráfico de Rosca (Status das Tarefas)
  const statusCanvas = document.getElementById('tasksStatusChart');
  if (statusCanvas) {
    if (statusChart) statusChart.destroy();

    const pending = data.pendingTasks || 0;
    const inProgress = data.inProgressTasks || 0;
    const completed = data.completedTasks || 0;
    const cancelled = data.cancelledTasks || 0;

    statusChart = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Pendentes', 'Em Andamento', 'Concluídas', 'Canceladas'],
        datasets: [
          {
            data: [pending, inProgress, completed, cancelled],
            backgroundColor: ['#f59e0b', '#0284c7', '#10b981', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
            },
          },
        },
        cutout: '65%',
      },
    });
  }

  // 2. Gráfico de Barras (Visão Geral do Sistema)
  const overviewCanvas = document.getElementById('systemOverviewChart');
  if (overviewCanvas) {
    if (overviewChart) overviewChart.destroy();

    const totalClients = data.totalClients || 0;
    const totalTasks = data.totalTasks || 0;
    const openTasks = (data.pendingTasks || 0) + (data.inProgressTasks || 0);
    const completed = data.completedTasks || 0;

    overviewChart = new Chart(overviewCanvas, {
      type: 'bar',
      data: {
        labels: ['Clientes', 'Total Tarefas', 'Tarefas Abertas', 'Concluídas'],
        datasets: [
          {
            label: 'Quantidade',
            data: [totalClients, totalTasks, openTasks, completed],
            backgroundColor: ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981'],
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
            grid: {
              color: '#f1f5f9',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}

