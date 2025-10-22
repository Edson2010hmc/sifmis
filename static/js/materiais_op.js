// static/js/materiais_op.js
// Módulo para Cadastro de Materiais de Operação (Cadastros Gerais)

const MateriaisModule = (() => {
  const API_URL = '/api/materiais-operacao/';
  let modoEdicao = false;
  let materialEditandoId = null;

  // Referências aos elementos DOM
  const elementos = {
    desc: document.getElementById('cad_mat_desc'),
    obs: document.getElementById('cad_mat_obs'),
    list: document.getElementById('cad_mat_list'),
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
    carregarMateriais();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.btnSave.addEventListener('click', salvar);
    elementos.btnEditar.addEventListener('click', habilitarEdicao);
    elementos.btnExcluir.addEventListener('click', excluir);
    elementos.btnConfirma.addEventListener('click', confirmarEdicao);
    elementos.btnCancela.addEventListener('click', cancelarEdicao);
    
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

  // ===== CARREGAR LISTA DE MATERIAIS =====
  async function carregarMateriais() {
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
        option.textContent = mat.descMat;
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
      elementos.desc.value = mat.descMat;
      elementos.obs.value = mat.obsDescMat || '';
      
      materialEditandoId = mat.id;
      desabilitarCampos(true);
      
    } catch (error) {
      alert('Erro ao carregar material: ' + error.message);
    }
  }

  // ===== SALVAR =====
  async function salvar() {
    if (!validarCampos()) return;
    
    try {
      const dados = {
        descMat: elementos.desc.value.trim(),
        obsDescMat: elementos.obs.value.trim()
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
        descMat: elementos.desc.value.trim(),
        obsDescMat: elementos.obs.value.trim()
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
    limpar();
    elementos.btnSave.style.display = 'inline-block';
    elementos.btnEditar.style.display = 'inline-block';
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.editActions.style.display = 'none';
    elementos.list.disabled = false;
  }

  // ===== EXCLUIR =====
  async function excluir() {
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
    if (!elementos.desc.value.trim()) {
      alert('Preencha a descrição do material');
      elementos.desc.focus();
      return false;
    }
    return true;
  }

  // ===== DESABILITAR CAMPOS =====
  function desabilitarCampos(desabilitar) {
    elementos.desc.disabled = desabilitar;
    elementos.obs.disabled = desabilitar;
  }

  // ===== LIMPAR =====
  function limpar() {
    elementos.desc.value = '';
    elementos.obs.value = '';
    elementos.list.value = '';
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    materialEditandoId = null;
    desabilitarCampos(false);
  }

  // ===== REINICIAR =====
  function reiniciar() {
    limpar();
    carregarMateriais();
  }

  // ===== EXPORTAR =====
  return {
    init,
    reiniciar
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MateriaisModule.init);
} else {
  MateriaisModule.init();
}