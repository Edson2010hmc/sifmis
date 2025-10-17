# fiscweb/views_anom.py
# Views para Informe de Anomalia

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime
from django.utils import timezone
from email.message import EmailMessage
import smtplib

from .models_anom import InformeAnomalia, SubTabPessoasAnomalia
from .models_cad import BarcosCad


#========================================== LISTAR INFORMES DE ANOMALIA ==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def informe_anomalia_list(request):
    """
    GET: Lista todos os informes de anomalia
    POST: Cria novo informe de anomalia
    """
    
    if request.method == 'GET':
        try:
            informes = InformeAnomalia.objects.all()
            
            data = []
            for informe in informes:
                data.append({
                    'id': informe.id,
                    'tipo': informe.tipo,
                    'siteInstalacao': informe.siteInstalacao,
                    'empresa': informe.empresa,
                    'dataEvento': str(informe.dataEvento),
                    'horarioEvento': informe.horarioEvento.strftime('%H:%M') if informe.horarioEvento else '',
                    'relacaoEvento': informe.relacaoEvento,
                    'criado_em': informe.criado_em.isoformat()
                })
            
            print(f"[API] GET /api/informes/ - {len(data)} informes retornados")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/informes/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/informes/ - Criando novo informe")
            
            # Criar informe
            informe = InformeAnomalia.objects.create(
                tipo=data.get('tipo', ''),
                siteInstalacao=data.get('siteInstalacao', ''),
                empresa=data.get('empresa', ''),
                subcontratada=data.get('subcontratada', ''),
                subcontratadaNaoAplicavel=data.get('subcontratadaNaoAplicavel', False),
                dataEvento=data.get('dataEvento'),
                horarioEvento=data.get('horarioEvento'),
                municipioUF=data.get('municipioUF', ''),
                municipioOutro=data.get('municipioOutro', ''),
                descricao=data.get('descricao', ''),
                relacaoEvento=data.get('relacaoEvento', ''),
                acoesAdotadas=data.get('acoesAdotadas', ''),
                ordemServico1=data.get('ordemServico1', ''),
                ordemServico2=data.get('ordemServico2', ''),
                operacaoParalisada=data.get('operacaoParalisada', ''),
                sistemaDegradado=data.get('sistemaDegradado', ''),
                embarcacaoDerivou=data.get('embarcacaoDerivou', ''),
                embarcacaoPerdeuPosicao=data.get('embarcacaoPerdeuPosicao', ''),
                informacoesComplementares=data.get('informacoesComplementares', '')
            )
            
            print(f"[API] POST /api/informes/ - Informe {informe.id} criado com sucesso")
            
            return JsonResponse({
                'success': True,
                'message': 'Informe de anomalia criado com sucesso',
                'data': {
                    'id': informe.id,
                    'tipo': informe.tipo,
                    'siteInstalacao': informe.siteInstalacao,
                    'dataEvento': str(informe.dataEvento)
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] POST /api/informes/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#========================================== DETALHES DO INFORME DE ANOMALIA ==========================================
@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def informe_anomalia_detail(request, informe_id):
    """
    GET: Retorna dados completos do informe
    PUT: Atualiza informe existente
    DELETE: Remove informe
    """
    
    try:
        informe = InformeAnomalia.objects.get(id=informe_id)
    except InformeAnomalia.DoesNotExist:
        print(f"[API ERROR] Informe ID {informe_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Informe não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            data = {
                'id': informe.id,
                'tipo': informe.tipo,
                'siteInstalacao': informe.siteInstalacao,
                'empresa': informe.empresa,
                'subcontratada': informe.subcontratada or '',
                'subcontratadaNaoAplicavel': informe.subcontratadaNaoAplicavel,
                'dataEvento': str(informe.dataEvento),
                'horarioEvento': informe.horarioEvento.strftime('%H:%M') if informe.horarioEvento else '',
                'municipioUF': informe.municipioUF,
                'municipioOutro': informe.municipioOutro or '',
                'descricao': informe.descricao or '',
                'relacaoEvento': informe.relacaoEvento,
                'acoesAdotadas': informe.acoesAdotadas or '',
                'ordemServico1': informe.ordemServico1 or '',
                'ordemServico2': informe.ordemServico2 or '',
                'operacaoParalisada': informe.operacaoParalisada,
                'sistemaDegradado': informe.sistemaDegradado or '',
                'embarcacaoDerivou': informe.embarcacaoDerivou or '',
                'embarcacaoPerdeuPosicao': informe.embarcacaoPerdeuPosicao or '',
                'informacoesComplementares': informe.informacoesComplementares or '',
                'criado_em': informe.criado_em.isoformat(),
                'atualizado_em': informe.atualizado_em.isoformat()
            }
            
            print(f"[API] GET /api/informes/{informe_id}/ - Dados retornados")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/informes/{informe_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /api/informes/{informe_id}/ - Atualizando informe")
            
            # Atualizar campos
            if 'tipo' in data:
                informe.tipo = data['tipo']
            if 'siteInstalacao' in data:
                informe.siteInstalacao = data['siteInstalacao']
            if 'empresa' in data:
                informe.empresa = data['empresa']
            if 'subcontratada' in data:
                informe.subcontratada = data['subcontratada']
            if 'subcontratadaNaoAplicavel' in data:
                informe.subcontratadaNaoAplicavel = data['subcontratadaNaoAplicavel']
            if 'dataEvento' in data:
                informe.dataEvento = data['dataEvento']
            if 'horarioEvento' in data:
                informe.horarioEvento = data['horarioEvento']
            if 'municipioUF' in data:
                informe.municipioUF = data['municipioUF']
            if 'municipioOutro' in data:
                informe.municipioOutro = data['municipioOutro']
            if 'descricao' in data:
                informe.descricao = data['descricao']
            if 'relacaoEvento' in data:
                informe.relacaoEvento = data['relacaoEvento']
            if 'acoesAdotadas' in data:
                informe.acoesAdotadas = data['acoesAdotadas']
            if 'ordemServico1' in data:
                informe.ordemServico1 = data['ordemServico1']
            if 'ordemServico2' in data:
                informe.ordemServico2 = data['ordemServico2']
            if 'operacaoParalisada' in data:
                informe.operacaoParalisada = data['operacaoParalisada']
            if 'sistemaDegradado' in data:
                informe.sistemaDegradado = data['sistemaDegradado']
            if 'embarcacaoDerivou' in data:
                informe.embarcacaoDerivou = data['embarcacaoDerivou']
            if 'embarcacaoPerdeuPosicao' in data:
                informe.embarcacaoPerdeuPosicao = data['embarcacaoPerdeuPosicao']
            if 'informacoesComplementares' in data:
                informe.informacoesComplementares = data['informacoesComplementares']
            
            informe.save()
            
            print(f"[API] PUT /api/informes/{informe_id}/ - Informe atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Informe atualizado com sucesso',
                'data': {
                    'id': informe.id
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/informes/{informe_id}/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            informe.delete()
            
            print(f"[API] DELETE /api/informes/{informe_id}/ - Informe removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Informe removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/informes/{informe_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#========================================== SUBTABELA PESSOAS ==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def subtab_pessoas_list(request, informe_id):
    """
    GET: Lista pessoas do informe
    POST: Adiciona pessoa ao informe
    """
    
    try:
        informe = InformeAnomalia.objects.get(id=informe_id)
    except InformeAnomalia.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Informe não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            pessoas = SubTabPessoasAnomalia.objects.filter(idxAnomalia=informe)
            
            data = []
            for pessoa in pessoas:
                data.append({
                    'id': pessoa.id,
                    'nome': pessoa.nome,
                    'idade': pessoa.idade,
                    'funcao': pessoa.funcao,
                    'tempoExpFuncao': pessoa.tempoExpFuncao,
                    'tempoExpEmpresa': pessoa.tempoExpEmpresa,
                    'duracaoUltimaFolga': pessoa.duracaoUltimaFolga,
                    'necessarioDesembarque': pessoa.necessarioDesembarque,
                    'resgateAeromedico': pessoa.resgateAeromedico,
                    'situacaoAtual': pessoa.situacaoAtual
                })
            
            print(f"[API] GET /api/informes/{informe_id}/pessoas/ - {len(data)} pessoas retornadas")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/informes/{informe_id}/pessoas/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/informes/{informe_id}/pessoas/ - Adicionando pessoa")
            
            pessoa = SubTabPessoasAnomalia.objects.create(
                idxAnomalia=informe,
                nome=data.get('nome', ''),
                idade=data.get('idade', ''),
                funcao=data.get('funcao', ''),
                tempoExpFuncao=data.get('tempoExpFuncao', ''),
                tempoExpEmpresa=data.get('tempoExpEmpresa', ''),
                duracaoUltimaFolga=data.get('duracaoUltimaFolga', ''),
                necessarioDesembarque=data.get('necessarioDesembarque', ''),
                resgateAeromedico=data.get('resgateAeromedico', ''),
                situacaoAtual=data.get('situacaoAtual', '')
            )
            
            print(f"[API] POST /api/informes/{informe_id}/pessoas/ - Pessoa {pessoa.id} adicionada")
            
            return JsonResponse({
                'success': True,
                'message': 'Pessoa adicionada com sucesso',
                'data': {
                    'id': pessoa.id,
                    'nome': pessoa.nome
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] POST /api/informes/{informe_id}/pessoas/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#========================================== DETALHES PESSOA ==========================================
@csrf_exempt
@require_http_methods(["DELETE"])
def subtab_pessoas_detail(request, pessoa_id):
    """
    DELETE: Remove pessoa da subtabela
    """
    
    try:
        pessoa = SubTabPessoasAnomalia.objects.get(id=pessoa_id)
    except SubTabPessoasAnomalia.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Pessoa não encontrada'
        }, status=404)
    
    if request.method == 'DELETE':
        try:
            pessoa.delete()
            
            print(f"[API] DELETE /api/pessoas/{pessoa_id}/ - Pessoa removida")
            
            return JsonResponse({
                'success': True,
                'message': 'Pessoa removida com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/pessoas/{pessoa_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#========================================== BUSCAR EMPRESAS DA EMBARCAÇÃO ==========================================
@csrf_exempt
@require_http_methods(["GET"])
def buscar_empresas_embarcacao(request, embarcacao_id):
    """
    Retorna lista de empresas (afretamento + serviços) da embarcação
    """
    
    try:
        barco = BarcosCad.objects.get(id=embarcacao_id)
        
        empresas = []
        
        if barco.emprNav:
            empresas.append(barco.emprNav)
        
        if barco.emprServ and barco.emprServ != barco.emprNav:
            empresas.append(barco.emprServ)
        
        print(f"[API] GET /api/embarcacoes/{embarcacao_id}/empresas/ - {len(empresas)} empresas retornadas")
        
        return JsonResponse({
            'success': True,
            'data': empresas
        })
        
    except BarcosCad.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Embarcação não encontrada'
        }, status=404)
    except Exception as e:
        print(f"[API ERROR] GET /api/embarcacoes/{embarcacao_id}/empresas/ - {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

#========================================== ENVIAR INFORME ==========================================
@csrf_exempt
def enviar_informe(request, informe_id):
        """
        Envia o Informe de Anomalia por e-mail, preenchendo:
        - Assunto: #### IMPORTANTE #### - INFORME DE ANOMALIA {TIPO} {NOME DA EMBARCAÇÃO}
        - From: emailPetr (BarcosCad)
        - To:   emailCiop (BarcosCad)
        - Cc:   emailAto; emailSto; emailFiscContr (ignorar vazios)
        Atualiza em Informe: dataEnvio, horaEnvio, destinatarios.
        """
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Método não permitido'}, status=405)

        # 1) Carregar Informe
        try:
            informe = InformeAnomalia.objects.get(id=informe_id)
        except InformeAnomalia.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Informe não encontrado'}, status=404)

        # 2) Vincular Barco via siteInstalacao: "[tipo] [Nome...]"
        site = (informe.siteInstalacao or '').strip()
        if not site:
            return JsonResponse({'success': False, 'error': 'siteInstalacao vazio no Informe'}, status=400)

        # separar primeiro token (tipoBarco) do restante (nomeBarco)
        partes = site.split(' ', 1)
        if len(partes) != 2:
            return JsonResponse({'success': False, 'error': 'siteInstalacao fora do padrão [tipo] [nome]'}, status=400)
        tipo_txt, nome_txt = partes[0].strip(), partes[1].strip()

        try:
            barco = BarcosCad.objects.get(tipoBarco=tipo_txt, nomeBarco=nome_txt)
        except BarcosCad.DoesNotExist:
            # fallback: tentar concatenação direta no banco (casos de espaços múltiplos/capitalização)
            barco = BarcosCad.objects.filter(tipoBarco=tipo_txt, nomeBarco__iexact=nome_txt).first()
            if not barco:
                return JsonResponse({'success': False, 'error': 'Embarcação não encontrada para o siteInstalacao informado'}, status=404)

        # 3) Resolver endereços de e-mail
        from_addr = (barco.emailPetr or '').strip()
        to_addr   = (barco.emailCiop or '').strip()
        cc_list_raw = [(barco.emailAto or '').strip(),
                    (barco.emailSto or '').strip(),
                    (barco.emailFiscContr or '').strip()]
        cc_list = [e for e in cc_list_raw if e]

        if not from_addr or not to_addr:
            return JsonResponse({'success': False, 'error': 'Remetente (emailPetr) ou destinatário (emailCiop) ausente no cadastro da embarcação'}, status=400)

        # 4) Montar assunto
        tipo_legivel = informe.get_tipo_display() if hasattr(informe, 'get_tipo_display') else (informe.tipo or '')
        assunto = f"#### IMPORTANTE #### - INFORME DE ANOMALIA {tipo_legivel} {barco.nomeBarco}"

        # 5) Obter subtabela de pessoas (se houver)
        pessoas = SubTabPessoasAnomalia.objects.filter(idxAnomalia=informe).order_by('id')

        # 6) Normalizações de campos "visível/oculto"
        # Regra: se relacaoEvento != 'EMBARCACAO', os três campos ficam como "N/A"
        rel = (informe.relacaoEvento or '').upper()
        def mostra_emb_campo(valor):
            if rel != 'EMBARCACAO':
                return 'N/A'
            return valor or ''

            # Montar tabela de pessoas apenas se a relação do evento envolver pessoas
# fiscweb/views_anom.py - Trecho da função enviar_informe()
# Substitua apenas a seção de montagem do corpo do e-mail

# ... código anterior mantido ...

        # 6) Montar tabela de pessoas apenas se a relação do evento envolver pessoas
        tabela_pessoas_html = ""
        if (informe.relacaoEvento or "").strip().upper() == "PESSOAS" and pessoas.exists():
            linhas_html = []
            for p in pessoas:
                linhas_html.append(f"""
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd;">{p.nome}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.idade}</td>
                        <td style="padding:8px; border:1px solid #ddd;">{p.funcao}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.tempoExpFuncao}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.tempoExpEmpresa}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.duracaoUltimaFolga}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.necessarioDesembarque}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">{p.resgateAeromedico}</td>
                        <td style="padding:8px; border:1px solid #ddd;">{p.situacaoAtual or ''}</td>
                    </tr>
                """)
            
            tabela_pessoas_html = f"""
                <div style="margin:20px 0;">
                    <h3 style="color:#0b7a66; margin-bottom:10px;">PESSOAS ENVOLVIDAS</h3>
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead>
                            <tr style="background-color:#0b7a66; color:white;">
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:left;">Nome</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Idade</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:left;">Função</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Tempo Exp. Função</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Tempo Exp. Empresa</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Última Folga</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Desembarque?</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:center;">Resgate Aéreo?</th>
                                <th style="padding:10px; border:1px solid #0b7a66; text-align:left;">Situação Atual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {''.join(linhas_html)}
                        </tbody>
                    </table>
                </div>
            """

        # 7) Montar corpo do e-mail em HTML
        corpo_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">
    
    <!-- Cabeçalho -->
    <div style="background-color:#0b7a66; color:white; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
        <h1 style="margin:0; font-size:24px;">INFORME DE ANOMALIA</h1>
        <p style="margin:5px 0 0 0; font-size:16px; font-weight:bold;">{tipo_legivel}</p>
    </div>

    <!-- Corpo principal -->
    <div style="background-color:#f8f9fa; padding:20px; border:1px solid #ddd; border-top:none;">
        
        <!-- Identificação -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">IDENTIFICAÇÃO</h3>
            <table style="width:100%; font-size:14px;">
                <tr>
                    <td style="padding:5px 10px; font-weight:bold; width:180px;">Site/Instalação:</td>
                    <td style="padding:5px 10px;">{informe.siteInstalacao or ''}</td>
                </tr>
                <tr style="background-color:#f8f9fa;">
                    <td style="padding:5px 10px; font-weight:bold;">Empresa:</td>
                    <td style="padding:5px 10px;">{informe.empresa or ''}</td>
                </tr>
                <tr>
                    <td style="padding:5px 10px; font-weight:bold;">Subcontratada:</td>
                    <td style="padding:5px 10px;">{informe.subcontratada or ''} {'<strong>[ x ] Não Aplicável</strong>' if informe.subcontratadaNaoAplicavel else ''}</td>
                </tr>
            </table>
        </div>

        <!-- Data e Local -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">DATA E LOCAL</h3>
            <table style="width:100%; font-size:14px;">
                <tr>
                    <td style="padding:5px 10px; font-weight:bold; width:180px;">Data do Evento:</td>
                    <td style="padding:5px 10px;">{informe.dataEvento or ''}</td>
                </tr>
                <tr style="background-color:#f8f9fa;">
                    <td style="padding:5px 10px; font-weight:bold;">Horário:</td>
                    <td style="padding:5px 10px;">{informe.horarioEvento or ''}</td>
                </tr>
                <tr>
                    <td style="padding:5px 10px; font-weight:bold;">Município/UF:</td>
                    <td style="padding:5px 10px;">{informe.municipioUF or ''} {(' - ' + (informe.municipioOutro or '')) if (getattr(informe, 'municipioUF', '') == 'OUTRO') else ''}</td>
                </tr>
            </table>
        </div>

        <!-- Descrição -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">DESCRIÇÃO</h3>
            <p style="margin:0; white-space:pre-wrap; font-size:14px;">{informe.descricao or ''}</p>
        </div>

        <!-- Relação do Evento -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">RELAÇÃO DO EVENTO</h3>
            <p style="margin:0; font-size:14px; font-weight:bold;">{informe.relacaoEvento or ''}</p>
        </div>

        <!-- Tabela de Pessoas (se houver) -->
        {tabela_pessoas_html}

        <!-- Ações Adotadas -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">AÇÕES ADOTADAS</h3>
            <p style="margin:0; white-space:pre-wrap; font-size:14px;">{informe.acoesAdotadas or ''}</p>
        </div>

        <!-- Ordem de Serviço -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">ORDEM DE SERVIÇO</h3>
            <p style="margin:0; font-size:14px;">
                <strong>OS 1:</strong> {informe.ordemServico1 or ''}
                {f'<span style="margin-left:30px;"><strong>OS 2:</strong> {informe.ordemServico2}</span>' if informe.ordemServico2 else ''}
            </p>
        </div>

        <!-- Operação/Instalação -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">OPERAÇÃO/INSTALAÇÃO</h3>
            <table style="width:100%; font-size:14px;">
                <tr>
                    <td style="padding:5px 10px; font-weight:bold; width:280px;">Operação/Instalação Paralisada?</td>
                    <td style="padding:5px 10px;">{informe.operacaoParalisada or ''}</td>
                </tr>
            </table>
        </div>

        <!-- Informações da Embarcação (se aplicável) -->
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">INFORMAÇÕES DA EMBARCAÇÃO</h3>
            <table style="width:100%; font-size:14px;">
                <tr>
                    <td style="padding:5px 10px; font-weight:bold; width:280px;">Embarcação operou com sistema degradado?</td>
                    <td style="padding:5px 10px;">{mostra_emb_campo(getattr(informe, 'sistemaDegradado', ''))}</td>
                </tr>
                <tr style="background-color:#f8f9fa;">
                    <td style="padding:5px 10px; font-weight:bold;">Embarcação derivou?</td>
                    <td style="padding:5px 10px;">{mostra_emb_campo(getattr(informe, 'embarcacaoDerivou', ''))}</td>
                </tr>
                <tr>
                    <td style="padding:5px 10px; font-weight:bold;">Embarcação perdeu posição?</td>
                    <td style="padding:5px 10px;">{mostra_emb_campo(getattr(informe, 'embarcacaoPerdeuPosicao', ''))}</td>
                </tr>
            </table>
        </div>

        <!-- Informações Complementares -->
        {f'''
        <div style="background-color:white; padding:15px; margin-bottom:15px; border-left:4px solid #0b7a66;">
            <h3 style="color:#0b7a66; margin-top:0;">INFORMAÇÕES COMPLEMENTARES</h3>
            <p style="margin:0; white-space:pre-wrap; font-size:14px;">{informe.informacoesComplementares}</p>
        </div>
        ''' if informe.informacoesComplementares else ''}

    </div>

    <!-- Rodapé/Assinatura -->
    <div style="background-color:#f8f9fa; padding:20px; border:1px solid #ddd; border-top:none; border-radius:0 0 8px 8px; text-align:center;">
        <p style="margin:0; font-size:14px; line-height:1.8;">
            <strong>Atenciosamente,</strong><br>
            {getattr(request, 'user', None) and getattr(request.user, 'get_username', lambda: '')() or ''}<br>
            <span style="color:#0b7a66; font-weight:bold;">Fiscal Offshore – Petróleo Brasileiro S/A</span><br>
            {barco.tipoBarco} {barco.nomeBarco}<br>
            <a href="mailto:{barco.emailPetr}" style="color:#0b7a66; text-decoration:none;">{barco.emailPetr}</a>
        </p>
    </div>

</body>
</html>
        """

        # 8) Enviar e-mail (SMTP sem autenticação)
        msg = EmailMessage()
        msg.set_content("Este e-mail requer visualização em HTML.")  # Fallback texto puro
        msg.add_alternative(corpo_html, subtype='html')  # Versão HTML
        msg['Subject'] = assunto
        msg['From'] = from_addr
        msg['To'] = to_addr
        if cc_list:
            msg['Cc'] = ", ".join(cc_list)

        try:
            s = smtplib.SMTP('smtp.petrobras.com.br', 25)
            s.send_message(msg)
            s.quit()
        except Exception as e:
            print(f"[EMAIL][ERRO] Falha no envio do informe {informe.id}: {e}")
            return JsonResponse({'success': False, 'error': 'Falha ao enviar e-mail'}, status=500)

        # 9) Atualizar campos de envio no Informe
        agora = timezone.localtime()
        informe.dataEnvioInforme = agora.date()
        informe.horaEnvioInforme = agora.time()
        destinatarios_total = [to_addr] + cc_list
        informe.destInforme = ";".join(destinatarios_total)
        informe.save(update_fields=['dataEnvioInforme', 'horaEnvioInforme', 'destInforme'])

        print(f"[EMAIL][OK] Informe {informe.id} enviado para {to_addr} CC={cc_list}")
        return JsonResponse({'success': True})