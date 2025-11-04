// static/js/emb-mat-ps.js
// Módulo para Embarque de Materiais na Passagem de Serviço

const EmbMatPsModule = (() => {
  'use strict';

  let psAtualId = null;

  const elementos = {
    tabela: document.getElementById('tblEmbMatPs'),
    btnAtualizar: null // Será criado dinamicamente
  };

  function init() {
    console.log('[EmbMatPs] Módulo inicializado');
    criarBotaoAtualizar();
  }

  // ===== CRIAR BOTÃO ATUALIZAR =====
  function criarBotaoAtualizar() {
    const accordion = document.getElementById('acc-embmateriais');
    if (!accordion) return;
    
    // Verificar se botão já existe
    if (document.getElementById('btnAtualizarEmbMat')) return;
    
    // Criar container do botão
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: flex-end;';
    
    // Criar botão
    const btn = document.createElement('button');
    btn.id = 'btnAtualizarEmbMat';
    btn.className = 'btn secondary small';
    btn.textContent = 'Atualizar';
    btn.style.cssText = 'padding: 6px 16px;';
    btn.addEventListener('click', () => {
      if (psAtualId) {
        atualizarTabela(psAtualId);
      }
    });
    
    container.appendChild(btn);
    
    // Inserir antes da tabela
    const tabelaParent = elementos.tabela.parentElement;
    tabelaParent.insertBefore(container, elementos.tabela);
    
    elementos.btnAtualizar = btn;
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
      console.error('[EmbMatPs] Erro ao sincronizar:', error);
    }
  }

  async function carregarDados(psId) {
    if (!psId) return;
    
    psAtualId = psId;
    
    try {
      await sincronizarMateriais(psId);
      await atualizarTabela(psId);
    } catch (error) {
      console.error('[EmbMatPs] Erro ao carregar:', error);
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
        
        // Criar botão com materialId correto
        const materialId = mat.materialId;
        const btnDetalhes = materialId 
          ? `<button class="btn secondary small" onclick="EmbMatPsModule.abrirModal(${materialId})">Exibir Detalhes</button>`
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
      
      console.log(`[EmbMatPs] Tabela atualizada: ${result.data.length} materiais`);
      
    } catch (error) {
      console.error('[EmbMatPs] Erro ao atualizar tabela:', error);
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
    
    if (elementos.tabela) {
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
    }
  }

  // ===== ABRIR MODAL DE DETALHES =====
  function abrirModal(materialId) {
    if (!materialId) {
      alert('ID do material não disponível');
      return;
    }
    
    console.log('[EmbMatPs] Tentando abrir modal para material ID:', materialId);
    
    // Verificar se InvMatModule está disponível
    if (typeof window.InvMatModule === 'undefined') {
      alert('Erro: Módulo de Inventário não está carregado. Recarregue a página.');
      return;
    }
    
    if (typeof window.InvMatModule.verDetalhes !== 'function') {
      alert('Erro: Função verDetalhes não disponível no módulo de Inventário');
      return;
    }
    
    // Chamar a função verDetalhes
    window.InvMatModule.verDetalhes(materialId);
  }

  return {
    init,
    carregarDados,
    salvar,
    limpar,
    abrirModal
  };

})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EmbMatPsModule.init);
} else {
  EmbMatPsModule.init();
}