// static/js/anom-sms.js
// Módulo para Anomalias de SMS na Passagem de Serviço

const AnomSMSModule = (() => {

  // ===== CARREGAR DADOS =====
  async function carregarDados(psId) {
    if (!psId) return;

    try {
      const response = await fetch(`/api/ps/${psId}/anom-sms/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      renderizarTabela(result.data || []);

    } catch (error) {
      console.error('[AnomSMS] Erro ao carregar:', error);
    }
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela(anomalias) {
    const tbody = document.querySelector('#tblAnomSMS tbody');
    const msgSem = document.getElementById('msgSemAnomalias');
    
    tbody.innerHTML = '';

    if (anomalias.length === 0) {
      msgSem.style.display = 'block';
      return;
    }

    msgSem.style.display = 'none';

    anomalias.forEach(anom => {
      const tr = document.createElement('tr');
      
      const dataFormatada = new Date(anom.dataAnomSMS + 'T00:00:00').toLocaleDateString('pt-BR');
      
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">${dataFormatada}</td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">${anom.horaAnomSMS}</td>
        <td style="border:1px solid #ddd; padding:8px;">${anom.relacAnomSMS}</td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">
          <button class="btn small" onclick="AnomSMSModule.visualizarInforme(${anom.linkAnomSMS})">Ver Informe</button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  // ===== VISUALIZAR INFORME (ABRE MODAL) =====
  async function visualizarInforme(informeId) {
    try {
      const response = await fetch(`/api/informes/${informeId}/html/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      document.getElementById('modalInformeConteudo').innerHTML = result.html;
      document.getElementById('modalVisualizarInforme').classList.add('active');

    } catch (error) {
      alert('Erro ao carregar informe: ' + error.message);
    }
  }

  // ===== FECHAR MODAL =====
  function fecharModal() {
    document.getElementById('modalVisualizarInforme').classList.remove('active');
  }

  return {
    carregarDados,
    visualizarInforme,
    fecharModal
  };

})();