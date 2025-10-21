// ===== MÓDULO: CADASTRO DE UEPs =====

const UepsModule = (() => {
  const API_URL = '/api/ueps/';
  let modoEdicao = false;
  let uepEditandoId = null;
  let itensSubtabela = [];
  let itensParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    checkboxAfretada: document.getElementById('cad_uep_afretada'),
    inputUnidade: document.getElementById('cad_uep_unidade'),
    selectTipoContato: document.getElementById('uepTipoContato'),
    inputChave: document.getElementById('uepChave'),
    inputEmail: document.getElementById('uepEmail'),
    inputRamal: document.getElementById('uepRamal'),
    inputTelExterno: document.getElementById('uepTelExterno'),
    btnAdicionar: document.getElementById('btnAddUepContato'),
    tbody: document.querySelector('#tblUepContatos tbody'),
    lista: document.getElementById('cad_uep_list'),
    btnSalvar: document.getElementById('btnSaveUep'),
    btnEditar: document.getElementById('btnUepEditar'),
    btnExcluir: document.getElementById('btnUepExcluir'),
    btnConfirmar: document.getElementById('btnUepConfirma'),
    btnCancelar: document.getElementById('btnUepCancela'),
    editActions: document.getElementById('uepEditActions')
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    carregarLista();
    configurarEventos();
    aplicarEstadoInicial();
    recarregarChoicesPorCheckbox();
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
    elementos.btnSalvar.addEventListener('click', salvarNovaUep);
    elementos.btnEditar.addEventListener('click', ativarModoEdicao);
    elementos.btnExcluir.addEventListener('click', excluirUep);
    elementos.btnConfirmar.addEventListener('click', confirmarEdicao);
    elementos.btnCancelar.addEventListener('click', cancelarEdicao);
    elementos.lista.addEventListener('change', selecionarUep);
    elementos.btnAdicionar.addEventListener('click', adicionarContato);
    
    // Quando mudar checkbox, recarregar choices e habilitar botão Salvar
// Quando mudar checkbox, recarregar choices SEMPRE
    elementos.checkboxAfretada.addEventListener('change', function() {
      recarregarChoicesPorCheckbox();
      
      // Validar apenas se não estiver em edição
      if (!modoEdicao) {
        validarCamposParaSalvar();
      }
    });
  }

  // ===== VALIDAR CAMPOS PARA HABILITAR SALVAR =====
  function validarCamposParaSalvar() {
    if (modoEdicao) return;
    
    // Para salvar uma UEP, basta ter pelo menos 1 contato na subtabela
    const podeHabilitar = itensSubtabela.length > 0;
    elementos.btnSalvar.disabled = !podeHabilitar;
  }


  // ===== PREENCHER SELECT TIPO CONTATO =====
  function preencherSelectTipoContato(choices) {
    
    elementos.selectTipoContato.innerHTML = '<option value="">— selecione —</option>';
    
    choices.forEach(choice => {
      const option = document.createElement('option');
      option.value = choice.value;
      option.textContent = choice.label;
      elementos.selectTipoContato.appendChild(option);
    });
    
  }

  // ===== CARREGAR LISTA DE UEPs =====
  async function carregarLista() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }
      
      elementos.lista.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(uep => {
        const option = document.createElement('option');
        option.value = uep.id;
        const tipo = uep.afretUep ? 'Afretada' : 'Não Afretada';
        option.textContent = `${uep.unidade} - ${tipo}`;
        option.dataset.uep = JSON.stringify(uep);
        elementos.lista.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar UEPs: ' + error.message);
    }
  }

  // ===== ADICIONAR CONTATO À SUBTABELA =====
  function adicionarContato() {
    const tipoContato = elementos.selectTipoContato.value;
    const chave = elementos.inputChave.value.trim();
    const email = elementos.inputEmail.value.trim();
    const ramal = elementos.inputRamal.value.trim();
    const telExterno = elementos.inputTelExterno.value.trim();

    if (!tipoContato) {
      alert('Selecione o Tipo de Contato');
      elementos.selectTipoContato.focus();
      return;
    }

    if (!email) {
      alert('E-mail Externo é obrigatório');
      elementos.inputEmail.focus();
      return;
    }

    const item = {
      id: null,
      tipoContato: tipoContato,
      chaveCompartilhada: chave,
      emailExterno: email,
      ramalBR: ramal,
      telExterno: telExterno
    };

    itensSubtabela.push(item);
    renderizarTabela();
    limparCamposSubtabela();
    validarCamposParaSalvar();
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela() {
    elementos.tbody.innerHTML = '';
    const botoesHabilitados = !elementos.checkboxAfretada.disabled;

    itensSubtabela.forEach((item, index) => {
      const tr = document.createElement('tr');
      const btnDisabled = botoesHabilitados ? '' : 'disabled';
      
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:8px;">${item.tipoContato}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.chaveCompartilhada || '-'}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.emailExterno}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.ramalBR || '-'}</td>
        <td style="border:1px solid #ddd; padding:8px;">${item.telExterno || '-'}</td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">
          <button class="btn-icon" onclick="UepsModule.removerContato(${index})" ${btnDisabled}>🗑️</button>
        </td>
      `;
      
      elementos.tbody.appendChild(tr);
    });
  }

    // ===== REMOVER CONTATO =====
    function removerContato(index) {
      const item = itensSubtabela[index];
      
      if (item.id) {
        itensParaDeletar.push(item.id);
      }
      
      itensSubtabela.splice(index, 1);
      renderizarTabela();
      validarCamposParaSalvar();
    }

    // ===== LIMPAR CAMPOS SUBTABELA =====
    function limparCamposSubtabela() {
      elementos.selectTipoContato.value = '';
      elementos.inputChave.value = '';
      elementos.inputEmail.value = '';
      elementos.inputRamal.value = '';
      elementos.inputTelExterno.value = '';
      elementos.selectTipoContato.focus();
    }

  // ===== SALVAR NOVA UEP =====
    async function salvarNovaUep() {
    // Validar campo unidade
    const unidade = elementos.inputUnidade.value.trim();
    
    if (!unidade) {
      alert('Informe a Unidade');
      elementos.inputUnidade.focus();
      return;
    }
    
    if (itensSubtabela.length === 0) {
      alert('Adicione pelo menos um contato');
      return;
    }

    try {
      // 1. Criar UEP
      const responseUep = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          afretUep: elementos.checkboxAfretada.checked,
          unidade: unidade
        })
      });

      const resultUep = await responseUep.json();

      if (!resultUep.success) {
        throw new Error(resultUep.error);
      }

      const uepId = resultUep.data.id;

      // 2. Salvar contatos
      for (const item of itensSubtabela) {
        const responseContato = await fetch(`/api/ueps/${uepId}/contatos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        const resultContato = await responseContato.json();

        if (!resultContato.success) {
          throw new Error(resultContato.error);
        }
      }

      alert('UEP cadastrada com sucesso!');
      
      limparFormulario();
      carregarLista();
      
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;

    } catch (error) {
      alert('Erro ao salvar UEP: ' + error.message);
    }
  }

  // ===== SELECIONAR UEP DA LISTA =====
  async function selecionarUep() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      limparFormulario();
      elementos.btnSalvar.disabled = true;
      elementos.btnEditar.disabled = true;
      elementos.btnExcluir.disabled = true;
      return;
    }

    const uep = JSON.parse(selectedOption.dataset.uep);
    await preencherFormulario(uep);
    
    habilitarCampos(false);
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = false;
    elementos.btnExcluir.disabled = false;
  }

 // ===== PREENCHER FORMULÁRIO ====================
  async function preencherFormulario(uep) {
  elementos.checkboxAfretada.checked = uep.afretUep;
  elementos.inputUnidade.value = uep.unidade || '';
  
  // Choices Dinamicos
  recarregarChoicesPorCheckbox();
  
  // Carregar contatos
  await carregarContatos(uep.id);
  
  habilitarCampos(false);
}

  // ===== CARREGAR CONTATOS =====
  async function carregarContatos(uepId) {
    try {
      const response = await fetch(`/api/ueps/${uepId}/contatos/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      itensSubtabela = result.data || [];
      renderizarTabela();

    } catch (error) {
      alert('Erro ao carregar contatos: ' + error.message);
    }
  }

  // ===== ATIVAR MODO EDIÇÃO =====
  function ativarModoEdicao() {
    const selectedOption = elementos.lista.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      alert('Selecione uma UEP para editar');
      return;
    }

    modoEdicao = true;
    uepEditandoId = selectedOption.value;
    
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
  // Validar campo unidade
  const unidade = elementos.inputUnidade.value.trim();
  
  if (!unidade) {
    alert('Informe a Unidade');
    elementos.inputUnidade.focus();
    return;
  }
  
  if (itensSubtabela.length === 0) {
    alert('Deve haver pelo menos um contato');
    return;
  }

  try {
    // 1. Atualizar UEP
    const responseUep = await fetch(`${API_URL}${uepEditandoId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        afretUep: elementos.checkboxAfretada.checked,
        unidade: unidade
      })
    });

    const resultUep = await responseUep.json();

    if (!resultUep.success) {
      throw new Error(resultUep.error);
    }

    // 2. Deletar contatos removidos
    for (const itemId of itensParaDeletar) {
      const responseDelete = await fetch(`/api/uep-contatos/${itemId}/`, {
        method: 'DELETE'
      });

      const resultDelete = await responseDelete.json();

      if (!resultDelete.success) {
        throw new Error(resultDelete.error);
      }
    }
    itensParaDeletar = [];

    // 3. Salvar/atualizar contatos
    for (const item of itensSubtabela) {
      if (item.id) {
        // Atualizar existente
        const responsePut = await fetch(`/api/uep-contatos/${item.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        const resultPut = await responsePut.json();

        if (!resultPut.success) {
          throw new Error(resultPut.error);
        }
      } else {
        // Criar novo
        const responsePost = await fetch(`/api/ueps/${uepEditandoId}/contatos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        const resultPost = await responsePost.json();

        if (!resultPost.success) {
          throw new Error(resultPost.error);
        }
      }
    }

    alert('UEP atualizada com sucesso!');
    
    cancelarEdicao();
    carregarLista();

  } catch (error) {
    alert('Erro ao atualizar UEP: ' + error.message);
  }
  }

  // ===== CANCELAR EDIÇÃO =====
  function cancelarEdicao() {
    modoEdicao = false;
    uepEditandoId = null;
    itensParaDeletar = [];
    
    limparFormulario();
    
    elementos.btnSalvar.style.display = 'inline-block';
    elementos.btnSalvar.disabled = true;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.style.display = 'inline-block';
    elementos.btnExcluir.disabled = true;
    elementos.lista.disabled = false;
    elementos.lista.value = '';
    elementos.editActions.style.display = 'none';
  }

  // ===== EXCLUIR UEP =====
