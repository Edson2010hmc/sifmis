// ===== MÓDULO: INSPEÇÃO NORMATIVA (1.4) =====

const InspNormModule = (() => {
  let inspNormId = null;
  let itensSubtabela = [];
  let itensParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('anNaoPrevisto'),
    obs: document.getElementById('anObs'),
    selectDesc: document.getElementById('inspNorDesc'),
    inputOS: document.getElementById('inspNorOS'),
    btnAdicionar: document.getElementById('btnAddInspNorm'),
    tbody: document.querySelector('#tblInspNorm tbody'),
    containerSubtabela: document.getElementById('containerSubtabelaInspNorm')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
    carregarChoices();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    // Checkbox controla visibilidade da subtabela
    elementos.checkbox.addEventListener('change', function() {
      toggleSubtabela();
    });

    // Botão adicionar linha
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
      { value: 'anvisa', label: 'ANVISA' },
      { value: 'classe', label: 'CLASSE' },
      { value: 'marinha', label: 'MARINHA' },
      { value: 'outros', label: 'OUTROS' }
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
    const os = elementos.inputOS.value.trim();

    if (!descricao) {
      alert('Selecione a Descrição');
      elementos.selectDesc.focus();
      return;
    }

    if (!os) {
      alert('Informe o número da OS');
      elementos.inputOS.focus();
      return;
    }

    // Adicionar ao array em memória
    const item = {
      id: null,
      DescInspNorm: descricao,
      OrdSerInspNorm: os
    };

    itensSubtabela.push(item);

    // Renderizar na tabela
    renderizarTabela();

    // Limpar campos
    elementos.selectDesc.value = '';
    elementos.inputOS.value = '';
    elementos.selectDesc.focus();
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela() {
    elementos.tbody.innerHTML = '';

    itensSubtabela.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      const descLabel = elementos.selectDesc.querySelector(`option[value="${item.DescInspNorm}"]`).textContent;
      
      tr.innerHTML = `
        <td>${descLabel}</td>
        <td>${item.OrdSerInspNorm}</td>
        <td><button class="btn small" onclick="InspNormModule.removerLinha(${index})">Remover</button></td>
      `;
      
      elementos.tbody.appendChild(tr);
    });
  }

  // ===== REMOVER LINHA =====
  function removerLinha(index) {
    // Se o item tem ID (existe no banco), marcar para deletar
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
      // Buscar inspeção normativa da PS
      const response = await fetch(`/api/ps/${psId}/insp-norm/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        // Não existe inspeção, criar uma nova
        await criarInspecao(psId);
        return;
      }

      // Existe inspeção, preencher dados
      inspNormId = result.data.id;
      elementos.checkbox.checked = !result.data.prevInsNorm;
      elementos.obs.value = result.data.ObservInspNorm || '';
      
      toggleSubtabela();

      // Carregar itens da subtabela
      await carregarSubtabela(inspNormId);

    } catch (error) {
      alert('Erro ao carregar Inspeção Normativa: ' + error.message);
    }
  }

  // ===== CRIAR INSPEÇÃO NORMATIVA =====
  async function criarInspecao(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/insp-norm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prevInsNorm: true,
          ObservInspNorm: ''
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      inspNormId = result.data.id;
      elementos.checkbox.checked = false;
      toggleSubtabela();

    } catch (error) {
      alert('Erro ao criar Inspeção Normativa: ' + error.message);
    }
  }

  // ===== CARREGAR SUBTABELA =====
  async function carregarSubtabela(inspNormId) {
    try {
      const response = await fetch(`/api/insp-norm/${inspNormId}/subtab/`);
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
    if (!inspNormId) return;

    try {
      // 1. Salvar modelo principal
      const dadosPrincipal = {
        prevInsNorm: !elementos.checkbox.checked,
        ObservInspNorm: elementos.obs.value.trim()
      };

      const responsePrincipal = await fetch(`/api/insp-norm/${inspNormId}/`, {
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
        const responseDelete = await fetch(`/api/insp-norm-item/${itemId}/`, {
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
          const responseItem = await fetch(`/api/insp-norm/${inspNormId}/subtab/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              DescInspNorm: item.DescInspNorm,
              OrdSerInspNorm: item.OrdSerInspNorm
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
    inspNormId = null;
    itensSubtabela = [];
    itensParaDeletar = [];
    elementos.checkbox.checked = false;
    elementos.obs.value = '';
    elementos.selectDesc.value = '';
    elementos.inputOS.value = '';
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
  document.addEventListener('DOMContentLoaded', InspNormModule.init);
} else {
  InspNormModule.init();
}