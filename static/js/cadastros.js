// ===== PÁGINA CADASTROS - Configuração Accordion e Autenticação =====
// NOTA: Módulos fiscais.js, embarcacoes.js e cad-passagens.js são AUTO-INICIALIZÁVEIS

(function() {
  'use strict';

  // ===== INICIALIZAÇÃO =====
  async function init() {
    // Validar usuário ANTES de mostrar interface
    if (typeof AuthModule !== 'undefined' && AuthModule.validarUsuario) {
      const autorizado = await AuthModule.validarUsuario();
      if (!autorizado) {
        return;
      }
    }
    
    configurarAccordion();
  }

  // ===== CONFIGURAR ACCORDION (extraído de app.js) =====
  function configurarAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    
    headers.forEach(header => {
      header.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        const content = document.getElementById(`acc-${target}`);
        const toggle = this.querySelector('.toggle');
        
        if (content.classList.contains('active')) {
          content.classList.remove('active');
          toggle.textContent = '▼';
          header.closest('.accordion-item').style.width = '600px';
          return;
        }
        
        document.querySelectorAll('.accordion-content').forEach(c => {
          c.classList.remove('active');
        });
        
        document.querySelectorAll('.accordion-header .toggle').forEach(t => {
          t.textContent = '▼';
        });
        
        content.classList.add('active');
        toggle.textContent = '▲';
        header.closest('.accordion-item').style.width = '100%';
      });
    });
    
    // Fechar todos ao iniciar
    document.querySelectorAll('.accordion-content').forEach(c => {
      c.classList.remove('active');
    });
    document.querySelectorAll('.accordion-header .toggle').forEach(t => {
      t.textContent = '▼';
    });
  }

  // ===== EXECUTAR QUANDO DOM CARREGAR =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();