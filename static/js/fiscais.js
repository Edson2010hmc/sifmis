// ===== MÓDULO: CADASTRO DE FISCAIS =====

const FiscaisModule = (() => {
  const API_URL = '/api/fiscais/';
  let modoEdicao = false;
  let fiscalEditandoId = null;

  // Referências aos elementos DOM
  const elementos = {
    chave: document.getElementById('cad_f_ch'),
    nome: document.getElementById('cad_f_nome'),
    email: document.getElementById('cad_f_email'),
    celular: document.getElementById('cad_f_celular'),
    perfFisc: document.getElementById('cad_f_perfFisc'),
    perfAdm: document.getElementById('cad_f_perfAdm'),
    lista: document.getElementById('cad_f_list'),
    btnSalvar: document.getElementById('btnSaveFiscal'),
    btnEditar: document.getElementById('btnFiscalEditar'),
    btnExcluir: document.getElementById('btnFiscalExcluir'),
    btnConfirmar: document.getElementById('btnFiscalConfirma'),
    btnCancelar: document.getElementById('btnFiscalCancela'),
    editActions: document.getElementById('fiscEditActions')
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    carregarLista();
    configurarEventos();
    aplicarEstadoInicial();
  }

  // ===== ESTADO INICIAL =====
  function aplicarEstadoInicial() {
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    elementos.editActions.style.display = 'none';
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.btnSalvar.addEventListener('click', salvarNovoFiscal);
    elementos.btnEditar.addEventListener('click', ativarModoEdicao);
    elementos.btnExcluir.addEventListener('click', excluirFiscal);
    elementos.btnConfirmar.addEventListener('click', confirmarEdicao);
    elementos.btnCancelar.addEventListener('click', cancelarEdicao);
    elementos.lista.addEventListener('change', selecionarFiscal);
    
    // Validação em tempo real para habilitar botão Salvar
    elementos.chave.addEventListener('input', validarCamposParaSalvar);
    elementos.nome.addEventListener('input', validarCamposParaSalvar);
    elementos.email.addEventListener('input', validarCamposParaSalvar);
    elementos.perfFisc.addEventListener('change', validarCamposParaSalvar);
    elementos.perfAdm.addEventListener('change', validarCamposParaSalvar);
  }

  // ===== VALIDAR CAMPOS PARA HABILITAR SALVAR =====
  function validarCamposParaSalvar() {
    if (modoEdicao) return;
    
    const chavePreenchida = elementos.chave.value.trim().length > 0;
    const nomePreenchido = elementos.nome.value.trim().length > 0;
    const emailPreenchido = elementos.email.value.trim().length > 0;
    const algumPerfilSelecionado = elementos.perfFisc.checked || elementos.perfAdm.checked;
    
    const podeHabilitar = chavePreenchida && nomePreenchido && emailPreenchido && algumPerfilSelecionado;
    elementos.btnSalvar.disabled = !podeHabilitar;
  }

  // ===== CARREGAR LISTA DE FISCAIS =====
  async function carregarLista() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.lista.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(fiscal => {
        const option = document.createElement('option');
        option.value = fiscal.id;
        option.textContent = `${fiscal.chave} - ${fiscal.nome}`;
        option.dataset.fiscal = JSON.stringify(fiscal);
        elementos.lista.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar usuarios: ' + error.message);
    }
  }

  // ===== SALVAR NOVO FISCAL =====
  async function salvarNovoFiscal() {
    const dados = obterDadosFormulario();
    
    if (!validarDados(dados)) {
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Usuario cadastrado com sucesso!');
      
      limparFormulario();
      carregarLista();
      
      // Estado após salvar
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao salvar usuario: ' + error.message);
    }
  }

  // ===== SELECIONAR FISCAL DA LISTA =====
  function selecionarFiscal() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      limparFormulario();
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;
      return;
    }

    const fiscal = JSON.parse(selectedOption.dataset.fiscal);
    preencherFormulario(fiscal);
    
    // Estado após selecionar
    habilitarCampos(false);
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = false;
    elementos.btnExcluir.disabled = false;
  }

  // ===== ATIVAR MODO EDIÇÃO =====
  function ativarModoEdicao() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      alert('Selecione um usuario para editar');
      return;
    }

    modoEdicao = true;
    fiscalEditandoId = selectedOption.value;
    
    // Estado modo edição
    habilitarCampos(true);
    elementos.btnSalvar.style.display = 'none';
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.style.display = 'none';
    elementos.btnExcluir.disabled = true;
    elementos.lista.disabled = true;
    elementos.editActions.style.display = 'flex';
  }

  // ===== CONFIRMAR EDIÇÃO =====
  async function confirmarEdicao() {
    const dados = obterDadosFormulario();
    
    if (!validarDados(dados)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}${fiscalEditandoId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Usuario atualizado com sucesso!');
      
      // Sair do modo edição
      modoEdicao = false;
      fiscalEditandoId = null;
      
      carregarLista();
      limparFormulario();
      
      // Estado após confirmar
      elementos.lista.disabled = false;
      elementos.editActions.style.display = 'none';
      elementos.btnSalvar.style.display = 'inline-block';
      elementos.btnExcluir.style.display = 'inline-block';
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao atualizar usuario: ' + error.message);
    }
  }

  // ===== CANCELAR EDIÇÃO =====
  function cancelarEdicao() {
    modoEdicao = false;
    fiscalEditandoId = null;
    
    limparFormulario();
    elementos.lista.value = '';
    elementos.lista.disabled = false;
    
    // Estado após cancelar
    elementos.editActions.style.display = 'none';
    elementos.btnSalvar.style.display = 'inline-block';
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
  }

  // ===== EXCLUIR FISCAL =====
  async function excluirFiscal() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      alert('Selecione um usuario para excluir');
      return;
    }

    // Estado ao clicar excluir
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;

    const fiscal = JSON.parse(selectedOption.dataset.fiscal);
    
    if (!confirm(`Confirma exclusão do usuario "${fiscal.nome}"?`)) {
      // Não confirmou - limpa e Salvar fica HABILITADO
      limparFormulario();
      elementos.lista.value = '';
      elementos.btnSalvar.disabled = false;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;
      return;
    }

    // Confirmou exclusão
    try {
      const response = await fetch(`${API_URL}${selectedOption.value}/`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Usuario excluído com sucesso!');
      
      carregarLista();
      limparFormulario();
      
      // Estado após excluir - Salvar HABILITADO
      elementos.btnSalvar.disabled = false;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao excluir usuario: ' + error.message);
      
      // Em caso de erro, Salvar HABILITADO
      limparFormulario();
      elementos.lista.value = '';
      elementos.btnSalvar.disabled = false;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;
    }
  }

  // ===== OBTER DADOS DO FORMULÁRIO =====
  function obterDadosFormulario() {
    return {
      chave: elementos.chave.value.trim(),
      nome: elementos.nome.value.trim(),
      email: elementos.email.value.trim(),
      celular: elementos.celular.value.trim(),
      perfFisc: elementos.perfFisc.checked,
      perfAdm: elementos.perfAdm.checked
    };
  }

  // ===== VALIDAR DADOS =====
  function validarDados(dados) {
    if (!dados.chave) {
      alert('Chave é obrigatória');
      elementos.chave.focus();
      return false;
    }

    if (dados.chave.length !== 4) {
      alert('Chave deve ter exatamente 4 caracteres');
      elementos.chave.focus();
      return false;
    }

    if (!dados.nome) {
      alert('Nome é obrigatório');
      elementos.nome.focus();
      return false;
    }

    if (!dados.email) {
      alert('E-mail é obrigatório');
      elementos.email.focus();
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dados.email)) {
      alert('E-mail inválido');
      elementos.email.focus();
      return false;
    }

    if (!dados.perfFisc && !dados.perfAdm) {
      alert('Selecione ao menos um perfil (Fiscal ou ADM)');
      return false;
    }

    if (dados.celular) {
      const celularRegex = /^\(\d{2}\)\d{4,5}-\d{4}$/;
      if (!celularRegex.test(dados.celular)) {
        alert('Celular deve estar no formato (99)99999-9999');
        elementos.celular.focus();
        return false;
      }
    }

    return true;
  }

  // ===== PREENCHER FORMULÁRIO =====
  function preencherFormulario(fiscal) {
    elementos.chave.value = fiscal.chave || '';
    elementos.nome.value = fiscal.nome || '';
    elementos.email.value = fiscal.email || '';
    elementos.celular.value = fiscal.celular || '';
    elementos.perfFisc.checked = fiscal.perfFisc || false;
    elementos.perfAdm.checked = fiscal.perfAdm || false;
  }

  // ===== LIMPAR FORMULÁRIO =====
  function limparFormulario() {
    elementos.chave.value = '';
    elementos.nome.value = '';
    elementos.email.value = '';
    elementos.celular.value = '';
    elementos.perfFisc.checked = false;
    elementos.perfAdm.checked = false;
    
    habilitarCampos(true);
  }

  // ===== HABILITAR/DESABILITAR CAMPOS =====
  function habilitarCampos(habilitar) {
    elementos.chave.disabled = !habilitar;
    elementos.nome.disabled = !habilitar;
    elementos.email.disabled = !habilitar;
    elementos.celular.disabled = !habilitar;
    elementos.perfFisc.disabled = !habilitar;
    elementos.perfAdm.disabled = !habilitar;
  }

  // ===== REINICIAR FORMULÁRIO =====
  function reiniciar() {
    limparFormulario();
    elementos.lista.value = '';
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    elementos.editActions.style.display = 'none';
    elementos.btnSalvar.style.display = 'inline-block';
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.lista.disabled = false;
    modoEdicao = false;
    fiscalEditandoId = null;
  }

  // ===== EXPORTAR FUNÇÕES PÚBLICAS =====
  return {
    init,
    carregarLista,
    reiniciar  // ADICIONAR AQUI
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FiscaisModule.init);
} else {
  FiscaisModule.init();
}