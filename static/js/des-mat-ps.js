// static/js/des-mat-ps.js
// Módulo para Desembarque de Materiais na Passagem de Serviço

const DesMatPsModule = (() => {
  'use strict';

  let psAtualId = null;
  let sincronizandoEmAndamento = false;

  const elementos = {
    tabela: document.getElementById('tblDesMatPs'),
    btnAtualizar: null,
    modal: document.getElementById('modalDetalhesMaterial'),
    closeModal: document.getElementById('closeDetalhesMaterial'),
    btnFechar: document.getElementById('btnFecharDetalhes')
  };

  //============INICIALIZAR==========
  function init() {
    criarBotaoAtualizar();
    configurarModal();
  }

  //============CRIAR BOTÃO ATUALIZAR==========
  function criarBotaoAtualizar() {
    const accordion = document.getElementById('acc-desmateriais');
    if (!accordion || document.getElementById('btnAtualizarDesMat')) return;

    const container = document.createElement('div');
    container.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: flex-end;';

    const btn = document.createElement('button');
    btn.id = 'btnAtualizarDesMat';
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

  //============CONFIGURAR MODAL==========
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

  //============FECHAR MODAL==========
  function fecharModal() {
    if (elementos.modal) {
      elementos.modal.style.display = 'none';
    }
  }

  //============SINCRONIZAR MATERIAIS==========
  async function sincronizarMateriais(psId) {
    if (!psId) return;

    if (sincronizandoEmAndamento) {

      return;
    }

    sincronizandoEmAndamento = true;

    try {
      const response = await fetch(`/api/ps/${psId}/sincronizar-materiais-desembarque/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();


    } catch (error) {

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
      await new Promise(resolve => setTimeout(resolve, 300));
      await atualizarTabela(psId);
    } catch (error) {

    }
  }

  //============ATUALIZAR TABELA==========
  async function atualizarTabela(psId) {
    if (!elementos.tabela) return;

    try {
      const response = await fetch(`/api/ps/${psId}/materiais-desembarque/`);
      const result = await response.json();

      if (!result.success) return;

      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '';

      if (result.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Nenhum material solicitado para desembarque</td></tr>';
        return;
      }

      result.data.forEach(mat => {
        const tr = document.createElement('tr');
        const materialId = mat.materialId;
        const btnDetalhes = materialId
          ? `<button class="btn secondary small" onclick="DesMatPsModule.abrirModal(${materialId})">Exibir Detalhes</button>`
          : '<span style="color:#999;">-</span>';

        tr.innerHTML = `
          <td style="border:1px solid #ddd; padding:8px;">${mat.descMatDesembPs}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.respMatDesembPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.descContMatDesembPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.statusProgMatEmbPs || '-'}</td>
          <td style="border:1px solid #ddd; padding:8px;">${btnDetalhes}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (error) {

    }
  }

  //============SALVAR==========
  async function salvar() {
    if (!psAtualId) return;

    try {
      await sincronizarMateriais(psAtualId);
      await new Promise(resolve => setTimeout(resolve, 300));
      await atualizarTabela(psAtualId);
    } catch (error) {
      throw error;
    }
  }

  //============LIMPAR==========
  function limpar() {
    psAtualId = null;
    sincronizandoEmAndamento = false;
    if (elementos.tabela) {
      const tbody = elementos.tabela.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Nenhum material solicitado para desembarque</td></tr>';
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

      // Preencher campos básicos
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
      document.getElementById('det_status').value = mat.statusProgMatEmb || '';
      document.getElementById('det_obs').value = mat.obsMatEmb || '';

      // 
      document.getElementById('det_data_prev').value = mat.dataPrevEmbMat || '';
      document.getElementById('det_rt').value = mat.numRtMatEmb || '';
      document.getElementById('det_os').value = mat.osEmbMat || '';
      document.getElementById('det_meio_rec').value = mat.meioRecEmbMat || '';

      // Preencher campos de contentor (se aplicável)
      if (mat.contBordoEmbMat === 'SIM') {
        document.getElementById('det_campos_contentor').style.display = 'block';
        document.getElementById('det_desc_cont').value = mat.descContMatEmb || '';
        document.getElementById('det_id_cont').value = mat.idContMatEmb || '';
        document.getElementById('det_resp_cont').value = mat.respContMatEmb || '';
        document.getElementById('det_cert_cont').value = mat.certContMatEmb || '';
        document.getElementById('det_val_cont').value = mat.valContMatEmb || '';
      } else {
        document.getElementById('det_campos_contentor').style.display = 'none';
      }

      // Exibir modal
      elementos.modal.style.display = 'flex';

    } catch (error) {
      alert('Erro ao carregar detalhes do material: ' + error.message);
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
  document.addEventListener('DOMContentLoaded', DesMatPsModule.init);
} else {
  DesMatPsModule.init();
}