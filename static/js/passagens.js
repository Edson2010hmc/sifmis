// ===== MODULO PASSAGENS DE SERVIÇO ======================================================

const PassagensModule = (() => {
 let psAtualId = null;
 let pdfLinkGerado = null;

  // ===== CALCULAR PERÍODO DA PS ==========================================================
  function calcularPeriodoPS(dataPrimeiraEntrada) {
    const primeiraEntrada = new Date(dataPrimeiraEntrada);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Calcula quantos dias passaram desde primeira entrada
    const diasPassados = Math.floor((hoje - primeiraEntrada) / (1000 * 60 * 60 * 24));
    
    // Calcula qual ciclo atual (vigente)
    const cicloAtual = Math.floor(diasPassados / 14);
    
    // Calcula início do ciclo vigente
    const inicioVigente = new Date(primeiraEntrada);
    inicioVigente.setDate(inicioVigente.getDate() + (cicloAtual * 14));
    
    // Calcula fim do ciclo vigente (13 dias depois do início)
    const fimVigente = new Date(inicioVigente);
    fimVigente.setDate(fimVigente.getDate() + 13);
    
    // Data de emissão (dia seguinte ao fim)
    const emissao = new Date(fimVigente);
    emissao.setDate(emissao.getDate() + 1);
    
    // Contar emissões que caíram no ano da PS atual
    const ano = emissao.getFullYear();
    let psNoAno = 0;
    
    // Loop pelos ciclos anteriores para contar emissões no mesmo ano
    for (let ciclo = 0; ciclo < cicloAtual; ciclo++) {
      const inicioEsseCiclo = new Date(primeiraEntrada);
      inicioEsseCiclo.setDate(inicioEsseCiclo.getDate() + (ciclo * 14));
      
      const fimEsseCiclo = new Date(inicioEsseCiclo);
      fimEsseCiclo.setDate(fimEsseCiclo.getDate() + 13);
      
      const emissaoEsseCiclo = new Date(fimEsseCiclo);
      emissaoEsseCiclo.setDate(emissaoEsseCiclo.getDate() + 1);
      
      if (emissaoEsseCiclo.getFullYear() === ano) {
        psNoAno++;
      }
    }
    
    // Numeração da PS atual
    const numero = psNoAno + 1;
    
    return {
      inicio: inicioVigente.toISOString().slice(0, 10),
      fim: fimVigente.toISOString().slice(0, 10),
      emissao: emissao.toISOString().slice(0, 10),
      numero,
      ano,
      numeroFormatado: `${numero.toString().padStart(2, '0')}/${ano}`
    };
  }

  // ===== CRIAR NOVA PS ===================================================================
async function criarNovaPS(barcoId, barcoData) {
  const usuario = AuthModule.getUsuarioLogado();
  if (!usuario) {
    alert('Usuário não identificado');
    return;
  }

  try {
    // 1. Verificar rascunho para embarcação
    const checkResponse = await fetch('/api/verificar-rascunho-embarcacao/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        barcoId,
        fiscalNome: `${usuario.chave} - ${usuario.nome}`
      })
    });

    const checkResult = await checkResponse.json();

    if (!checkResult.success) {
      throw new Error(checkResult.error);
    }

    if (checkResult.existeRascunho) {
      alert(`Existe uma Passagem de Serviço em modo Rascunho para o barco ${checkResult.barcoNome} gerada pelo usuário ${checkResult.fiscalNome}`);
      document.getElementById('modalNovaPS').classList.add('hidden');
      document.querySelectorAll('.tablink').forEach(btn => btn.disabled = false);
      return;
    }

    // 2. Verificar se existe PS anterior
    const anteriorResponse = await fetch('/api/verificar-ps-anterior/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcoId })
    });

    const anteriorResult = await anteriorResponse.json();

    if (!anteriorResult.success) {
      throw new Error(anteriorResult.error);
    }

    let periodo;

    if (anteriorResult.existeAnterior) {
      // Usar dados da PS anterior
      periodo = {
        numero: anteriorResult.proximoNumero,
        ano: anteriorResult.proximoAno,
        inicio: anteriorResult.proximoInicio,
        fim: anteriorResult.proximoFim,
        emissao: anteriorResult.proximaEmissao,
        numeroFormatado: `${anteriorResult.proximoNumero.toString().padStart(2, '0')}/${anteriorResult.proximoAno}`
      };
    } else {
      // Primeira PS - usar algoritmo
      periodo = calcularPeriodoPS(barcoData.dataPrimPorto);
    }

    // 3. Criar PS no backend
    const createResponse = await fetch('/api/passagens/criar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcoId: barcoId,
        fiscalDesNome: `${usuario.chave} - ${usuario.nome}`,
        fiscalEmbId: null,
        numero: periodo.numero,
        ano: periodo.ano,
        dataInicio: periodo.inicio,
        dataFim: periodo.fim,
        dataEmissao: periodo.emissao
      })
    });

    const createResult = await createResponse.json();

    if (!createResult.success) {
      throw new Error(createResult.error);
    }

    // 4. Limpar módulos
    if (typeof TrocaTurmaModule !== 'undefined' && TrocaTurmaModule.limpar) {
      TrocaTurmaModule.limpar();
    }
    if (typeof ManutPrevModule !== 'undefined' && ManutPrevModule.limpar) {
      ManutPrevModule.limpar();
    }
    if (typeof AbastModule !== 'undefined' && AbastModule.limpar) {
      AbastModule.limpar();
    }
    if (typeof InspNormModule !== 'undefined' && InspNormModule.limpar) {
      InspNormModule.limpar();
    }
    if (typeof InspPetrModule !== 'undefined' && InspPetrModule.limpar) {
      InspPetrModule.limpar();
    }
    if (typeof EmbEquipModule !== 'undefined' && EmbEquipModule.limpar) {
      EmbEquipModule.limpar();
    }
    if (typeof MobDesmModule !== 'undefined' && MobDesmModule.limpar) {
      MobDesmModule.limpar();
    }

    if (typeof EmbMatPsModule !== 'undefined' && EmbMatPsModule.limpar) {
      EmbMatPsModule.limpar();
    }

    if (typeof DesMatPsModule !== 'undefined' && DesMatPsModule.limpar) {
      DesMatPsModule.limpar();
    }

   
    // 5. Fechar modal e guardar ID
    psAtualId = createResult.data.id;
    document.getElementById('modalNovaPS').classList.add('hidden');
    document.querySelectorAll('.tablink').forEach(btn => btn.disabled = false);
    document.getElementById('selEmbNova').value = '';

    // 6. Preencher formulário
    preencherFormularioPS(createResult.data, barcoData, usuario);

    // 7. Criar card
    criarCardPS(createResult.data);

    // 8. Ir para tela da PS
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-passagem').classList.add('active');

  } catch (error) {
    alert('Erro ao criar PS: ' + error.message);
  }
}

