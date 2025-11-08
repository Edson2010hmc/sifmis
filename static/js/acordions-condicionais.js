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

        acordionsCondicionais.forEach(accordion => {
            if (exibirMergulho) {
                // Exibir accordion
                accordion.style.display = '';
            } else {
                // Ocultar accordion
                accordion.style.display = 'none';

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
        // Verificar quando uma PS é carregada
        // O tipo da embarcação será obtido do campo fEmb
        const campoEmbarcacao = document.getElementById('fEmb');

        if (campoEmbarcacao) {
            // Executar quando o valor do campo mudar
            const observer = new MutationObserver(() => {
                const valorEmb = campoEmbarcacao.value;
                // Extrair o tipo (primeira palavra antes do hífen)
                const tipo = valorEmb.split(' - ')[0] || '';
                controlarAcordionsCondicionais(tipo);
            });

            observer.observe(campoEmbarcacao, {
                attributes: true,
                attributeFilter: ['value']
            });

            // Também verificar mudanças no value via JavaScript
            campoEmbarcacao.addEventListener('change', function () {
                const valorEmb = this.value;
                const tipo = valorEmb.split(' - ')[0] || '';
                controlarAcordionsCondicionais(tipo);
            });

            // Executar imediatamente se já houver valor
            if (campoEmbarcacao.value) {
                const valorEmb = campoEmbarcacao.value;
                const tipo = valorEmb.split(' - ')[0] || '';
                controlarAcordionsCondicionais(tipo);
            }
        }
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