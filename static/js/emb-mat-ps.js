// static/js/emb-mat-ps.js
// Módulo para Embarque de Materiais na Passagem de Serviço

const EmbMatPsModule = (() => {
  'use strict';

  let psAtualId = null;
  let sincronizandoEmAndamento = false; // NOVO: Flag para evitar sincronizações simultâneas

  const elementos = {
    tabela: document.getElementById('tblEmbMatPs'),
    btnAtualizar: null,
    modal: document.getElementById('modalDetalhesMaterial'),
    closeModal: document.getElementById('closeDetalhesMaterial'),
    btnFechar: document.getElementById('btnFecharDetalhes')
  };

  function init() {
    criarBotaoAtualizar();
    configurarModal();
  }

  function criarBotaoAtualizar() {
    const accordion = document.getElementById('acc-embmateriais');
    if (!accordion || document.getElementById('btnAtualizarEmbMat')) return;
    
    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: flex-end;';
    
    const btn = document.createElement('button');
    btn.id = 'btnAtualizarEmbMat';
    btn.className = 'btn secondary small';
    btn.textContent = 'Atualizar';
    btn.style.cssText = 'padding: 6px 16px;';
    btn.addEventListener('click', () => {
      if (psAtualId) atualizarTabela(psAtualId);
    });
    
    container.appendChild(btn);
    const tabelaParent = elementos.tabela.parentElement;
    tabelaParent.insertBefore(container, elementos.tabela);
    elementos.btnAtualizar = btn;
  }

  function configurarModal() {
    if (elementos.closeModal) {
      elementos.closeModal.addEventListener('click', fecharModal);
    }
    if (elementos.btnFechar) {
      elementos.btnFechar.addEventListener('click', fecharModal);
    }
    window.addEventListener('click', (e) => {
      if (e.target === elementos.modal) fecharModal();
    });
  }

  function fecharModal() {
    if (elementos.modal) {
      elementos.modal.style.display = 'none';
    }
  }

  //============SINCRONIZAR MATERIAIS==========
  async function sincronizarMateriais(psId) {
    if (!psId) return;
    
    // NOVO: Verificar se já há sincronização em andamento
    if (sincronizandoEmAndamento) {
      console.log('[EMB-MAT-PS] Sincronização já em andamento, aguardando...');
      return;
    }
    
    sincronizandoEmAndamento = true;
    
    try {
      const response = await fetch(`/api/ps/${psId}/sincronizar-materiais-embarque/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      const result = await response.json();
      console.log('[EMB-MAT-PS] Sincronização concluída:', result.message);
      
    } catch (error) {
      console.error('[EMB-MAT-PS] Erro na sincronização:', error);
    } finally {
      sincronizandoEmAndamento = false;
    }
  }

  //============CARREGAR DADOS==========
  async function carregarDados(psId) {
    if (!psId) return;
    psAtualId = psId;
    
    try {
      await sincronizarMateriais(psId);
      // NOVO: Aguardar um pouco antes de atualizar a tabela para garantir que a sincronização terminou
      await new Promise(resolve => setTimeout(resolve, 300));
      await atualizarTabela(psId);
    } catch (error) {
      console.error('[EMB-MAT-PS] Erro ao carregar dados:', error);
    }
  }

  //============ATUALIZAR TABELA==========
  async function atualizarTabela(psId) {
    if (!elementos.tabela) return;
    
    try {
      const response = await fetch(`/api/ps/${psId}/materiais-embarque/`);
      const result = await response.json();
      
      if (!result.success) return;
      
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '';
      
      if (result.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
        return;
      }
      
      result.data.forEach(mat => {
        const tr = document.createElement('tr');
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
          <td style="border:1px solid #ddd; padding:8px;">${btnDetalhes}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('[EMB-MAT-PS] Erro ao atualizar tabela:', error);
    }
  }

  //============SALVAR==========
  async function salvar() {
    if (!psAtualId) return;
    
    try {
      await sincronizarMateriais(psAtualId);
      // NOVO: Aguardar antes de atualizar a tabela
      await new Promise(resolve => setTimeout(resolve, 300));
      await atualizarTabela(psAtualId);
    } catch (error) {
      throw error;
    }
  }

  //============LIMPAR==========
  function limpar() {
    psAtualId = null;
    sincronizandoEmAndamento = false; // NOVO: Resetar flag
    if (elementos.tabela) {
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado para embarque</td></tr>';
    }
  }

  //============ABRIR MODAL==========
  async function abrirModal(materialId) {
    if (!materialId) {
      alert('ID do material não disponível');
      return;
    }
    
    try {
      const response = await fetch(`/api/materiais-embarque/${materialId}/`);
      const result = await response.json();
      
      if (!result.success) {
        alert('Erro ao carregar material');
        return;
      }
      
      const mat = result.data;
      
      document.getElementById('det_barco').value = `${mat.tipoBarco} ${mat.barcoMatEmb}`;
      document.getElementById('det_desc').value = mat.descMatEmb || '';
      document.getElementById('det_ident').value = mat.identMatEmb || '';
      document.getElementById('det_peso').value = mat.pesoMatEmb || '';
      document.getElementById('det_altura').value = mat.alturaMatEmb || '';
      document.getElementById('det_largura').value = mat.larguraMatEmb || '';
      document.getElementById('det_compr').value = mat.comprimentoMatEmb || '';
      
      const resp = mat.respEmbMat === 'OUTRO' ? mat.outRespEmbMat || '' : mat.respEmbMat || '';
      document.getElementById('det_resp').value = resp;
      
      document.getElementById('det_cont_bordo').value = mat.contBordoEmbMat || '';
      document.getElementById('det_desc_cont').value = mat.descContMatEmb || '';
      document.getElementById('det_id_cont').value = mat.idContMatEmb || '';
      document.getElementById('det_resp_cont').value = mat.respContMatEmb || '';
      document.getElementById('det_status').value = mat.statusProgMatEmb || '';
      document.getElementById('det_obs').value = mat.obsMatEmb || '';
      
      // Preencher campos de embarque
      if (mat.embarques && mat.embarques.length > 0) {
        const emb = mat.embarques[0];
        document.getElementById('det_data_prev').value = emb.dataPrevEmbMat || '';
        document.getElementById('det_rt').value = emb.numRtMatEmb || '';
        document.getElementById('det_os').value = emb.osEmbMat || '';
        document.getElementById('det_meio_rec').value = emb.meioRecEmbMat || '';
      }
      
      if (mat.contBordoEmbMat === 'SIM') {
        document.getElementById('det_campos_contentor').style.display = 'block';
        document.getElementById('det_cert_cont').value = mat.certContMatEmb || '';
        document.getElementById('det_val_cont').value = mat.valContMatEmb || '';
      } else {
        document.getElementById('det_campos_contentor').style.display = 'none';
      }
      
      elementos.modal.style.display = 'flex';
      
    } catch (error) {
      alert('Erro ao carregar detalhes do material');
    }
  }

  // API Pública
  return {
    init,
    carregarDados,
    salvar,
    limpar,
    abrirModal
  };
})();

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EmbMatPsModule.init);
} else {
  EmbMatPsModule.init();
}