// cad-passagens.js


// URL base da API (ajuste se necessário)
const CadPassagensModule = (() => {
  const API_URL = '/api/passagens/'; // GET lista, DELETE /{id}/

  const SELECT_ID = 'admin_ps_list';
  const HINT_ID = 'admin_ps_hint';
  const BTN_DELETE_ID = 'btnAdminPSDelete';

  let selectEl = null;
  let hintEl = null;
  let btnDeleteEl = null;

  // Formata o texto exibido no select
  function textoPSExibicao(ps) {
    const idPS = ps.Id || '';
    const num = (ps.numPS !== undefined && ps.numPS !== null) ? String(ps.numPS).padStart(2, '0') : '??';
    const ano = ps.anoPS || '????';
    const tipo = ps.TipoBarco || '';
    const barco = ps.BarcoPS || '';
    return `${idPS}>${num}/${ano}-${`${tipo} ${barco}`.trim()}`.trim();
  }

  // Carrega opções no select admin_ps_list — só adiciona <option>, nada mais
  async function carregarSelectAdminPassagens() {
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
        // Não encontramos o select correto — não fazemos nada para evitar poluir o DOM
        return;
      }

      // Limpa opções e adiciona a opção padrão
      selectEl.innerHTML = '<option value="">— selecione —</option>';

      result.data.forEach(ps => {
        const option = document.createElement('option');
        option.value = ps.id;
        option.textContent = textoPSExibicao(ps);
        option.dataset.ps = JSON.stringify(ps);
        selectEl.appendChild(option);
      });

      // estado inicial do hint e botão
      if (hintEl) {
        hintEl.textContent = 'Selecione uma PS para poder excluir.';
      }
      if (btnDeleteEl) {
        btnDeleteEl.disabled = true;
      }

    } catch (err) {
      alert('Erro ao carregar passagens para administração: ' + (err.message || err));
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
      if (hintEl) hintEl.textContent = 'Selecione uma PS para poder excluir.';
      if (btnDeleteEl) btnDeleteEl.disabled = true;
      return;
    }

    // mostra o texto completo da PS no hint
    if (hintEl) hintEl.textContent = selected.textContent;
    if (btnDeleteEl) btnDeleteEl.disabled = false;
  }

  // Exclui a PS selecionada
  async function excluirPSSelecionada() {
    selectEl = document.getElementById(SELECT_ID);
    hintEl = document.getElementById(HINT_ID);
    btnDeleteEl = document.getElementById(BTN_DELETE_ID);

    if (!selectEl || selectEl.tagName.toUpperCase() !== 'SELECT') {
      alert('Controle de seleção não encontrado ou inválido.');
      return;
    }

    const selected = selectEl.selectedOptions[0];
    if (!selected || !selected.value) {
      alert('Selecione uma PS para excluir.');
      return;
    }

    const psId = selected.value;
    const psTexto = selected.textContent || '';

    if (!confirm(`Confirma exclusão da PS "${psTexto}"? Esta ação é irreversível.`)) {
      return;
    }

    if (btnDeleteEl) btnDeleteEl.disabled = true;
    selectEl.disabled = true;

    try {
      const response = await fetch(`${API_URL}${psId}/`, { method: 'DELETE' });
      const result = await response.json();

      if (!result || !result.success) {
        const msgErr = (result && result.error) ? result.error : 'Erro ao excluir no servidor.';
        throw new Error(msgErr);
      }

      alert('PS excluída com sucesso.');

      // Recarregar apenas o select (não toca em outros componentes)
      await carregarSelectAdminPassagens();

      // Remover card da lista principal se existir
      const card = document.querySelector(`li[data-ps-id="${psId}"]`);
      if (card && card.parentNode) {
        card.parentNode.removeChild(card);
      }

      // Se existia psAtualId global igual, limpar
      if (typeof window.psAtualId !== 'undefined' && String(window.psAtualId) === String(psId)) {
        window.psAtualId = null;
        const psForm = document.getElementById('psForm');
        const psPlaceholder = document.getElementById('psPlaceholder');
        if (psForm) psForm.classList.add('hidden');
        if (psPlaceholder) psPlaceholder.style.display = '';
      }

    } catch (err) {
      alert('Erro ao excluir PS: ' + (err.message || err));
    } finally {
      if (btnDeleteEl) btnDeleteEl.disabled = false;
      selectEl.disabled = false;
      onSelectChange(); // atualiza hint e botão conforme nova seleção
    }
  }

  // Configura listeners do select e do botão excluir
  function configurarControles() {
    selectEl = document.getElementById(SELECT_ID);
    btnDeleteEl = document.getElementById(BTN_DELETE_ID);

    if (selectEl && selectEl.tagName.toUpperCase() === 'SELECT') {
      // remove event listeners duplicados substituindo o node (evita múltiplas ligações)
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
        excluirPSSelecionada();
      });
    }
  }

  // Inicialização
  function init() {
    carregarSelectAdminPassagens();
    configurarControles();
  }

  // Função pública para recarregar manualmente
  async function reload() {
    await carregarSelectAdminPassagens();
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
