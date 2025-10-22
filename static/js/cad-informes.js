// Módulo para administração (exclusão) de Informes de Anomalia

const CadInformesModule = (() => {
  const API_URL = '/api/informes/'; // GET lista, DELETE /{id}/

  const SELECT_ID = 'admin_inf_list';
  const HINT_ID = 'admin_inf_hint';
  const BTN_DELETE_ID = 'btnAdminInfDelete';

  let selectEl = null;
  let hintEl = null;
  let btnDeleteEl = null;

  // Formata o texto exibido no select
  function textoInformeExibicao(informe) {
    const id = informe.id || '';
    const data = informe.dataEvento || '';
    const hora = informe.horarioEvento || '';
    const tipo = informe.tipo || '';
    const site = informe.siteInstalacao || '';
    const relacao = informe.relacaoEvento || '';
    
    // Formatar data de YYYY-MM-DD para DD/MM/YYYY
    let dataFormatada = data;
    if (data && data.includes('-')) {
      const [ano, mes, dia] = data.split('-');
      dataFormatada = `${dia}/${mes}/${ano}`;
    }
    
    return `ID:${id} | ${dataFormatada} ${hora} | ${tipo} | ${site} | ${relacao}`.trim();
  }

  // Carrega opções no select admin_inf_list
  async function carregarSelectAdminInformes() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!result || !result.success) {
        const msg = (result && result.error) ? result.error : 'Resposta inválida do servidor.';
        throw new Error(msg);
      }

      // Referências
      selectEl = document.getElementById(SELECT_ID);
      hintEl = document.getElementById(HINT_ID);
      btnDeleteEl = document.getElementById(BTN_DELETE_ID);

      if (!selectEl || selectEl.tagName.toUpperCase() !== 'SELECT') {
        // Não encontramos o select correto
        return;
      }

      // Limpa opções e adiciona a opção padrão
      selectEl.innerHTML = '<option value="">— selecione —</option>';

      result.data.forEach(informe => {
        const option = document.createElement('option');
        option.value = informe.id;
        option.textContent = textoInformeExibicao(informe);
        option.dataset.informe = JSON.stringify(informe);
        selectEl.appendChild(option);
      });

      // Estado inicial do hint e botão
      if (hintEl) {
        hintEl.textContent = 'Selecione um informe para poder excluir.';
      }
      if (btnDeleteEl) {
        btnDeleteEl.disabled = true;
      }

    } catch (err) {
      alert('Erro ao carregar informes para administração: ' + (err.message || err));
    }
  }

  // Atualiza hint e habilita botão conforme seleção
  function onSelectChange() {
    selectEl = document.getElementById(SELECT_ID);
    hintEl = document.getElementById(HINT_ID);
    btnDeleteEl = document.getElementById(BTN_DELETE_ID);

    if (!selectEl || selectEl.tagName.toUpperCase() !== 'SELECT') return;

    const selected = selectEl.selectedOptions[0];
    if (!selected || !selected.value) {
      if (hintEl) hintEl.textContent = 'Selecione um informe para poder excluir.';
      if (btnDeleteEl) btnDeleteEl.disabled = true;
      return;
    }

    try {
      const informeData = JSON.parse(selected.dataset.informe || '{}');
      const descricao = textoInformeExibicao(informeData);
      if (hintEl) {
        hintEl.textContent = `Informe selecionado: ${descricao}`;
      }
      if (btnDeleteEl) {
        btnDeleteEl.disabled = false;
      }
    } catch (e) {
      if (hintEl) hintEl.textContent = 'Erro ao ler dados do informe.';
      if (btnDeleteEl) btnDeleteEl.disabled = true;
    }
  }

  // Exclui informe selecionado
  async function excluirInformeSelecionado() {
    selectEl = document.getElementById(SELECT_ID);
    if (!selectEl || selectEl.tagName.toUpperCase() !== 'SELECT') return;

    const selected = selectEl.selectedOptions[0];
    if (!selected || !selected.value) {
      alert('Nenhum informe selecionado.');
      return;
    }

    const informeId = selected.value;
    const informeData = JSON.parse(selected.dataset.informe || '{}');
    const descricao = textoInformeExibicao(informeData);

    if (!confirm(`Deseja realmente excluir o informe?\n\n${descricao}\n\nEsta ação é irreversível.`)) {
      return;
    }

    if (btnDeleteEl) btnDeleteEl.disabled = true;
    selectEl.disabled = true;

    try {
      const response = await fetch(`${API_URL}${informeId}/`, { method: 'DELETE' });
      const result = await response.json();

      if (!result || !result.success) {
        const msgErr = (result && result.error) ? result.error : 'Erro ao excluir no servidor.';
        throw new Error(msgErr);
      }

      alert('Informe excluído com sucesso.');

      // Recarregar select
      await carregarSelectAdminInformes();

    } catch (err) {
      alert('Erro ao excluir informe: ' + (err.message || err));
    } finally {
      if (btnDeleteEl) btnDeleteEl.disabled = false;
      selectEl.disabled = false;
      onSelectChange();
    }
  }

  // Configura listeners do select e do botão excluir
  function configurarControles() {
    selectEl = document.getElementById(SELECT_ID);
    btnDeleteEl = document.getElementById(BTN_DELETE_ID);

    if (selectEl && selectEl.tagName.toUpperCase() === 'SELECT') {
      // Remove event listeners duplicados substituindo o node
      const novoSelect = selectEl.cloneNode(true);
      selectEl.parentNode.replaceChild(novoSelect, selectEl);
      selectEl = document.getElementById(SELECT_ID);
      selectEl.addEventListener('change', onSelectChange);
    }

    if (btnDeleteEl) {
      const novoBtn = btnDeleteEl.cloneNode(true);
      btnDeleteEl.parentNode.replaceChild(novoBtn, btnDeleteEl);
      btnDeleteEl = document.getElementById(BTN_DELETE_ID);
      btnDeleteEl.addEventListener('click', function (ev) {
        ev.preventDefault();
        excluirInformeSelecionado();
      });
    }
  }

  // Inicialização
  function init() {
    carregarSelectAdminInformes();
    configurarControles();
  }

  // Função pública para recarregar manualmente
  async function reload() {
    await carregarSelectAdminInformes();
  }

  // Auto-init quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    reload
  };
})();