// ===== MÓDULO: INSPEÇÃO PETROBRAS (1.5) =====

const InspPetrModule = (() => {
  let inspPetrId = null;
  let itensSubtabela = [];
  let itensParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('ipNaoPrevisto'),
    obs: document.getElementById('ipObs'),
    selectDesc: document.getElementById('inspPetrDesc'),
    inputAuditor: document.getElementById('ipAud'),
    inputGerencia: document.getElementById('ipGer'),
    btnAdicionar: document.getElementById('btnAddInspPetr'),
    tbody: document.querySelector('#tblInspPetr tbody'),
    containerSubtabela: document.getElementById('containerSubtabelaInspPetr')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
    carregarChoices();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.checkbox.addEventListener('change', function() {
      toggleSubtabela();
    });

    elementos.btnAdicionar.addEventListener('click', adicionarLinha);
  }

  // ===== CONTROLAR VISIBILIDADE DA SUBTABELA =====
  function toggleSubtabela() {
    const previsto = !elementos.checkbox.checked;
    elementos.containerSubtabela.style.display = previsto ? 'block' : 'none';
  }

  // ===== CARREGAR CHOICES DO SELECT =====
  function carregarChoices() {
    const choices = [
      { value: 'GSOP/SMS', label: 'GSOP/SMS' },
      { value: 'GERENCIA CONTRATO', label: 'GERENCIA CONTRATO' },
      { value: 'STEE', label: 'STEE' },
      { value: 'GERENTE MIS', label: 'GERENTE MIS' },
      { value: 'STO MIS', label: 'STO MIS' },
      { value: 'OUTROS', label: 'OUTROS' }
    ];

    elementos.selectDesc.innerHTML = '<option value="">— selecione —</option>';
    
    choices.forEach(choice => {
      const option = document.createElement('option');
      option.value = choice.value;
      option.textContent = choice.label;
      elementos.selectDesc.appendChild(option);
    });
  }

  // ===== ADICIONAR LINHA NA SUBTABELA =====
  function adicionarLinha() {
    const descricao = elementos.selectDesc.value;
    const auditor = elementos.inputAuditor.value.trim();
    const gerencia = elementos.inputGerencia.value.trim();

    if (!descricao) {
      alert('Selecione a Descrição');
      elementos.selectDesc.focus();
      return;
    }

    if (!auditor) {
      alert('Informe o nome do Auditor/Visitante');
      elementos.inputAuditor.focus();
      return;
    }

    if (!gerencia) {
      alert('Informe a Gerência');
      elementos.inputGerencia.focus();
      return;
    }

    const item = {
      id: null,
      DescInspPetr: descricao,
      auditorPetr: auditor,
      gerAuditorPetr: gerencia
    };

    itensSubtabela.push(item);
    renderizarTabela();

    elementos.selectDesc.value = '';
    elementos.inputAuditor.value = '';
    elementos.inputGerencia.value = '';
    elementos.selectDesc.focus();
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela() {
    elementos.tbody.innerHTML = '';

    itensSubtabela.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${item.DescInspPetr}</td>
        <td>${item.auditorPetr}</td>
        <td>${item.gerAuditorPetr}</td>
        <td><button class="btn small" onclick="InspPetrModule.removerLinha(${index})">Remover</button></td>
      `;
      
      elementos.tbody.appendChild(tr);
    });
  }

  // ===== REMOVER LINHA =====
  function removerLinha(index) {
    if (itensSubtabela[index].id) {
      itensParaDeletar.push(itensSubtabela[index].id);
    }
    
    itensSubtabela.splice(index, 1);
    renderizarTabela();
  }

  // ===== CARREGAR DADOS (chamado ao abrir PS) =====
  async function carregarDados(psId) {
    if (!psId) return;

    try {
      const response = await fetch(`/api/ps/${psId}/insp-petr/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        await criarInspecao(psId);
        return;
      }

      inspPetrId = result.data.id;
      elementos.checkbox.checked = !result.data.prevInspPetr;
      elementos.obs.value = result.data.ObservInspPetr || '';
      
      toggleSubtabela();
      await carregarSubtabela(inspPetrId);

    } catch (error) {
      alert('Erro ao carregar Inspeção Petrobras: ' + error.message);
    }
  }

  // ===== CRIAR INSPEÇÃO PETROBRAS =====
  async function criarInspecao(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/insp-petr/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prevInspPetr: true,
          ObservInspPetr: ''
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      inspPetrId = result.data.id;
      elementos.checkbox.checked = false;
      toggleSubtabela();

    } catch (error) {
      alert('Erro ao criar Inspeção Petrobras: ' + error.message);
    }
  }

  // ===== CARREGAR SUBTABELA =====
  async function carregarSubtabela(inspPetrId) {
    try {
      const response = await fetch(`/api/insp-petr/${inspPetrId}/subtab/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      itensSubtabela = result.data || [];
      renderizarTabela();

    } catch (error) {
      alert('Erro ao carregar itens: ' + error.message);
    }
  }

  // ===== SALVAR DADOS (chamado pelo PassagensModule) =====
  async function salvar() {
    if (!inspPetrId) return;

    try {
      const dadosPrincipal = {
        prevInspPetr: !elementos.checkbox.checked,
        ObservInspPetr: elementos.obs.value.trim()
      };

      const responsePrincipal = await fetch(`/api/insp-petr/${inspPetrId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPrincipal)
      });

      const resultPrincipal = await responsePrincipal.json();

      if (!resultPrincipal.success) {
        throw new Error(resultPrincipal.error);
      }

      for (const itemId of itensParaDeletar) {
        const responseDelete = await fetch(`/api/insp-petr-item/${itemId}/`, {
          method: 'DELETE'
        });

        const resultDelete = await responseDelete.json();

        if (!resultDelete.success) {
          throw new Error(resultDelete.error);
        }
      }
      itensParaDeletar = [];

      for (const item of itensSubtabela) {
        if (!item.id) {
          const responseItem = await fetch(`/api/insp-petr/${inspPetrId}/subtab/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              DescInspPetr: item.DescInspPetr,
              auditorPetr: item.auditorPetr,
              gerAuditorPetr: item.gerAuditorPetr
            })
          });

          const resultItem = await responseItem.json();

          if (resultItem.success) {
            item.id = resultItem.data.id;
          }
        }
      }

    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR DADOS =====
  function limpar() {
    inspPetrId = null;
    itensSubtabela = [];
    itensParaDeletar = [];
    elementos.checkbox.checked = false;
    elementos.obs.value = '';
    elementos.selectDesc.value = '';
    elementos.inputAuditor.value = '';
    elementos.inputGerencia.value = '';
    elementos.tbody.innerHTML = '';
    toggleSubtabela();
  }

  // ===== EXPORTAR FUNÇÕES PÚBLICAS =====
  return {
    init,
    carregarDados,
    salvar,
    limpar,
    removerLinha
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', InspPetrModule.init);
} else {
  InspPetrModule.init();
}