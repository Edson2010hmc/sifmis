// static/js/emb-mat-ps.js
// Módulo para Embarque de Materiais na Passagem de Serviço (1.8)

const EmbMatPsModule = (() => {
  let psAtualId = null;
  let intervaloAtualizacao = null;

  // ===== ELEMENTOS DOM =====
  const elementos = {
    tabela: document.getElementById('tblEmbMatPs')
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    // Inicialização silenciosa
  }

  // ===== SINCRONIZAR MATERIAIS =====
  async function sincronizarMateriais(psId) {
    if (!psId) return;
    
    try {
      const response = await fetch(`/api/ps/${psId}/sincronizar-materiais-embarque/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      const result = await response.json();
      
      if (!result.success) {
        return;
      }
      
    } catch (error) {
      // Silencioso
    }
  }

  // ===== CARREGAR DADOS =====
  async function carregarDados(psId) {
    if (!psId) return;
    
    psAtualId = psId;
    
    try {
      await sincronizarMateriais(psId);
      await atualizarTabela(psId);
      iniciarAtualizacaoTempoReal(psId);
      
    } catch (error) {
      alert('Erro ao carregar Embarque de Materiais: ' + error.message);
    }
  }

  // ===== ATUALIZAR TABELA =====
  async function atualizarTabela(psId) {
    if (!elementos.tabela) return;
    
    try {
      const response = await fetch(`/api/ps/${psId}/materiais-embarque/`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '';
      
      if (result.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
        return;
      }
      
      result.data.forEach(mat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border:1px solid #ddd; padding:8px;">${mat.descMatEmbPs}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.numRtMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.osMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.respMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.descContMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">
            <button class="btn secondary small" onclick="EmbMatPsModule.exibirDetalhes('${mat.descMatEmbPs}')">Exibir Detalhes</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
    } catch (error) {
      alert('Erro ao atualizar tabela de materiais: ' + error.message);
    }
  }

  // ===== INICIAR ATUALIZAÇÃO EM TEMPO REAL =====
  function iniciarAtualizacaoTempoReal(psId) {
    if (intervaloAtualizacao) {
      clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(() => {
      atualizarTabela(psId);
    }, 5000);
  }

  // ===== PARAR ATUALIZAÇÃO EM TEMPO REAL =====
  function pararAtualizacaoTempoReal() {
    if (intervaloAtualizacao) {
      clearInterval(intervaloAtualizacao);
      intervaloAtualizacao = null;
    }
  }

  // ===== SALVAR (chamado pelo PassagensModule) =====
  async function salvar() {
    if (!psAtualId) return;
    
    try {
      await sincronizarMateriais(psAtualId);
      await atualizarTabela(psAtualId);
      
    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR =====
  function limpar() {
    psAtualId = null;
    pararAtualizacaoTempoReal();
    
    if (elementos.tabela) {
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
    }
  }

  // ===== EXIBIR DETALHES =====
  async function exibirDetalhes(descMaterial) {
    alert(`Detalhes do material: ${descMaterial}\n\nEsta funcionalidade abrirá o modal de detalhes do módulo de Inventário de Materiais em modo somente leitura.`);
      
  }

  // ===== EXPORTAR FUNÇÕES =====
  return {
    init,
    carregarDados,
    salvar,
    limpar,
    exibirDetalhes,
    
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EmbMatPsModule.init);
} else {
  EmbMatPsModule.init();
}