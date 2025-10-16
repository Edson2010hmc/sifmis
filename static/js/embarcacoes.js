// ===== MÓDULO: CADASTRO DE EMBARCAÇÕES =====

const EmbarcacoesModule = (() => {
  const API_URL = '/api/barcos/';
  const API_TIPOS_URL = '/api/barcos/tipos/';
  const API_MODAIS_URL = '/api/modais/';
  let modoEdicao = false;
  let embarcacaoEditandoId = null;

  // Referências aos elementos DOM
  const elementos = {
    tipo: document.getElementById('cad_e_tipo'),
    nome: document.getElementById('cad_e_nome'),
    modal: document.getElementById('cad_e_modal'),
    primeira: document.getElementById('cad_e_primeira'),
    email: document.getElementById('cad_e_email'),
    emprNav: document.getElementById('cad_e_emprNav'),
    icjEmprNav: document.getElementById('cad_e_icjEmprNav'),
    emprServ: document.getElementById('cad_e_emprServ'),
    icjEmprServ: document.getElementById('cad_e_icjEmprServ'),
    lista: document.getElementById('cad_e_list'),
    btnSalvar: document.getElementById('btnSaveEmb'),
    btnEditar: document.getElementById('btnEmbEditar'),
    btnExcluir: document.getElementById('btnEmbExcluir'),
    btnConfirmar: document.getElementById('btnEmbConfirma'),
    btnCancelar: document.getElementById('btnEmbCancela'),
    editActions: document.getElementById('embEditActions')
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    carregarTipos();
    carregarModais();
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
    elementos.btnSalvar.addEventListener('click', salvarNovaEmbarcacao);
    elementos.btnEditar.addEventListener('click', ativarModoEdicao);
    elementos.btnExcluir.addEventListener('click', excluirEmbarcacao);
    elementos.btnConfirmar.addEventListener('click', confirmarEdicao);
    elementos.btnCancelar.addEventListener('click', cancelarEdicao);
    elementos.lista.addEventListener('change', selecionarEmbarcacao);
    
    // Validação em tempo real para habilitar botão Salvar (apenas campos obrigatórios)
    elementos.tipo.addEventListener('change', validarCamposParaSalvar);
    elementos.nome.addEventListener('input', validarCamposParaSalvar);
    elementos.primeira.addEventListener('input', validarCamposParaSalvar);
  }

  // ===== VALIDAR CAMPOS PARA HABILITAR SALVAR =====
  function validarCamposParaSalvar() {
    if (modoEdicao) return;
    
    const tipoSelecionado = elementos.tipo.value.trim().length > 0;
    const nomePreenchido = elementos.nome.value.trim().length > 0;
    const dataPreenchida = elementos.primeira.value.trim().length > 0;
    
    const podeHabilitar = tipoSelecionado && nomePreenchido && dataPreenchida;
    
    elementos.btnSalvar.disabled = !podeHabilitar;
  }

  // ===== CARREGAR TIPOS DE BARCOS =====
  async function carregarTipos() {
    try {
      const response = await fetch(API_TIPOS_URL);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.tipo.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo.value;
        option.textContent = tipo.label;
        elementos.tipo.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar tipos de barcos: ' + error.message);
    }
  }

  // ===== CARREGAR MODAIS =====
  async function carregarModais() {
    try {
      const response = await fetch(API_MODAIS_URL);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.modal.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(modal => {
        const option = document.createElement('option');
        option.value = modal.id;
        option.textContent = modal.modal;
        elementos.modal.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar modais: ' + error.message);
    }
  }

  // ===== CARREGAR LISTA DE EMBARCAÇÕES =====
  async function carregarLista() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.lista.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(barco => {
        const option = document.createElement('option');
        option.value = barco.id;
        option.textContent = `${barco.tipoBarco} - ${barco.nomeBarco}`;
        option.dataset.barco = JSON.stringify(barco);
        elementos.lista.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar embarcações: ' + error.message);
    }
  }

  // ===== SALVAR NOVA EMBARCAÇÃO =====
  async function salvarNovaEmbarcacao() {
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

      alert('Embarcação cadastrada com sucesso!');
      
      limparFormulario();
      carregarLista();
      
      // Estado após salvar
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao salvar embarcação: ' + error.message);
    }
  }

  // ===== SELECIONAR EMBARCAÇÃO DA LISTA =====
  function selecionarEmbarcacao() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      limparFormulario();
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;
      return;
    }

    const barco = JSON.parse(selectedOption.dataset.barco);
    preencherFormulario(barco);
    
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
      alert('Selecione uma embarcação para editar');
      return;
    }

    modoEdicao = true;
    embarcacaoEditandoId = selectedOption.value;
    
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
      const response = await fetch(`${API_URL}${embarcacaoEditandoId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      alert('Embarcação atualizada com sucesso!');
      
      // Sair do modo edição
      modoEdicao = false;
      embarcacaoEditandoId = null;
      
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
      alert('Erro ao atualizar embarcação: ' + error.message);
    }
  }

  // ===== CANCELAR EDIÇÃO =====
  function cancelarEdicao() {
    modoEdicao = false;
    embarcacaoEditandoId = null;
    
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

  // ===== EXCLUIR EMBARCAÇÃO =====
  async function excluirEmbarcacao() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      alert('Selecione uma embarcação para excluir');
      return;
    }

    // Estado ao clicar excluir
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;

    const barco = JSON.parse(selectedOption.dataset.barco);
    
    if (!confirm(`Confirma exclusão da embarcação "${barco.nomeBarco}"?`)) {
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

      alert('Embarcação excluída com sucesso!');
      
      carregarLista();
      limparFormulario();
      
      // Estado após excluir - Salvar HABILITADO
      elementos.btnSalvar.disabled = false;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao excluir embarcação: ' + error.message);
      
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
      tipoBarco: elementos.tipo.value.trim(),
      nomeBarco: elementos.nome.value.trim(),
      modalSelec_id: elementos.modal.value || null,
      dataPrimPorto: elementos.primeira.value,
      emailPetr: elementos.email.value.trim(),
      emprNav: elementos.emprNav.value.trim(),
      icjEmprNav: elementos.icjEmprNav.value.trim(),
      emprServ: elementos.emprServ.value.trim(),
      icjEmprServ: elementos.icjEmprServ.value.trim()
    };
  }

  // ===== VALIDAR DADOS =====
  function validarDados(dados) {
    if (!dados.tipoBarco) {
      alert('Tipo é obrigatório');
      elementos.tipo.focus();
      return false;
    }

    if (!dados.nomeBarco) {
      alert('Nome é obrigatório');
      elementos.nome.focus();
      return false;
    }

    
    if (!dados.dataPrimPorto) {
      alert('Data do primeiro porto é obrigatória');
      elementos.primeira.focus();
      return false;
    }

    // Validar e-mail se preenchido
    if (dados.emailPetr) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dados.emailPetr)) {
        alert('E-mail Petrobras inválido');
        elementos.email.focus();
        return false;
      }
    }

    return true;
  }

  // ===== PREENCHER FORMULÁRIO =====
  function preencherFormulario(barco) {
    elementos.tipo.value = barco.tipoBarco || '';
    elementos.nome.value = barco.nomeBarco || '';
    elementos.modal.value = barco.modalSelec_id || '';
    elementos.primeira.value = barco.dataPrimPorto || '';
    elementos.email.value = barco.emailPetr || '';
    elementos.emprNav.value = barco.emprNav || '';
    elementos.icjEmprNav.value = barco.icjEmprNav || '';
    elementos.emprServ.value = barco.emprServ || '';
    elementos.icjEmprServ.value = barco.icjEmprServ || '';
  }

  // ===== LIMPAR FORMULÁRIO =====
  function limparFormulario() {
    elementos.tipo.value = '';
    elementos.nome.value = '';
    elementos.modal.value = '';
    elementos.primeira.value = '';
    elementos.email.value = '';
    elementos.emprNav.value = '';
    elementos.icjEmprNav.value = '';
    elementos.emprServ.value = '';
    elementos.icjEmprServ.value = '';
    
    habilitarCampos(true);
  }

  // ===== HABILITAR/DESABILITAR CAMPOS =====
  function habilitarCampos(habilitar) {
    elementos.tipo.disabled = !habilitar;
    elementos.nome.disabled = !habilitar;
    elementos.modal.disabled = !habilitar;
    elementos.primeira.disabled = !habilitar;
    elementos.email.disabled = !habilitar;
    elementos.emprNav.disabled = !habilitar;
    elementos.icjEmprNav.disabled = !habilitar;
    elementos.emprServ.disabled = !habilitar;
    elementos.icjEmprServ.disabled = !habilitar;
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
    embarcacaoEditandoId = null;
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
  document.addEventListener('DOMContentLoaded', EmbarcacoesModule.init);
} else {
  EmbarcacoesModule.init();
}