// ===== PREENCHER FORMULÁRIO DA PS =======================================================
function preencherFormularioPS(psData, barcoData, usuario) {
  // Mostrar formulário, ocultar placeholder
  document.getElementById('psPlaceholder').style.display = 'none';
  document.getElementById('psForm').classList.remove('hidden');

  // Número PS
  document.getElementById('fNumero').value = `${psData.numPS.toString().padStart(2, '0')}/${psData.anoPS}`;
  document.getElementById('fNumero').disabled = true;

  // Datas (habilitadas)
  document.getElementById('fData').value = psData.dataEmissaoPS;
  document.getElementById('fInicioPS').value = psData.dataInicio;
  document.getElementById('fFimPS').value = psData.dataFim;

  // Embarcação (desabilitada)
  document.getElementById('fEmb').value = psData.BarcoPS;
  document.getElementById('fEmb').disabled = true;

  // Status (desabilitado)
  document.getElementById('fStatus').value = psData.statusPS;
  document.getElementById('fStatus').disabled = true;

  // Fiscal Desembarcando (desabilitado)
  document.getElementById('fDesCNome').value = psData.fiscalDes;
  document.getElementById('fDesCNome').disabled = true;

  // Carregar combo de fiscais embarcando
  carregarFiscaisEmbarcando(psData.fiscalEmb);
  // Configurar botão excluir (apenas uma vez)
  if (!window.btnExcluirConfigurado) {
    configurarBotaoExcluir();
    window.btnExcluirConfigurado = true;
}
  // Configurar botão salvar (apenas uma vez)
  if (!window.btnSalvarConfigurado) {
    configurarBotaoSalvar();
    window.btnSalvarConfigurado = true;
}

if (!window.btnFinalizarConfigurado) {
  configurarBotaoFinalizar();
  window.btnFinalizarConfigurado = true;
}

// Carregar modulos
if (typeof TrocaTurmaModule !== 'undefined' && TrocaTurmaModule.carregarDados) {
  TrocaTurmaModule.carregarDados(psData.id);
}
if (typeof ManutPrevModule !== 'undefined' && ManutPrevModule.carregarDados) {
  ManutPrevModule.carregarDados(psData.id);
}
if (typeof AbastModule !== 'undefined' && AbastModule.carregarDados) {
  AbastModule.carregarDados(psData.id);
}
if (typeof InspNormModule !== 'undefined' && InspNormModule.carregarDados) {
  InspNormModule.carregarDados(psData.id);
}
if (typeof InspPetrModule !== 'undefined' && InspPetrModule.carregarDados) {
  InspPetrModule.carregarDados(psData.id);
}
if (typeof EmbEquipModule !== 'undefined' && EmbEquipModule.carregarDados) {
  EmbEquipModule.carregarDados(psData.id);
}
// Carregar módulo Mobilização/Desmobilização
if (typeof MobDesmModule !== 'undefined' && MobDesmModule.carregarDados) {
  MobDesmModule.carregarDados(psData.id);
}

// Carregar Embarque de Materiais
if (typeof EmbMatPsModule !== 'undefined' && EmbMatPsModule.carregarDados) {
  EmbMatPsModule.carregarDados(psData.id);
}

// Carregar Desembarque de Materiais
if (typeof DesMatPsModule !== 'undefined' && DesMatPsModule.carregarDados) {
  DesMatPsModule.carregarDados(psData.id);
}

//console.log('[DEBUG] Verificando AnomSMSModule:', typeof AnomSMSModule);
if (typeof AnomSMSModule !== 'undefined' && AnomSMSModule.carregarDados) {
  //console.log('[DEBUG] Chamando AnomSMSModule.carregarDados com psId:', psData.id);
  AnomSMSModule.carregarDados(psData.id);
} else {
  //console.log('[DEBUG] AnomSMSModule não disponível');
}


// Verificar se PS está finalizada
verificarPSFinalizada(psData);

}

