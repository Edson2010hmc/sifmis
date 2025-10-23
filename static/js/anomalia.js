// static/js/anomalia.js
// Módulo para gerenciar Informe de Anomalia

const AnomaliaModule = (() => {
  let informeAtualId = null;
  let pessoasSubtabela = [];
  let pessoasParaDeletar = [];
  let informesCache = [];
  let informesFiltrados = [];

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
    btnLimpar: document.getElementById('btnLimparAnomalia'),
    botoesEstadoInicial: document.getElementById('botoesEstadoInicial'),
    botoesEstadoSalvo: document.getElementById('botoesEstadoSalvo'),
    btnConcluir: document.getElementById('btnConcluirInforme'),
    btnEditar: document.getElementById('btnEditarInforme'),
    btnCancelar: document.getElementById('btnCancelarInforme')

  };


// ===== LIMPAR FORMULÁRIO (versão original - com confirmação) =====
function limpar() {
  if (informeAtualId) {
    if (!confirm('Deseja realmente limpar o formulário?')) {
      return;
    }
  }

  executarLimpeza();
}

// ===== LIMPAR APÓS ENVIO (sem confirmação) =====
function limparAposEnvio() {
  executarLimpeza();
}

// ===== EXECUTAR LIMPEZA (lógica centralizada) =====
function executarLimpeza() {
  informeAtualId = null;
  pessoasSubtabela = [];
  pessoasParaDeletar = [];

  // Limpar campos principais
  elementos.tipo.value = '';
  elementos.siteInstalacao.value = '';
  elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
  elementos.subcontratada.value = '';
  elementos.subcontratadaNA.checked = false;
  elementos.subcontratada.disabled = false;
  elementos.descricao.value = '';
  elementos.relacaoEvento.value = '';
  elementos.acoesAdotadas.value = '';
  elementos.os1.value = '';
  elementos.os2.value = '';
  elementos.operacaoParalisada.value = '';
  elementos.municipioUF.value = '';
  elementos.municipioOutro.value = '';
  elementos.containerMunicipioOutro.style.display = 'none';
  elementos.infoComplementares.value = '';

  // Limpar campos de embarcação
  elementos.sistemaDegradado.value = '';
  elementos.embarcacaoDerivou.value = '';
  elementos.embarcacaoPerdeuPosicao.value = '';

  // Limpar subtabela de pessoas
  limparCamposPessoa();
  renderizarTabelaPessoas();

  // Resetar data/hora para atual
  setDataHoraAtual();

  // Ocultar campos condicionais
  elementos.containerSubtabelaPessoas.style.display = 'none';
  elementos.containerCamposEmbarcacao.style.display = 'none';

  // Remover botão de enviar se existir
  const btnEnviar = document.getElementById('btnEnviarInforme');
  if (btnEnviar) {
    btnEnviar.remove();
  }

  
}

// ===== ALTERNAR VISIBILIDADE DOS BOTÕES =====
function alternarBotoes(estadoSalvo) {
  if (estadoSalvo) {
    // Ocultar botões iniciais (Salvar + Limpar)
    elementos.botoesEstadoInicial.style.display = 'none';
    
    // Exibir botões do estado salvo (Concluir + Editar + Cancelar)
    elementos.botoesEstadoSalvo.style.display = 'flex';
  } else {
    // Exibir botões iniciais (Salvar + Limpar)
    elementos.botoesEstadoInicial.style.display = 'flex';
    
    // Ocultar botões do estado salvo
    elementos.botoesEstadoSalvo.style.display = 'none';
  }
}

// ===== DESABILITAR/HABILITAR TODOS OS CAMPOS =====
function desabilitarCampos(desabilitar) {
  // Desabilitar todos os inputs
  const inputs = document.querySelectorAll('#tab-novo-informe input');
  inputs.forEach(input => {
    input.disabled = desabilitar;
  });
  
  // Desabilitar todos os selects
  const selects = document.querySelectorAll('#tab-novo-informe select');
  selects.forEach(select => {
    select.disabled = desabilitar;
  });
  
  // Desabilitar todos os textareas
  const textareas = document.querySelectorAll('#tab-novo-informe textarea');
  textareas.forEach(textarea => {
    textarea.disabled = desabilitar;
  });
  
  // Desabilitar/habilitar botão de adicionar pessoa
  if (elementos.btnAddPessoa) {
    elementos.btnAddPessoa.disabled = desabilitar;
  }
  
  // Desabilitar/habilitar botões de remover da subtabela
  const botoesRemover = document.querySelectorAll('#tblPessoas button');
  botoesRemover.forEach(btn => {
    btn.disabled = desabilitar;
  });
}

// ===== VERIFICAR E CARREGAR INFORME SALVO =====
async function verificarInformeSalvo() {
  try {
    // Buscar todos os informes
    const response = await fetch('/api/informes/');
    const result = await response.json();
    
    if (!result.success) {
      return;
    }
    
    // Procurar informe com status='SALVO' (mais recente)
    const informesSalvos = result.data.filter(inf => inf.status === 'SALVO');
    
    if (informesSalvos.length === 0) {
      return; // Nenhum informe salvo
    }
    
    // Ordenar por data de atualização (mais recente primeiro)
    informesSalvos.sort((a, b) => {
      const dataA = new Date(a.atualizado_em || a.criado_em);
      const dataB = new Date(b.atualizado_em || b.criado_em);
      return dataB - dataA;
    });
    
    const informe = informesSalvos[0]; // Pegar o mais recente
    
    // Carregar detalhes completos do informe
    const responseDetail = await fetch(`/api/informes/${informe.id}/`);
    const resultDetail = await responseDetail.json();
    
    if (!resultDetail.success) {
      return;
    }
    
    const informeCompleto = resultDetail.data;
    
    // Preencher formulário
    await preencherFormularioComInforme(informeCompleto);
    
    // Aplicar estado congelado
    desabilitarCampos(true);
    alternarBotoes(true);
    
    
    
  } catch (error) {
    console.log('');
  }
}

// ===== PREENCHER FORMULÁRIO COM INFORME =====
async function preencherFormularioComInforme(informe) {
  informeAtualId = informe.id;
  
  elementos.tipo.value = informe.tipo || '';
  elementos.descricao.value = informe.descricao || '';
  elementos.data.value = informe.dataEvento || '';
  elementos.horario.value = informe.horarioEvento || '';
  elementos.municipioUF.value = informe.municipioUF || '';
  
  if (informe.municipioUF === 'OUTRO') {
    elementos.containerMunicipioOutro.style.display = 'block';
    elementos.municipioOutro.value = informe.municipioOutro || '';
  }
  
  elementos.relacaoEvento.value = informe.relacaoEvento || '';
  elementos.acoesAdotadas.value = informe.acoesAdotadas || '';
  elementos.os1.value = informe.ordemServico1 || '';
  elementos.os2.value = informe.ordemServico2 || '';
  elementos.operacaoParalisada.value = informe.operacaoParalisada || '';
  elementos.infoComplementares.value = informe.informacoesComplementares || '';
  
  elementos.subcontratada.value = informe.subcontratada || '';
  elementos.subcontratadaNA.checked = informe.subcontratadaNaoAplicavel || false;
  if (elementos.subcontratadaNA.checked) {
    elementos.subcontratada.disabled = true;
  }
  
  // Campos de embarcação
  if (informe.relacaoEvento === 'EMBARCACAO') {
    elementos.containerCamposEmbarcacao.style.display = 'block';
    elementos.sistemaDegradado.value = informe.sistemaDegradado || '';
    elementos.embarcacaoDerivou.value = informe.embarcacaoDerivou || '';
    elementos.embarcacaoPerdeuPosicao.value = informe.embarcacaoPerdeuPosicao || '';
  }
  
  // Carregar embarcações primeiro
  await carregarEmbarcacoes();
  
  // Selecionar embarcação pelo texto
  const siteTexto = informe.siteInstalacao;
  for (let i = 0; i < elementos.siteInstalacao.options.length; i++) {
    if (elementos.siteInstalacao.options[i].text === siteTexto) {
      elementos.siteInstalacao.selectedIndex = i;
      break;
    }
  }
  
  // Carregar empresas
  if (elementos.siteInstalacao.value) {
    await carregarEmpresas(elementos.siteInstalacao.value);
    
    // Selecionar empresa
    elementos.empresa.value = informe.empresa || '';
  }
  
  // Carregar pessoas se houver
  if (informe.relacaoEvento === 'PESSOAS') {
    elementos.containerSubtabelaPessoas.style.display = 'block';
    
    const responsePessoas = await fetch(`/api/informes/${informe.id}/pessoas/`);
    const resultPessoas = await responsePessoas.json();
    
    if (resultPessoas.success && resultPessoas.data) {
      pessoasSubtabela = resultPessoas.data;
      renderizarTabelaPessoas();
    }
  }
}

// ===== INICIALIZAR ==========================
async function init() {
  configurarEventos();
  configurarNavegacaoTabs();
  configurarEventosConsulta();
  carregarEmbarcacoes();
  carregarEmbarcacoesFiltro();
  setDataHoraAtual();
  await verificarInformeSalvo();
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

    
    elementos.btnAddPessoa.addEventListener('click', adicionarPessoa);
    elementos.btnSalvar.addEventListener('click', salvar);
    elementos.btnLimpar.addEventListener('click', limpar);
    elementos.btnConcluir.addEventListener('click', concluirInforme);
    elementos.btnEditar.addEventListener('click', editarInforme);
    elementos.btnCancelar.addEventListener('click', cancelarInforme);
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
        option.textContent = `${barco.tipoBarco} ${barco.nomeBarco}`;
        elementos.siteInstalacao.appendChild(option);
      });

    } catch (error) {
      alert('Erro ao carregar embarcações: ' + error.message);
    }
  }