async function excluirUep() {
  const selectedOption = elementos.lista.selectedOptions[0];
  
  if (!selectedOption || !selectedOption.value) {
    alert('Selecione uma UEP para excluir');
    return;
  }

  elementos.btnSalvar.disabled = true;
  elementos.btnEditar.disabled = true;

  const uep = JSON.parse(selectedOption.dataset.uep);
  
  if (!confirm(`Confirma exclusão da UEP "${uep.unidade}"?`)) {
    limparFormulario();
    elementos.lista.value = '';
    elementos.btnSalvar.disabled = false;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
    return;
  }

  try {
    const response = await fetch(`${API_URL}${selectedOption.value}/`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    alert('UEP excluída com sucesso!');
    
    limparFormulario();
    carregarLista();
    
    elementos.btnSalvar.disabled = false;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;

  } catch (error) {
    alert('Erro ao excluir UEP: ' + error.message);
    
    limparFormulario();
    elementos.lista.value = '';
    elementos.btnSalvar.disabled = false;
    elementos.btnEditar.disabled = true;
    elementos.btnExcluir.disabled = true;
  }
}

  // ===== LIMPAR FORMULÁRIO =====
  function limparFormulario() {
  elementos.checkboxAfretada.checked = false;
  elementos.inputUnidade.value = '';
  itensSubtabela = [];
  renderizarTabela();
  limparCamposSubtabela();
  recarregarChoicesPorCheckbox();
  habilitarCampos(true);
  }

  // ===== HABILITAR/DESABILITAR CAMPOS =====
  function habilitarCampos(habilitar) {
    elementos.checkboxAfretada.disabled = !habilitar;
    elementos.inputUnidade.disabled = !habilitar;
    elementos.selectTipoContato.disabled = !habilitar;
    elementos.inputChave.disabled = !habilitar;
    elementos.inputEmail.disabled = !habilitar;
    elementos.inputRamal.disabled = !habilitar;
    elementos.inputTelExterno.disabled = !habilitar;
    elementos.btnAdicionar.disabled = !habilitar;
  }

  // ===== RECARREGAR CHOICES BASEADO NO CHECKBOX =====
  function recarregarChoicesPorCheckbox() {
    const isAfretada = elementos.checkboxAfretada.checked;

      
    if (isAfretada) {
      // Choices para Afretada
      const choicesAfret = [
        { value: 'FISCAL', label: 'FISCAL' },
        { value: 'ENGENHEIRO OU OIM', label: 'ENGENHEIRO OU OIM' },
        { value: 'TEC.SEGURANÇA', label: 'TEC.SEGURANÇA' },
        { value: 'COMANDANTE', label: 'COMANDANTE' }
      ];
      console.log('[UEPS] Carregando choices AFRETADA:', choicesAfret);
      preencherSelectTipoContato(choicesAfret);
    } else {
      // Choices para Não Afretada (BR)
      const choicesBR = [
        { value: 'GEPLAT', label: 'GEPLAT' },
        { value: 'COPROD', label: 'COPROD' },
        { value: 'COEMB', label: 'COEMB' },
        { value: 'COMAN', label: 'COMAN' },
        { value: 'TEC.SEGURANÇA', label: 'TEC.SEGURANÇA' }
      ];
      
      preencherSelectTipoContato(choicesBR);
    }
  }

  // ===== INICIALIZAR QUANDO DOM CARREGAR =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== API PÚBLICA =====
  return {
    removerContato: removerContato
  };

})();