// ===== CARREGAR USUARIOS COM PERFIL FISCAL =====
async function carregarFiscaisEmbarcando(fiscalEmbSelecionado = '') {
  try {
    const response = await fetch('/api/fiscais/perfil-fiscal/');
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    const select = document.getElementById('fEmbC');
    select.innerHTML = '<option value="">— selecione —</option>';

    result.data.forEach(fiscal => {
      const option = document.createElement('option');
      option.value = fiscal.id;
      const fiscalTexto = `${fiscal.chave} - ${fiscal.nome}`;
      option.textContent = fiscalTexto;
      
      // Pré-selecionar se corresponder
      if (fiscalEmbSelecionado && fiscalTexto === fiscalEmbSelecionado) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });

  } catch (error) {
    alert('Erro ao carregar Fiscal: ' + error.message);
  }
}

  // ===== CRIAR CARD NA LISTA ==========================================================
  function criarCardPS(psData) {
    const lista = document.getElementById('listaPS');
    const li = document.createElement('li');
    li.dataset.psId = psData.id;

    li.innerHTML = `
      <div class="ps-card-content">
        <div class="ps-linha1">N°${psData.numPS.toString().padStart(2, '0')}/${psData.anoPS} => ${psData.BarcoPS}</div>
        <div class="ps-linha2">PERÍODO: ${formatarData(psData.dataInicio)} a ${formatarData(psData.dataFim)}</div>
        <div class="ps-linha3 status-${psData.statusPS}">${psData.statusPS}</div>
        <div class="ps-linha4">TROCA DE TURMA ${formatarData(psData.dataEmissaoPS)}</div>
      </div>
    `;

    lista.appendChild(li);
    li.addEventListener('click', function() {
      abrirPS(psData.id);
});
  }

  // ===== FORMATAR DATA =====
  function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // ===== ABRIR PS EXISTENTE ============================================================
