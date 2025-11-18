// static/js/freq-lv-seg.js
// Módulo para Cadastro de Frequência de LV de Segurança

const FreqLvSegModule = (() => {
    const API_URL = '/api/freq-lv-seg/';
    let modoEdicao = false;
    let freqEditandoId = null;

    // Referências aos elementos DOM
    const elementos = {
        tema: document.getElementById('cad_freq_tema'),
        frequencia: document.getElementById('cad_freq_meses'),
        list: document.getElementById('cad_freq_list'),
        btnSave: document.getElementById('btnSaveFreq'),
        btnEditar: document.getElementById('btnFreqEditar'),
        btnExcluir: document.getElementById('btnFreqExcluir'),
        btnConfirma: document.getElementById('btnFreqConfirma'),
        btnCancela: document.getElementById('btnFreqCancela'),
        editActions: document.getElementById('freqEditActions')
    };

    // ===== INICIALIZAR =====
    function init() {
        configurarEventos();
        carregarFrequencias();
    }

    // ===== CONFIGURAR EVENTOS =====
    function configurarEventos() {
        elementos.btnSave.addEventListener('click', salvar);
        elementos.btnEditar.addEventListener('click', habilitarEdicao);
        elementos.btnExcluir.addEventListener('click', excluir);
        elementos.btnConfirma.addEventListener('click', confirmarEdicao);
        elementos.btnCancela.addEventListener('click', cancelarEdicao);

        elementos.list.addEventListener('change', function () {
            if (this.value) {
                carregarFrequencia(this.value);
                elementos.btnEditar.disabled = false;
                elementos.btnExcluir.disabled = false;
            } else {
                limpar();
            }
        });
    }

    // ===== CARREGAR LISTA DE FREQUÊNCIAS =====
    async function carregarFrequencias() {
        try {
            const response = await fetch(API_URL);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            elementos.list.innerHTML = '<option value="">— selecione —</option>';

            result.data.forEach(freq => {
                const option = document.createElement('option');
                option.value = freq.id;
                option.textContent = `${freq.temaLvSeg} (${freq.freqLvSeg} meses)`;
                elementos.list.appendChild(option);
            });

        } catch (error) {
            alert('Erro ao carregar frequências: ' + error.message);
        }
    }

    // ===== CARREGAR FREQUÊNCIA ESPECÍFICA =====
    async function carregarFrequencia(id) {
        try {
            const response = await fetch(`${API_URL}${id}/`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            elementos.tema.value = result.data.temaLvSeg;
            elementos.frequencia.value = result.data.freqLvSeg;

            freqEditandoId = id;
            desabilitarCampos(true);

        } catch (error) {
            alert('Erro ao carregar frequência: ' + error.message);
        }
    }

    // ===== SALVAR =====
    async function salvar() {
        if (!validarCampos()) return;

        try {
            const dados = {
                temaLvSeg: elementos.tema.value.trim(),
                freqLvSeg: parseInt(elementos.frequencia.value)
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Frequência cadastrada com sucesso!');
            limpar();
            await carregarFrequencias();

        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    // ===== HABILITAR EDIÇÃO =====
    function habilitarEdicao() {
        if (!freqEditandoId) return;

        modoEdicao = true;
        desabilitarCampos(false);

        elementos.btnEditar.style.display = 'none';
        elementos.btnExcluir.style.display = 'none';
        elementos.editActions.style.display = 'block';
    }

    // ===== CONFIRMAR EDIÇÃO =====
    async function confirmarEdicao() {
        if (!validarCampos()) return;

        try {
            const dados = {
                temaLvSeg: elementos.tema.value.trim(),
                freqLvSeg: parseInt(elementos.frequencia.value)
            };

            const response = await fetch(`${API_URL}${freqEditandoId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Frequência atualizada com sucesso!');
            cancelarEdicao();
            await carregarFrequencias();
            limpar();

        } catch (error) {
            alert('Erro ao atualizar: ' + error.message);
        }
    }

    // ===== CANCELAR EDIÇÃO =====
    function cancelarEdicao() {
        modoEdicao = false;

        elementos.btnEditar.style.display = 'inline-block';
        elementos.btnExcluir.style.display = 'inline-block';
        elementos.editActions.style.display = 'none';

        if (freqEditandoId) {
            carregarFrequencia(freqEditandoId);
        }
    }

    // ===== EXCLUIR =====
    async function excluir() {
        if (!freqEditandoId) return;

        if (!confirm('Confirma a exclusão desta frequência de LV?')) return;

        try {
            const response = await fetch(`${API_URL}${freqEditandoId}/`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Frequência excluída com sucesso!');
            limpar();
            await carregarFrequencias();

        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }

    // ===== VALIDAR CAMPOS =====
    function validarCampos() {
        if (!elementos.tema.value.trim()) {
            alert('Preencha o tema da LV de Segurança');
            elementos.tema.focus();
            return false;
        }

        const freq = parseInt(elementos.frequencia.value);
        if (!freq || freq <= 0) {
            alert('Informe uma frequência válida (em meses)');
            elementos.frequencia.focus();
            return false;
        }

        return true;
    }

    // ===== DESABILITAR CAMPOS =====
    function desabilitarCampos(desabilitar) {
        elementos.tema.disabled = desabilitar;
        elementos.frequencia.disabled = desabilitar;
    }

    // ===== LIMPAR =====
    function limpar() {
        elementos.tema.value = '';
        elementos.frequencia.value = '';
        elementos.list.value = '';
        elementos.btnEditar.disabled = true;
        elementos.btnExcluir.disabled = true;
        elementos.editActions.style.display = 'none';
        freqEditandoId = null;
        modoEdicao = false;
        desabilitarCampos(false);
    }

    // ===== REINICIAR =====
    function reiniciar() {
        limpar();
        carregarFrequencias();
    }

    // ===== EXPORTAR =====
    return {
        init,
        reiniciar
    };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', FreqLvSegModule.init);
} else {
    FreqLvSegModule.init();
}