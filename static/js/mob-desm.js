// ===== MÓDULO: MOBILIZAÇÃO/DESMOBILIZAÇÃO (1.7) =====

const MobDesmModule = (() => {
  let mobDesmId = null;
  let itensSubtabela = [];
  let itensParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('omNaoPrevisto'),
    obs: document.getElementById('omObs'),
    inputOS: document.getElementById('mobDOS'),
    inputDesc: document.getElementById('mobDDesc'),
    btnAdicionar: document.getElementById('btnAddMobD'),
    tbody: document.querySelector('#tblMobD tbody'),
    containerSubtabela: document.getElementById('containerSubtabelaMobD')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
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

  // ===== ADICIONAR LINHA NA SUBTABELA =====
  function adicionarLinha() {
    const os = elementos.inputOS.value.trim();
    const descricao = elementos.inputDesc.value.trim();

    if (!os) {
      alert('Informe a OS');
      elementos.inputOS.focus();
      return;
    }

    if (!descricao) {
      alert('Informe a Descrição');
      elementos.inputDesc.focus();
      return;
    }

    const item = {
      id: null,
      OsMobD: os,
      DescMobD: descricao
    };

    itensSubtabela.push(item);
    renderizarTabela();

    elementos.inputOS.value = '';
    elementos.inputDesc.value = '';
    elementos.inputOS.focus();
  }

  // ===== RENDERIZAR TABELA =====
  function renderizarTabela() {
    elementos.tbody.innerHTML = '';

    itensSubtabela.forEach((item, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${item.OsMobD}</td>
        <td>${item.DescMobD}</td>
        <td><button class="btn small" onclick="MobDesmModule.removerLinha(${index})">Remover</button></td>
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
      const response = await fetch(`/api/ps/${psId}/mob-desm/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        await criarRegistro(psId);
        return;
      }

      mobDesmId = result.data.id;
      elementos.checkbox.checked = !result.data.prevMobD;
      elementos.obs.value = result.data.ObservMobD || '';
      
      toggleSubtabela();
      await carregarSubtabela(mobDesmId);

    } catch (error) {
      alert('Erro ao carregar Mobilização/Desmobilização: ' + error.message);
    }
  }

  // ===== CRIAR REGISTRO PRINCIPAL =====
  async function criarRegistro(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/mob-desm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prevMobD: true,
          ObservMobD: ''
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      mobDesmId = result.data.id;
      elementos.checkbox.checked = false;
      toggleSubtabela();

    } catch (error) {
      alert('Erro ao criar registro: ' + error.message);
    }
  }

  // ===== CARREGAR SUBTABELA =====
  async function carregarSubtabela(mobDesmId) {
    try {
      const response = await fetch(`/api/mob-desm/${mobDesmId}/subtab/`);
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
    if (!mobDesmId) return;

    try {
      // 1. Salvar modelo principal
      const dadosPrincipal = {
        prevMobD: !elementos.checkbox.checked,
        ObservMobD: elementos.obs.value.trim()
      };

      const responsePrincipal = await fetch(`/api/mob-desm/${mobDesmId}/`, {
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
        const responseDelete = await fetch(`/api/mob-desm-item/${itemId}/`, {
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
          const responseItem = await fetch(`/api/mob-desm/${mobDesmId}/subtab/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              OsMobD: item.OsMobD,
              DescMobD: item.DescMobD
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
    mobDesmId = null;
    itensSubtabela = [];
    itensParaDeletar = [];
    elementos.checkbox.checked = false;
    elementos.obs.value = '';
    elementos.inputOS.value = '';
    elementos.inputDesc.value = '';
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
  document.addEventListener('DOMContentLoaded', MobDesmModule.init);
} else {
  MobDesmModule.init();
}