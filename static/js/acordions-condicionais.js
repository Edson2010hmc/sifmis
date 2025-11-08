// static/js/acordions-condicionais.js
// Módulo para controle de visibilidade de acordions condicionais baseado no tipo de embarcação

(function () {
    'use strict';

    //============CONTROLAR VISIBILIDADE DOS ACORDIONS CONDICIONAIS==========
    function controlarAcordionsCondicionais(tipoEmbarcacao) {
        // Tipos que devem exibir acordions de mergulho: TUP, DSV, SDSV
        const tiposPermitidos = ['TUP', 'DSV', 'SDSV'];

        // Normalizar tipo da embarcação (remover espaços e converter para maiúsculas)
        const tipoNormalizado = (tipoEmbarcacao || '').trim().toUpperCase();

        // Verificar se o tipo está na lista permitida
        const exibirMergulho = tiposPermitidos.includes(tipoNormalizado);

        console.log(`[ACORDIONS-COND] Tipo embarcação: ${tipoNormalizado}, Exibir mergulho: ${exibirMergulho}`);

        // Buscar todos os acordions condicionais (que possuem data-tipo-barco)
        const acordionsCondicionais = document.querySelectorAll('.accordion-item[data-tipo-barco]');

        console.log(`[ACORDIONS-COND] Total de acordions condicionais encontrados: ${acordionsCondicionais.length}`);

        acordionsCondicionais.forEach(accordion => {
            if (exibirMergulho) {
                // Exibir accordion
                accordion.style.display = '';
                console.log(`[ACORDIONS-COND] Exibindo accordion`);
            } else {
                // Ocultar accordion
                accordion.style.display = 'none';
                console.log(`[ACORDIONS-COND] Ocultando accordion`);

                // Se estiver aberto, fechar
                const content = accordion.querySelector('.accordion-content');
                const toggle = accordion.querySelector('.toggle');
                if (content && content.classList.contains('active')) {
                    content.classList.remove('active');
                    if (toggle) toggle.textContent = '▼';
                }
            }
        });
    }

    //============INICIALIZAR CONTROLE DE ACORDIONS CONDICIONAIS==========
    function inicializarAcordionsCondicionais() {
        console.log('[ACORDIONS-COND] Inicializando módulo...');

        // Ocultar TODOS os accordions condicionais por padrão ao carregar a página
        const acordionsCondicionais = document.querySelectorAll('.accordion-item[data-tipo-barco]');
        acordionsCondicionais.forEach(accordion => {
            accordion.style.display = 'none';
        });
        console.log(`[ACORDIONS-COND] ${acordionsCondicionais.length} acordions ocultados por padrão`);
    }

    // Expor funções globalmente para uso por outros módulos
    window.AcordionsCondicionaisModule = {
        controlarAcordionsCondicionais: controlarAcordionsCondicionais,
        inicializarAcordionsCondicionais: inicializarAcordionsCondicionais
    };

    // Auto-inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarAcordionsCondicionais);
    } else {
        inicializarAcordionsCondicionais();
    }

})();