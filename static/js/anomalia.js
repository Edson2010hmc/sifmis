// static/js/anomalia.js
// Módulo para gerenciar Informe de Anomalia

const AnomaliaModule = (() => {
  let informeAtualId = null;
  let pessoasSubtabela = [];
  let pessoasParaDeletar = [];

  // Referências aos elementos DOM
  const elementos = {
    tipo: document.getElementById('anTipo'),
    siteInstalacao: document.getElementById('anSiteInstalacao'),
    empresa: document.getElementById('anEmpresa'),
    subcontratada: document.getElementById('anSubcontratada'),
    subcontratadaNA: document.getElementById('anSubcontratadaNA'),
    data: document.getElementById('anData'),
    horario: document.getElementById('anHorario'),
    municipioUF: document.getElementById('anMunicipioUF'),
    municipioOutro: document.getElementById('anMunicipioOutro'),
    containerMunicipioOutro: document.getElementById('containerMunicipioOutro'),
    descricao: document.getElementById('anDescricao'),
    relacaoEvento: document.getElementById('anRelacaoEvento'),
    containerSubtabelaPessoas: document.getElementById('containerSubtabelaPessoas'),
    acoesAdotadas: document.getElementById('anAcoesAdotadas'),
    os1: document.getElementById('anOS1'),
    os2: document.getElementById('anOS2'),
    operacaoParalisada: document.getElementById('anOperacaoParalisada'),
    containerCamposEmbarcacao: document.getElementById('containerCamposEmbarcacao'),
    sistemaDegradado: document.getElementById('anSistemaDegradado'),
    embarcacaoDerivou: document.getElementById('anEmbarcacaoDerivou'),
    embarcacaoPerdeuPosicao: document.getElementById('anEmbarcacaoPerdeuPosicao'),
    infoComplementares: document.getElementById('anInfoComplementares'),
    // Campos subtabela pessoas
    pessoaNome: document.getElementById('pessoaNome'),
    pessoaIdade: document.getElementById('pessoaIdade'),
    pessoaFuncao: document.getElementById('pessoaFuncao'),
    pessoaTempoFuncao: document.getElementById('pessoaTempoFuncao'),
    pessoaTempoEmpresa: document.getElementById('pessoaTempoEmpresa'),
    pessoaUltimaFolga: document.getElementById('pessoaUltimaFolga'),
    pessoaDesembarque: document.getElementById('pessoaDesembarque'),
    pessoaResgateAero: document.getElementById('pessoaResgateAero'),
    pessoaSituacao: document.getElementById('pessoaSituacao'),
    btnAddPessoa: document.getElementById('btnAddPessoa'),
    tblPessoas: document.getElementById('tblPessoas').querySelector('tbody'),
    // Botões
    btnSalvar: document.getElementById('btnSalvarAnomalia'),
    btnLimpar: document.getElementById('btnLimparAnomalia')
  };

  // ===== INICIALIZAR =====
  function init() {
    configurarEventos();
    carregarEmbarcacoes();
    setDataHoraAtual();
  }

  // ===== CONFIGURAR EVENTOS =====
  function configurarEventos() {
    // Checkbox Não Aplicável
    elementos.subcontratadaNA.addEventListener('change', function() {
      if (this.checked) {
        elementos.subcontratada.value = '';
        elementos.subcontratada.disabled = true;
      } else {
        elementos.subcontratada.disabled = false;
      }
    });

    // Município Outro
    elementos.municipioUF.addEventListener('change', function() {
      if (this.value === 'OUTRO') {
        elementos.containerMunicipioOutro.style.display = 'block';
      } else {
        elementos.containerMunicipioOutro.style.display = 'none';
        elementos.municipioOutro.value = '';
      }
    });

    // Relação do Evento
    elementos.relacaoEvento.addEventListener('change', function() {
      toggleCamposPorRelacao(this.value);
    });

    // Embarcação selecionada
    elementos.siteInstalacao.addEventListener('change', async function() {
      if (this.value) {
        await carregarEmpresas(this.value);
      } else {
        elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
      }
    });

    // Adicionar pessoa
    elementos.btnAddPessoa.addEventListener('click', adicionarPessoa);

    // Salvar
    elementos.btnSalvar.addEventListener('click', salvar);

    // Limpar
    elementos.btnLimpar.addEventListener('click', limpar);
  }

  // ===== SETAR DATA E HORA ATUAL =====
  function setDataHoraAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hora = String(hoje.getHours()).padStart(2, '0');
    const min = String(hoje.getMinutes()).padStart(2, '0');
    
    elementos.data.value = `${ano}-${mes}-${dia}`;
    elementos.horario.value = `${hora}:${min}`;
  }

  // ===== CARREGAR EMBARCAÇÕES =====
  async function carregarEmbarcacoes() {
    try {
      const response = await fetch('/api/barcos/');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      elementos.siteInstalacao.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(barco => {
        const option = document.createElement('option');
        option.value = barco.id;
        option.textContent = `${barco.TipoBarco} ${barco.nomeBarco}`;
        elementos.siteInstalacao.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar embarcações: ' + error.message);
    }
  }

  // ===== CARREGAR EMPRESAS DA EMBARCAÇÃO =====
  async function carregarEmpresas(embarcacaoId) {
    try {
      const response = await fetch(`/api/embarcacoes/${embarcacaoId}/empresas/`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
      
      result.data.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa;
        option.textContent = empresa;
        elementos.empresa.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar empresas: ' + error.message);
    }
  }

  // ===== TOGGLE CAMPOS POR RELAÇÃO DO EVENTO =====
  function toggleCamposPorRelacao(relacao) {
    // Subtabela de pessoas
    if (relacao === 'PESSOAS') {
      elementos.containerSubtabelaPessoas.style.display = 'block';
    } else {
      elementos.containerSubtabelaPessoas.style.display = 'none';
    }

    // Campos de embarcação
    if (relacao === 'EMBARCACAO') {
      elementos.containerCamposEmbarcacao.style.display = 'block';
      elementos.sistemaDegradado.disabled = false;
      elementos.embarcacaoDerivou.disabled = false;
      elementos.embarcacaoPerdeuPosicao.disabled = false;
    } else {
      elementos.containerCamposEmbarcacao.style.display = 'none';
      elementos.sistemaDegradado.value = '';
      elementos.embarcacaoDerivou.value = '';
      elementos.embarcacaoPerdeuPosicao.value = '';
      elementos.sistemaDegradado.disabled = true;
      elementos.embarcacaoDerivou.disabled = true;
      elementos.embarcacaoPerdeuPosicao.disabled = true;
    }
  }

  // ===== ADICIONAR PESSOA À SUBTABELA =====
  function adicionarPessoa() {
    const nome = elementos.pessoaNome.value.trim();
    const idade = elementos.pessoaIdade.value.trim();
    const funcao = elementos.pessoaFuncao.value.trim();

    if (!nome || !idade || !funcao) {
      alert('Preencha pelo menos Nome, Idade e Função');
      return;
    }

    const pessoa = {
      id: null,
      nome: nome,
      idade: idade,
      funcao: funcao,
      tempoExpFuncao: elementos.pessoaTempoFuncao.value.trim(),
      tempoExpEmpresa: elementos.pessoaTempoEmpresa.value.trim(),
      duracaoUltimaFolga: elementos.pessoaUltimaFolga.value.trim(),
      necessarioDesembarque: elementos.pessoaDesembarque.value,
      resgateAeromedico: elementos.pessoaResgateAero.value,
      situacaoAtual: elementos.pessoaSituacao.value.trim()
    };

    pessoasSubtabela.push(pessoa);
    renderizarTabelaPessoas();
    limparCamposPessoa();
  }

  // ===== RENDERIZAR TABELA DE PESSOAS =====
  function renderizarTabelaPessoas() {
    elementos.tblPessoas.innerHTML = '';

    pessoasSubtabela.forEach((pessoa, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td style="border:1px solid #ddd; padding:8px;">${pessoa.nome}</td>
        <td style="border:1px solid #ddd; padding:8px;">${pessoa.idade}</td>
        <td style="border:1px solid #ddd; padding:8px;">${pessoa.funcao}</td>
        <td style="border:1px solid #ddd; padding:8px;">${pessoa.necessarioDesembarque}</td>
        <td style="border:1px solid #ddd; padding:8px;">
          <button class="btn small" onclick="AnomaliaModule.removerPessoa(${index})">Remover</button>
        </td>
      `;
      
      elementos.tblPessoas.appendChild(tr);
    });
  }

  // ===== REMOVER PESSOA =====
  function removerPessoa(index) {
    if (pessoasSubtabela[index].id) {
      pessoasParaDeletar.push(pessoasSubtabela[index].id);
    }
    
    pessoasSubtabela.splice(index, 1);
    renderizarTabelaPessoas();
  }

  // ===== LIMPAR CAMPOS DE PESSOA =====
  function limparCamposPessoa() {
    elementos.pessoaNome.value = '';
    elementos.pessoaIdade.value = '';
    elementos.pessoaFuncao.value = '';
    elementos.pessoaTempoFuncao.value = '';
    elementos.pessoaTempoEmpresa.value = '';
    elementos.pessoaUltimaFolga.value = '';
    elementos.pessoaDesembarque.value = '';
    elementos.pessoaResgateAero.value = '';
    elementos.pessoaSituacao.value = '';
  }

  // ===== SALVAR INFORME =====
  async function salvar() {
    try {
      // Validações básicas
      if (!elementos.tipo.value) {
        alert('Selecione o tipo de anomalia');
        return;
      }

      if (!elementos.siteInstalacao.value) {
        alert('Selecione a instalação');
        return;
      }

      if (!elementos.empresa.value) {
        alert('Selecione a empresa');
        return;
      }

      // Obter texto da embarcação selecionada
      const siteInstalacaoTexto = elementos.siteInstalacao.options[elementos.siteInstalacao.selectedIndex].text;

      const dados = {
        tipo: elementos.tipo.value,
        siteInstalacao: siteInstalacaoTexto,
        empresa: elementos.empresa.value,
        subcontratada: elementos.subcontratadaNA.checked ? null : elementos.subcontratada.value,
        subcontratadaNaoAplicavel: elementos.subcontratadaNA.checked,
        dataEvento: elementos.data.value,
        horarioEvento: elementos.horario.value,
        municipioUF: elementos.municipioUF.value,
        municipioOutro: elementos.municipioUF.value === 'OUTRO' ? elementos.municipioOutro.value : null,
        descricao: elementos.descricao.value,
        relacaoEvento: elementos.relacaoEvento.value,
        acoesAdotadas: elementos.acoesAdotadas.value,
        ordemServico1: elementos.os1.value,
        ordemServico2: elementos.os2.value,
        operacaoParalisada: elementos.operacaoParalisada.value,
        sistemaDegradado: elementos.relacaoEvento.value === 'EMBARCACAO' ? elementos.sistemaDegradado.value : null,
        embarcacaoDerivou: elementos.relacaoEvento.value === 'EMBARCACAO' ? elementos.embarcacaoDerivou.value : null,
        embarcacaoPerdeuPosicao: elementos.relacaoEvento.value === 'EMBARCACAO' ? elementos.embarcacaoPerdeuPosicao.value : null,
        informacoesComplementares: elementos.infoComplementares.value
      };

      let response, result;

      if (informeAtualId) {
        // Atualizar existente
        response = await fetch(`/api/informes/${informeAtualId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });
      } else {
        // Criar novo
        response = await fetch('/api/informes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });
      }

      result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      informeAtualId = result.data.id;

      // Salvar pessoas se relação for PESSOAS
      if (elementos.relacaoEvento.value === 'PESSOAS') {
        await salvarPessoas();
      }

      alert('Informe de anomalia salvo com sucesso!');

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  }

  // ===== SALVAR PESSOAS =====
  async function salvarPessoas() {
    try {
      // Deletar pessoas removidas
      for (const pessoaId of pessoasParaDeletar) {
        await fetch(`/api/pessoas/${pessoaId}/`, {
          method: 'DELETE'
        });
      }
      pessoasParaDeletar = [];

      // Adicionar novas pessoas
      for (const pessoa of pessoasSubtabela) {
        if (!pessoa.id) {
          const response = await fetch(`/api/informes/${informeAtualId}/pessoas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pessoa)
          });

          const result = await response.json();
          if (result.success) {
            pessoa.id = result.data.id;
          }
        }
      }

    } catch (error) {
      throw error;
    }
  }

  // ===== LIMPAR FORMULÁRIO =====
  function limpar() {
    if (informeAtualId) {
      if (!confirm('Deseja realmente limpar o formulário?')) {
        return;
      }
    }

    informeAtualId = null;
    pessoasSubtabela = [];
    pessoasParaDeletar = [];

    elementos.tipo.value = '';
    elementos.siteInstalacao.value = '';
    elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
    elementos.subcontratada.value = '';
    elementos.subcontratadaNA.checked = false;
    elementos.subcontratada.disabled = false;
    setDataHoraAtual();
    elementos.municipioUF.value = '';
    elementos.municipioOutro.value = '';
    elementos.containerMunicipioOutro.style.display = 'none';
    elementos.descricao.value = '';
    elementos.relacaoEvento.value = '';
    elementos.acoesAdotadas.value = '';
    elementos.os1.value = '';
    elementos.os2.value = '';
    elementos.operacaoParalisada.value = '';
    elementos.sistemaDegradado.value = '';
    elementos.embarcacaoDerivou.value = '';
    elementos.embarcacaoPerdeuPosicao.value = '';
    elementos.infoComplementares.value = '';
    
    elementos.containerSubtabelaPessoas.style.display = 'none';
    elementos.containerCamposEmbarcacao.style.display = 'none';
    elementos.tblPessoas.innerHTML = '';
    limparCamposPessoa();
  }

  // ===== EXPORTAR FUNÇÕES PÚBLICAS =====
  return {
    init,
    removerPessoa
  };

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AnomaliaModule.init);
} else {
  AnomaliaModule.init();
}