async function abrirPS(psId) {
  try {
    const response = await fetch(`/api/passagens/${psId}/`);
    const result = await response.json();
    psAtualId = psId;

    if (!result.success) {
      psAtualId = psId;
      throw new Error(result.error);
    }

    // Preencher formulário com dados da PS
    preencherFormularioPS(result.data, null, null);

    // Carregar dados Modulo Troca de Turma
    if (typeof TrocaTurmaModule !== 'undefined' && TrocaTurmaModule.carregarDados) {
      TrocaTurmaModule.carregarDados(psId);
    }

    // Carregar Manutenção Preventiva
    if (typeof ManutPrevModule !== 'undefined' && ManutPrevModule.carregarDados) {
      ManutPrevModule.carregarDados(psId);
    }

    // Carregar dados Modulo Inspeção Normativa
    if (typeof InspNormModule !== 'undefined' && InspNormModule.carregarDados) {
      InspNormModule.carregarDados(psId);
    }

    // Carregar Embarque de Equipes
    if (typeof EmbEquipModule !== 'undefined' && EmbEquipModule.carregarDados) {
      EmbEquipModule.carregarDados(psId);
    }

    // Carregar Embarque de Materiais
    if (typeof EmbMatPsModule !== 'undefined' && EmbMatPsModule.carregarDados) {
      EmbMatPsModule.carregarDados(psId);
    }

    // Carregar Desembarque de Materiais
    if (typeof DesMatPsModule !== 'undefined' && DesMatPsModule.carregarDados) {
      DesMatPsModule.carregarDados(psId);
    }

    
    if (typeof AnomSMSModule !== 'undefined' && AnomSMSModule.carregarDados) {
          AnomSMSModule.carregarDados(psId);
    } 


    // Ir para tela da PS
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-passagem').classList.add('active');

  } catch (error) {
    alert('Erro ao abrir PS: ' + error.message);
  }
}

