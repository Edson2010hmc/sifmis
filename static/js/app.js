// ===== APLICAÇÃO PRINCIPAL - GERENCIADOR DE NAVEGAÇÃO ===============

(function() {
  'use strict';

  // ===== INICIALIZAÇÃO ==============================================
  async function init() {
    // Validar usuário ANTES de mostrar interface
    if (typeof AuthModule !== 'undefined' && AuthModule.validarUsuario) {
      const autorizado = await AuthModule.validarUsuario();
      if (!autorizado) {
        return; // Para aqui se não autorizado
      }
    }
    configurarNavegacaoTabs();
    configurarNavegacaoSubtabs();
    configurarAccordion();
    // Fecha todos os accordions ao iniciar
  document.querySelectorAll('.accordion-content').forEach(c => {
    c.classList.remove('active');
  });
  document.querySelectorAll('.accordion-header .toggle').forEach(t => {
    t.textContent = '▼';
  });
    inicializarModulos();
    configurarModalNovaPS();
    if (typeof PassagensModule !== 'undefined' && PassagensModule.carregarPassagensUsuario) {
  PassagensModule.carregarPassagensUsuario();
}
  }

  // ===== CONFIGURAR NAVEGAÇÃO ENTRE TABS PRINCIPAIS =================
  function configurarNavegacaoTabs() {
    const tablinks = document.querySelectorAll('.tablink');
    
    tablinks.forEach(link => {
      link.addEventListener('click', async function() {
        const targetTab = this.getAttribute('data-tab');
        const abaAtual = document.querySelector('.tab.active');
        if (abaAtual && abaAtual.id === 'tab-passagem') {
          if (typeof PassagensModule !== 'undefined' && PassagensModule.salvarAntesDeSair) {
            await PassagensModule.salvarAntesDeSair();
          }
        }
        
        // Remove active de todos os links
        tablinks.forEach(l => l.classList.remove('active'));
        
        // Remove active de todas as tabs
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Adiciona active no link clicado
        this.classList.add('active');
        
        // Adiciona active na tab correspondente
        const targetSection = document.getElementById(`tab-${targetTab}`);
        if (targetSection) {
          targetSection.classList.add('active');
        }
        if (targetTab === 'cadastros') {
          reiniciarCadastros();
        }

      });
    });
  }

  // ===== CONFIGURAR NAVEGAÇÃO ENTRE SUBTABS ==========================
  function configurarNavegacaoSubtabs() {
    const sublinks = document.querySelectorAll('.sublink');
    
    sublinks.forEach(link => {
      link.addEventListener('click', function() {
        const targetSub = this.getAttribute('data-sub');
        
        // Remove active de todos os sublinks
        sublinks.forEach(l => l.classList.remove('active'));
        
        // Remove active de todas as subtabs
        document.querySelectorAll('.subtab').forEach(subtab => {
          subtab.classList.remove('active');
        });
        
        // Adiciona active no sublink clicado
        this.classList.add('active');
        
        // Adiciona active na subtab correspondente
        const targetSubsection = document.getElementById(`sub-${targetSub}`);
        if (targetSubsection) {
          targetSubsection.classList.add('active');
        }
      });
    });
  }
  
// ===== CONFIGURAR ACORDION DAS TELAS ========================
function configurarAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      const content = document.getElementById(`acc-${target}`);
      const toggle = this.querySelector('.toggle');
      
      // Se já está aberto, fecha
      if (content.classList.contains('active')) {
        content.classList.remove('active');
        toggle.textContent = '▼';
        header.closest('.accordion-item').style.width = '600px';

        return;
      }
      
      // Fecha todos os conteúdos
      document.querySelectorAll('.accordion-content').forEach(c => {
        c.classList.remove('active');
      });
      
      // Reset todos os toggles
      document.querySelectorAll('.accordion-header .toggle').forEach(t => {
        t.textContent = '▼';
      });
      
      // Abre o clicado
      content.classList.add('active');
      toggle.textContent = '▲';
      header.closest('.accordion-item').style.width = '100%';

    });
  });
}


