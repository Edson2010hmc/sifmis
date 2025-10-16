// ===== MÓDULO: MANUTENÇÃO PREVENTIVA (1.2) =====

const ManutPrevModule = (() => {
  let manutPrevId = null;
  let arquivoAtual = null;

  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('mpNaoPrevisto'),
    franquia: document.getElementById('mpFranquia'),
    saldo: document.getElementById('mpSaldo'),
    os: document.getElementById('mpOS'),
    rade: document.getElementById('mpRADE'),
    obs: document.getElementById('mpObs'),
    containerCampos: document.getElementById('containerCamposManutPrev'),
    linkDownload: document.getElementById('linkDownloadRade')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    // Checkbox controla visibilidade dos campos
    elementos.checkbox.addEventListener('change', function() {
      toggleCampos();
    });
  }

  // ===== CONTROLAR VISIBILIDADE DOS CAMPOS =====
  function toggleCampos() {
    const previsto = !elementos.checkbox.checked;
    elementos.containerCampos.style.display = previsto ? 'block' : 'none';
  }

  // ===== CARREGAR DADOS (chamado ao abrir PS) =====
  async function carregarDados(psId) {
    if (!psId) return;

    try {
      // Buscar manutenção preventiva da PS
      const response = await fetch(`/api/ps/${psId}/manut-prev/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        // Não existe manutenção preventiva, criar uma nova
        await criarManutPrev(psId);
        return;
      }

      // Existe manutenção preventiva, preencher dados
      manutPrevId = result.data.id;
      elementos.checkbox.checked = !result.data.prevManPrev;
      elementos.franquia.value = result.data.Franquia || '';
      elementos.saldo.value = result.data.SaldoFranquia || '';
      elementos.os.value = result.data.OrdSerManutPrev || '';
      elementos.obs.value = result.data.ObservManPrev || '';
      
      // Guardar informação do arquivo atual
      arquivoAtual = result.data.Rade ? {
        url: result.data.Rade,
        nome: result.data.RadeNome
      } : null;

      // Mostrar link de download se houver arquivo
      mostrarLinkDownload();
      
      toggleCampos();

    } catch (error) {
      alert('Erro ao carregar Manutenção Preventiva: ' + error.message);
    }
  }

  // ===== CRIAR MANUTENÇÃO PREVENTIVA =====
  async function criarManutPrev(psId) {
    try {
      const formData = new FormData();
      formData.append('prevManPrev', 'true');
      formData.append('Franquia', '0');
      formData.append('SaldoFranquia', '0');
      formData.append('OrdSerManutPrev', '');
      formData.append('ObservManPrev', '');

      const response = await fetch(`/api/ps/${psId}/manut-prev/`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      manutPrevId = result.data.id;
      elementos.checkbox.checked = false;
      toggleCampos();

    } catch (error) {
      alert('Erro ao criar Manutenção Preventiva: ' + error.message);
    }
  }

  // ===== MOSTRAR LINK DE DOWNLOAD =====
  function mostrarLinkDownload() {
    if (!arquivoAtual) {
      elementos.linkDownload.innerHTML = '';
      return;
    }

    // Abreviar nome do arquivo (máximo 30 caracteres)
    let nomeAbreviado = arquivoAtual.nome;
    if (nomeAbreviado.length > 30) {
      const extensao = nomeAbreviado.split('.').pop();
      nomeAbreviado = nomeAbreviado.substring(0, 26) + '...' + extensao;
    }

    elementos.linkDownload.innerHTML = `<a href="${arquivoAtual.url}" target="_blank" style="color:#0b7a66; text-decoration:underline; margin-left:10px;">${nomeAbreviado}</a>`;
  }

  // ===== SALVAR DADOS (chamado pelo PassagensModule) =====
  async function salvar() {
    if (!manutPrevId) return;

    try {
      const formData = new FormData();
      formData.append('prevManPrev', (!elementos.checkbox.checked).toString());
      formData.append('Franquia', elementos.franquia.value.trim() || '0');
      formData.append('SaldoFranquia', elementos.saldo.value.trim() || '0');
      formData.append('OrdSerManutPrev', elementos.os.value.trim());
      formData.append('ObservManPrev', elementos.obs.value.trim());

      // Adicionar arquivo apenas se novo arquivo foi selecionado
      if (elementos.rade.files.length > 0) {
        formData.append('Rade', elementos.rade.files[0]);
      }

      const response = await fetch(`/api/manut-prev/${manutPrevId}/`, {
        method: 'PUT',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Atualizar informação do arquivo atual
      if (result.data.Rade) {
        arquivoAtual = {
          url: result.data.Rade,
          nome: result.data.RadeNome
        };
        mostrarLinkDownload();
      }
      elementos.rade.value = '';
    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR DADOS =====
  function limpar() {
    manutPrevId = null;
    arquivoAtual = null;
    elementos.checkbox.checked = false;
    elementos.franquia.value = '';
    elementos.saldo.value = '';
    elementos.os.value = '';
    elementos.rade.value = '';
    elementos.obs.value = '';
    elementos.linkDownload.innerHTML = '';
    toggleCampos();
  }

  // ===== EXPORTAR FUNÇÕES PÚBLICAS =====
  return {
    init,
    carregarDados,
    salvar,
    limpar
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ManutPrevModule.init);
} else {
  ManutPrevModule.init();
}