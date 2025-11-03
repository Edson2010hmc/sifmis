// static/js/invmat.js
// Módulo Inventário de Materiais

(function() {
  'use strict';

  const API_BASE = '/api/materiais-embarque/';
  let modoEdicao = false;
  let materialEditandoId = null;
  let modoSomenteLeitura = false;
  let emailsId = null;

  // ===== ELEMENTOS DOM =====
  const elementos = {
    // Filtros
    filtroBarcoProgEmb: document.getElementById('filtro_barco_prog'),
    filtroBarcoBordo: document.getElementById('filtro_barco_bordo'),
    
    // Botões principais
    btnAddProgEmbarque: document.getElementById('btnAddProgEmbarque'),
    
    // Tabelas
    tblProgEmbarque: document.getElementById('tblProgEmbarque'),
    tblMatBordo: document.getElementById('tblMatBordo'),
    filtroBarcoDesembarque: document.getElementById('filtro_barco_desembarque'),
    btnSolicitarDesembarque: document.getElementById('btnSolicitarDesembarque'),
    tblMatDesembarque: document.getElementById('tblMatDesembarque'),
    
    // Modal
    modal: document.getElementById('modalProgEmbarque'),
    modalClose: document.querySelector('#modalProgEmbarque .close'),
    modalTitle: document.getElementById('modalProgTitle'),
    
    // Campos do modal - Principal
    modalBarco: document.getElementById('modal_barco'),
    modalDesc: document.getElementById('modal_desc'),
    modalIdent: document.getElementById('modal_ident'),
    modalPeso: document.getElementById('modal_peso'),
    modalAltura: document.getElementById('modal_altura'),
    modalLargura: document.getElementById('modal_largura'),
    modalCompr: document.getElementById('modal_compr'),
    modalResp: document.getElementById('modal_resp'),
    modalOutroResp: document.getElementById('modal_outro_resp'),
    modalOutroRespContainer: document.getElementById('modal_outro_resp_container'),
    
    // Campos do modal - Contentor
    modalContBordo: document.getElementById('modal_cont_bordo'),
    modalCamposContentor: document.getElementById('modal_campos_contentor'),
    modalDescCont: document.getElementById('modal_desc_cont'),
    modalIdCont: document.getElementById('modal_id_cont'),
    modalRespCont: document.getElementById('modal_resp_cont'),
    modalCertCont: document.getElementById('modal_cert_cont'),
    modalValCont: document.getElementById('modal_val_cont'),
    
    // Campos do modal - Embarque
    modalDataPrev: document.getElementById('modal_data_prev'),
    modalRt: document.getElementById('modal_rt'),
    modalNf: document.getElementById('modal_nf'),
    modalOs: document.getElementById('modal_os'),
    modalMeioRec: document.getElementById('modal_meio_rec'),
    labelRtObrig: document.getElementById('label_rt_obrig'),
    labelOsObrig: document.getElementById('label_os_obrig'),
    
    // Campos condicionais meio recebimento
    modalCampoUep: document.getElementById('modal_campo_uep'),
    modalUep: document.getElementById('modal_uep'),
    modalCampoBarco: document.getElementById('modal_campo_barco'),
    modalMisFlag: document.getElementById('modal_mis_flag'),
    modalMisBarco: document.getElementById('modal_mis_barco'),
    modalMisBarcoContainer: document.getElementById('modal_mis_barco_container'),
    modalBarcoNaoMis: document.getElementById('modal_barco_nao_mis'),
    modalBarcoNaoMisContainer: document.getElementById('modal_barco_nao_mis_container'),
    
    // Outros campos
    modalObs: document.getElementById('modal_obs'),
    modalStatus: document.getElementById('modal_status'),
    
    // Botões do modal
    btnModalSalvar: document.getElementById('btnModalSalvar'),
    btnModalCancelar: document.getElementById('btnModalCancelar'),
    btnModalExcluir: document.getElementById('btnModalExcluir'),
    modalEmails: document.getElementById('modalEmailsEquipes'),
    closeEmailsModal: document.getElementById('closeEmailsModal'),
    btnEmailsEquipes: document.getElementById('btnEmailsEquipes'),
    emailInputCrd: document.getElementById('email_input_crd'),
    emailInputMis: document.getElementById('email_input_mis'),
    emailInputCc: document.getElementById('email_input_cc'),
    emailsCrd: document.getElementById('emails_crd'),
    emailsMis: document.getElementById('emails_mis'),
    emailsCc: document.getElementById('emails_cc'),
    btnIncluirCrd: document.getElementById('btnIncluirCrd'),
    btnIncluirMis: document.getElementById('btnIncluirMis'),
    btnIncluirCc: document.getElementById('btnIncluirCc'),
    btnLimparCrd: document.getElementById('btnLimparCrd'),
    btnLimparMis: document.getElementById('btnLimparMis'),
    btnLimparCc: document.getElementById('btnLimparCc'),
    btnSalvarEmails: document.getElementById('btnSalvarEmails'),
    btnCancelarEmails: document.getElementById('btnCancelarEmails')
  };

  // ===== INICIALIZAÇÃO =====
  async function init() {
    if (typeof AuthModule !== 'undefined' && AuthModule.validarUsuario) {
      const autorizado = await AuthModule.validarUsuario();
      if (!autorizado) return;
    }

    configurarAccordion();
    configurarEventos();
    await carregarEmbarcacoes();
    await carregarTabelas();
  }

  // ===== CONFIGURAR ACCORDION =====
function configurarAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      const content = document.getElementById(`acc-${target}`);
      const toggle = this.querySelector('.toggle');
      
      if (content.classList.contains('active')) {
        content.classList.remove('active');
        toggle.textContent = '▼';
        header.closest('.accordion-item').style.width = '600px';
        return;
      }
      
      document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.accordion-header .toggle').forEach(t => t.textContent = '▼');
      document.querySelectorAll('.accordion-item').forEach(item => item.style.width = '600px');
      
      content.classList.add('active');
      toggle.textContent = '▲';
      header.closest('.accordion-item').style.width = '100%';
    });
  });
}

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    
    const btnNav = document.getElementById('btnAddMaterialNav');
    if (btnNav) btnNav.addEventListener('click', abrirModalNovo);
    elementos.modalClose.addEventListener('click', fecharModal);
    elementos.btnModalSalvar.addEventListener('click', salvarMaterial);
    elementos.btnModalCancelar.addEventListener('click', fecharModal);
    elementos.btnModalExcluir.addEventListener('click', excluirMaterial);
    
    elementos.filtroBarcoProgEmb.addEventListener('change', () => carregarTabelas());
    elementos.filtroBarcoBordo.addEventListener('change', () => carregarTabelas());
    
    elementos.modalResp.addEventListener('change', toggleOutroResponsavel);
    elementos.modalContBordo.addEventListener('change', toggleCamposContentor);
    elementos.modalMeioRec.addEventListener('change', toggleCamposMeioRecebimento);
    elementos.modalMisFlag.addEventListener('change', toggleBarcoMis);
    
    window.addEventListener('click', (e) => {
      if (e.target === elementos.modal) fecharModal();
    });


    const btnEmail = document.getElementById('btnEmailsEquipes');
    if (btnEmail) btnEmail.addEventListener('click', abrirModalEmails);
    elementos.closeEmailsModal.addEventListener('click', fecharModalEmails);
    elementos.btnCancelarEmails.addEventListener('click', fecharModalEmails);
    elementos.btnSalvarEmails.addEventListener('click', salvarEmails);
    elementos.btnIncluirCrd.addEventListener('click', () => incluirEmail('crd'));
    elementos.btnIncluirMis.addEventListener('click', () => incluirEmail('mis'));
    elementos.btnIncluirCc.addEventListener('click', () => incluirEmail('cc'));
    elementos.btnLimparCrd.addEventListener('click', () => limparCampoEmail('crd'));
    elementos.btnLimparMis.addEventListener('click', () => limparCampoEmail('mis'));
    elementos.btnLimparCc.addEventListener('click', () => limparCampoEmail('cc'));

    window.addEventListener('click', (e) => {
      if (e.target === elementos.modalEmails) fecharModalEmails();
    });
    // Eventos Desembarque
      if (elementos.filtroBarcoDesembarque) {
      elementos.filtroBarcoDesembarque.addEventListener('change', carregarTabelaMatDesembarque);
    }
      if (elementos.btnSolicitarDesembarque) {
      elementos.btnSolicitarDesembarque.addEventListener('click', solicitarDesembarqueTodos);
    }

  }

  // ===== CARREGAR EMBARCAÇÕES =====
  async function carregarEmbarcacoes() {
    try {
      const response = await fetch('/api/barcos/');
      const result = await response.json();
      
      if (result.success) {
        const barcos = result.data;
        
        [elementos.filtroBarcoProgEmb, elementos.filtroBarcoBordo, elementos.modalBarco, elementos.modalMisBarco].forEach(select => {
          if (select.id.includes('filtro')) {
            select.innerHTML = '<option value="">— todas as embarcações —</option>';
          } else {
            select.innerHTML = '<option value="">— selecione —</option>';
          }
          
          barcos.forEach(barco => {
            const option = document.createElement('option');
            option.value = barco.id;
            option.textContent = `${barco.tipoBarco} ${barco.nomeBarco}`;
            select.appendChild(option);
          });
        });

        if (elementos.filtroBarcoDesembarque) {
          elementos.filtroBarcoDesembarque.innerHTML = '<option value="">— selecione —</option>';
          barcos.forEach(barco => {
            const option = document.createElement('option');
            option.value = barco.id;
            option.textContent = `${barco.tipoBarco} ${barco.nomeBarco}`;
            elementos.filtroBarcoDesembarque.appendChild(option);
          });
        }
      }



    } catch (error) {
      alert('Erro ao carregar embarcações');
    }
  }

  // ===== CARREGAR TABELAS =====
  async function carregarTabelas() {
    await carregarTabelaProgEmbarque();
    await carregarTabelaMatBordo();
    await carregarTabelaMatDesembarque();
  }

  async function carregarTabelaProgEmbarque() {
    try {
      const barcoId = elementos.filtroBarcoProgEmb.value;
      const url = barcoId ? `${API_BASE}?status=EMBARQUE PROGRAMADO&barco_id=${barcoId}` : `${API_BASE}?status=EMBARQUE PROGRAMADO`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      const tbody = elementos.tblProgEmbarque.querySelector('tbody');
      tbody.innerHTML = '';
      
      if (result.success && result.data.length > 0) {
        result.data.forEach(mat => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="border:1px solid #ddd; padding:8px;">${mat.tipoBarco} ${mat.barcoMatEmb}</td>
            <td style="border:1px solid #ddd; padding:8px;">${formatarData(mat.dataPrevEmb)}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.numRtEmb || '-'}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.descMatEmb}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.osEmb || '-'}</td>
            <td style="border:1px solid #ddd; padding:8px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <button class="btn secondary small" onclick="InvMatModule.editarMaterial(${mat.id})">Editar dados material</button>
                <button class="btn small" onclick="InvMatModule.confirmarEmbarque(${mat.id})">Confirmar Embarque</button>
                <button class="btn ghost small" onclick="InvMatModule.embarqueNaoConcluido(${mat.id})">Material não embarcado</button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material programado</td></tr>';
      }
    } catch (error) {
      alert('Erro ao carregar programação de embarque');
    }
  }

  async function carregarTabelaMatBordo() {
    try {
      const barcoId = elementos.filtroBarcoBordo.value;
      const url = barcoId ? `${API_BASE}?status=MATERIAL A BORDO&barco_id=${barcoId}` : `${API_BASE}?status=MATERIAL A BORDO`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      const tbody = elementos.tblMatBordo.querySelector('tbody');
      tbody.innerHTML = '';
      
      if (result.success && result.data.length > 0) {
        result.data.forEach(mat => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="border:1px solid #ddd; padding:8px;">${mat.tipoBarco} ${mat.barcoMatEmb}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.meioRecEmbMat || '-'}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.numRtEmb || '-'}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.osEmb || '-'}</td>
            <td style="border:1px solid #ddd; padding:8px;">${mat.descMatEmb}</td>
            <td style="border:1px solid #ddd; padding:8px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <button class="btn secondary small" onclick="InvMatModule.verDetalhes(${mat.id})">Exibir detalhes</button>
                <button class="btn small" onclick="InvMatModule.relacionarDesembarque(${mat.id})">Preparar desembarque</button>
                <button class="btn ghost small" onclick="InvMatModule.aplicarOperacao(${mat.id})">Aplicar à operação</button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#999;">Nenhum material a bordo</td></tr>';
      }
    } catch (error) {
      alert('Erro ao carregar materiais a bordo');
    }
  }

  // ===== CARREGAR TABELA MATERIAIS DESEMBARQUE =====
  async function carregarTabelaMatDesembarque() {
    if (!elementos.tblMatDesembarque) return;
    
    try {
      const barcoId = elementos.filtroBarcoDesembarque.value;
      
      const tbody = elementos.tblMatDesembarque.querySelector('tbody');
      
      if (!barcoId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Selecione uma embarcação</td></tr>';
        elementos.btnSolicitarDesembarque.style.display = 'none';
        return;
      }
      
      const response = await fetch(`/api/materiais-desembarque/?barco_id=${barcoId}`);
      const result = await response.json();
      
      if (!result.success) {
        alert('Erro ao carregar materiais: ' + result.error);
        return;
      }
      
      const materiais = result.data;
      
      if (materiais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Nenhum material relacionado para desembarque</td></tr>';
        elementos.btnSolicitarDesembarque.style.display = 'none';
        return;
      }
      
      elementos.btnSolicitarDesembarque.style.display = 'block';
      tbody.innerHTML = '';
      
      materiais.forEach(mat => {
        const tr = document.createElement('tr');
        const responsavel = mat.respEmbMat === 'OUTRO' ? mat.outRespEmbMat : mat.respEmbMat;
        
        tr.innerHTML = `
          <td style="border:1px solid #ddd; padding:8px;">${mat.tipoBarco} ${mat.barcoMatEmb}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.descMatEmb}</td>
          <td style="border:1px solid #ddd; padding:8px;">${mat.osEmb || ''}</td>
          <td style="border:1px solid #ddd; padding:8px;">${responsavel}</td>
          <td style="border:1px solid #ddd; padding:8px;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <button class="btn small" onclick="InvMatModule.removerSelecaoDesembarque(${mat.id})">Remover da Seleção para Desembarque</button>
              <button class="btn secondary small" onclick="InvMatModule.exibirDetalhesDesembarque(${mat.id})">Exibir Detalhes</button>
            </div>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
      
    } catch (error) {
      alert('Erro ao carregar materiais: ' + error.message);
    }
  }

  // ===== REMOVER DA SELEÇÃO PARA DESEMBARQUE =====
  async function removerSelecaoDesembarque(id) {
    if (!confirm('Remover este material da seleção para desembarque?')) return;
    
    try {
      const response = await fetch(`${API_BASE}${id}/status/`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'MATERIAL A BORDO'})
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert('Erro: ' + result.error);
        return;
      }
      
      alert('Material removido da seleção para desembarque');
      await carregarTabelas();
      
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  // ===== EXIBIR DETALHES DO MATERIAL =====
  async function exibirDetalhesDesembarque(id) {
    try {
      const response = await fetch(`${API_BASE}${id}/`);
      const result = await response.json();
      
      if (!result.success) {
        alert('Erro: ' + result.error);
        return;
      }
      
      const mat = result.data;
      modoSomenteLeitura = true;
      
      elementos.modalTitle.textContent = 'DETALHES DO MATERIAL';
      preencherModal(mat);
      elementos.modal.style.display = 'flex';
      
      // Desabilitar todos os campos
      Object.keys(elementos).forEach(key => {
        if (key.startsWith('modal') && elementos[key].tagName) {
          elementos[key].disabled = true;
        }
      });
      
      elementos.btnModalSalvar.style.display = 'none';
      elementos.btnModalExcluir.style.display = 'none';
      elementos.btnModalCancelar.textContent = 'Fechar';
      
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  // ===== SOLICITAR DESEMBARQUE INDIVIDUAL =====
  async function solicitarDesembarqueIndividual(id) {
    const barcoId = elementos.filtroBarcoDesembarque.value;
    await processarSolicitacaoDesembarque(barcoId, [id]);
  }

  // ===== SOLICITAR DESEMBARQUE TODOS =====
  async function solicitarDesembarqueTodos() {
    if (!confirm('Confirma a solicitação de DESEMBARQUE de todos os materiais relacionados?')) return;
    
    const barcoId = elementos.filtroBarcoDesembarque.value;
    await processarSolicitacaoDesembarque(barcoId, null);
  }

// ===== PROCESSAR SOLICITAÇÃO DE DESEMBARQUE =====
  async function processarSolicitacaoDesembarque(barcoId) {
    try {
      // Buscar fiscal logado
      const fiscalNome = sessionStorage.getItem('usuarioLogado');
      
      if (!fiscalNome) {
        alert('Fiscal não identificado');
        return;
      }
      
      // Verificar PS rascunho
      const responsePS = await fetch('/api/verificar-ps-rascunho-material/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({barcoId})
      });
      
      const resultPS = await responsePS.json();
      
      if (!resultPS.success) {
        alert('Erro ao verificar PS: ' + resultPS.error);
        return;
      }
      
      if (!resultPS.existeRascunho || !resultPS.dadosCompletos) {
        alert('Não existe PS em rascunho com dados de porto completos. Complete esses dados antes de solicitar o desembarque.');
        return;
      }
      
      const psData = resultPS.psData;
      
      // Buscar nome do barco
      const respBarco = await fetch(`/api/barcos/`);
      const resBarco = await respBarco.json();
      const barco = resBarco.data.find(b => b.id == barcoId);
      const barcoNome = barco ? `${barco.tipoBarco} ${barco.nomeBarco}` : 'a embarcação';
      
      // Formatar data
      const dataFormatada = psData.dataEmissao.split('-').reverse().join('/');
      
      if (!confirm(`Confirma a solicitação de Desembarque dos materiais relacionados para entrada de porto do ${barcoNome} no dia ${dataFormatada}?`)) {
        return;
      }
      
      // Buscar materiais
      const responseMat = await fetch(`/api/materiais-desembarque/?barco_id=${barcoId}`);
      const resultMat = await responseMat.json();
      
      if (!resultMat.success || resultMat.data.length === 0) {
        alert('Nenhum material encontrado');
        return;
      }
      
      const materiais = resultMat.data;
      
      // SEPARAR MATERIAIS POR TIPO
      const materiaisCrd = materiais.filter(m => m.respEmbMat === 'CRD');
      const materiaisNaoCrd = materiais.filter(m => m.respEmbMat !== 'CRD');
      
      // COLETAR DADOS DO MODAL SE NECESSÁRIO (antes de enviar emails)
      let dadosModal = {};
      
      if (materiaisNaoCrd.length > 0) {
        const comContentor = materiaisNaoCrd.filter(m => m.contBordoEmbMat === 'SIM');
        const semContentor = materiaisNaoCrd.filter(m => m.contBordoEmbMat !== 'SIM');
        
        if (semContentor.length > 0 && comContentor.length === 0) {
          // MODELO 002 - Precisa modal
          dadosModal = await abrirModalContentoresPromise('002', barcoId, fiscalNome, psData);
          if (!dadosModal) return; // Usuário cancelou
          
        } else if (semContentor.length > 0 && comContentor.length > 0) {
          // MODELO 003 - Perguntar se pode agrupar
          const resposta = confirm('Os materiais sem contentor associado podem ser acondicionados juntamente com os materiais que já estão em contentores?');
          
          if (!resposta) {
            // MODELO 003 - Precisa modal
            dadosModal = await abrirModalContentoresPromise('003', barcoId, fiscalNome, psData);
            if (!dadosModal) return; // Usuário cancelou
          }
        }
      }
      
      // AGORA ENVIAR OS E-MAILS EM SEQUÊNCIA
      
      // 1) PROCESSAR CRD (se existir)
      if (materiaisCrd.length > 0) {
        await enviarSolicitacao('004', barcoId, fiscalNome, psData, {}, 'CRD');
      }
      
      // 2) PROCESSAR NÃO CRD (se existir)
      if (materiaisNaoCrd.length > 0) {
        const comContentor = materiaisNaoCrd.filter(m => m.contBordoEmbMat === 'SIM');
        const semContentor = materiaisNaoCrd.filter(m => m.contBordoEmbMat !== 'SIM');
        
        let modelo = '001'; // Default: todos com contentor
        
        if (semContentor.length > 0 && comContentor.length === 0) {
          modelo = '002';
        } else if (semContentor.length > 0 && comContentor.length > 0) {
          const resposta = confirm('Os materiais sem contentor associado podem ser acondicionados juntamente com os materiais que já estão em contentores?');
          modelo = resposta ? '001' : '003';
        }
        
        await enviarSolicitacao(modelo, barcoId, fiscalNome, psData, dadosModal, 'NAO_CRD');
      }
      
      alert('Processo concluído! E-mails enviados com sucesso.');
      await carregarTabelas();
      
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  }

  // ===== ABRIR MODAL CONTENTORES COM PROMISE =====
  function abrirModalContentoresPromise(modelo, barcoId, fiscalNome, psData) {
    return new Promise((resolve, reject) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:2000;';
      
      modal.innerHTML = `
        <div class="modal-content" style="background:#fff; border-radius:10px; padding:30px; max-width:600px; width:90%;">
          <h2 style="color:#0b7a66; margin-bottom:20px;">Contentores para desembarque</h2>
          
          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:5px;">Quantidade de Contentores <span style="color:red;">*</span></label>
            <input type="text" id="qtdeContentores" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
          </div>
          
          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:5px;">Descrição dos Contentores <span style="color:red;">*</span></label>
            <textarea id="descContentores" rows="3" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; resize:vertical;"></textarea>
          </div>
          
          <p style="color:#666; font-size:14px; margin-bottom:20px;">Indique a quantidade e descreva o contentor necessário com as respectivas dimensões para acondicionamento dos materiais</p>
          
          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="btnCancelarCont" class="btn secondary">Cancelar</button>
            <button id="btnSalvarCont" class="btn">Confirmar</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('btnCancelarCont').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null); // Retorna null quando cancela
      });
      
      document.getElementById('btnSalvarCont').addEventListener('click', () => {
        const qtde = document.getElementById('qtdeContentores').value.trim();
        const desc = document.getElementById('descContentores').value.trim();
        
        if (!qtde || !desc) {
          alert('Preencha todos os campos obrigatórios');
          return;
        }
        
        document.body.removeChild(modal);
        resolve({
          qtdeContentores: qtde,
          descContentores: desc
        });
      });
    });
  }

  // ===== ENVIAR SOLICITAÇÃO =====
  async function enviarSolicitacao(modelo, barcoId, fiscalNome, psData, dadosModal, tipoMaterial) {
    try {
      const response = await fetch('/api/solicitar-desembarque/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          barcoId,
          fiscalNome,
          psData,
          modelo,
          dadosModal,
          tipoMaterial
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log(`E-mail ${tipoMaterial} enviado com sucesso (Modelo ${modelo})`);
      
    } catch (error) {
      alert('Erro ao enviar solicitação ' + tipoMaterial + ': ' + error.message);
      throw error;
    }
  }

   // ===== MODAL - ABRIR/FECHAR =====
  function abrirModalNovo() {
    limparModal();
    modoEdicao = false;
    modoSomenteLeitura = false;
    materialEditandoId = null;
    elementos.modalTitle.textContent = 'EMBARQUE DE MATERIAIS';
    elementos.btnModalExcluir.style.display = 'none';
    elementos.modal.style.display = 'flex';
    desabilitarCampos(false);
  }

  async function editarMaterial(id) {
    try {
      const response = await fetch(`${API_BASE}${id}/`);
      const result = await response.json();
      
      if (result.success) {
        const mat = result.data;
        modoEdicao = true;
        modoSomenteLeitura = false;
        materialEditandoId = id;
        
        preencherModal(mat);
        
        elementos.modalTitle.textContent = 'EDITAR MATERIAL';
        elementos.btnModalExcluir.style.display = 'inline-block';
        elementos.modal.style.display = 'flex';
        desabilitarCampos(false);
      }
    } catch (error) {
      alert('Erro ao carregar material');
    }
  }

  async function verDetalhes(id) {
    try {
      const response = await fetch(`${API_BASE}${id}/`);
      const result = await response.json();
      
      if (result.success) {
        const mat = result.data;
        modoEdicao = false;
        modoSomenteLeitura = true;
        materialEditandoId = id;
        
        preencherModal(mat);
        
        elementos.modalTitle.textContent = 'EXIBIR DETALHES DE MATERIAL';
        elementos.btnModalExcluir.style.display = 'none';
        elementos.modal.style.display = 'flex';
        desabilitarCampos(true);
      }
    } catch (error) {
      alert('Erro ao carregar detalhes');
    }
  }

  function fecharModal() {
    elementos.modal.style.display = 'none';
    limparModal();
  }

  function limparModal() {
    Object.keys(elementos).forEach(key => {
      if (key.startsWith('modal') && elementos[key].tagName) {
        if (elementos[key].type === 'checkbox') {
          elementos[key].checked = key === 'modalMisFlag';
        } else if (elementos[key].tagName === 'SELECT') {
          elementos[key].value = '';
        } else if (elementos[key].tagName === 'INPUT' || elementos[key].tagName === 'TEXTAREA') {
          elementos[key].value = '';
        }
      }
    });
    
    elementos.modalCamposContentor.style.display = 'none';
    elementos.modalOutroRespContainer.style.display = 'none';
    elementos.modalCampoUep.style.display = 'none';
    elementos.modalCampoBarco.style.display = 'none';
    elementos.labelRtObrig.style.display = 'none';
    elementos.labelOsObrig.style.display = 'none';
  }

  function preencherModal(mat) {
    elementos.modalBarco.value = mat.barcoMatEmbId;
    elementos.modalDesc.value = mat.descMatEmb;
    elementos.modalIdent.value = mat.identMatEmb;
    elementos.modalPeso.value = mat.pesoMatEmb || '';
    elementos.modalAltura.value = mat.alturaMatEmb;
    elementos.modalLargura.value = mat.larguraMatEmb;
    elementos.modalCompr.value = mat.comprimentoMatEmb;
    elementos.modalResp.value = mat.respEmbMat;
    elementos.modalOutroResp.value = mat.outRespEmbMat;
    elementos.modalContBordo.value = mat.contBordoEmbMat;
    elementos.modalDescCont.value = mat.descContMatEmb;
    elementos.modalIdCont.value = mat.idContMatEmb;
    elementos.modalRespCont.value = mat.respContMatEmb;
    elementos.modalCertCont.value = mat.certContMatEmb;
    elementos.modalValCont.value = mat.valContMatEmb;
    elementos.modalObs.value = mat.obsMatEmb;
    elementos.modalStatus.value = mat.statusProgMatEmb;
    
    if (mat.embarques && mat.embarques.length > 0) {
      const emb = mat.embarques[0];
      elementos.modalDataPrev.value = emb.dataPrevEmbMat;
      elementos.modalRt.value = emb.numRtMatEmb;
      elementos.modalNf.value = emb.numNotaFiscMatEmb;
      elementos.modalOs.value = emb.osEmbMat;
      elementos.modalMeioRec.value = emb.meioRecEmbMat;
      elementos.modalUep.value = emb.uepRecMatEmb;
      elementos.modalMisFlag.checked = emb.misBarcoFlag;
      elementos.modalMisBarco.value = emb.misBarcoRecMatEmb;
      elementos.modalBarcoNaoMis.value = emb.barcoRecMatEmb;
    }
    
    toggleOutroResponsavel();
    toggleCamposContentor();
    toggleCamposMeioRecebimento();
    toggleBarcoMis();
  }

  function desabilitarCampos(desabilitar) {
    Object.keys(elementos).forEach(key => {
      if (key.startsWith('modal') && elementos[key].tagName && !key.includes('Container')) {
        if (elementos[key].tagName === 'INPUT' || elementos[key].tagName === 'SELECT' || elementos[key].tagName === 'TEXTAREA') {
          elementos[key].disabled = desabilitar;
        }
      }
    });
    
    elementos.btnModalSalvar.style.display = desabilitar ? 'none' : 'inline-block';
  }

  // ===== CAMPOS CONDICIONAIS =====
  function toggleOutroResponsavel() {
    const mostrar = elementos.modalResp.value === 'OUTRO';
    elementos.modalOutroRespContainer.style.display = mostrar ? 'block' : 'none';
  }

  function toggleCamposContentor() {
    const mostrar = elementos.modalContBordo.value === 'SIM';
    elementos.modalCamposContentor.style.display = mostrar ? 'block' : 'none';
  }

  function toggleCamposMeioRecebimento() {
    const meio = elementos.modalMeioRec.value;
    
    elementos.modalCampoUep.style.display = 'none';
    elementos.modalCampoBarco.style.display = 'none';
    elementos.labelRtObrig.style.display = 'none';
    elementos.labelOsObrig.style.display = 'none';
    
    if (meio === 'TRANSBORDO UEP') {
      elementos.modalCampoUep.style.display = 'block';
    } else if (meio === 'TRANSBORDO BARCO') {
      elementos.modalCampoBarco.style.display = 'block';
    } else if (meio === 'PORTO' || meio === 'RETIRADO DE OS') {
      elementos.labelRtObrig.style.display = 'inline';
      elementos.labelOsObrig.style.display = 'inline';
    }
  }

  function toggleBarcoMis() {
    const isMis = elementos.modalMisFlag.checked;
    elementos.modalMisBarcoContainer.style.display = isMis ? 'block' : 'none';
    elementos.modalBarcoNaoMisContainer.style.display = isMis ? 'none' : 'block';
  }

  // ===== SALVAR MATERIAL =====
  async function salvarMaterial() {
    if (!validarCampos()) return;
    
    const meio = elementos.modalMeioRec.value;
    let status = '';
    
    if (meio === 'PORTO') {
      status = 'EMBARQUE PROGRAMADO';
    } else {
      status = 'MATERIAL A BORDO';
    }
    
    const dados = {
      barcoMatEmb: parseInt(elementos.modalBarco.value),
      descMatEmb: elementos.modalDesc.value,
      identMatEmb: elementos.modalIdent.value || null,
      pesoMatEmb: elementos.modalPeso.value ? parseInt(elementos.modalPeso.value) : null,
      alturaMatEmb: elementos.modalAltura.value || null,
      larguraMatEmb: elementos.modalLargura.value || null,
      comprimentoMatEmb: elementos.modalCompr.value || null,
      respEmbMat: elementos.modalResp.value || null,
      outRespEmbMat: elementos.modalOutroResp.value || null,
      contBordoEmbMat: elementos.modalContBordo.value,
      descContMatEmb: elementos.modalDescCont.value || null,
      idContMatEmb: elementos.modalIdCont.value || null,
      respContMatEmb: elementos.modalRespCont.value || null,
      certContMatEmb: elementos.modalCertCont.value || null,
      valContMatEmb: elementos.modalValCont.value || null,
      obsMatEmb: elementos.modalObs.value || null,
      statusProgMatEmb: status,
      dataPrevEmbMat: elementos.modalDataPrev.value,
      numRtMatEmb: elementos.modalRt.value || null,
      numNotaFiscMatEmb: elementos.modalNf.value || null,
      meioRecEmbMat: meio || null,
      uepRecMatEmb: elementos.modalUep.value || null,
      misBarcoFlag: elementos.modalMisFlag.checked,
      misBarcoRecMatEmb: elementos.modalMisBarco.value || null,
      barcoRecMatEmb: elementos.modalBarcoNaoMis.value || null,
      osEmbMat: elementos.modalOs.value || null
    };
    
    try {
      let response;
      if (modoEdicao) {
        response = await fetch(`${API_BASE}${materialEditandoId}/`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(dados)
        });
      } else {
        response = await fetch(API_BASE, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(dados)
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert(modoEdicao ? 'Material atualizado com sucesso!' : 'Material cadastrado com sucesso!');
        fecharModal();
        await carregarTabelas();
      } else {
        alert('Erro ao salvar: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao salvar material');
    }
  }

  function validarCampos() {
    if (!elementos.modalBarco.value) {
      alert('Selecione uma embarcação');
      return false;
    }
    
    if (!elementos.modalDesc.value.trim()) {
      alert('Informe a descrição do material');
      return false;
    }
    
    if (!elementos.modalContBordo.value) {
      alert('Selecione se o material ficará em contentor a bordo');
      return false;
    }
    
    if (elementos.modalContBordo.value === 'SIM') {
      if (!elementos.modalDescCont.value.trim()) {
        alert('Informe a descrição do contentor');
        return false;
      }
      if (!elementos.modalRespCont.value) {
        alert('Selecione o responsável pelo contentor');
        return false;
      }
      if (!elementos.modalValCont.value) {
        alert('Informe a validade do certificado do contentor');
        return false;
      }
    }
    
    if (!elementos.modalDataPrev.value) {
      alert('Informe a data prevista de embarque');
      return false;
    }
    
    const meio = elementos.modalMeioRec.value;
    if (meio === 'PORTO' || meio === 'RETIRADO DE OS') {
      if (!elementos.modalRt.value.trim()) {
        alert('Informe o número da RT (obrigatório para este meio de recebimento)');
        return false;
      }
      if (!elementos.modalOs.value.trim()) {
        alert('Informe a ordem de serviço (obrigatório para este meio de recebimento)');
        return false;
      }
    }
    
    return true;
  }

  // ===== EXCLUIR MATERIAL =====
  async function excluirMaterial() {
    if (!confirm('Deseja realmente excluir este material?')) return;
    
    try {
      const response = await fetch(`${API_BASE}${materialEditandoId}/`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Material excluído com sucesso!');
        fecharModal();
        await carregarTabelas();
      } else {
        alert('Erro ao excluir: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao excluir material');
    }
  }

  // ===== AÇÕES DE STATUS =====
  async function confirmarEmbarque(id) {
    if (!confirm('Confirmar embarque deste material?')) return;
    await atualizarStatus(id, 'MATERIAL A BORDO');
  }

  async function embarqueNaoConcluido(id) {
    if (!confirm('Marcar embarque como não concluído?')) return;
    await atualizarStatus(id, 'EMBARQUE NÃO CONCLUIDO');
  }

  async function relacionarDesembarque(id) {
    if (!confirm('Relacionar material para desembarque?')) return;
    await atualizarStatus(id, 'RELACIONADO PARA DESEMBARQUE');
  }

  async function aplicarOperacao(id) {
    if (!confirm('Marcar material como aplicado na operação?')) return;
    await atualizarStatus(id, 'APLICADO NA OPERAÇÃO');
  }

  async function atualizarStatus(id, novoStatus) {
    try {
      const response = await fetch(`${API_BASE}${id}/status/`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: novoStatus})
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Status atualizado com sucesso!');
        await carregarTabelas();
      } else {
        alert('Erro ao atualizar status: ' + result.error);
      }
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  }

  // ===== UTILITÁRIOS =====
  function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

// ===== MODAL E-MAILS =====

async function abrirModalEmails() {
  try {
    const response = await fetch('/api/emails-desembarque/');
    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      emailsId = data.id;
      elementos.emailsCrd.value = data.emailMatCrd;
      elementos.emailsMis.value = data.emailMatMis;
      elementos.emailsCc.value = data.emailsMatCc;
    }
    
    elementos.modalEmails.style.display = 'flex';
  } catch (error) {
    alert('Erro ao carregar e-mails');
  }
}

function fecharModalEmails() {
  elementos.modalEmails.style.display = 'none';
  elementos.emailInputCrd.value = '';
  elementos.emailInputMis.value = '';
  elementos.emailInputCc.value = '';
}

function incluirEmail(tipo) {
  let input, textarea;
  
  if (tipo === 'crd') {
    input = elementos.emailInputCrd;
    textarea = elementos.emailsCrd;
  } else if (tipo === 'mis') {
    input = elementos.emailInputMis;
    textarea = elementos.emailsMis;
  } else if (tipo === 'cc') {
    input = elementos.emailInputCc;
    textarea = elementos.emailsCc;
  }
  
  const email = input.value.trim();
  
  if (!email) {
    alert('Digite um e-mail');
    return;
  }
  
  if (!validarEmail(email)) {
    alert('E-mail inválido');
    return;
  }
  
  const emailsAtuais = textarea.value.trim();
  if (emailsAtuais) {
    textarea.value = emailsAtuais + ';' + email;
  } else {
    textarea.value = email;
  }
  
  input.value = '';
}

function limparCampoEmail(tipo) {
  if (tipo === 'crd') {
    elementos.emailsCrd.value = '';
  } else if (tipo === 'mis') {
    elementos.emailsMis.value = '';
  } else if (tipo === 'cc') {
    elementos.emailsCc.value = '';
  }
}

async function salvarEmails() {
  const dados = {
    id: emailsId,
    emailMatCrd: elementos.emailsCrd.value.trim(),
    emailMatMis: elementos.emailsMis.value.trim(),
    emailsMatCc: elementos.emailsCc.value.trim()
  };
  
  try {
    const method = emailsId ? 'PUT' : 'POST';
    const response = await fetch('/api/emails-desembarque/', {
      method: method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('E-mails salvos com sucesso!');
      fecharModalEmails();
    } else {
      alert('Erro ao salvar: ' + result.error);
    }
  } catch (error) {
    alert('Erro ao salvar e-mails');
  }
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ===== UTILITÁRIOS =====


  // ===== EXPORTAR MÓDULO =====
  window.InvMatModule = {
    editarMaterial,
    verDetalhes,
    confirmarEmbarque,
    embarqueNaoConcluido,
    relacionarDesembarque,
    aplicarOperacao,
    removerSelecaoDesembarque,
    exibirDetalhesDesembarque,
    solicitarDesembarqueIndividual
  };

  // ===== INICIAR =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();