// ===== EXCLUIR RASCUNHO =================================================================
async function excluirRascunho(psId) {
  if (!confirm('Confirma a exclusão do rascunho?')) {
    return;
  }

  try {
    const response = await fetch(`/api/passagens/${psId}/`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    alert('Rascunho excluído com sucesso!');

    // Remover card da lista
    const card = document.querySelector(`li[data-ps-id="${psId}"]`);
    if (card) {
      card.remove();
    }

    // Limpar formulários dos módulos
    if (typeof TrocaTurmaModule !== 'undefined' && TrocaTurmaModule.limpar) {
      TrocaTurmaModule.limpar();
    }

    if (typeof ManutPrevModule !== 'undefined' && ManutPrevModule.limpar) {
      ManutPrevModule.limpar();
    }

    if (typeof InspNormModule !== 'undefined' && InspNormModule.limpar) {
      InspNormModule.limpar();
    }

    // Limpar Embarque de Materiais
    if (typeof EmbMatPsModule !== 'undefined' && EmbMatPsModule.limpar) {
      EmbMatPsModule.limpar();
    }
    // Limpar Desembarque de Materiais
    if (typeof DesMatPsModule !== 'undefined' && DesMatPsModule.limpar) {
      DesMatPsModule.limpar();
    }


    psAtualId = null;

    // Voltar para tela inicial
    document.querySelector('[data-tab="consultas"]').click();

  } catch (error) {
    alert('Erro ao excluir rascunho: ' + error.message);
  }
}

// ===== CONFIGURAR BOTÃO EXCLUIR =========================================================
function configurarBotaoExcluir() {
  const btnExcluir = document.getElementById('btnExcluirRasc');
  
  btnExcluir.addEventListener('click', function() {
    if (psAtualId) {
      excluirRascunho(psAtualId);
    } else {
      alert('Nenhuma PS carregada');
    }
  });
}

// ===== SALVAR RASCUNHO ==================================================================
async function salvarRascunho(psId, silencioso = false) {
  try {
    const dados = {
      dataEmissaoPS: document.getElementById('fData').value,
      dataInicio: document.getElementById('fInicioPS').value,
      dataFim: document.getElementById('fFimPS').value,
      fiscalEmb: document.getElementById('fEmbC').value
    };
    // Salvar dados Modulo Troca de Turma
    if (typeof TrocaTurmaModule !== 'undefined' && TrocaTurmaModule.salvar) {
      await TrocaTurmaModule.salvar();
    }

    // Salvar Manutenção Preventiva
    if (typeof ManutPrevModule !== 'undefined' && ManutPrevModule.salvar) {
      await ManutPrevModule.salvar();
    }

    // Salvar modulo Abastecimento
    if (typeof AbastModule !== 'undefined' && AbastModule.salvar) {
      await AbastModule.salvar();
    }

    // Salvar dados Modulo Inspeção Normativa
    if (typeof InspNormModule !== 'undefined' && InspNormModule.salvar) {
      await InspNormModule.salvar();
    }

    // Salvar Inspeção Petrobras
    if (typeof InspPetrModule !== 'undefined' && InspPetrModule.salvar) {
      await InspPetrModule.salvar();
    }

    // Salvar Embarque de Equipes
    if (typeof EmbEquipModule !== 'undefined' && EmbEquipModule.salvar) {
      await EmbEquipModule.salvar();
    }

    // Salvar módulo Mobilização/Desmobilização
    if (typeof MobDesmModule !== 'undefined' && MobDesmModule.salvar) {
      await MobDesmModule.salvar();
    }

    // Salvar Embarque de Materiais
    if (typeof EmbMatPsModule !== 'undefined' && EmbMatPsModule.salvar) {
      await EmbMatPsModule.salvar();
    }

    // Salvar Desembarque de Materiais
    if (typeof DesMatPsModule !== 'undefined' && DesMatPsModule.salvar) {
      await DesMatPsModule.salvar();
    }
    const response = await fetch(`/api/passagens/${psId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    if (!silencioso) {
      alert('Rascunho salvo com sucesso!');
    }

  } catch (error) {
    if (!silencioso) {
      alert('Erro ao salvar rascunho: ' + error.message);
    }
  }
}

// ===== SALVAMENTO AO TROCAR DE ABA ============================================
async function salvarAntesDeSair() {
  if (!psAtualId) return;
  await salvarRascunho(psAtualId, true);
}

// ===== CONFIGURAR BOTÃO SALVAR ==========================================================
function configurarBotaoSalvar() {
  const btnSalvar = document.getElementById('btnSalvar');
  
  btnSalvar.addEventListener('click', function() {
    if (psAtualId) {
      salvarRascunho(psAtualId);
    } else {
      alert('Nenhuma PS carregada');
    }
  });
}

// ===== CARREGAR PASSAGENS DO USUÁRIO ====================================================
async function carregarPassagensUsuario() {
  const usuario = AuthModule.getUsuarioLogado();
  if (!usuario) return;

  try {
    const fiscalNome = `${usuario.chave} - ${usuario.nome}`;
    const response = await fetch(`/api/passagens/usuario/?fiscalNome=${encodeURIComponent(fiscalNome)}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    const lista = document.getElementById('listaPS');
    lista.innerHTML = '';

    result.data.forEach(ps => {
      criarCardPS(ps);
    });

  } catch (error) {
    //console.error('Erro ao carregar passagens:', error);
  }
}

function desabilitarInterface() {
  
  
  // Desabilitar campos do cabeçalho
  document.getElementById('fData').disabled = true;
  document.getElementById('fInicioPS').disabled = true;
  document.getElementById('fFimPS').disabled = true;
  document.getElementById('fEmbC').disabled = true;
  
  // Desabilitar todos os inputs, selects e textareas das seções
  document.querySelectorAll('#sub-porto input, #sub-porto select, #sub-porto textarea, #sub-porto button').forEach(el => {
    if (!el.classList.contains('btn')) {
      el.disabled = true;
    }
  });
  
  // Desabilitar botões de adicionar/remover das tabelas
  document.querySelectorAll('#sub-porto button').forEach(btn => {
    if (btn.textContent.includes('Adicionar') || btn.textContent.includes('Remover')) {
      btn.disabled = true;
    }
  });
  
  // Desabilitar checkboxes "Não previsto"
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.disabled = true;
  });
  
  // Desabilitar inputs de arquivo
  document.querySelectorAll('input[type="file"]').forEach(file => {
    file.disabled = true;
  });
  
  // Desabilitar botões principais
  document.getElementById('btnSalvar').disabled = true;
  document.getElementById('btnFinalizar').disabled = true;
  document.getElementById('btnExcluirRasc').disabled = true;
  
  
}

