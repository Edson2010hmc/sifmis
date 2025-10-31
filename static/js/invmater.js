// static/js/invmater.js
// Módulo para Inventário de Materiais - Contentores e Materiais a Bordo

const ContentoresModule = (() => {
  const API_URL = '/api/contentores/';
  let modoEdicao = false;
  let contentorEditandoId = null;

  // Referências aos elementos DOM
  const elementos = {
    desc: document.getElementById('inv_cont_desc'),
    ident: document.getElementById('inv_cont_ident'),
    data: document.getElementById('inv_cont_data'),
    req: document.getElementById('inv_cont_req'),
    resp: document.getElementById('inv_cont_resp'),
    outroResp: document.getElementById('inv_cont_outro_resp'),
    outroRespContainer: document.getElementById('inv_cont_outro_resp_container'),
    cert: document.getElementById('inv_cont_cert'),
    val: document.getElementById('inv_cont_val'),
    list: document.getElementById('inv_cont_list'),
    btnSave: document.getElementById('btnSaveCont'),
    btnEditar: document.getElementById('btnContEditar'),
    btnExcluir: document.getElementById('btnContExcluir'),
    btnConfirma: document.getElementById('btnContConfirma'),
    btnCancela: document.getElementById('btnContCancela'),
    editActions: document.getElementById('contEditActions')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
    carregarBarcos();
    carregarContentores();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.btnSave.addEventListener('click', salvar);
    elementos.btnEditar.addEventListener('click', habilitarEdicao);
    elementos.btnExcluir.addEventListener('click', excluir);
    elementos.btnConfirma.addEventListener('click', confirmarEdicao);
    elementos.btnCancela.addEventListener('click', cancelarEdicao);
    
    elementos.resp.addEventListener('change', function() {
      if (this.value === 'OUTROS') {
        elementos.outroRespContainer.style.display = 'block';
      } else {
        elementos.outroRespContainer.style.display = 'none';
        elementos.outroResp.value = '';
      }
    });
    
    elementos.list.addEventListener('change', function() {
      if (this.value) {
        carregarContentor(this.value);
        elementos.btnEditar.disabled = false;
        elementos.btnExcluir.disabled = false;
      } else {
        limpar();
      }
    });
  }

// =======CARREGAR BARCOS===============
  async function carregarBarcos() {
    try {
      const response = await fetch('/api/barcos/');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.barco.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(barco => {
        const option = document.createElement('option');
        option.value = barco.id;
        option.textContent = `${barco.tipoBarco} ${barco.nomeBarco}`;
        elementos.barco.appendChild(option);
      });
      
    } catch (error) {
      console.error('Erro ao carregar barcos:', error);
    }
  }

//========CARREGAR CONTENTORES==================
    async function carregarContentores() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.list.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(cont => {
        const option = document.createElement('option');
        option.value = cont.id;
        option.textContent = `${cont.identContCesta} - ${cont.descContCesta}`;
        elementos.list.appendChild(option);
      });
      
    } catch (error) {
      console.error('Erro ao carregar contentores:', error);
    }
  }
  // ===== CARREGAR CONTENTOR ESPECÍFICO===========
  async function carregarContentor(id) {
    try {
      const response = await fetch(`${API_URL}${id}/`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const cont = result.data;
      elementos.desc.value = cont.descContCesta;
      elementos.ident.value = cont.identContCesta;
      elementos.data.value = cont.dataEmbContCesta;
      elementos.req.value = cont.reqTranspContCesta;
      elementos.resp.value = cont.respContCesta;
      elementos.outroResp.value = cont.outRespContCesta || '';
      elementos.cert.value = cont.numCertContCesta;
      elementos.val.value = cont.valCertContCesta;
      elementos.barco.value = cont.barcoCertContCestaId || '';
      elementos.alt.value = cont.altCertContCesta || '';
      elementos.larg.value = cont.largCertContCesta || '';
      elementos.compr.value = cont.comprCertContCesta || '';
      elementos.peso.value = cont.pesoCertContCesta || '';
      elementos.solicDesemb.checked = cont.solicDesembContCesta || false;
      elementos.dataDesemb.value = cont.dataDesembContCesta || '';
      
      if (cont.respContCesta === 'OUTROS') {
        elementos.outroRespContainer.style.display = 'block';
      }
      
      contentorEditandoId = cont.id;
      desabilitarCampos(true);
      
    } catch (error) {
      alert('Erro ao carregar contentor: ' + error.message);
    }
  }

  // ===== SALVAR =====
  async function salvar() {
    if (!validarCampos()) return;
    
    try {
      const dados = {
        descContCesta: elementos.desc.value.trim(),
        identContCesta: elementos.ident.value.trim(),
        dataEmbContCesta: elementos.data.value,
        reqTranspContCesta: elementos.req.value.trim(),
        respContCesta: elementos.resp.value,
        outRespContCesta: elementos.resp.value === 'OUTROS' ? elementos.outroResp.value.trim() : '',
        numCertContCesta: elementos.cert.value.trim(),
        valCertContCesta: elementos.val.value
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Contentor/Cesta cadastrado com sucesso!');
      limpar();
      await carregarContentores();
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  // ===== HABILITAR EDIÇÃO =====
  function habilitarEdicao() {
    modoEdicao = true;
    desabilitarCampos(false);
    elementos.btnSave.style.display = 'none';
    elementos.btnEditar.style.display = 'none';
    elementos.btnExcluir.style.display = 'none';
    elementos.editActions.style.display = 'flex';
    elementos.list.disabled = true;
  }

  // ===== CONFIRMAR EDIÇÃO =====
  async function confirmarEdicao() {
    if (!validarCampos()) return;
    
    try {
      const dados = {
        descContCesta: elementos.desc.value.trim(),
        identContCesta: elementos.ident.value.trim(),
        dataEmbContCesta: elementos.data.value,
        reqTranspContCesta: elementos.req.value.trim(),
        respContCesta: elementos.resp.value,
        outRespContCesta: elementos.resp.value === 'OUTROS' ? elementos.outroResp.value.trim() : '',
        numCertContCesta: elementos.cert.value.trim(),
        valCertContCesta: elementos.val.value
      };
      
      const response = await fetch(`${API_URL}${contentorEditandoId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Contentor/Cesta atualizado com sucesso!');
      cancelarEdicao();
      await carregarContentores();
      
    } catch (error) {
      alert('Erro ao atualizar: ' + error.message);
    }
  }

  // ===== CANCELAR EDIÇÃO =====
  function cancelarEdicao() {
    modoEdicao = false;
    limpar();
    elementos.btnSave.style.display = 'inline-block';
    elementos.btnEditar.style.display = 'inline-block';
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.editActions.style.display = 'none';
    elementos.list.disabled = false;
  }

  // ===== EXCLUIR =====
  async function excluir() {
    if (!contentorEditandoId) return;
    
    if (!confirm('Deseja excluir este contentor/cesta?')) return;
    
    try {
      const response = await fetch(`${API_URL}${contentorEditandoId}/`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Contentor/Cesta excluído com sucesso!');
      limpar();
      await carregarContentores();
      
      // ATUALIZAR lista de contentores no módulo de Materiais a Bordo
      if (typeof MateriaisBordoModule !== 'undefined' && MateriaisBordoModule.recarregarContentores) {
        MateriaisBordoModule.recarregarContentores();
      }
      
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  // ===== VALIDAR CAMPOS =====
  function validarCampos() {
    if (!elementos.desc.value.trim()) {
      alert('Preencha a descrição');
      elementos.desc.focus();
      return false;
    }
    if (!elementos.ident.value.trim()) {
      alert('Preencha a identificação');
      elementos.ident.focus();
      return false;
    }
    if (!elementos.data.value) {
      alert('Preencha a data de embarque');
      elementos.data.focus();
      return false;
    }
    if (!elementos.req.value.trim()) {
      alert('Preencha o número da requisição');
      elementos.req.focus();
      return false;
    }
    if (!elementos.resp.value) {
      alert('Selecione o responsável');
      elementos.resp.focus();
      return false;
    }
    if (elementos.resp.value === 'OUTROS' && !elementos.outroResp.value.trim()) {
      alert('Preencha o outro responsável');
      elementos.outroResp.focus();
      return false;
    }
    if (!elementos.cert.value.trim()) {
      alert('Preencha o número do certificado');
      elementos.cert.focus();
      return false;
    }
    if (!elementos.val.value) {
      alert('Preencha a validade do certificado');
      elementos.val.focus();
      return false;
    }
    return true;
  }

  // ===== DESABILITAR CAMPOS =====
  function desabilitarCampos(desabilitar) {
    elementos.desc.disabled = desabilitar;
    elementos.ident.disabled = desabilitar;
    elementos.data.disabled = desabilitar;
    elementos.req.disabled = desabilitar;
    elementos.resp.disabled = desabilitar;
    elementos.outroResp.disabled = desabilitar;
    elementos.cert.disabled = desabilitar;
    elementos.val.disabled = desabilitar;
    elementos.barco.disabled = desabilitar;
    elementos.alt.disabled = desabilitar;
    elementos.larg.disabled = desabilitar;
    elementos.compr.disabled = desabilitar;
    elementos.peso.disabled = desabilitar;
    elementos.solicDesemb.disabled = desabilitar;
    elementos.dataDesemb.disabled = desabilitar;
  }

  // ===== LIMPAR =====
  function limpar() {
    elementos.desc.value = '';
    elementos.ident.value = '';
    elementos.data.value = '';
    elementos.req.value = '';
    elementos.resp.value = '';
    elementos.outroResp.value = '';
    elementos.outroRespContainer.style.display = 'none';
    elementos.cert.value = '';
    elementos.val.value = '';
    elementos.barco.value = '';
    elementos.alt.value = '';
    elementos.larg.value = '';
    elementos.compr.value = '';
    elementos.peso.value = '';
    elementos.solicDesemb.checked = false;
    elementos.dataDesemb.value = '';
    elementos.list.value = '';
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    contentorEditandoId = null;
    desabilitarCampos(false);
  }

  // ===== EXPORTAR =====
  return {
    init,
    recarregarContentores: carregarContentores
  };

})();

// ===== MÓDULO MATERIAIS A BORDO ===================================================================
const MateriaisBordoModule = (() => {
  const API_URL = '/api/materiais-bordo/';
  const API_MATERIAIS_OP = '/api/materiais-operacao/';
  const API_CONTENTORES = '/api/contentores/';
  let modoEdicao = false;
  let materialEditandoId = null;

  // Referências aos elementos DOM
  const elementos = {
    desc: document.getElementById('inv_mat_desc'),
    num: document.getElementById('inv_mat_num'),
    data: document.getElementById('inv_mat_data'),
    orig: document.getElementById('inv_mat_orig'),
    outraOrig: document.getElementById('inv_mat_outra_orig'),
    outraOrigContainer: document.getElementById('inv_mat_outra_orig_container'),
    resp: document.getElementById('inv_mat_resp'),
    outroResp: document.getElementById('inv_mat_outro_resp'),
    outroRespContainer: document.getElementById('inv_mat_outro_resp_container'),
    os: document.getElementById('inv_mat_os'),
    req: document.getElementById('inv_mat_req'),
    contCesta: document.getElementById('inv_mat_cont_cesta'),
    camposContentor: document.getElementById('inv_mat_campos_contentor'),
    contDesc: document.getElementById('inv_mat_cont_desc'),
    contIdent: document.getElementById('inv_mat_cont_ident'),
    contCert: document.getElementById('inv_mat_cont_cert'),
    contVal: document.getElementById('inv_mat_cont_val'),
    obs: document.getElementById('inv_mat_obs'),
    list: document.getElementById('inv_mat_list'),
    btnSave: document.getElementById('btnSaveMat'),
    btnEditar: document.getElementById('btnMatEditar'),
    btnExcluir: document.getElementById('btnMatExcluir'),
    btnConfirma: document.getElementById('btnMatConfirma'),
    btnCancela: document.getElementById('btnMatCancela'),
    editActions: document.getElementById('matEditActions')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
    carregarMateriaisOperacao();
    carregarContentores();
    carregarMateriais();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.btnSave.addEventListener('click', salvar);
    elementos.btnEditar.addEventListener('click', habilitarEdicao);
    elementos.btnExcluir.addEventListener('click', excluir);
    elementos.btnConfirma.addEventListener('click', confirmarEdicao);
    elementos.btnCancela.addEventListener('click', cancelarEdicao);
    
    elementos.orig.addEventListener('change', function() {
      if (this.value === 'OUTROS') {
        elementos.outraOrigContainer.style.display = 'block';
      } else {
        elementos.outraOrigContainer.style.display = 'none';
        elementos.outraOrig.value = '';
      }
    });
    
    elementos.resp.addEventListener('change', function() {
      if (this.value === 'OUTROS') {
        elementos.outroRespContainer.style.display = 'block';
      } else {
        elementos.outroRespContainer.style.display = 'none';
        elementos.outroResp.value = '';
      }
    });
    
    elementos.contCesta.addEventListener('change', function() {
      if (this.checked) {
        elementos.camposContentor.style.display = 'block';
      } else {
        elementos.camposContentor.style.display = 'none';
        elementos.contDesc.value = '';
        elementos.contIdent.value = '';
        elementos.contCert.value = '';
        elementos.contVal.value = '';
      }
    });
    
    elementos.contDesc.addEventListener('change', function() {
      if (this.value) {
        carregarDadosContentor(this.value);
      } else {
        elementos.contIdent.value = '';
        elementos.contCert.value = '';
        elementos.contVal.value = '';
      }
    });
    
    elementos.list.addEventListener('change', function() {
      if (this.value) {
        carregarMaterial(this.value);
        elementos.btnEditar.disabled = false;
        elementos.btnExcluir.disabled = false;
      } else {
        limpar();
      }
    });
  }

  // ===== CARREGAR MATERIAIS OPERAÇÃO =====
  async function carregarMateriaisOperacao() {
    try {
      const response = await fetch(API_MATERIAIS_OP);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.desc.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id;
        option.textContent = mat.descMat;
        elementos.desc.appendChild(option);
      });
      
    } catch (error) {
      alert('Erro ao carregar materiais de operação: ' + error.message);
    }
  }

  // ===== CARREGAR CONTENTORES =====
  async function carregarContentores() {
    try {
      const response = await fetch(API_CONTENTORES);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.contDesc.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(cont => {
        const option = document.createElement('option');
        option.value = cont.id;
        option.textContent = `${cont.identContCesta} - ${cont.descContCesta}`;
        option.dataset.ident = cont.identContCesta;
        option.dataset.cert = cont.numCertContCesta;
        option.dataset.val = cont.valCertContCesta;
        elementos.contDesc.appendChild(option);
      });
      
    } catch (error) {
      alert('Erro ao carregar contentores: ' + error.message);
    }
  }

  // ===== CARREGAR DADOS DO CONTENTOR =====
  function carregarDadosContentor(id) {
    const option = elementos.contDesc.querySelector(`option[value="${id}"]`);
    if (option) {
      elementos.contIdent.value = option.dataset.ident || '';
      elementos.contCert.value = option.dataset.cert || '';
      elementos.contVal.value = option.dataset.val || '';
    }
  }

  // ===== CARREGAR LISTA DE MATERIAIS =====
  async function carregarMateriais() {
    carregarContentores();
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.list.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(mat => {
        const option = document.createElement('option');
        option.value = mat.id;
        option.textContent = `${mat.numSerIden} - ${mat.descMat}`;
        elementos.list.appendChild(option);
      });
      
    } catch (error) {
      alert('Erro ao carregar materiais: ' + error.message);
    }
  }

  // ===== CARREGAR MATERIAL =====
  async function carregarMaterial(id) {
    try {
      const response = await fetch(`${API_URL}${id}/`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const mat = result.data;
      elementos.desc.value = mat.descMatId || '';
      elementos.num.value = mat.numSerIden;
      elementos.data.value = mat.dataReceb;
      elementos.orig.value = mat.origMat;
      elementos.outraOrig.value = mat.outOrigMat || '';
      elementos.resp.value = mat.respMat;
      elementos.outroResp.value = mat.outRespMat || '';
      elementos.os.value = mat.osAplicMat;
      elementos.req.value = mat.numReqTranspMat || '';
      elementos.contCesta.checked = mat.contCestaMat;
      elementos.obs.value = mat.obsMat || '';
      elementos.barco.value = mat.barcoMatId || '';
      elementos.alt.value = mat.altMat || '';
      elementos.larg.value = mat.largMat || '';
      elementos.compr.value = mat.comprMat || '';
      elementos.peso.value = mat.pesoMat || '';
      elementos.solicDesemb.checked = mat.solicDesembMat || false;
      elementos.dataDesemb.value = mat.dataDesembMat || '';
      
      if (mat.origMat === 'OUTROS') {
        elementos.outraOrigContainer.style.display = 'block';
      }
      
      if (mat.respMat === 'OUTROS') {
        elementos.outroRespContainer.style.display = 'block';
      }
      
      if (mat.contCestaMat) {
        elementos.camposContentor.style.display = 'block';
        elementos.contDesc.value = mat.descContCestaMatId || '';
        elementos.contIdent.value = mat.identContCestaMat || '';
        elementos.contCert.value = mat.numCertContCestaMat || '';
        elementos.contVal.value = mat.valCertContCestaMat || '';
      }
      
      materialEditandoId = mat.id;
      desabilitarCampos(true);
      
    } catch (error) {
      alert('Erro ao carregar material: ' + error.message);
    }
  }

  // ===== SALVAR =====
  async function salvar() {
    if (!validarCampos()) return;
    carregarContentores();
    try {
      const dados = {
        descMatId: elementos.desc.value,
        numSerIden: elementos.num.value.trim(),
        dataReceb: elementos.data.value,
        origMat: elementos.orig.value,
        outOrigMat: elementos.orig.value === 'OUTROS' ? elementos.outraOrig.value.trim() : '',
        respMat: elementos.resp.value,
        outRespMat: elementos.resp.value === 'OUTROS' ? elementos.outroResp.value.trim() : '',
        osAplicMat: elementos.os.value.trim(),
        numReqTranspMat: elementos.req.value.trim(),
        contCestaMat: elementos.contCesta.checked,
        descContCestaMatId: elementos.contCesta.checked ? elementos.contDesc.value : null,
        identContCestaMat: elementos.contCesta.checked ? elementos.contIdent.value : '',
        numCertContCestaMat: elementos.contCesta.checked ? elementos.contCert.value : '',
        valCertContCestaMat: elementos.contCesta.checked ? elementos.contVal.value : '',
        obsMat: elementos.obs.value.trim()
      };
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Material cadastrado com sucesso!');
      limpar();
      await carregarMateriais();
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  // ===== HABILITAR EDIÇÃO =====
  function habilitarEdicao() {
    carregarContentores();
    modoEdicao = true;
    desabilitarCampos(false);
    elementos.btnSave.style.display = 'none';
    elementos.btnEditar.style.display = 'none';
    elementos.btnExcluir.style.display = 'none';
    elementos.editActions.style.display = 'flex';
    elementos.list.disabled = true;
  }

  // ===== CONFIRMAR EDIÇÃO =====
  async function confirmarEdicao() {
    if (!validarCampos()) return;
    carregarContentores();
    try {
      const dados = {
        descMatId: elementos.desc.value,
        numSerIden: elementos.num.value.trim(),
        dataReceb: elementos.data.value,
        origMat: elementos.orig.value,
        outOrigMat: elementos.orig.value === 'OUTROS' ? elementos.outraOrig.value.trim() : '',
        respMat: elementos.resp.value,
        outRespMat: elementos.resp.value === 'OUTROS' ? elementos.outroResp.value.trim() : '',
        osAplicMat: elementos.os.value.trim(),
        numReqTranspMat: elementos.req.value.trim(),
        contCestaMat: elementos.contCesta.checked,
        descContCestaMatId: elementos.contCesta.checked ? elementos.contDesc.value : null,
        identContCestaMat: elementos.contCesta.checked ? elementos.contIdent.value : '',
        numCertContCestaMat: elementos.contCesta.checked ? elementos.contCert.value : '',
        valCertContCestaMat: elementos.contCesta.checked ? elementos.contVal.value : '',
        obsMat: elementos.obs.value.trim()
      };
      
      const response = await fetch(`${API_URL}${materialEditandoId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Material atualizado com sucesso!');
      cancelarEdicao();
      await carregarMateriais();
      
    } catch (error) {
      alert('Erro ao atualizar: ' + error.message);
    }
  }

  // ===== CANCELAR EDIÇÃO =====
  function cancelarEdicao() {
    modoEdicao = false;
    carregarContentores();
    limpar();
    elementos.btnSave.style.display = 'inline-block';
    elementos.btnEditar.style.display = 'inline-block';
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.editActions.style.display = 'none';
    elementos.list.disabled = false;
  }

  // ===== EXCLUIR =====
  async function excluir() {
    carregarContentores();
    if (!materialEditandoId) return;
    
    if (!confirm('Deseja excluir este material?')) return;
    
    try {
      const response = await fetch(`${API_URL}${materialEditandoId}/`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      alert('Material excluído com sucesso!');
      limpar();
      await carregarMateriais();
      
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  // ===== VALIDAR CAMPOS =====
  function validarCampos() {
    if (!elementos.desc.value) {
      alert('Selecione a descrição do material');
      elementos.desc.focus();
      return false;
    }
    if (!elementos.num.value.trim()) {
      alert('Preencha o número de série/identificação');
      elementos.num.focus();
      return false;
    }
    if (!elementos.data.value) {
      alert('Preencha a data de recebimento');
      elementos.data.focus();
      return false;
    }
    if (!elementos.orig.value) {
      alert('Selecione a origem do material');
      elementos.orig.focus();
      return false;
    }
    if (elementos.orig.value === 'OUTROS' && !elementos.outraOrig.value.trim()) {
      alert('Preencha a outra origem');
      elementos.outraOrig.focus();
      return false;
    }
    if (!elementos.resp.value) {
      alert('Selecione o responsável');
      elementos.resp.focus();
      return false;
    }
    if (elementos.resp.value === 'OUTROS' && !elementos.outroResp.value.trim()) {
      alert('Preencha o outro responsável');
      elementos.outroResp.focus();
      return false;
    }
    if (!elementos.os.value.trim()) {
      alert('Preencha a ordem de serviço');
      elementos.os.focus();
      return false;
    }
    if (elementos.contCesta.checked && !elementos.contDesc.value) {
      alert('Selecione o contentor/cesta');
      elementos.contDesc.focus();
      return false;
    }
    return true;
  }

  // ===== DESABILITAR CAMPOS =====
  function desabilitarCampos(desabilitar) {
    elementos.desc.disabled = desabilitar;
    elementos.num.disabled = desabilitar;
    elementos.data.disabled = desabilitar;
    elementos.orig.disabled = desabilitar;
    elementos.outraOrig.disabled = desabilitar;
    elementos.resp.disabled = desabilitar;
    elementos.outroResp.disabled = desabilitar;
    elementos.os.disabled = desabilitar;
    elementos.req.disabled = desabilitar;
    elementos.contCesta.disabled = desabilitar;
    elementos.contDesc.disabled = desabilitar;
    elementos.obs.disabled = desabilitar;
    elementos.barco.disabled = desabilitar;
    elementos.alt.disabled = desabilitar;
    elementos.larg.disabled = desabilitar;
    elementos.compr.disabled = desabilitar;
    elementos.peso.disabled = desabilitar;
    elementos.solicDesemb.disabled = desabilitar;
    elementos.dataDesemb.disabled = desabilitar;
  }

  // ===== LIMPAR =====
  function limpar() {
    elementos.desc.value = '';
    elementos.num.value = '';
    elementos.data.value = '';
    elementos.orig.value = '';
    elementos.outraOrig.value = '';
    elementos.outraOrigContainer.style.display = 'none';
    elementos.resp.value = '';
    elementos.outroResp.value = '';
    elementos.outroRespContainer.style.display = 'none';
    elementos.os.value = '';
    elementos.req.value = '';
    elementos.contCesta.checked = false;
    elementos.camposContentor.style.display = 'none';
    elementos.contDesc.value = '';
    elementos.contIdent.value = '';
    elementos.contCert.value = '';
    elementos.contVal.value = '';
    elementos.obs.value = '';
    elementos.barco.value = '';
    elementos.alt.value = '';
    elementos.larg.value = '';
    elementos.compr.value = '';
    elementos.peso.value = '';
    elementos.solicDesemb.checked = false;
    elementos.dataDesemb.value = '';
    elementos.list.value = '';
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    materialEditandoId = null;
    desabilitarCampos(false);
  }

  // ===== EXPORTAR =====
  return {
    init
  };

})();

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
        return;
      }
      
      document.querySelectorAll('.accordion-content').forEach(c => {
        c.classList.remove('active');
      });
      
      document.querySelectorAll('.accordion-header .toggle').forEach(t => {
        t.textContent = '▼';
      });
      
      content.classList.add('active');
      toggle.textContent = '▲';
    });
  });
}

// ===== INICIALIZAR =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    configurarAccordion();
    ContentoresModule.init();
    MateriaisBordoModule.init();
  });
} else {
  configurarAccordion();
  ContentoresModule.init();
  MateriaisBordoModule.init();
}