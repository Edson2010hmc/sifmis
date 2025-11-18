// ===== MÓDULO: ABASTECIMENTO (1.3) =====

const AbastModule = (() => {
  let abastId = null;
  let arquivoAtual = null;
  let dataEmissaoPS = null;
  // Referências aos elementos DOM
  const elementos = {
    checkbox: document.getElementById('abNaoPrevisto'),
    os: document.getElementById('abOS'),
    prevInicio: document.getElementById('prevInicioAbast'),
    qtd: document.getElementById('abQtd'),
    duracao: document.getElementById('abDuracao'),
    ultAbast: document.getElementById('ultimoAbast'),
    ultQtd: document.getElementById('ultAbastQtd'),
    anexo: document.getElementById('abAnexo'),
    obs: document.getElementById('abObs'),
    containerCampos: document.getElementById('containerCamposAbast'),
    linkDownload: document.getElementById('linkDownloadAbast'),
    msgUltAbast: document.getElementById('msgUltAbast')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    elementos.checkbox.addEventListener('change', function () {
      toggleCampos();
    });
  }

  // ===== CONTROLAR VISIBILIDADE DOS CAMPOS =====
  function toggleCampos() {
    const previsto = !elementos.checkbox.checked;
    elementos.containerCampos.style.display = previsto ? 'block' : 'none';
    if (elementos.checkbox.checked) {
      elementos.os.value = '';
      elementos.prevInicio.value = '';
      elementos.qtd.value = '';
      elementos.obs.value = '';
      elementos.duracao.value = '';
    }
    else {
      elementos.prevInicio.value = dataEmissaoPS;
    }
  }

  // ===== CRIAR ABASTECIMENTO =====
  async function criarAbastecimento(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/abast/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prevAbast: true
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      abastId = result.data.id;
      elementos.checkbox.checked = false;
      toggleCampos();

      await buscarUltimoAbastecimento(psId);

    } catch (error) {
      alert('Erro ao criar Abastecimento: ' + error.message);
    }
  }

  // ===== BUSCAR ÚLTIMO ABASTECIMENTO =====
  async function buscarUltimoAbastecimento(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/ultimo-abastecimento/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.encontrado) {
        elementos.ultAbast.value = result.data.UltAbast;
        elementos.ultQtd.value = result.data.QuantUltAbast;
        elementos.msgUltAbast.textContent = '';
      } else {
        elementos.ultAbast.value = '';
        elementos.ultQtd.value = '';
        elementos.msgUltAbast.textContent = result.mensagem;
        elementos.msgUltAbast.style.color = '#b33';
        elementos.msgUltAbast.style.fontSize = '12px';
        elementos.msgUltAbast.style.marginLeft = '10px';
      }

    } catch (error) {
      alert('Erro ao buscar último abastecimento: ' + error.message);
    }
  }

  // ===== CARREGAR DADOS (chamado ao abrir PS) =====
  async function carregarDados(psId, dataEmissao) {
    if (!psId) return;
    psAtualId = psId;
    dataEmissaoPS = dataEmissao;
    console.log(dataEmissao)
    try {
      const response = await fetch(`/api/ps/${psId}/abast/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        await criarAbastecimento(psId);
        return;
      }

      abastId = result.data.id;
      elementos.checkbox.checked = !result.data.prevAbast;
      elementos.os.value = result.data.OrdSerAbast || '';
      elementos.prevInicio.value = result.data.DataHoraPrevAbast ? result.data.DataHoraPrevAbast.slice(0, 16) : '';
      elementos.qtd.value = result.data.QuantAbast || '';
      elementos.duracao.value = result.data.DuracPrev || '';
      elementos.ultAbast.value = result.data.UltAbast || '';
      elementos.ultQtd.value = result.data.QuantUltAbast || '';
      elementos.obs.value = result.data.ObservAbast || '';

      arquivoAtual = result.data.Anexos ? {
        url: result.data.Anexos,
        nome: result.data.AnexosNome
      } : null;

      mostrarLinkDownload();
      toggleCampos();

      if (!result.data.UltAbast && !result.data.QuantUltAbast) {
        await buscarUltimoAbastecimento(psId);
      }

    } catch (error) {
      alert('Erro ao carregar Abastecimento: ' + error.message);
    }
  }

  // ===== MOSTRAR LINK DE DOWNLOAD =====
  function mostrarLinkDownload() {
    if (!arquivoAtual) {
      elementos.linkDownload.innerHTML = '';
      return;
    }

    let nomeAbreviado = arquivoAtual.nome;
    if (nomeAbreviado.length > 30) {
      const extensao = nomeAbreviado.split('.').pop();
      nomeAbreviado = nomeAbreviado.substring(0, 26) + '...' + extensao;
    }

    elementos.linkDownload.innerHTML = `<a href="${arquivoAtual.url}" target="_blank" style="color:#0b7a66; text-decoration:underline; margin-left:10px;">${nomeAbreviado}</a>`;
  }

  // ===== SALVAR DADOS (chamado pelo PassagensModule) =====
  async function salvar() {
    if (!abastId) return;

    try {
      const formData = new FormData();
      formData.append('prevAbast', (!elementos.checkbox.checked).toString());
      formData.append('OrdSerAbast', elementos.os.value.trim());

      if (elementos.prevInicio.value) {
        formData.append('DataHoraPrevAbast', elementos.prevInicio.value);
      }

      formData.append('QuantAbast', elementos.qtd.value.trim() || '');
      formData.append('DuracPrev', elementos.duracao.value.trim() || '');

      if (elementos.ultAbast.value) {
        formData.append('UltAbast', elementos.ultAbast.value);
      }

      formData.append('QuantUltAbast', elementos.ultQtd.value.trim() || '');
      formData.append('ObservAbast', elementos.obs.value.trim());

      if (elementos.anexo.files.length > 0) {
        formData.append('Anexos', elementos.anexo.files[0]);
      }

      const response = await fetch(`/api/abast/${abastId}/`, {
        method: 'PUT',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data.Anexos) {
        arquivoAtual = {
          url: result.data.Anexos,
          nome: result.data.AnexosNome
        };
        mostrarLinkDownload();
      }

      elementos.anexo.value = '';

    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR DADOS =====
  function limpar() {
    abastId = null;
    arquivoAtual = null;
    elementos.checkbox.checked = false;
    elementos.os.value = '';
    elementos.prevInicio.value = '';
    elementos.qtd.value = '';
    elementos.duracao.value = '';
    elementos.ultAbast.value = '';
    elementos.ultQtd.value = '';
    elementos.anexo.value = '';
    elementos.obs.value = '';
    elementos.linkDownload.innerHTML = '';
    elementos.msgUltAbast.textContent = '';
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
  document.addEventListener('DOMContentLoaded', AbastModule.init);
} else {
  AbastModule.init();
}