// static/js/assun-pend-contr.js
// Módulo para Assuntos e Pendências Contratuais

const AssunPendContrModule = (() => {
    const API_URL = '/api/assun-pend-contr/';
    let registroEditandoId = null;
    let registroComentarioId = null;
    let modoEdicao = false;

    //============REFERENCIAS DOM============
    const elementos = {
        btnCadastro: document.getElementById('btnCadastroAssunPend'),
        tabelaBody: document.querySelector('#tblAssunPendContr tbody'),
        msgSemRegistros: document.getElementById('msgSemRegistros'),
        modalCadastro: document.getElementById('modalCadastroAssunPend'),
        modalComentario: document.getElementById('modalComentarioAssunPend'),
        selectCrud: document.getElementById('apcSelectCrud'),
        data: document.getElementById('apcData'),
        fiscal: document.getElementById('apcFiscal'),
        classe: document.getElementById('apcClasse'),
        descricao: document.getElementById('apcDescricao'),
        abertoBroa: document.getElementById('apcAbertoBroa'),
        numeroBroa: document.getElementById('apcNumeroBroa'),
        divNumeroBroa: document.getElementById('divNumeroBroa'),
        btnSalvar: document.getElementById('btnApcSalvar'),
        btnEditar: document.getElementById('btnApcEditar'),
        btnExcluir: document.getElementById('btnApcExcluir'),
        comentData: document.getElementById('apcComentData'),
        comentFiscal: document.getElementById('apcComentFiscal'),
        comentDescricao: document.getElementById('apcComentDescricao'),
        btnComentSalvar: document.getElementById('btnApcComentSalvar'),
        fDesCNome: document.getElementById('fDesCNome'),
        contrato: document.getElementById('apcContrato'),
        itemContr: document.getElementById('apcItemContr'),
        anexoContr: document.getElementById('apcAnexoContr')
    };

    let psAtualId = null;
    let fiscalDesembarcando = '';

    //============INICIALIZAR============
    function init() {
        configurarEventos();
        carregarFiscais();
    }

    //============CONFIGURAR EVENTOS============
    function configurarEventos() {
        elementos.btnCadastro.addEventListener('click', abrirModalCadastro);
        elementos.btnSalvar.addEventListener('click', salvarNovo);
        elementos.btnEditar.addEventListener('click', confirmarEdicao);
        elementos.btnExcluir.addEventListener('click', excluirRegistro);
        elementos.selectCrud.addEventListener('change', selecionarRegistro);
        elementos.btnComentSalvar.addEventListener('click', salvarComentario);
        elementos.abertoBroa.addEventListener('change', toggleNumeroBroa);
    }

    //============TOGGLE NUMERO BROA============
    function toggleNumeroBroa() {

        const abBroa = !elementos.abertoBroa.checked;
        elementos.divNumeroBroa.style.display = abBroa ? 'none' : 'block';
    }

    //============CARREGAR FISCAIS============
    async function carregarFiscais() {
        try {
            const response = await fetch('/api/fiscais/perfil-fiscal/');
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            const opcaoVazia = '<option value="">— selecione —</option>';
            let options = '';

            result.data.forEach(fiscal => {
                const texto = `${fiscal.chave} - ${fiscal.nome}`;
                options += `<option value="${texto}">${texto}</option>`;
                //alert(fiscal.nome);
            });

            elementos.fiscal.innerHTML = opcaoVazia + options;
            elementos.comentFiscal.innerHTML = opcaoVazia + options;

        } catch (error) {
            alert('Erro ao carregar fiscais: ' + error.message);
        }
    }

    //============CARREGAR DADOS DA PS============
    async function carregarDados(psId) {
        if (!psId) return;

        psAtualId = psId;

        try {
            // Buscar dados da PS
            const response = await fetch(`/api/passagens/${psId}/`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            fiscalDesembarcando = result.data.fiscalDes;
            // Carregar contratos do barco
            const contratosResp = await fetch(`/api/ps/${psId}/contratos-barco/`);
            const contratosResult = await contratosResp.json();

            elementos.contrato.innerHTML = '<option value="">— selecione —</option>';
            if (contratosResult.success && contratosResult.data) {
                contratosResult.data.forEach(contr => {
                    elementos.contrato.innerHTML += `<option value="${contr}">${contr}</option>`;
                });
            }

            // Carregar lista de registros
            await carregarLista();

        } catch (error) {
            alert('Erro ao carregar dados da PS: ' + error.message);
        }
    }

    //============CARREGAR LISTA DE REGISTROS============
    async function carregarLista() {
        try {
            const response = await fetch(API_URL);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            renderizarTabela(result.data);

            elementos.selectCrud.innerHTML = '<option value="">— selecione —</option>';

            result.data.forEach(reg => {
                const option = document.createElement('option');
                option.value = reg.id;
                option.textContent = `${reg.ano}/${reg.id}`;
                option.dataset.registro = JSON.stringify(reg);
                elementos.selectCrud.appendChild(option);
            });

        } catch (error) {
            alert('Erro ao carregar registros: ' + error.message);
        }
    }

    //============RENDERIZAR TABELA============
    function renderizarTabela(registros) {
        elementos.tabelaBody.innerHTML = '';

        if (!registros || registros.length === 0) {
            elementos.msgSemRegistros.style.display = 'block';
            return;
        }

        elementos.msgSemRegistros.style.display = 'none';

        registros.forEach(reg => {
            const tr = document.createElement('tr');

            const item = `${reg.ano}/${reg.id}`;

            tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:8px;">${item}</td>
        <td style="border:1px solid #ddd; padding:8px;">
          <textarea readonly style="width:100%; min-height:80px; border:none; background:transparent; resize:vertical;">${reg.descricaoCompleta || ''}</textarea>
        </td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center;">
          <button class="btn small" onclick="AssunPendContrModule.abrirModalComentario(${reg.id})">Adicionar Comentário</button>
          <button class="btn small ghost" onclick="AssunPendContrModule.finalizarItem(${reg.id})">Finalizar Item</button>
        </td>
      `;

            elementos.tabelaBody.appendChild(tr);
        });
    }

    //============ABRIR MODAL CADASTRO============
    function abrirModalCadastro() {
        limparFormulario();
        elementos.modalCadastro.classList.add('active');
        elementos.data.value = obterDataAtual();

        // Aguardar um tick para garantir que o select está populado
        setTimeout(() => {
            elementos.fiscal.value = fiscalDesembarcando;
            elementos.fiscal.disabled = true;
        }, 0);
    }

    //============FECHAR MODAL CADASTRO============
    function fecharModalCadastro() {
        elementos.modalCadastro.classList.remove('active');
        limparFormulario();
    }

    //============SELECIONAR REGISTRO============
    function selecionarRegistro() {
        const option = elementos.selectCrud.options[elementos.selectCrud.selectedIndex];

        if (!option.value) {
            limparFormulario();
            return;
        }

        const registro = JSON.parse(option.dataset.registro);

        elementos.data.value = registro.dataRegistroInicial || '';
        elementos.fiscal.value = registro.fiscRegistroInicial || '';
        elementos.classe.value = registro.classeRegistroInicial || '';
        elementos.contrato.value = registro.contrato || '';
        elementos.itemContr.value = registro.itemContr || '';
        elementos.anexoContr.value = registro.anexoContr || '';
        elementos.descricao.value = registro.descrRegistroInicial || '';
        elementos.abertoBroa.checked = registro.abertoBroa || false;
        elementos.numeroBroa.value = registro.numeroBroa || '';
        toggleNumeroBroa();
        registroEditandoId = registro.id;
        elementos.btnSalvar.disabled = true;
        elementos.btnEditar.disabled = false;
        elementos.btnExcluir.disabled = false;
        modoEdicao = true;
        desabilitarCampos(true);
    }

    //============SALVAR NOVO REGISTRO============
    async function salvarNovo() {
        if (!validarCampos()) {
            return;
        }

        try {
            const dados = obterDadosFormulario();

            const parteBroa = dados.abertoBroa && dados.numeroBroa
                ? `BROA N.${dados.numeroBroa}`
                : 'Sem registro no BROA';


            const [ano, mes, dia] = dados.dataRegistroInicial.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            const textoFormatado = `${dados.fiscRegistroInicial} - ${dataFormatada} - ${dados.classeRegistroInicial} - ${parteBroa} - ${dados.descrRegistroInicial}`;


            dados.descrRegistroInicial = textoFormatado;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Registro criado com sucesso!');
            fecharModalCadastro();
            carregarLista();

        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    //============CONFIRMAR EDIÇÃO============
    async function confirmarEdicao() {
        if (!registroEditandoId) return;

        desabilitarCampos(false);
        elementos.btnEditar.textContent = 'Confirmar';
        elementos.btnEditar.removeEventListener('click', confirmarEdicao);
        elementos.btnEditar.addEventListener('click', salvarEdicao);
    }

    //============SALVAR EDIÇÃO============
    async function salvarEdicao() {
        if (!validarCampos()) {
            return;
        }

        try {
            const dados = obterDadosFormulario();
            dados.fiscalEditor = fiscalDesembarcando;

            // Reformatar o texto com os dados atualizados
            const parteBroa = dados.abertoBroa && dados.numeroBroa
                ? `BROA N.${dados.numeroBroa}`
                : 'Sem registro no BROA';

            const [ano, mes, dia] = dados.dataRegistroInicial.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            const textoFormatado = `${dados.fiscRegistroInicial} - ${dataFormatada} - ${dados.classeRegistroInicial} - ${parteBroa} - ${dados.descrRegistroInicial}`;

            dados.descrRegistroInicial = textoFormatado;

            const response = await fetch(`${API_URL}${registroEditandoId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Registro atualizado com sucesso!');
            fecharModalCadastro();
            carregarLista();

        } catch (error) {
            alert('Erro ao atualizar: ' + error.message);
        }
    }

    //============EXCLUIR REGISTRO============
    async function excluirRegistro() {
        if (!registroEditandoId) return;

        if (!confirm('Deseja realmente excluir este registro? Todos os comentários também serão removidos.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}${registroEditandoId}/`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            alert('Registro excluído com sucesso!');
            fecharModalCadastro();
            carregarLista();

        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }

    //============ABRIR MODAL COMENTÁRIO============
    function abrirModalComentario(registroId, finalizacao = false) {
        registroComentarioId = registroId;
        modoFinalizacao = finalizacao;

        elementos.modalComentario.classList.add('active');
        elementos.comentData.value = obterDataAtual();
        elementos.comentData.disabled = true;

        elementos.comentFiscal.value = fiscalDesembarcando;
        elementos.comentFiscal.disabled = true;
        elementos.comentDescricao.value = '';

        if (finalizacao) {
            elementos.btnComentSalvar.textContent = 'Finalizar Item';
        } else {
            elementos.btnComentSalvar.textContent = 'Salvar Comentário';
        }
    }

    //============FECHAR MODAL COMENTÁRIO============
    function fecharModalComentario() {
        elementos.modalComentario.classList.remove('active');
        registroComentarioId = null;
        modoFinalizacao = false;
        elementos.btnComentSalvar.textContent = 'Salvar Comentário';
    }

    //============SALVAR COMENTÁRIO============
    async function salvarComentario() {
        if (!registroComentarioId) return;

        const data = elementos.comentData.value;
        const fiscal = elementos.comentFiscal.value;
        const descricao = elementos.comentDescricao.value.trim();

        if (!data) {
            alert('Informe a data');
            elementos.comentData.focus();
            return;
        }

        if (!fiscal) {
            alert('Selecione o fiscal');
            elementos.comentFiscal.focus();
            return;
        }

        if (!descricao) {
            alert('Informe a descrição do comentário');
            elementos.comentDescricao.focus();
            return;
        }

        if (modoFinalizacao) {
            if (!confirm('Confirma a finalização desse item de pendência, removendo da próxima Passagem de Serviço?')) {
                fecharModalComentario();
                return;
            }
        }

        try {
            const dataHora = obterDataHoraFormatada();
            const textoFormatado = `${fiscal} ${dataHora} - ${descricao}`;

            const dados = {
                dataRegistroComent: data,
                fiscRegistroComent: fiscal,
                descrRegistroComent: textoFormatado
            };

            const response = await fetch(`${API_URL}${registroComentarioId}/subtab/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            if (modoFinalizacao) {
                await finalizarRegistro(registroComentarioId);
                alert('Item finalizado com sucesso!');
            } else {
                alert('Comentário adicionado com sucesso!');
            }

            fecharModalComentario();
            carregarLista();

        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    //============FINALIZAR REGISTRO============
    async function finalizarRegistro(registroId) {
        try {
            const response = await fetch(`${API_URL}${registroId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mantRegistroInicial: false })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

        } catch (error) {
            alert('Erro ao finalizar: ' + error.message);
            throw error;
        }
    }


    //============FINALIZAR ITEM============
    function finalizarItem(registroId) {
        abrirModalComentario(registroId, true);
    }

    //============OBTER DADOS FORMULÁRIO============
    function obterDadosFormulario() {
        return {
            psId: psAtualId,
            dataRegistroInicial: elementos.data.value,
            fiscRegistroInicial: elementos.fiscal.value,
            classeRegistroInicial: elementos.classe.value,
            contrato: elementos.contrato.value,
            itemContr: elementos.itemContr.value.trim(),
            anexoContr: elementos.anexoContr.value.trim(),
            descrRegistroInicial: elementos.descricao.value.trim(),
            abertoBroa: elementos.abertoBroa.checked,
            numeroBroa: elementos.numeroBroa.value.trim() || null
        };
    }

    //============VALIDAR CAMPOS============
    function validarCampos() {
        if (!elementos.data.value) {
            alert('Informe a data');
            elementos.data.focus();
            return false;
        }

        if (!elementos.fiscal.value) {
            alert('Selecione o fiscal');
            elementos.fiscal.focus();
            return false;
        }

        if (!elementos.classe.value) {
            alert('Selecione a classificação');
            elementos.classe.focus();
            return false;
        }

        if (!elementos.descricao.value.trim()) {
            alert('Informe a descrição');
            elementos.descricao.focus();
            return false;
        }

        if (elementos.abertoBroa.checked && !elementos.numeroBroa.value.trim()) {
            alert('Informe o número do BROA');
            elementos.numeroBroa.focus();
            return false;
        }

        if (!elementos.contrato.value) {
            alert('Selecione o contrato');
            elementos.contrato.focus();
            return false;
        }

        if (elementos.classe.value !== 'OUTROS' && !elementos.itemContr.value.trim()) {
            alert('Item contratual é obrigatório para esta classificação');
            elementos.itemContr.focus();
            return false;
        }

        if (!elementos.anexoContr.value.trim()) {
            alert('Informe o anexo contratual');
            elementos.anexoContr.focus();
            return false;
        }

        return true;
    }

    //============LIMPAR FORMULÁRIO============
    function limparFormulario() {
        elementos.selectCrud.value = '';
        elementos.data.value = '';
        elementos.classe.value = '';
        elementos.descricao.value = '';
        elementos.abertoBroa.checked = false;
        elementos.numeroBroa.value = '';
        elementos.divNumeroBroa.style.display = 'none';
        elementos.btnSalvar.disabled = false;
        elementos.btnEditar.disabled = true;
        elementos.btnExcluir.disabled = true;
        registroEditandoId = null;
        modoEdicao = false;
        desabilitarCampos(false);
        elementos.fiscal.value = fiscalDesembarcando;
        elementos.fiscal.disabled = true;
        elementos.btnEditar.textContent = 'Editar';
        elementos.btnEditar.removeEventListener('click', salvarEdicao);
        elementos.btnEditar.addEventListener('click', confirmarEdicao);
        elementos.contrato.value = '';
        elementos.itemContr.value = '';
        elementos.anexoContr.value = '';
    }

    //============DESABILITAR CAMPOS============
    function desabilitarCampos(desabilitar) {
        elementos.data.disabled = desabilitar;
        elementos.fiscal.disabled = desabilitar;
        elementos.classe.disabled = desabilitar;
        elementos.descricao.disabled = desabilitar;
        elementos.contrato.disabled = desabilitar;
        elementos.itemContr.disabled = desabilitar;
        elementos.anexoContr.disabled = desabilitar;
        elementos.abertoBroa.disabled = desabilitar;
        elementos.numeroBroa.disabled = desabilitar;

    }

    //============OBTER DATA ATUAL============
    function obterDataAtual() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    //============OBTER DATA/HORA FORMATADA============
    function obterDataHoraFormatada() {
        const agora = new Date();
        const dia = String(agora.getDate()).padStart(2, '0');
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const ano = agora.getFullYear();
        const hora = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano}`
    }

    //============LIMPAR============
    function limpar() {
        elementos.tabelaBody.innerHTML = '';
        elementos.msgSemRegistros.style.display = 'none';
        psAtualId = null;
        fiscalDesembarcando = '';
    }

    //============EXPORTAR FUNÇÕES PÚBLICAS============
    return {
        init,
        carregarDados,
        limpar,
        abrirModalComentario,
        finalizarItem,
        fecharModalCadastro,
        fecharModalComentario
    };

})();

//============INICIALIZAR QUANDO DOM CARREGAR============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AssunPendContrModule.init);
} else {
    AssunPendContrModule.init();
}