function habilitarInterface() {
  // Habilitar campos do cabeçalho (exceto os que devem permanecer desabilitados)
  document.getElementById('fData').disabled = false;
  document.getElementById('fInicioPS').disabled = false;
  document.getElementById('fFimPS').disabled = false;
  document.getElementById('fEmbC').disabled = false;
  
  // Habilitar todos os inputs, selects e textareas das seções Porto
  document.querySelectorAll('#sub-porto input, #sub-porto select, #sub-porto textarea').forEach(el => {
    el.disabled = false;
  });
  
  // Habilitar todos os botões das seções Porto
  document.querySelectorAll('#sub-porto button').forEach(btn => {
    btn.disabled = false;
  });
  
  // Habilitar checkboxes
  document.querySelectorAll('#sub-porto input[type="checkbox"]').forEach(cb => {
    cb.disabled = false;
  });
  
  // Habilitar inputs de arquivo
  document.querySelectorAll('#sub-porto input[type="file"]').forEach(file => {
    file.disabled = false;
  });
  
  // Habilitar botões principais
  document.getElementById('btnSalvar').disabled = false;
  document.getElementById('btnFinalizar').disabled = false;
  document.getElementById('btnExcluirRasc').disabled = false;
  
  // Remover link do PDF se existir
  const linkPDF = document.getElementById('linkPDFFinalizado');
  if (linkPDF) {
    linkPDF.remove();
  }
}



// ===== EXIBIR LINK DO PDF =====
function exibirLinkPDF(pdfPath) {
  //console.log('[FINALIZAR] Exibindo link do PDF:', pdfPath);
  
  const btnFinalizar = document.getElementById('btnFinalizar');
  const btnsContainer = btnFinalizar.parentElement;
  
  // Remover link antigo se existir
  const linkAntigo = document.getElementById('linkPDFFinalizado');
  if (linkAntigo) {
    linkAntigo.remove();
  }
  
  // Extrair nome do arquivo do caminho
  const nomeArquivo = pdfPath.split('/').pop();
  
  // Criar novo link
  const linkPDF = document.createElement('a');
  linkPDF.id = 'linkPDFFinalizado';
  linkPDF.href = `/storage/${pdfPath}`;
  linkPDF.target = '_blank';
  linkPDF.style.cssText = 'color:#0b7a66; text-decoration:underline; margin-left:16px; font-weight:bold;';
  linkPDF.textContent = `📄 ${nomeArquivo}`;
  
  btnsContainer.appendChild(linkPDF);
  
  //console.log('[FINALIZAR] Link do PDF exibido com sucesso');
}