// ===== CARREGAR EMPRESAS DA EMBARCAÇÃO =====
async function carregarEmpresas(embarcacaoId) {
  // Limpa e mantém placeholder
  elementos.empresa.innerHTML = '<option value="">— selecione —</option>';

  if (!embarcacaoId) return;

  try {
    const response = await fetch(`/api/barcos/${embarcacaoId}/`);
    if (!response.ok) {
      // Silencioso no front (pywebview); apenas aborta
      return;
    }

    const result = await response.json();
    if (!result || result.success !== true || !result.data) return;

    const { emprServ, emprNav } = result.data;

    const empresas = [emprServ, emprNav]
      .filter(e => typeof e === 'string' && e.trim().length > 0);

    // Evita duplicatas e preserva ordem: emprServ, depois emprNav
    const vistos = new Set();
    for (const nome of empresas) {
      const valor = nome.trim();
      if (vistos.has(valor)) continue;
      vistos.add(valor);

      const opt = document.createElement('option');
      opt.value = valor;
      opt.textContent = valor;
      elementos.empresa.appendChild(opt);
    }
  } catch (_) {
    // Não usar console.log; manter silencioso no front
    return;
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
      aplicarNaoAplicavelCamposEmbarcacao(false);
    } else {
      elementos.containerCamposEmbarcacao.style.display = 'block';
      aplicarNaoAplicavelCamposEmbarcacao(true);
      //elementos.sistemaDegradado.value = '';
      //elementos.embarcacaoDerivou.value = '';
      //elementos.embarcacaoPerdeuPosicao.value = '';
      elementos.sistemaDegradado.disabled = true;
      elementos.embarcacaoDerivou.disabled = true;
      elementos.embarcacaoPerdeuPosicao.disabled = true;
    }
  }

