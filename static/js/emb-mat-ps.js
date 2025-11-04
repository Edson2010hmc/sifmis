// static/js/emb-mat-ps.js
// Módulo para Embarque de Materiais na Passagem de Serviço

const EmbMatPsModule = (function() {
  'use strict';

  let psAtualId = null;
  let intervaloAtualizacao = null;

  // ===== ELEMENTOS DOM =====
  const elementos = {
    tabela: document.getElementById('tblEmbMatPs')
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    console.log('[EmbMatPs] Módulo inicializado');
  }

  // ===== SINCRONIZAR MATERIAIS =====
  async function sincronizarMateriais(psId) {
    if (!psId) return;
    
    try {
      console.log(`[EmbMatPs] Sincronizando materiais para PS ${psId}`);
      
      const response = await fetch(`/api/ps/${psId}/sincronizar-materiais-embarque/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      const result = await response.json();
      
      if (!result.success) {
        //console.error('[EmbMatPs] Erro ao sincronizar:', result.error);
        return;
      }
      
      //console.log(`[EmbMatPs] ${result.message}`);
      
    } catch (error) {
      //console.error('[EmbMatPs] Erro ao sincronizar materiais:', error);
    }
  }

  // ===== CARREGAR DADOS =====
  async function carregarDados(psId) {
    if (!psId) return;
    
    psAtualId = psId;
    
    try {
      // Sincronizar materiais antes de carregar
      await sincronizarMateriais(psId);
      
      // Carregar dados
      await atualizarTabela(psId);
      
      // Iniciar atualização em tempo real
      iniciarAtualizacaoTempoReal(psId);
      
    } catch (error) {
      //console.error('[EmbMatPs] Erro ao carregar dados:', error);
    }
  }

  // ===== ATUALIZAR TABELA =====
  async function atualizarTabela(psId) {
    if (!elementos.tabela) return;
    
    try {
      const response = await fetch(`/api/ps/${psId}/materiais-embarque/`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('[EmbMatPs] Erro ao carregar materiais:', result.error);
        return;
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
      //console.error('[EmbMatPs] Erro ao atualizar tabela:', error);
    }
  }

  // ===== INICIAR ATUALIZAÇÃO EM TEMPO REAL =====
  function iniciarAtualizacaoTempoReal(psId) {
    // Limpar intervalo anterior se existir
    if (intervaloAtualizacao) {
      clearInterval(intervaloAtualizacao);
    }
    
    // Atualizar a cada 5 segundos
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

  // ===== SALVAR (SINCRONIZAR) =====
  async function salvar() {
    if (!psAtualId) return;
    
    try {
      // Sincronizar materiais
      await sincronizarMateriais(psAtualId);
      
      // Atualizar tabela
      await atualizarTabela(psAtualId);
      
      //console.log('[EmbMatPs] Dados salvos e sincronizados');
      
    } catch (error) {
      //console.error('[EmbMatPs] Erro ao salvar:', error);
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

  // ===== EXIBIR DETALHES (MODAL DO MÓDULO INVMAT) =====
  async function exibirDetalhes(descMaterial) {
    alert(`Detalhes do material: ${descMaterial}\n\nEsta funcionalidade abrirá o modal de detalhes do módulo de Inventário de Materiais em modo somente leitura.`);
  }

  // ===== EXPORTAR FUNÇÕES =====
  return {
    init,
    carregarDados,
    salvar,
    limpar,
    exibirDetalhes
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EmbMatPsModule.init);
} else {
  EmbMatPsModule.init();
}