// ===== FINALIZAR PASSAGEM DE SERVIÇO =====
async function finalizarPS() {
  if (!psAtualId) {
    alert('Nenhuma PS carregada');
    return;
  }
  
  try {
    // Obter dados da PS atual
    const numPS = document.getElementById('fNumero').value;
    const dataEmissaoPS = document.getElementById('fData').value;
    
    // VALIDAÇÃO: Verificar se data atual >= data emissão
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataEmissao = new Date(dataEmissaoPS);
    dataEmissao.setHours(0, 0, 0, 0);
    
    if (hoje < dataEmissao) {
      const dataFormatada = dataEmissao.toLocaleDateString('pt-BR');
      alert(`Não é possível finalizar a PS ${numPS}antes da data de emissão prevista.`);
      return;
    }
    
    // 1. Salvar rascunho silenciosamente antes de finalizar
    await salvarRascunho(psAtualId, true);
    
    // 2. Exibir confirmação
    const confirmar = confirm(`Tem certeza que deseja finalizar a PS ${numPS}? Essa ação é irreversível!`);
    
    if (!confirmar) {
      return;
    }
    
    // 3. Chamar endpoint de finalização
    const responseFinalizar = await fetch(`/api/passagens/${psAtualId}/finalizar/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const resultFinalizar = await responseFinalizar.json();
    
    if (!resultFinalizar.success) {
      throw new Error(resultFinalizar.error);
    }
    
    // 4. Atualizar status no formulário
    document.getElementById('fStatus').value = 'FINALIZADA';
    
    // 5. Desabilitar toda a interface
    desabilitarInterface();
    
    // 6. Gerar PDF
    const responsePDF = await fetch(`/api/passagens/${psAtualId}/gerar-pdf/`);
    
    const resultPDF = await responsePDF.json();
    
    if (!resultPDF.success) {
      throw new Error('Erro ao gerar PDF: ' + resultPDF.error);
    }
    
    // 7. Exibir link do PDF
    exibirLinkPDF(resultPDF.pdfPath);
    
    // 8. Atualizar card na lista
    const card = document.querySelector(`li[data-ps-id="${psAtualId}"]`);
    if (card) {
      const statusElement = card.querySelector('.ps-linha3');
      if (statusElement) {
        statusElement.textContent = 'FINALIZADA';
        statusElement.className = 'ps-linha3 status-FINALIZADA';
      }
    }
    
    alert(`PS ${numPS} finalizada com sucesso! O PDF foi gerado e está disponível para download.`);
    
  } catch (error) {
    alert('Erro ao finalizar PS: ' + error.message);
  }
}

// ===== VERIFICAR SE PS É FINALIZADA AO CARREGAR =====
function verificarPSFinalizada(psData) {
  setTimeout(() => {
    if (psData.statusPS === 'FINALIZADA') {
      desabilitarInterface();
      
      if (psData.pdfPath) {
        exibirLinkPDF(psData.pdfPath);
      }
    } else {
      habilitarInterface();
    }
  }, 100);
}

// ===== CONFIGURAR BOTÃO FINALIZAR ==========================================================
function configurarBotaoFinalizar() {
  const btnFinalizar = document.getElementById('btnFinalizar');
  
  btnFinalizar.addEventListener('click', function() {
    if (psAtualId) {
      finalizarPS();
    } else {
      alert('Nenhuma PS carregada');
    }
  });
}
// Formatar texto exibido no select admin_ps_hint =====
function textoPSExibicao(ps) {
  // Garante numPS com 2 dígitos
  const num = (ps.numPS !== undefined && ps.numPS !== null) ? ps.numPS.toString().padStart(2, '0') : '??';
  const ano = ps.anoPS || '????';
  const tipo = ps.TipoBarco || '';
  const barco = ps.BarcoPS || '';
  return `${num}/${ano} - ${tipo} ${barco}`.trim();
}







  // ===== EXPORTAR FUNÇÕES ================================================================
  return {
    criarNovaPS,
    carregarPassagensUsuario,
    salvarRascunho,
    salvarAntesDeSair,
    finalizarPS
  };

})();