// Aplica/retira a opção "N/A" nos campos de embarcação
function aplicarNaoAplicavelCamposEmbarcacao(aplicarNA) {
  const selects = [
    elementos.sistemaDegradado,
    elementos.embarcacaoDerivou,
    elementos.embarcacaoPerdeuPosicao
  ];

  for (const sel of selects) {
    // Sempre visível (conforme PASSO 1 já aplicado)
    elementos.containerCamposEmbarcacao.style.display = 'block';

    if (aplicarNA) {
      // Se não existir a opção "NA", cria dinamicamente
      let na = Array.from(sel.options).find(o => o.value === 'NA');
      if (!na) {
        na = document.createElement('option');
        na.value = 'NA';
        na.textContent = 'N/A';
        sel.insertBefore(na, sel.firstChild); // fica no topo para seleção direta
      }
      sel.value = 'NA';
      sel.disabled = true;
    } else {
      // Em "Embarcação": remove "NA" se estiver presente e reabilita
      const na = Array.from(sel.options).find(o => o.value === 'NA');
      if (na) na.remove();
      sel.disabled = false;
      if (sel.value === 'NA') sel.value = ''; // libera para usuário escolher
    }
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
    if (!elementos.siteInstalacao.value) {
      alert('Selecione a instalação');
      return;
    }

    if (!elementos.empresa.value) {
      alert('Selecione a empresa');
      return;
    }

    if (!elementos.data.value) {
      alert('Informe a data do evento');
      return;
    }

    if (!elementos.horario.value) {
      alert('Informe a Hora do evento');
      return;
    }

    if (!elementos.municipioUF.value) {
      alert('Informe o Municipio/UF');
      return;
    }

    if (!elementos.descricao.value) {
      alert('Descreva o evento');
      return;
    }

    if (!elementos.relacaoEvento.value) {
      alert('Sinalize a relação do evento');
      return;
    }
    
    if (!elementos.acoesAdotadas.value) {
      alert('Informe as ações adotadas');
      return;
    }
    
    if (!elementos.operacaoParalisada.value) {
      alert('Sinalize o status da operação');
      return;
    }

    // Obter texto da embarcação selecionada
    const siteInstalacaoTexto = elementos.siteInstalacao.options[elementos.siteInstalacao.selectedIndex].text;

    const dados = {
      tipo: elementos.tipo.value,
      status: 'SALVO', 
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
    
    // NOVO: Aplicar estado "SALVO"
    desabilitarCampos(true);  // Desabilita todos os campos
    alternarBotoes(true);      // Mostra os 3 botões novos

  } catch (error) {
    alert('Erro ao salvar: ' + error.message);
  }
}

// ===== CANCELAR INFORME =====
async function cancelarInforme() {
  if (!confirm('Deseja cancelar a emissão do Informe de anomalia?')) {
    return;
  }
  
  try {
    // Deletar informe do banco de dados
    if (informeAtualId) {
      const response = await fetch(`/api/informes/${informeAtualId}/`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
    }
    
    // Limpar variáveis
    informeAtualId = null;
    pessoasSubtabela = [];
    pessoasParaDeletar = [];
    
    // Limpar todos os campos
    elementos.tipo.value = '';
    elementos.siteInstalacao.value = '';
    elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
    elementos.subcontratada.value = '';
    elementos.subcontratadaNA.checked = false;
    elementos.subcontratada.disabled = false;
    elementos.descricao.value = '';
    elementos.relacaoEvento.value = '';
    elementos.acoesAdotadas.value = '';
    elementos.os1.value = '';
    elementos.os2.value = '';
    elementos.operacaoParalisada.value = '';
    elementos.municipioUF.value = '';
    elementos.municipioOutro.value = '';
    elementos.containerMunicipioOutro.style.display = 'none';
    elementos.infoComplementares.value = '';
    elementos.sistemaDegradado.value = '';
    elementos.embarcacaoDerivou.value = '';
    elementos.embarcacaoPerdeuPosicao.value = '';
    
    // Resetar data/hora
    setDataHoraAtual();
    
    // Ocultar containers condicionais
    elementos.containerSubtabelaPessoas.style.display = 'none';
    elementos.containerCamposEmbarcacao.style.display = 'none';
    
    // Limpar subtabela pessoas
    elementos.tblPessoas.innerHTML = '';
    limparCamposPessoa();
    
    // Habilitar campos
    desabilitarCampos(false);
    
    // Voltar aos botões iniciais
    alternarBotoes(false);
    
    alert('Informe cancelado com sucesso.');
    
  } catch (error) {
    alert('Erro ao cancelar informe: ' + error.message);
  }
}

// ===== EDITAR INFORME =====
function editarInforme() {
  // Habilitar todos os campos
  desabilitarCampos(false);
  
  // Voltar aos botões iniciais (Salvar + Limpar)
  alternarBotoes(false);
}

// ===== CONCLUIR INFORME =====
async function concluirInforme() {
  if (!confirm('Deseja concluir e enviar o informe de Anomalia?')) {
    return;
  }
  
  try {
    // 1. Enviar e-mail
    const response = await fetch(`/api/informes/${informeAtualId}/enviar/`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (!result.success) {
      alert('Erro ao enviar e-mail: ' + (result.error || 'Falha desconhecida'));
      return;
    }
    
    // 2. Atualizar status para ENVIADO
    const dados = {status: 'ENVIADO'};
    const responseUpdate = await fetch(`/api/informes/${informeAtualId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    const resultUpdate = await responseUpdate.json();
    
    if (!resultUpdate.success) {
      alert('Erro ao atualizar status: ' + resultUpdate.error);
      return;
    }
    
    // 3. Sucesso - limpar tudo
    alert('Informe enviado com sucesso!');
    
    // Limpar variáveis
    informeAtualId = null;
    pessoasSubtabela = [];
    pessoasParaDeletar = [];
    
    // Limpar campos
    elementos.tipo.value = '';
    elementos.siteInstalacao.value = '';
    elementos.empresa.innerHTML = '<option value="">— selecione —</option>';
    elementos.subcontratada.value = '';
    elementos.subcontratadaNA.checked = false;
    elementos.subcontratada.disabled = false;
    elementos.descricao.value = '';
    elementos.relacaoEvento.value = '';
    elementos.acoesAdotadas.value = '';
    elementos.os1.value = '';
    elementos.os2.value = '';
    elementos.operacaoParalisada.value = '';
    elementos.municipioUF.value = '';
    elementos.municipioOutro.value = '';
    elementos.containerMunicipioOutro.style.display = 'none';
    elementos.infoComplementares.value = '';
    elementos.sistemaDegradado.value = '';
    elementos.embarcacaoDerivou.value = '';
    elementos.embarcacaoPerdeuPosicao.value = '';
    
    // Resetar data/hora
    setDataHoraAtual();
    
    // Ocultar containers
    elementos.containerSubtabelaPessoas.style.display = 'none';
    elementos.containerCamposEmbarcacao.style.display = 'none';
    
    // Limpar subtabela
    elementos.tblPessoas.innerHTML = '';
    limparCamposPessoa();
    
    // Habilitar campos
    desabilitarCampos(false);
    
    // Voltar aos botões iniciais
    alternarBotoes(false);
    
  } catch (error) {
    alert('Erro ao concluir informe: ' + error.message);
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

// ===== VISUALIZAR INFORME (ABRIR MODAL)===================== 
async function visualizarInforme(informeId) {
  try {
    // VALIDAÇÃO: Só permite abrir modal na aba de consulta
    const abaConsulta = document.getElementById('tab-consultar-informes');
    if (!abaConsulta || !abaConsulta.classList.contains('active')) {
      return; // Silenciosamente bloqueia se não estiver na aba correta
    }
    
    // Buscar HTML formatado do backend
    const response = await fetch(`/api/informes/${informeId}/html/`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Inserir HTML diretamente no modal
    document.getElementById('modalInformeConteudo').innerHTML = result.html;
    
    // Abrir modal
    document.getElementById('modalVisualizarInforme').classList.add('active');
    
  } catch (error) {
    alert('Erro ao carregar informe: ' + error.message);
  }
}

// ===== CONFIGURAR NAVEGAÇÃO ENTRE TABS =====
function configurarNavegacaoTabs() {
  const tablinks = document.querySelectorAll('.tablink[data-tab]');
  
  tablinks.forEach(link => {
    link.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // FECHAR MODAL ao trocar de aba
      const modal = document.getElementById('modalVisualizarInforme');
      if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
      }
      
      tablinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      
      if (targetTab === 'tab-consultar-informes') {
        carregarInformes();
      }
    });
  });
}

// ===== CARREGAR EMBARCAÇÕES PARA FILTRO =====
async function carregarEmbarcacoesFiltro() {
  try {
    const response = await fetch('/api/barcos/');
    const result = await response.json();
    
    if (!result.success) return;
    
    const select = document.getElementById('filtroEmbarcacao');
    if (!select) return;
    
    select.innerHTML = '<option value="">— Todas as embarcações —</option>';
    
    result.data.forEach(barco => {
      const option = document.createElement('option');
      option.value = `${barco.tipoBarco} ${barco.nomeBarco}`;
      option.textContent = `${barco.tipoBarco} ${barco.nomeBarco}`;
      select.appendChild(option);
    });
    
  } catch (error) {
    // Silencioso
  }
}

// ===== CONFIGURAR EVENTOS DE CONSULTA =====
function configurarEventosConsulta() {
  const btnFiltrar = document.getElementById('btnFiltrar');
  const btnLimparFiltro = document.getElementById('btnLimparFiltro');
  
  if (btnFiltrar) {
    btnFiltrar.addEventListener('click', filtrarInformes);
  }
  
  if (btnLimparFiltro) {
    btnLimparFiltro.addEventListener('click', limparFiltro);
  }
}

// ===== CARREGAR TODOS OS INFORMES =====
async function carregarInformes() {
  try {
    const response = await fetch('/api/informes/');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    informesCache = result.data || [];
    informesFiltrados = [...informesCache];
    
    informesFiltrados.sort((a, b) => {
      const dataA = new Date(a.dataEvento + ' ' + (a.horarioEvento || '00:00'));
      const dataB = new Date(b.dataEvento + ' ' + (b.horarioEvento || '00:00'));
      return dataB - dataA;
    });
    
    renderizarTabelaInformes();
    
  } catch (error) {
    alert('Erro ao carregar informes: ' + error.message);
  }
}

// ===== FILTRAR INFORMES POR EMBARCAÇÃO =====
function filtrarInformes() {
  const filtroEmbarcacao = document.getElementById('filtroEmbarcacao').value;
  
  if (!filtroEmbarcacao) {
    informesFiltrados = [...informesCache];
  } else {
    informesFiltrados = informesCache.filter(informe => {
      return informe.siteInstalacao && informe.siteInstalacao.includes(filtroEmbarcacao);
    });
  }
  
  informesFiltrados.sort((a, b) => {
    const dataA = new Date(a.dataEvento + 'T' + (a.horarioEvento || '00:00'));
    const dataB = new Date(b.dataEvento + 'T' + (b.horarioEvento || '00:00'));
    return dataB - dataA;
  });
  
  renderizarTabelaInformes();
}

// ===== LIMPAR FILTRO =====
function limparFiltro() {
  document.getElementById('filtroEmbarcacao').value = '';
  filtrarInformes();
}

// ===== RENDERIZAR TABELA DE INFORMES =====
function renderizarTabelaInformes() {
  const tbody = document.getElementById('tabelaInformes');
  tbody.innerHTML = '';
  
  if (informesFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#999;">
          Nenhum informe encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  informesFiltrados.forEach(informe => {
    const tr = document.createElement('tr');
    
    const data = new Date(informe.dataEvento + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR');
    
    const tipoMap = {
      'DESVIO': 'Desvio',
      'NAO_CONFORMIDADE': 'Não Conformidade',
      'INCIDENTE_ALTO_POTENCIAL': 'Incidente Alto Potencial',
      'ACIDENTE': 'Acidente'
    };
        
    tr.innerHTML = `
      <td>${dataFormatada}</td>
      <td>${informe.horarioEvento || '--:--'}</td>
      <td>${informe.siteInstalacao || ''}</td>
      <td style="text-align:center;">
        <button class="btn-visualizar" onclick="AnomaliaModule.visualizarInforme(${informe.id})">
          Visualizar
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// ===== FECHAR MODAL =====
function fecharModal() {
  document.getElementById('modalVisualizarInforme').classList.remove('active');
}

// =============================RETURN
return {
  init,
  removerPessoa,
  visualizarInforme,
  fecharModal
};

})();

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AnomaliaModule.init);
} else {
  AnomaliaModule.init();
}