// Módulo para gerenciar Troca de Turma na Passagem de Serviço (PS)

const TrocaTurmaModule = (() => {
  let trocaTurmaId = null;

  // Referências aos elementos DOM
  const elementos = {
    porto: document.getElementById('ttPorto'),
    terminal: document.getElementById('ttTerminal'),
    os: document.getElementById('ttOS'),
    atracacao: document.getElementById('ttAtracacao'),
    duracao: document.getElementById('ttDuracao'),
    obs: document.getElementById('ttObs')
  };

  // ===== INICIALIZAR =====
  function init() {
    // Módulo simples, sem eventos especiais
  }

  // ===== CARREGAR DADOS (chamado ao abrir PS) =====
  async function carregarDados(psId) {
    if (!psId) return;

    try {
      // Buscar troca de turma da PS
      const response = await fetch(`/api/ps/${psId}/troca-turma/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        // Se Não existe troca de turma, criar uma nova
        await criarTrocaTurma(psId);
        return;
      }

      // Se Existe troca de turma, preencher dados
      trocaTurmaId = result.data.id;
      elementos.porto.value = result.data.Porto || '';
      elementos.terminal.value = result.data.Terminal || '';
      elementos.os.value = result.data.OrdSerPorto || '';
      elementos.atracacao.value = result.data.AtracPorto || '';
      elementos.duracao.value = result.data.DuracPorto || '';
      elementos.obs.value = result.data.ObservPorto || '';

    } catch (error) {
      alert('Erro ao carregar Troca de Turma: ' + error.message);
    }
  }

  // ===== CRIAR TROCA DE TURMA =====
  async function criarTrocaTurma(psId) {
    try {
      const response = await fetch(`/api/ps/${psId}/troca-turma/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Porto: '',
          Terminal: '',
          OrdSerPorto: '',
          AtracPorto: '00:00',
          DuracPorto: '',
          ObservPorto: ''
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      trocaTurmaId = result.data.id;

    } catch (error) {
      alert('Erro ao criar Troca de Turma: ' + error.message);
    }
  }

  // ===== SALVAR DADOS (chamada  por PassagensModule) =====
  async function salvar() {
    if (!trocaTurmaId) return;

    try {
      const dados = {
        Porto: elementos.porto.value.trim(),
        Terminal: elementos.terminal.value.trim(),
        OrdSerPorto: elementos.os.value.trim(),
        AtracPorto: elementos.atracacao.value,
        DuracPorto: elementos.duracao.value.trim(),
        ObservPorto: elementos.obs.value.trim()
      };

      const response = await fetch(`/api/troca-turma/${trocaTurmaId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR DADOS =====
  function limpar() {
    trocaTurmaId = null;
    elementos.porto.value = '';
    elementos.terminal.value = '';
    elementos.os.value = '';
    elementos.atracacao.value = '';
    elementos.duracao.value = '';
    elementos.obs.value = '';
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
  document.addEventListener('DOMContentLoaded', TrocaTurmaModule.init);
} else {
  TrocaTurmaModule.init();
}