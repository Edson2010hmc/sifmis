// static/js/emb-mat-ps.js
// Módulo para Embarque de Materiais na Passagem de Serviço

const EmbMatPsModule = (() => {
  'use strict';

  let psAtualId = null;
  let intervaloAtualizacao = null;

  const elementos = {
    tabela: document.getElementById('tblEmbMatPs')
  };

  function init() {
    console.log('[EmbMatPs] Módulo inicializado');
  }

  async function sincronizarMateriais(psId) {
    if (!psId) return;
    
    try {
      const response = await fetch(`/api/ps/${psId}/sincronizar-materiais-embarque/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      await response.json();
    } catch (error) {
      // Silencioso
    }
  }

  async function carregarDados(psId) {
    if (!psId) return;
    
    psAtualId = psId;
    
    try {
      await sincronizarMateriais(psId);
      await atualizarTabela(psId);
      iniciarAtualizacaoTempoReal(psId);
    } catch (error) {
      // Silencioso
    }
  }

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
        
        // Criar botão que chama a função correta
        const materialId = mat.materialId;
        const btnDetalhes = materialId 
          ? `<button class="btn secondary small" onclick="EmbMatPsModule.exibirDetalhes(${materialId})">Exibir Detalhes</button>`
          : '<span style="color:#999;">-</span>';
        
        tr.innerHTML = `
          <td style="border:1px solid #ddd; padding:8px;">${mat.descMatEmbPs}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.numRtMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.osMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.respMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.descContMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">
            ${btnDetalhes}
          </td>
        `;
        tbody.appendChild(tr);
      });
      
    } catch (error) {
      console.error('[EmbMatPs] Erro ao atualizar tabela:', error);
    }
  }

  function iniciarAtualizacaoTempoReal(psId) {
    if (intervaloAtualizacao) {
      clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(() => {
      atualizarTabela(psId);
    }, 5000);
  }

  function pararAtualizacaoTempoReal() {
    if (intervaloAtualizacao) {
      clearInterval(intervaloAtualizacao);
      intervaloAtualizacao = null;
    }
  }

  async function salvar() {
    if (!psAtualId) return;
    
    try {
      await sincronizarMateriais(psAtualId);
      await atualizarTabela(psAtualId);
    } catch (error) {
      throw error;
    }
  }

  function limpar() {
    psAtualId = null;
    pararAtualizacaoTempoReal();
    
    if (elementos.tabela) {
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
    }
  }

  // ===== EXIBIR DETALHES - CHAMA INVMATMODULE =====
  function exibirDetalhes(materialId) {
    if (!materialId) {
      alert('ID do material não disponível');
      return;
    }
    
    // Verificar se InvMatModule está disponível
    if (typeof InvMatModule === 'undefined' || typeof InvMatModule.verDetalhes !== 'function') {
      alert('Erro: Módulo de Inventário não disponível');
      return;
    }
    
    // Chamar diretamente a função verDetalhes do InvMatModule
    InvMatModule.verDetalhes(materialId);
  }

  return {
    init,
    carregarDados,
    salvar,
    limpar,
    exibirDetalhes
  };

})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EmbMatPsModule.init);
} else {
  EmbMatPsModule.init();
}