// ===== CONFIGURAR MODAL NOVA PS ========================================
function configurarModalNovaPS() {
  // Funções auxiliares para controlar botões
  function desabilitarBotoesMenu() {
    document.querySelectorAll('.tablink').forEach(btn => btn.disabled = true);
  }

  function habilitarBotoesMenu() {
    document.querySelectorAll('.tablink').forEach(btn => btn.disabled = false);
  }
  const btnNova = document.getElementById('btnNova');
  const modal = document.getElementById('modalNovaPS');
  const btnCancelar = document.getElementById('btnModalNovaCancelar');
  const btnConfirmar = document.getElementById('btnModalNovaConfirmar');
  const selectEmb = document.getElementById('selEmbNova');
  const msgNovaPS = document.getElementById('msgNovaPS');
  const msgModal = document.getElementById('msgModalNovaPS');
  
  // Ao clicar em Nova PS
  btnNova.addEventListener('click', async function() {
    // Obter fiscal logado
    const usuario = AuthModule.getUsuarioLogado();
    if (!usuario) {
      alert('Usuário não identificado');
      return;
    }
    
    // Verificar se existe rascunho
    try {
      const response = await fetch('/api/verificar-rascunho/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalNome: `${usuario.chave} - ${usuario.nome}` })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      if (result.existeRascunho) {
        // Mostrar mensagem por 8 segundos
        msgNovaPS.textContent = (`Já existe uma PS em modo rascunho para o fiscal ${usuario.nome}`);
        setTimeout(() => {
          msgNovaPS.textContent = '';
        }, 8000);
        return;
      }
      
      // Não existe rascunho - abrir modal
      carregarEmbarcacoesModal();
      modal.classList.remove('hidden');
      desabilitarBotoesMenu();
      
    } catch (error) {
      alert('Erro ao verificar rascunho: ' + error.message);
    }
  });
  
  // Cancelar modal
  btnCancelar.addEventListener('click', function() {
    modal.classList.add('hidden');
    habilitarBotoesMenu();
    selectEmb.value = '';
    msgModal.textContent = '';
    btnConfirmar.disabled = true;
  });
  
  // Habilitar confirmar quando selecionar embarcação
  selectEmb.addEventListener('change', function() {
    btnConfirmar.disabled = !this.value;
  });
  
// Confirmar seleção
  btnConfirmar.addEventListener('click', function() {
    const embarcacaoId = selectEmb.value;
    
    if (!embarcacaoId) {
      alert('ESCOLHA A EMBARCAÇÃO PARA INICIAR A PASSAGEM DE SERVIÇO');
      return;
    }
    
    // Obter dados da embarcação selecionada
    const selectedOption = selectEmb.selectedOptions[0];
    const barcoData = JSON.parse(selectedOption.dataset.barco);
    
    // Chamar módulo de passagens
    if (typeof PassagensModule !== 'undefined' && PassagensModule.criarNovaPS) {
      PassagensModule.criarNovaPS(embarcacaoId, barcoData);
    }
  });
}

// ===== CARREGAR EMBARCAÇÕES NO MODAL =====================================
async function carregarEmbarcacoesModal() {
  try {
    const response = await fetch('/api/barcos/');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const selectEmb = document.getElementById('selEmbNova');
    selectEmb.innerHTML = '<option value="">— selecione —</option>';
    
    result.data.forEach(barco => {
      const option = document.createElement('option');
      option.value = barco.id;
      option.textContent = `${barco.tipoBarco} - ${barco.nomeBarco}`;
      option.dataset.barco = JSON.stringify(barco);
      selectEmb.appendChild(option);
    });
    
  } catch (error) {
    alert('Erro ao carregar embarcações: ' + error.message);
  }
}

  // ===== INICIALIZAR MÓDULOS EXISTENTES ===================================
  function inicializarModulos() {
    // Inicializar módulo de Fiscais
    if (typeof FiscaisModule !== 'undefined' && FiscaisModule.init) {
      FiscaisModule.init();
    }

    // Inicializar módulo de Embarcações
    if (typeof EmbarcacoesModule !== 'undefined' && EmbarcacoesModule.init) {
      EmbarcacoesModule.init();
    }

    if (typeof PassagensModule !== 'undefined' && PassagensModule.init) {
        PassagensModule.init();
}
  }

// ===== REINICIAR FORMULÁRIOS DE CADASTROS ==================================

  function reiniciarCadastros() {
    // Reinicia formulário de Fiscais
    if (typeof FiscaisModule !== 'undefined' && FiscaisModule.reiniciar) {
      FiscaisModule.reiniciar();
    }

    // Reinicia formulário de Embarcações
    if (typeof EmbarcacoesModule !== 'undefined' && EmbarcacoesModule.reiniciar) {
      EmbarcacoesModule.reiniciar();
    }
     document.querySelectorAll('.accordion-content').forEach(c => {
    c.classList.remove('active');
  });
  document.querySelectorAll('.accordion-header .toggle').forEach(t => {
    t.textContent = '▼';
  });
  }

  // ===== EXECUTAR QUANDO DOM CARREGAR =======================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();