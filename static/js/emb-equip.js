// ===== MÓDULO: EMBARQUE DE EQUIPES (1.6) =====

const EmbEquipModule = (() => {
  let embEquipId = null;
  let itensSubtabela = [];
  let itensParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('eqNaoPrevisto'),
    obs: document.getElementById('eqObs'),
    selectDesc: document.getElementById('embEquipDesc'),
    inputNome: document.getElementById('eqNome'),
    inputFuncao: document.getElementById('eqFuncao'),
    inputEmpresa: document.getElementById('eqEmpresa'),
    btnAdicionar: document.getElementById('btnAddEmbEquip'),
    tbody: document.querySelector('#tblEmbEquip tbody'),
    containerSubtabela: document.getElementById('containerSubtabelaEmbEquip')
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
      { value: 'CRD', label: 'CRD' },
      { value: 'STC', label: 'STC' },
      { value: 'EQSE', label: 'EQSE' },
      { value: 'STO', label: 'STO' },
      { value: 'CENPES', label: 'CENPES' },
      { value: 'AMBIENTAÇÃO MIS', label: 'AMBIENTAÇÃO MIS' },
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
    const nome = elementos.inputNome.value.trim();
    const funcao = elementos.inputFuncao.value.trim();
    const empresa = elementos.inputEmpresa.value.trim();

    if (!descricao) {
      alert('Selecione a Descrição');
      elementos.selectDesc.focus();
      return;
    }

    if (!nome) {
      alert('Informe o nome');
      elementos.inputNome.focus();
      return;
    }

    if (!funcao) {
      alert('Informe a função');
      elementos.inputFuncao.focus();
      return;
    }

    if (!empresa) {
      alert('Informe a empresa');
      elementos.inputEmpresa.focus();
      return;
    }

    const item = {
      id: null,
      DescEmbEquip: descricao,
      equipNome: nome,
      equipFuncao: funcao,
      equipEmpre: empresa
    };

    itensSubtabela.push(item);
    renderizarTabela();

    elementos.selectDesc.value = '';
    elementos.inputNome.value = '';
    elementos.inputFuncao.value = '';
    elementos.inputEmpresa.value = '';
    elementos.selectDesc.focus();
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela() {
    elementos.tbody.innerHTML = '';

    itensSubtabela.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${item.DescEmbEquip}</td>
        <td>${item.equipNome}</td>
        <td>${item.equipFuncao}</td>
        <td>${item.equipEmpre}</td>
        <td><button class="btn small" onclick="EmbEquipModule.removerLinha(${index})">Remover</button></td>
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
      const response = await fetch(`/api/ps/${psId}/emb-equip/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        await criarRegistro(psId);
        return;
      }

      embEquipId = result.data.id;
      elementos.checkbox.checked = !result.data.prevEmbEquip;
      elementos.obs.value = result.data.ObservEmbEquip || '';
      
      toggleSubtabela();
      await carregarSubtabela(embEquipId);

    } catch (error) {
      alert('Erro ao carregar Embarque de Equipes: ' + error.message);
    }
  }

  // ===== CRIAR REGISTRO PRINCIPAL =====
  async function criarRegistro(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/emb-equip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prevEmbEquip: true,
          ObservEmbEquip: ''
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      embEquipId = result.data.id;
      elementos.checkbox.checked = false;
      toggleSubtabela();

    } catch (error) {
      alert('Erro ao criar registro de Embarque de Equipes: ' + error.message);
    }
  }

  // ===== CARREGAR SUBTABELA =====
  async function carregarSubtabela(embEquipId) {
    try {
      const response = await fetch(`/api/emb-equip/${embEquipId}/subtab/`);
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
    if (!embEquipId) return;

    try {
      // 1. Salvar modelo principal
      const dadosPrincipal = {
        prevEmbEquip: !elementos.checkbox.checked,
        ObservEmbEquip: elementos.obs.value.trim()
      };

      const responsePrincipal = await fetch(`/api/emb-equip/${embEquipId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPrincipal)
      });

      const resultPrincipal = await responsePrincipal.json();

      if (!resultPrincipal.success) {
        throw new Error(resultPrincipal.error);
      }

      // 2. Deletar itens removidos
      for (const itemId of itensParaDeletar) {
        const responseDelete = await fetch(`/api/emb-equip-item/${itemId}/`, {
          method: 'DELETE'
        });

        const resultDelete = await responseDelete.json();

        if (!resultDelete.success) {
          throw new Error(resultDelete.error);
        }
      }
      itensParaDeletar = [];

      // 3. Salvar itens da subtabela (apenas novos)
      for (const item of itensSubtabela) {
        if (!item.id) {
          const responseItem = await fetch(`/api/emb-equip/${embEquipId}/subtab/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              DescEmbEquip: item.DescEmbEquip,
              equipNome: item.equipNome,
              equipFuncao: item.equipFuncao,
              equipEmpre: item.equipEmpre
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
    embEquipId = null;
    itensSubtabela = [];
    itensParaDeletar = [];
    elementos.checkbox.checked = false;
    elementos.obs.value = '';
    elementos.selectDesc.value = '';
    elementos.inputNome.value = '';
    elementos.inputFuncao.value = '';
    elementos.inputEmpresa.value = '';
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
  document.addEventListener('DOMContentLoaded', EmbEquipModule.init);
} else {
  EmbEquipModule.init();
}