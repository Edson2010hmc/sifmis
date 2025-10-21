import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from django.conf import settings
from django.shortcuts import render
from django.utils.dateparse import parse_date, parse_datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.http.multipartparser import MultiPartParser
from django.core.files.uploadhandler import MemoryFileUploadHandler

from .models_cad import FiscaisCad,BarcosCad,ModalBarco

from .models_anom import InformeAnomalia

from .models_ps import PassServ
from .models_ps import PortoTrocaTurma
from .models_ps import PortoManutPrev
from .models_ps import PortoAbast
from .models_ps import PortoInspNorm,subTabPortoInspNorm
from .models_ps import PortoInspPetr,subTabPortoInspPetr
from .models_ps import PortoEmbEquip,subTabPortoEmbEquip
from .models_ps import PortoMobD,SubTabPortoMobD
from .models_ps import anomSMS,desvSMS


#================================================PASSAGEM DE SERVIÇO - API REST - VERIFICA RASCUNHO USUARIO=================================================
@csrf_exempt
@require_http_methods(["POST"])
def verificar_rascunho(request):
    """
    Verifica se existe PS em RASCUNHO para o fiscal logado
    """
    try:
        data = json.loads(request.body)
        fiscal_nome = data.get('fiscalNome', '').strip()
        
        if not fiscal_nome:
            return JsonResponse({
                'success': False,
                'error': 'Nome do fiscal não fornecido'
            }, status=400)
        
        # Buscar PS em RASCUNHO para o fiscal desembarcando
        ps_rascunho = PassServ.objects.filter(
            fiscalDes=fiscal_nome,
            statusPS='RASCUNHO'
        ).first()
        
        return JsonResponse({
            'success': True,
            'existeRascunho': ps_rascunho is not None
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================PASSAGEM DE SERVIÇO - API REST - VERIFICA RASCUNHO EMBARCAÇÃO=================================================
@csrf_exempt
@require_http_methods(["POST"])
def verificar_rascunho_embarcacao(request):
    """
    Verifica se existe PS em RASCUNHO para uma embarcação específica
    Retorna dados do fiscal que criou se existir
    """
    try:
        data = json.loads(request.body)
        barco_id = data.get('barcoId')
        fiscal_nome = data.get('fiscalNome', '').strip()
        
        if not barco_id:
            return JsonResponse({
                'success': False,
                'error': 'ID da embarcação não fornecido'
            }, status=400)
        
        # Buscar embarcação
        try:
            barco = BarcosCad.objects.get(id=barco_id)
        except BarcosCad.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Embarcação não encontrada'
            }, status=404)
        
        # Buscar PS em RASCUNHO para essa embarcação
        barco_nome = f"{barco.tipoBarco} - {barco.nomeBarco}"
        ps_rascunho = PassServ.objects.filter(
            BarcoPS=barco_nome,
            statusPS='RASCUNHO'
        ).exclude(fiscalDes=fiscal_nome).first()
        
        if ps_rascunho:
            return JsonResponse({
                'success': True,
                'existeRascunho': True,
                'barcoNome': barco_nome,
                'fiscalNome': ps_rascunho.fiscalDes
            })
        
        return JsonResponse({
            'success': True,
            'existeRascunho': False
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================PASSAGEM DE SERVIÇO - API REST - DETALHES PS=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def passagem_list(request):
    """
    GET: Lista todas as passagens (PassServ)
    POST: Cria uma nova passagem (PassServ)
    """
    if request.method == 'GET':
        try:
            passagens = PassServ.objects.all().values(
                'id', 'numPS', 'anoPS', 'dataInicio', 'dataFim',
                'dataEmissaoPS', 'TipoBarco', 'BarcoPS', 'statusPS',
                'fiscalEmb', 'fiscalDes', 'pdfPath'
            )
            passagens_list = []
            for p in passagens:
                # Garantir que campos de data venham como string JSON-serializável
                p['dataInicio'] = str(p['dataInicio']) if p.get('dataInicio') is not None else None
                p['dataFim'] = str(p['dataFim']) if p.get('dataFim') is not None else None
                p['dataEmissaoPS'] = str(p['dataEmissaoPS']) if p.get('dataEmissaoPS') is not None else None
                passagens_list.append(p)

            print(f"[API] GET /passagens - Retornando {len(passagens_list)} passagens")

            return JsonResponse({
                'success': True,
                'data': passagens_list,
                'count': len(passagens_list)
            }, safe=False)

        except Exception as e:
            print(f"[API ERROR] GET /passagens - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)

            print(f"[API] POST /passagens - Criando passagem: numPS={data.get('numPS')} anoPS={data.get('anoPS')}")

            # Preparar dados (tentativa de parse de datas; aceita None se falhar)
            data_emissao = None
            dt_inicio = None
            dt_fim = None

            # Tenta parsear como date ou datetime (aceita ISO strings)
            if data.get('dataEmissaoPS'):
                data_emissao = parse_date(data.get('dataEmissaoPS')) or parse_datetime(data.get('dataEmissaoPS')) or data.get('dataEmissaoPS')
            if data.get('dataInicio'):
                dt_inicio = parse_date(data.get('dataInicio')) or parse_datetime(data.get('dataInicio')) or data.get('dataInicio')
            if data.get('dataFim'):
                dt_fim = parse_date(data.get('dataFim')) or parse_datetime(data.get('dataFim')) or data.get('dataFim')

            # Monta o objeto PassServ. Ajuste os nomes dos campos caso seu modelo seja diferente.
            passagem = PassServ.objects.create(
                numPS=data.get('numPS'),
                anoPS=data.get('anoPS'),
                dataInicio=dt_inicio,
                dataFim=dt_fim,
                dataEmissaoPS=data_emissao,
                TipoBarco=data.get('TipoBarco'),
                BarcoPS=data.get('BarcoPS'),
                statusPS=data.get('statusPS'),
                # fiscalEmb e fiscalDes no DB parecem ser strings que guardam "chave - nome"
                fiscalDes=data.get('fiscalDes', ''),
                pdfPath=data.get('pdfPath', '')
            )

            # Se enviaram fiscalEmb como ID, converte para "chave - nome" como no seu detalhe
            if data.get('fiscalEmb'):
                try:
                    fiscal_emb = FiscaisCad.objects.get(id=data.get('fiscalEmb'))
                    passagem.fiscalEmb = f"{fiscal_emb.chave} - {fiscal_emb.nome}"
                    passagem.save()
                except FiscaisCad.DoesNotExist:
                    # se não existir, armazena o que foi enviado (possivelmente já string)
                    passagem.fiscalEmb = data.get('fiscalEmb')
                    passagem.save()

            print(f"[API] POST /passagens - Passagem criada com ID: {passagem.id}")

            return JsonResponse({
                'success': True,
                'message': 'Passagem criada com sucesso',
                'data': {
                    'id': passagem.id,
                    'numPS': passagem.numPS,
                    'anoPS': passagem.anoPS,
                    'dataInicio': str(passagem.dataInicio) if passagem.dataInicio else None,
                    'dataFim': str(passagem.dataFim) if passagem.dataFim else None,
                    'dataEmissaoPS': str(passagem.dataEmissaoPS) if passagem.dataEmissaoPS else None,
                    'TipoBarco': passagem.TipoBarco,
                    'BarcoPS': passagem.BarcoPS,
                    'statusPS': passagem.statusPS,
                    'fiscalEmb': passagem.fiscalEmb,
                    'fiscalDes': passagem.fiscalDes,
                    'pdfPath': passagem.pdfPath
                }
            }, status=201)

        except Exception as e:
            print(f"[API ERROR] POST /passagens - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def passagem_detail(request, ps_id):
    """
    GET: Retorna detalhes de uma PS específica
    PUT: Atualiza uma PS
    DELETE: Remove uma PS
    """
    try:
        ps = PassServ.objects.get(id=ps_id)
        
        if request.method == 'GET':
            return JsonResponse({
                'success': True,
                'data': {
                    'id': ps.id,
                    'numPS': ps.numPS,
                    'anoPS': ps.anoPS,
                    'dataInicio': str(ps.dataInicio),
                    'dataFim': str(ps.dataFim),
                    'dataEmissaoPS': str(ps.dataEmissaoPS),
                    'TipoBarco': ps.TipoBarco,
                    'BarcoPS': ps.BarcoPS,
                    'statusPS': ps.statusPS,
                    'fiscalEmb': ps.fiscalEmb,
                    'fiscalDes': ps.fiscalDes,
                    'pdfPath': ps.pdfPath  
                }
            })
        
        elif request.method == 'PUT':
            data = json.loads(request.body)
            
            ps.dataEmissaoPS = data.get('dataEmissaoPS', ps.dataEmissaoPS)
            ps.dataInicio = data.get('dataInicio', ps.dataInicio)
            ps.dataFim = data.get('dataFim', ps.dataFim)
            
            if data.get('fiscalEmb'):
                fiscal_emb = FiscaisCad.objects.get(id=data.get('fiscalEmb'))
                ps.fiscalEmb = f"{fiscal_emb.chave} - {fiscal_emb.nome}"
            
            ps.save()
            
            return JsonResponse({
                'success': True,
                'message': 'PS atualizada com sucesso'
            })
        
        elif request.method == 'DELETE':
            ps.delete()
            return JsonResponse({
                'success': True,
                'message': 'PS excluída com sucesso'
            })
        
    except PassServ.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'PS não encontrada'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================PASSAGEM DE SERVIÇO - API REST - CRIA NOVA PS=================================================
@csrf_exempt
@require_http_methods(["POST"])
def criar_nova_ps(request):
    """
    Cria uma nova PS em modo RASCUNHO
    """
    try:
        data = json.loads(request.body)
        
        barco_id = data.get('barcoId')
        fiscal_des_nome = data.get('fiscalDesNome')
        fiscal_emb_id = data.get('fiscalEmbId')
        numero = data.get('numero')
        ano = data.get('ano')
        data_inicio = data.get('dataInicio')
        data_fim = data.get('dataFim')
        data_emissao = data.get('dataEmissao')
        
        # Buscar embarcação
        barco = BarcosCad.objects.get(id=barco_id)
        
        # Buscar fiscal embarcando
        fiscal_emb_nome = ''
        if fiscal_emb_id:
            fiscal_emb = FiscaisCad.objects.get(id=fiscal_emb_id)
            fiscal_emb_nome = f"{fiscal_emb.chave} - {fiscal_emb.nome}"
        
        # Criar PS
        ps = PassServ.objects.create(
            numPS=numero,
            anoPS=str(ano),
            dataInicio=data_inicio,
            dataFim=data_fim,
            dataEmissaoPS=data_emissao,
            TipoBarco=barco.tipoBarco,
            BarcoPS=f"{barco.tipoBarco} - {barco.nomeBarco}",
            statusPS='RASCUNHO',
            fiscalEmb=fiscal_emb_nome,
            fiscalDes=fiscal_des_nome
        )
        
        return JsonResponse({
            'success': True,
            'message': 'PS criada com sucesso',
            'data': {
                'id': ps.id,
                'numPS': ps.numPS,
                'anoPS': ps.anoPS,
                'BarcoPS': ps.BarcoPS,
                'dataInicio': str(ps.dataInicio),
                'dataFim': str(ps.dataFim),
                'dataEmissaoPS': str(ps.dataEmissaoPS),
                'statusPS': ps.statusPS,
                'fiscalEmb': ps.fiscalEmb,
                'fiscalDes': ps.fiscalDes
            }
        }, status=201)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

#================================================PASSAGEM DE SERVIÇO - API REST - VERIFICA PS ANTERIOR=================================================
@csrf_exempt
@require_http_methods(["POST"])
def verificar_ps_anterior(request):
    """
    Verifica se existe PS anterior para a embarcação e calcula dados da próxima PS
    """
    try:
        data = json.loads(request.body)
        barco_id = data.get('barcoId')
        
        if not barco_id:
            return JsonResponse({
                'success': False,
                'error': 'ID da embarcação não fornecido'
            }, status=400)
        
        # Buscar embarcação
        try:
            barco = BarcosCad.objects.get(id=barco_id)
        except BarcosCad.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Embarcação não encontrada'
            }, status=404)
        
        barco_nome = f"{barco.tipoBarco} - {barco.nomeBarco}"
        
        # Buscar última PS da embarcação (por data de emissão)
        ps_anterior = PassServ.objects.filter(
            BarcoPS=barco_nome
        ).order_by('-dataEmissaoPS').first()
        
        if not ps_anterior:
            # Não existe PS anterior - frontend usará algoritmo
            return JsonResponse({
                'success': True,
                'existeAnterior': False
            })
        
        # Existe PS anterior - calcular próxima PS
        from datetime import timedelta
        
        # Início = emissão da anterior
        proximo_inicio = ps_anterior.dataEmissaoPS
        
        # Fim = início + 13 dias
        proximo_fim = proximo_inicio + timedelta(days=13)
        
        # Emissão = fim + 1 dia
        proxima_emissao = proximo_fim + timedelta(days=1)
        
        # Calcular numeração
        ano_emissao = proxima_emissao.year
        ano_anterior = ps_anterior.dataEmissaoPS.year
        
        if ano_emissao == ano_anterior:
            # Mesmo ano - incrementa número
            proximo_numero = ps_anterior.numPS + 1
        else:
            # Mudou ano - reinicia em 1
            proximo_numero = 1
        
        return JsonResponse({
            'success': True,
            'existeAnterior': True,
            'proximoNumero': proximo_numero,
            'proximoAno': ano_emissao,
            'proximoInicio': proximo_inicio.isoformat().split('T')[0],
            'proximoFim': proximo_fim.isoformat().split('T')[0],
            'proximaEmissao': proxima_emissao.isoformat().split('T')[0]
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


#================================================PASSAGEM DE SERVIÇO - API REST - DETALHES PS=================================================

    """
    GET: Retorna detalhes de uma PS específica
    DELETE: Remove uma PS
    """
    try:
        ps = PassServ.objects.get(id=ps_id)
        
        if request.method == 'GET':
            return JsonResponse({
                'success': True,
                'data': {
                    'id': ps.id,
                    'numPS': ps.numPS,
                    'anoPS': ps.anoPS,
                    'dataInicio': str(ps.dataInicio),
                    'dataFim': str(ps.dataFim),
                    'dataEmissaoPS': str(ps.dataEmissaoPS),
                    'TipoBarco': ps.TipoBarco,
                    'BarcoPS': ps.BarcoPS,
                    'statusPS': ps.statusPS,
                    'fiscalEmb': ps.fiscalEmb,
                    'fiscalDes': ps.fiscalDes
                }
            })
        
        elif request.method == 'DELETE':
            ps.delete()
            return JsonResponse({
                'success': True,
                'message': 'PS excluída com sucesso'
            })
        
    except PassServ.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'PS não encontrada'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    """
    Retorna detalhes de uma PS específica
    """
    try:
        ps = PassServ.objects.get(id=ps_id)
        
        return JsonResponse({
            'success': True,
            'data': {
                'id': ps.id,
                'numPS': ps.numPS,
                'anoPS': ps.anoPS,
                'dataInicio': str(ps.dataInicio),
                'dataFim': str(ps.dataFim),
                'dataEmissaoPS': str(ps.dataEmissaoPS),
                'TipoBarco': ps.TipoBarco,
                'BarcoPS': ps.BarcoPS,
                'statusPS': ps.statusPS,
                'fiscalEmb': ps.fiscalEmb,
                'fiscalDes': ps.fiscalDes
            }
        })
        
    except PassServ.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'PS não encontrada'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
#================================================PASSAGEM DE SERVIÇO - API REST - LISTA PS USUÁRIO=================================================
@csrf_exempt
@require_http_methods(["GET"])
def listar_passagens_usuario(request):
    """
    Lista todas as PS do usuário logado
    """
    try:
        fiscal_nome = request.GET.get('fiscalNome', '').strip()
        print(f"[DEBUG] Fiscal nome recebido: '{fiscal_nome}'")
        if not fiscal_nome:
            return JsonResponse({
                'success': False,
                'error': 'Nome do fiscal não fornecido'
            }, status=400)
        
        passagens = PassServ.objects.filter(
            fiscalDes=fiscal_nome
        ).order_by('-dataEmissaoPS')

        passagens_list = []
        for ps in passagens:
            passagens_list.append({
                'id': ps.id,
                'numPS': ps.numPS,
                'anoPS': ps.anoPS,
                'BarcoPS': ps.BarcoPS,
                'dataInicio': str(ps.dataInicio),
                'dataFim': str(ps.dataFim),
                'dataEmissaoPS': str(ps.dataEmissaoPS),
                'statusPS': ps.statusPS
            })
        
        return JsonResponse({
            'success': True,
            'data': passagens_list
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================TROCA DE TURMA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_troca_turma_list(request, ps_id):
    """
    GET: Retorna troca de turma de uma PS (se existir)
    POST: Cria nova troca de turma para uma PS
    """
    
    # Verificar se PS existe
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            troca_turma = PortoTrocaTurma.objects.filter(idxPortoTT=ps).first()
            
            if not troca_turma:
                print(f"[API] GET /ps/{ps_id}/troca-turma/ - Nenhuma troca de turma encontrada")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/troca-turma/ - Retornando troca de turma ID {troca_turma.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': troca_turma.id,
                    'Porto': troca_turma.Porto,
                    'Terminal': troca_turma.Terminal,
                    'OrdSerPorto': troca_turma.OrdSerPorto,
                    'AtracPorto': str(troca_turma.AtracPorto),
                    'DuracPorto': troca_turma.DuracPorto,
                    'ObservPorto': troca_turma.ObservPorto
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/troca-turma/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Verificar se já existe
            troca_existente = PortoTrocaTurma.objects.filter(idxPortoTT=ps).first()
            if troca_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/troca-turma/ - Já existe troca de turma para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe troca de turma para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/troca-turma/ - Criando troca de turma")
            
            troca_turma = PortoTrocaTurma.objects.create(
                idxPortoTT=ps,
                Porto=data.get('Porto', ''),
                Terminal=data.get('Terminal', ''),
                OrdSerPorto=data.get('OrdSerPorto', ''),
                AtracPorto=data.get('AtracPorto'),
                DuracPorto=data.get('DuracPorto', ''),
                ObservPorto=data.get('ObservPorto', '')
            )
            
            print(f"[API] POST /ps/{ps_id}/troca-turma/ - Troca de turma criada com ID: {troca_turma.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Troca de Turma criada com sucesso',
                'data': {
                    'id': troca_turma.id,
                    'Porto': troca_turma.Porto,
                    'Terminal': troca_turma.Terminal,
                    'OrdSerPorto': troca_turma.OrdSerPorto,
                    'AtracPorto': str(troca_turma.AtracPorto),
                    'DuracPorto': troca_turma.DuracPorto,
                    'ObservPorto': troca_turma.ObservPorto
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/troca-turma/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_troca_turma_detail(request, troca_turma_id):
    """
    PUT: Atualiza troca de turma
    DELETE: Remove troca de turma
    """
    
    try:
        troca_turma = PortoTrocaTurma.objects.get(id=troca_turma_id)
    except PortoTrocaTurma.DoesNotExist:
        print(f"[API ERROR] Troca de Turma ID {troca_turma_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Troca de Turma não encontrada'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /troca-turma/{troca_turma_id}/ - Atualizando troca de turma")
            
            troca_turma.Porto = data.get('Porto', troca_turma.Porto)
            troca_turma.Terminal = data.get('Terminal', troca_turma.Terminal)
            troca_turma.OrdSerPorto = data.get('OrdSerPorto', troca_turma.OrdSerPorto)
            troca_turma.AtracPorto = data.get('AtracPorto', troca_turma.AtracPorto)
            troca_turma.DuracPorto = data.get('DuracPorto', troca_turma.DuracPorto)
            troca_turma.ObservPorto = data.get('ObservPorto', troca_turma.ObservPorto)
            troca_turma.save()
            
            print(f"[API] PUT /troca-turma/{troca_turma_id}/ - Troca de turma atualizada")
            
            return JsonResponse({
                'success': True,
                'message': 'Troca de Turma atualizada com sucesso',
                'data': {
                    'id': troca_turma.id,
                    'Porto': troca_turma.Porto,
                    'Terminal': troca_turma.Terminal,
                    'OrdSerPorto': troca_turma.OrdSerPorto,
                    'AtracPorto': str(troca_turma.AtracPorto),
                    'DuracPorto': troca_turma.DuracPorto,
                    'ObservPorto': troca_turma.ObservPorto
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /troca-turma/{troca_turma_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            troca_turma.delete()
            
            print(f"[API] DELETE /troca-turma/{troca_turma_id}/ - Troca de turma removida")
            
            return JsonResponse({
                'success': True,
                'message': 'Troca de Turma removida com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /troca-turma/{troca_turma_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================MANUTENÇÃO PREVENTIVA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_manut_prev_list(request, ps_id):
    """
    GET: Retorna manutenção preventiva de uma PS (se existir)
    POST: Cria nova manutenção preventiva para uma PS
    """
    
    # Verificar se PS existe
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            manut_prev = PortoManutPrev.objects.filter(idxPortoMP=ps).first()
            
            if not manut_prev:
                print(f"[API] GET /ps/{ps_id}/manut-prev/ - Nenhuma manutenção preventiva encontrada")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/manut-prev/ - Retornando manutenção preventiva ID {manut_prev.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': manut_prev.id,
                    'prevManPrev': manut_prev.prevManPrev,
                    'Franquia': manut_prev.Franquia,
                    'SaldoFranquia': manut_prev.SaldoFranquia,
                    'OrdSerManutPrev': manut_prev.OrdSerManutPrev,
                    'Rade': manut_prev.Rade.url if manut_prev.Rade else None,
                    'RadeNome': manut_prev.Rade.name.split('/')[-1] if manut_prev.Rade else None,
                    'ObservManPrev': manut_prev.ObservManPrev
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/manut-prev/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            # Verificar se já existe
            manut_existente = PortoManutPrev.objects.filter(idxPortoMP=ps).first()
            if manut_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/manut-prev/ - Já existe manutenção preventiva para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe manutenção preventiva para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/manut-prev/ - Criando manutenção preventiva")
            
            # Dados vêm de request.POST (não JSON) quando tem arquivo
            manut_prev = PortoManutPrev.objects.create(
                idxPortoMP=ps,
                prevManPrev=request.POST.get('prevManPrev', 'false').lower() == 'true',
                Franquia=int(request.POST.get('Franquia', 0)),
                SaldoFranquia=int(request.POST.get('SaldoFranquia', 0)),
                OrdSerManutPrev=request.POST.get('OrdSerManutPrev', ''),
                Rade=request.FILES.get('Rade'),
                ObservManPrev=request.POST.get('ObservManPrev', '')
            )
            
            print(f"[API] POST /ps/{ps_id}/manut-prev/ - Manutenção preventiva criada com ID: {manut_prev.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Manutenção Preventiva criada com sucesso',
                'data': {
                    'id': manut_prev.id,
                    'prevManPrev': manut_prev.prevManPrev,
                    'Franquia': manut_prev.Franquia,
                    'SaldoFranquia': manut_prev.SaldoFranquia,
                    'OrdSerManutPrev': manut_prev.OrdSerManutPrev,
                    'Rade': manut_prev.Rade.url if manut_prev.Rade else None,
                    'RadeNome': manut_prev.Rade.name.split('/')[-1] if manut_prev.Rade else None,
                    'ObservManPrev': manut_prev.ObservManPrev
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/manut-prev/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_manut_prev_detail(request, manut_prev_id):
    """
    PUT: Atualiza manutenção preventiva
    DELETE: Remove manutenção preventiva
    """
    
    try:
        manut_prev = PortoManutPrev.objects.get(id=manut_prev_id)
    except PortoManutPrev.DoesNotExist:
        print(f"[API ERROR] Manutenção Preventiva ID {manut_prev_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Manutenção Preventiva não encontrada'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            print(f"[API] PUT /manut-prev/{manut_prev_id}/ - Atualizando manutenção preventiva")
            
            # Parser para FormData em requisições PUT
            if request.content_type and 'multipart/form-data' in request.content_type:
                # Parsear multipart data manualmente
                parser = MultiPartParser(request.META, request, [MemoryFileUploadHandler()])
                PUT, FILES = parser.parse()
                
                print(f"[DEBUG] PUT data parseado: {dict(PUT)}")
                print(f"[DEBUG] FILES parseado: {list(FILES.keys())}")
            else:
                PUT = request.POST
                FILES = request.FILES
            
            # Atualizar campos
            if 'prevManPrev' in PUT:
                manut_prev.prevManPrev = PUT.get('prevManPrev', 'false').lower() == 'true'
            
            if 'Franquia' in PUT:
                franquia = PUT.get('Franquia', '0')
                manut_prev.Franquia = int(franquia) if franquia else 0
            
            if 'SaldoFranquia' in PUT:
                saldo = PUT.get('SaldoFranquia', '0')
                manut_prev.SaldoFranquia = int(saldo) if saldo else 0
            
            if 'OrdSerManutPrev' in PUT:
                manut_prev.OrdSerManutPrev = PUT.get('OrdSerManutPrev', '')
            
            if 'ObservManPrev' in PUT:
                manut_prev.ObservManPrev = PUT.get('ObservManPrev', '')
            
            # Atualizar arquivo se foi enviado
            if 'Rade' in FILES:
                print(f"[DEBUG] Arquivo recebido: {FILES['Rade'].name}")
                
                # Deletar arquivo antigo se existir
                if manut_prev.Rade:
                    import os
                    try:
                        if os.path.isfile(manut_prev.Rade.path):
                            os.remove(manut_prev.Rade.path)
                    except:
                        pass
                
                manut_prev.Rade = FILES['Rade']
            
            manut_prev.save()
            
            print(f"[API] PUT /manut-prev/{manut_prev_id}/ - Dados salvos: Franquia={manut_prev.Franquia}, Saldo={manut_prev.SaldoFranquia}, OS={manut_prev.OrdSerManutPrev}")
            
            return JsonResponse({
                'success': True,
                'message': 'Manutenção Preventiva atualizada com sucesso',
                'data': {
                    'id': manut_prev.id,
                    'prevManPrev': manut_prev.prevManPrev,
                    'Franquia': manut_prev.Franquia,
                    'SaldoFranquia': manut_prev.SaldoFranquia,
                    'OrdSerManutPrev': manut_prev.OrdSerManutPrev,
                    'Rade': manut_prev.Rade.url if manut_prev.Rade else None,
                    'RadeNome': manut_prev.Rade.name.split('/')[-1] if manut_prev.Rade else None,
                    'ObservManPrev': manut_prev.ObservManPrev
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /manut-prev/{manut_prev_id}/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================ABASTECIMENTO - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_abast_list(request, ps_id):
    """
    GET: Retorna abastecimento de uma PS (se existir)
    POST: Cria novo abastecimento para uma PS
    """
    
    # Verificar se PS existe
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            abast = PortoAbast.objects.filter(idxPortoAB=ps).first()
            
            if not abast:
                print(f"[API] GET /ps/{ps_id}/abast/ - Nenhum abastecimento encontrado")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/abast/ - Retornando abastecimento ID {abast.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': abast.id,
                    'prevAbast': abast.prevAbast,
                    'OrdSerAbast': abast.OrdSerAbast or '',
                    'DataHoraPrevAbast': abast.DataHoraPrevAbast.isoformat() if abast.DataHoraPrevAbast else None,
                    'QuantAbast': abast.QuantAbast,
                    'DuracPrev': abast.DuracPrev,
                    'UltAbast': str(abast.UltAbast) if abast.UltAbast else None,
                    'QuantUltAbast': abast.QuantUltAbast,
                    'Anexos': abast.Anexos.url if abast.Anexos else None,
                    'AnexosNome': abast.Anexos.name.split('/')[-1] if abast.Anexos else None,
                    'ObservAbast': abast.ObservAbast or ''
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/abast/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            # Verificar se já existe
            abast_existente = PortoAbast.objects.filter(idxPortoAB=ps).first()
            if abast_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/abast/ - Já existe abastecimento para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe abastecimento para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/abast/ - Criando abastecimento")
            
            abast = PortoAbast.objects.create(
                idxPortoAB=ps,
                prevAbast=True,
                OrdSerAbast='',
                ObservAbast=''
            )
            
            print(f"[API] POST /ps/{ps_id}/abast/ - Abastecimento criado com ID: {abast.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Abastecimento criado com sucesso',
                'data': {
                    'id': abast.id,
                    'prevAbast': abast.prevAbast
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/abast/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_abast_detail(request, abast_id):
    """
    PUT: Atualiza abastecimento
    DELETE: Remove abastecimento
    """
    
    try:
        abast = PortoAbast.objects.get(id=abast_id)
    except PortoAbast.DoesNotExist:
        print(f"[API ERROR] Abastecimento ID {abast_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Abastecimento não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            print(f"[API] PUT /abast/{abast_id}/ - Atualizando abastecimento")
            
            # Parser para FormData em requisições PUT
            if request.content_type and 'multipart/form-data' in request.content_type:
                parser = MultiPartParser(request.META, request, [MemoryFileUploadHandler()])
                PUT, FILES = parser.parse()
                print(f"[DEBUG] PUT data parseado: {dict(PUT)}")
                print(f"[DEBUG] FILES parseado: {list(FILES.keys())}")
            else:
                PUT = request.POST
                FILES = request.FILES
            
            # Atualizar campos
            if 'prevAbast' in PUT:
                abast.prevAbast = PUT.get('prevAbast', 'false').lower() == 'true'
            
            if 'OrdSerAbast' in PUT:
                abast.OrdSerAbast = PUT.get('OrdSerAbast', '')
            
            if 'DataHoraPrevAbast' in PUT:
                data_hora = PUT.get('DataHoraPrevAbast')
                if data_hora:
                    from django.utils.dateparse import parse_datetime
                    abast.DataHoraPrevAbast = parse_datetime(data_hora)
            
            if 'QuantAbast' in PUT:
                qtd = PUT.get('QuantAbast', '')
                abast.QuantAbast = int(qtd) if qtd else None
            
            if 'DuracPrev' in PUT:
                duracao = PUT.get('DuracPrev', '')
                abast.DuracPrev = int(duracao) if duracao else None
            
            if 'UltAbast' in PUT:
                abast.UltAbast = PUT.get('UltAbast') or None
            
            if 'QuantUltAbast' in PUT:
                qtd_ult = PUT.get('QuantUltAbast', '')
                abast.QuantUltAbast = int(qtd_ult) if qtd_ult else None
            
            if 'ObservAbast' in PUT:
                abast.ObservAbast = PUT.get('ObservAbast', '')
            
            # Atualizar arquivo se foi enviado
            if 'Anexos' in FILES:
                print(f"[DEBUG] Arquivo recebido: {FILES['Anexos'].name}")
                
                # Deletar arquivo antigo se existir
                if abast.Anexos:
                    import os
                    try:
                        if os.path.isfile(abast.Anexos.path):
                            os.remove(abast.Anexos.path)
                    except:
                        pass
                
                abast.Anexos = FILES['Anexos']
            
            abast.save()
            
            print(f"[API] PUT /abast/{abast_id}/ - Dados salvos")
            
            return JsonResponse({
                'success': True,
                'message': 'Abastecimento atualizado com sucesso',
                'data': {
                    'id': abast.id,
                    'prevAbast': abast.prevAbast,
                    'OrdSerAbast': abast.OrdSerAbast or '',
                    'DataHoraPrevAbast': abast.DataHoraPrevAbast.isoformat() if abast.DataHoraPrevAbast else None,
                    'QuantAbast': abast.QuantAbast,
                    'DuracPrev': abast.DuracPrev,
                    'UltAbast': str(abast.UltAbast) if abast.UltAbast else None,
                    'QuantUltAbast': abast.QuantUltAbast,
                    'Anexos': abast.Anexos.url if abast.Anexos else None,
                    'AnexosNome': abast.Anexos.name.split('/')[-1] if abast.Anexos else None,
                    'ObservAbast': abast.ObservAbast or ''
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /abast/{abast_id}/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            abast.delete()
            
            print(f"[API] DELETE /abast/{abast_id}/ - Abastecimento removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Abastecimento removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /abast/{abast_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def buscar_ultimo_abastecimento(request, ps_id):
    """
    Busca o último abastecimento em PSs anteriores da mesma embarcação
    """
    try:
        ps_atual = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'PS não encontrada'
        }, status=404)
    
    try:
        # Buscar PSs anteriores da mesma embarcação, ordenadas da mais recente para mais antiga
        ps_anteriores = PassServ.objects.filter(
            BarcoPS=ps_atual.BarcoPS,
            dataEmissaoPS__lt=ps_atual.dataEmissaoPS
        ).order_by('-dataEmissaoPS')
        
        print(f"[API] Buscando último abastecimento para {ps_atual.BarcoPS} - {ps_anteriores.count()} PSs anteriores encontradas")
        
        # Percorrer PSs anteriores buscando abastecimento
        for ps_ant in ps_anteriores:
            abast = PortoAbast.objects.filter(idxPortoAB=ps_ant, prevAbast=True).first()
            
            if abast and abast.DataHoraPrevAbast and abast.QuantAbast:
                print(f"[API] Último abastecimento encontrado na PS {ps_ant.numPS}/{ps_ant.anoPS}")
                
                return JsonResponse({
                    'success': True,
                    'encontrado': True,
                    'data': {
                        'UltAbast': abast.DataHoraPrevAbast.date().isoformat(),
                        'QuantUltAbast': abast.QuantAbast,
                        'psOrigem': f"{ps_ant.numPS}/{ps_ant.anoPS}"
                    }
                })
        
        # Não encontrou em nenhuma PS anterior
        print(f"[API] Nenhum abastecimento encontrado em PSs anteriores")
        
        return JsonResponse({
            'success': True,
            'encontrado': False,
            'mensagem': 'Não Informado em PSs anteriores'
        })
        
    except Exception as e:
        print(f"[API ERROR] Erro ao buscar último abastecimento: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================INSPEÇÃO NORMATIVA (PRINCIPAL) - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_insp_norm_list(request, ps_id):
    """
    GET: Retorna inspeção normativa de uma PS (se existir)
    POST: Cria nova inspeção normativa para uma PS
    """
    
    # Verificar se PS existe
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            insp_norm = PortoInspNorm.objects.filter(idxPortoIN=ps).first()
            
            if not insp_norm:
                print(f"[API] GET /ps/{ps_id}/insp-norm/ - Nenhuma inspeção encontrada")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/insp-norm/ - Retornando inspeção ID {insp_norm.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': insp_norm.id,
                    'prevInsNorm': insp_norm.prevInsNorm,
                    'ObservInspNorm': insp_norm.ObservInspNorm
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/insp-norm/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Verificar se já existe
            insp_existente = PortoInspNorm.objects.filter(idxPortoIN=ps).first()
            if insp_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/insp-norm/ - Já existe inspeção para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe inspeção normativa para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/insp-norm/ - Criando inspeção")
            
            insp_norm = PortoInspNorm.objects.create(
                idxPortoIN=ps,
                prevInsNorm=data.get('prevInsNorm', False),
                ObservInspNorm=data.get('ObservInspNorm', '')
            )
            
            print(f"[API] POST /ps/{ps_id}/insp-norm/ - Inspeção criada com ID: {insp_norm.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Inspeção Normativa criada com sucesso',
                'data': {
                    'id': insp_norm.id,
                    'prevInsNorm': insp_norm.prevInsNorm,
                    'ObservInspNorm': insp_norm.ObservInspNorm
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/insp-norm/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_insp_norm_detail(request, insp_norm_id):
    """
    PUT: Atualiza inspeção normativa
    DELETE: Remove inspeção normativa
    """
    
    try:
        insp_norm = PortoInspNorm.objects.get(id=insp_norm_id)
    except PortoInspNorm.DoesNotExist:
        print(f"[API ERROR] Inspeção Normativa ID {insp_norm_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Inspeção Normativa não encontrada'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /insp-norm/{insp_norm_id}/ - Atualizando inspeção")
            
            insp_norm.prevInsNorm = data.get('prevInsNorm', insp_norm.prevInsNorm)
            insp_norm.ObservInspNorm = data.get('ObservInspNorm', insp_norm.ObservInspNorm)
            insp_norm.save()
            
            print(f"[API] PUT /insp-norm/{insp_norm_id}/ - Inspeção atualizada")
            
            return JsonResponse({
                'success': True,
                'message': 'Inspeção Normativa atualizada com sucesso',
                'data': {
                    'id': insp_norm.id,
                    'prevInsNorm': insp_norm.prevInsNorm,
                    'ObservInspNorm': insp_norm.ObservInspNorm
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /insp-norm/{insp_norm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            # Ao deletar, remove também todos os itens da subtabela (CASCADE)
            insp_norm.delete()
            
            print(f"[API] DELETE /insp-norm/{insp_norm_id}/ - Inspeção removida")
            
            return JsonResponse({
                'success': True,
                'message': 'Inspeção Normativa removida com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /insp-norm/{insp_norm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#================================================INSPEÇÃO NORMATIVA - SUBTABELA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def subtab_insp_norm_list(request, insp_norm_id):
    """
    GET: Lista itens da subtabela de uma inspeção normativa
    POST: Adiciona novo item à subtabela
    """
    
    # Verificar se inspeção normativa existe
    try:
        insp_norm = PortoInspNorm.objects.get(id=insp_norm_id)
    except PortoInspNorm.DoesNotExist:
        print(f"[API ERROR] Inspeção Normativa ID {insp_norm_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Inspeção Normativa não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            itens = subTabPortoInspNorm.objects.filter(
                idxsubTabPortoInspNorm=insp_norm
            ).values('id', 'DescInspNorm', 'OrdSerInspNorm')
            
            itens_list = list(itens)
            
            print(f"[API] GET /subtab-insp-norm/{insp_norm_id}/ - Retornando {len(itens_list)} itens")
            
            return JsonResponse({
                'success': True,
                'data': itens_list
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /subtab-insp-norm/{insp_norm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /subtab-insp-norm/{insp_norm_id}/ - Criando item")
            
            item = subTabPortoInspNorm.objects.create(
                idxsubTabPortoInspNorm=insp_norm,
                DescInspNorm=data.get('DescInspNorm'),
                OrdSerInspNorm=data.get('OrdSerInspNorm')
            )
            
            print(f"[API] POST /subtab-insp-norm/{insp_norm_id}/ - Item criado com ID: {item.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Item adicionado com sucesso',
                'data': {
                    'id': item.id,
                    'DescInspNorm': item.DescInspNorm,
                    'OrdSerInspNorm': item.OrdSerInspNorm
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /subtab-insp-norm/{insp_norm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def subtab_insp_norm_detail(request, item_id):
    """
    PUT: Atualiza um item da subtabela
    DELETE: Remove um item da subtabela
    """
    
    try:
        item = subTabPortoInspNorm.objects.get(id=item_id)
    except subTabPortoInspNorm.DoesNotExist:
        print(f"[API ERROR] Item ID {item_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Item não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /subtab-insp-norm-item/{item_id}/ - Atualizando item")
            
            item.DescInspNorm = data.get('DescInspNorm', item.DescInspNorm)
            item.OrdSerInspNorm = data.get('OrdSerInspNorm', item.OrdSerInspNorm)
            item.save()
            
            print(f"[API] PUT /subtab-insp-norm-item/{item_id}/ - Item atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Item atualizado com sucesso',
                'data': {
                    'id': item.id,
                    'DescInspNorm': item.DescInspNorm,
                    'OrdSerInspNorm': item.OrdSerInspNorm
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /subtab-insp-norm-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            item.delete()
            
            print(f"[API] DELETE /subtab-insp-norm-item/{item_id}/ - Item removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Item removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /subtab-insp-norm-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================INSPEÇÃO PETROBRAS - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_insp_petr_list(request, ps_id):
    """
    GET: Retorna inspeção Petrobras de uma PS (se existir)
    POST: Cria nova inspeção Petrobras para uma PS
    """
    
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            insp_petr = PortoInspPetr.objects.filter(idxPortoIP=ps).first()
            
            if not insp_petr:
                print(f"[API] GET /ps/{ps_id}/insp-petr/ - Nenhuma inspeção Petrobras encontrada")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/insp-petr/ - Retornando inspeção Petrobras ID {insp_petr.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': insp_petr.id,
                    'prevInspPetr': insp_petr.prevInspPetr,
                    'ObservInspPetr': insp_petr.ObservInspPetr
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/insp-petr/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            insp_existente = PortoInspPetr.objects.filter(idxPortoIP=ps).first()
            if insp_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/insp-petr/ - Já existe inspeção Petrobras para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe Registro de Insara esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/insp-petr/ - Criando inspeção Petrobras")
            
            insp_petr = PortoInspPetr.objects.create(
                idxPortoIP=ps,
                prevInspPetr=True,
                ObservInspPetr=''
            )
            
            print(f"[API] POST /ps/{ps_id}/insp-petr/ - Inspeção Petrobras criada com ID: {insp_petr.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Resgistro criado com sucesso',
                'data': {
                    'id': insp_petr.id,
                    'prevInspPetr': insp_petr.prevInspPetr,
                    'ObservInspPetr': insp_petr.ObservInspPetr
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/insp-petr/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_insp_petr_detail(request, insp_petr_id):
    """
    PUT: Atualiza inspeção Petrobras
    DELETE: Remove inspeção Petrobras
    """
    
    try:
        insp_petr = PortoInspPetr.objects.get(id=insp_petr_id)
    except PortoInspPetr.DoesNotExist:
        print(f"[API ERROR] Registro ID {insp_petr_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Inspeção Petrobras não encontrada'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /insp-petr/{insp_petr_id}/ - Atualizando inspeção Petrobras")
            
            insp_petr.prevInspPetr = data.get('prevInspPetr', insp_petr.prevInspPetr)
            insp_petr.ObservInspPetr = data.get('ObservInspPetr', insp_petr.ObservInspPetr)
            insp_petr.save()
            
            print(f"[API] PUT /insp-petr/{insp_petr_id}/ - Inspeção Petrobras atualizada")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro atualizado com sucesso',
                'data': {
                    'id': insp_petr.id,
                    'prevInspPetr': insp_petr.prevInspPetr,
                    'ObservInspPetr': insp_petr.ObservInspPetr
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /insp-petr/{insp_petr_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            insp_petr.delete()
            
            print(f"[API] DELETE /insp-petr/{insp_petr_id}/ - Inspeção Petrobras removida")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /insp-petr/{insp_petr_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================INSPEÇÃO PETROBRAS - SUBTABELA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def subtab_insp_petr_list(request, insp_petr_id):
    """
    GET: Lista itens da subtabela de inspeção Petrobras
    POST: Adiciona novo item à subtabela
    """
    
    try:
        insp_petr = PortoInspPetr.objects.get(id=insp_petr_id)
    except PortoInspPetr.DoesNotExist:
        print(f"[API ERROR] Inspeção Petrobras ID {insp_petr_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Registro não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            itens = subTabPortoInspPetr.objects.filter(
                idxsubTabPortoIP=insp_petr
            ).values('id', 'DescInspPetr', 'auditorPetr', 'gerAuditorPetr')
            
            itens_list = list(itens)
            
            print(f"[API] GET /subtab-insp-petr/{insp_petr_id}/ - Retornando {len(itens_list)} itens")
            
            return JsonResponse({
                'success': True,
                'data': itens_list
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /subtab-insp-petr/{insp_petr_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /subtab-insp-petr/{insp_petr_id}/ - Criando item")
            
            item = subTabPortoInspPetr.objects.create(
                idxsubTabPortoIP=insp_petr,
                DescInspPetr=data.get('DescInspPetr'),
                auditorPetr=data.get('auditorPetr'),
                gerAuditorPetr=data.get('gerAuditorPetr')
            )
            
            print(f"[API] POST /subtab-insp-petr/{insp_petr_id}/ - Item criado com ID: {item.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Item adicionado com sucesso',
                'data': {
                    'id': item.id,
                    'DescInspPetr': item.DescInspPetr,
                    'auditorPetr': item.auditorPetr,
                    'gerAuditorPetr': item.gerAuditorPetr
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /subtab-insp-petr/{insp_petr_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def subtab_insp_petr_detail(request, item_id):
    """
    PUT: Atualiza um item da subtabela
    DELETE: Remove um item da subtabela
    """
    
    try:
        item = subTabPortoInspPetr.objects.get(id=item_id)
    except subTabPortoInspPetr.DoesNotExist:
        print(f"[API ERROR] Item ID {item_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Item não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /subtab-insp-petr-item/{item_id}/ - Atualizando item")
            
            item.DescInspPetr = data.get('DescInspPetr', item.DescInspPetr)
            item.auditorPetr = data.get('auditorPetr', item.auditorPetr)
            item.gerAuditorPetr = data.get('gerAuditorPetr', item.gerAuditorPetr)
            item.save()
            
            print(f"[API] PUT /subtab-insp-petr-item/{item_id}/ - Item atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Item atualizado com sucesso',
                'data': {
                    'id': item.id,
                    'DescInspPetr': item.DescInspPetr,
                    'auditorPetr': item.auditorPetr,
                    'gerAuditorPetr': item.gerAuditorPetr
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /subtab-insp-petr-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            item.delete()
            
            print(f"[API] DELETE /subtab-insp-petr-item/{item_id}/ - Item removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Item removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /subtab-insp-petr-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================EMBARQUE DE EQUIPES - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_emb_equip_list(request, ps_id):
    """
    GET: Retorna embarque de equipes de uma PS (se existir)
    POST: Cria novo embarque de equipes para uma PS
    """
    
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            emb_equip = PortoEmbEquip.objects.filter(idxPortoEE=ps).first()
            
            if not emb_equip:
                print(f"[API] GET /ps/{ps_id}/emb-equip/ - Nenhum embarque de equipes encontrado")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/emb-equip/ - Retornando embarque de equipes ID {emb_equip.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': emb_equip.id,
                    'prevEmbEquip': emb_equip.prevEmbEquip,
                    'ObservEmbEquip': emb_equip.ObservEmbEquip
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/emb-equip/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            emb_existente = PortoEmbEquip.objects.filter(idxPortoEE=ps).first()
            if emb_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/emb-equip/ - Já existe registro para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe registro de Embarque de Equipes para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/emb-equip/ - Criando embarque de equipes")
            
            emb_equip = PortoEmbEquip.objects.create(
                idxPortoEE=ps,
                prevEmbEquip=True,
                ObservEmbEquip=''
            )
            
            print(f"[API] POST /ps/{ps_id}/emb-equip/ - Embarque de equipes criado com ID: {emb_equip.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro criado com sucesso',
                'data': {
                    'id': emb_equip.id,
                    'prevEmbEquip': emb_equip.prevEmbEquip,
                    'ObservEmbEquip': emb_equip.ObservEmbEquip
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/emb-equip/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_emb_equip_detail(request, emb_equip_id):
    """
    PUT: Atualiza embarque de equipes
    DELETE: Remove embarque de equipes
    """
    
    try:
        emb_equip = PortoEmbEquip.objects.get(id=emb_equip_id)
    except PortoEmbEquip.DoesNotExist:
        print(f"[API ERROR] Registro ID {emb_equip_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Embarque de Equipes não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /emb-equip/{emb_equip_id}/ - Atualizando embarque de equipes")
            
            emb_equip.prevEmbEquip = data.get('prevEmbEquip', emb_equip.prevEmbEquip)
            emb_equip.ObservEmbEquip = data.get('ObservEmbEquip', emb_equip.ObservEmbEquip)
            emb_equip.save()
            
            print(f"[API] PUT /emb-equip/{emb_equip_id}/ - Embarque de equipes atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro atualizado com sucesso',
                'data': {
                    'id': emb_equip.id,
                    'prevEmbEquip': emb_equip.prevEmbEquip,
                    'ObservEmbEquip': emb_equip.ObservEmbEquip
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /emb-equip/{emb_equip_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            emb_equip.delete()
            
            print(f"[API] DELETE /emb-equip/{emb_equip_id}/ - Embarque de equipes removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /emb-equip/{emb_equip_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================EMBARQUE DE EQUIPES - SUBTABELA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def subtab_emb_equip_list(request, emb_equip_id):
    """
    GET: Lista itens da subtabela de embarque de equipes
    POST: Adiciona novo item à subtabela
    """
    
    try:
        emb_equip = PortoEmbEquip.objects.get(id=emb_equip_id)
    except PortoEmbEquip.DoesNotExist:
        print(f"[API ERROR] Embarque de Equipes ID {emb_equip_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Registro não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            itens = subTabPortoEmbEquip.objects.filter(
                idxSubTabPortoEE=emb_equip
            ).values('id', 'DescEmbEquip', 'equipNome', 'equipFuncao', 'equipEmpre')
            
            itens_list = list(itens)
            
            print(f"[API] GET /subtab-emb-equip/{emb_equip_id}/ - Retornando {len(itens_list)} itens")
            
            return JsonResponse({
                'success': True,
                'data': itens_list
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /subtab-emb-equip/{emb_equip_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /subtab-emb-equip/{emb_equip_id}/ - Criando item")
            
            item = subTabPortoEmbEquip.objects.create(
                idxSubTabPortoEE=emb_equip,
                DescEmbEquip=data.get('DescEmbEquip'),
                equipNome=data.get('equipNome'),
                equipFuncao=data.get('equipFuncao'),
                equipEmpre=data.get('equipEmpre')
            )
            
            print(f"[API] POST /subtab-emb-equip/{emb_equip_id}/ - Item criado com ID: {item.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Item adicionado com sucesso',
                'data': {
                    'id': item.id,
                    'DescEmbEquip': item.DescEmbEquip,
                    'equipNome': item.equipNome,
                    'equipFuncao': item.equipFuncao,
                    'equipEmpre': item.equipEmpre
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /subtab-emb-equip/{emb_equip_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def subtab_emb_equip_detail(request, item_id):
    """
    PUT: Atualiza um item da subtabela
    DELETE: Remove um item da subtabela
    """
    
    try:
        item = subTabPortoEmbEquip.objects.get(id=item_id)
    except subTabPortoEmbEquip.DoesNotExist:
        print(f"[API ERROR] Item ID {item_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Item não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /subtab-emb-equip-item/{item_id}/ - Atualizando item")
            
            item.DescEmbEquip = data.get('DescEmbEquip', item.DescEmbEquip)
            item.equipNome = data.get('equipNome', item.equipNome)
            item.equipFuncao = data.get('equipFuncao', item.equipFuncao)
            item.equipEmpre = data.get('equipEmpre', item.equipEmpre)
            item.save()
            
            print(f"[API] PUT /subtab-emb-equip-item/{item_id}/ - Item atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Item atualizado com sucesso',
                'data': {
                    'id': item.id,
                    'DescEmbEquip': item.DescEmbEquip,
                    'equipNome': item.equipNome,
                    'equipFuncao': item.equipFuncao,
                    'equipEmpre': item.equipEmpre
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /subtab-emb-equip-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            item.delete()
            
            print(f"[API] DELETE /subtab-emb-equip-item/{item_id}/ - Item removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Item removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /subtab-emb-equip-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)





#================================================MOBILIZAÇÃO/DESMOBILIZAÇÃO - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def porto_mob_desm_list(request, ps_id):
    """
    GET: Retorna mobilização/desmobilização de uma PS (se existir)
    POST: Cria novo registro para uma PS
    """
    
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            mob_desm = PortoMobD.objects.filter(idxPortoMobD=ps).first()
            
            if not mob_desm:
                print(f"[API] GET /ps/{ps_id}/mob-desm/ - Nenhum registro encontrado")
                return JsonResponse({
                    'success': True,
                    'data': None
                })
            
            print(f"[API] GET /ps/{ps_id}/mob-desm/ - Retornando registro ID {mob_desm.id}")
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': mob_desm.id,
                    'prevMobD': mob_desm.prevMobD,
                    'ObservMobD': mob_desm.ObservMobD
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ps/{ps_id}/mob-desm/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            mob_existente = PortoMobD.objects.filter(idxPortoMobD=ps).first()
            if mob_existente:
                print(f"[API ERROR] POST /ps/{ps_id}/mob-desm/ - Já existe registro para esta PS")
                return JsonResponse({
                    'success': False,
                    'error': 'Já existe registro para esta PS'
                }, status=400)
            
            print(f"[API] POST /ps/{ps_id}/mob-desm/ - Criando registro")
            
            mob_desm = PortoMobD.objects.create(
                idxPortoMobD=ps,
                prevMobD=True,
                ObservMobD=''
            )
            
            print(f"[API] POST /ps/{ps_id}/mob-desm/ - Registro criado com ID: {mob_desm.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro criado com sucesso',
                'data': {
                    'id': mob_desm.id,
                    'prevMobD': mob_desm.prevMobD,
                    'ObservMobD': mob_desm.ObservMobD
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ps/{ps_id}/mob-desm/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def porto_mob_desm_detail(request, mob_desm_id):
    """
    PUT: Atualiza registro
    DELETE: Remove registro
    """
    
    try:
        mob_desm = PortoMobD.objects.get(id=mob_desm_id)
    except PortoMobD.DoesNotExist:
        print(f"[API ERROR] Registro ID {mob_desm_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Registro não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /mob-desm/{mob_desm_id}/ - Atualizando registro")
            
            mob_desm.prevMobD = data.get('prevMobD', mob_desm.prevMobD)
            mob_desm.ObservMobD = data.get('ObservMobD', mob_desm.ObservMobD)
            mob_desm.save()
            
            print(f"[API] PUT /mob-desm/{mob_desm_id}/ - Registro atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro atualizado com sucesso',
                'data': {
                    'id': mob_desm.id,
                    'prevMobD': mob_desm.prevMobD,
                    'ObservMobD': mob_desm.ObservMobD
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /mob-desm/{mob_desm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            mob_desm.delete()
            
            print(f"[API] DELETE /mob-desm/{mob_desm_id}/ - Registro removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Registro removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /mob-desm/{mob_desm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

#================================================MOBILIZAÇÃO/DESMOBILIZAÇÃO - SUBTABELA - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def subtab_mob_desm_list(request, mob_desm_id):
    """
    GET: Lista itens da subtabela
    POST: Adiciona novo item à subtabela
    """
    
    try:
        mob_desm = PortoMobD.objects.get(id=mob_desm_id)
    except PortoMobD.DoesNotExist:
        print(f"[API ERROR] PortoMobD ID {mob_desm_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Registro não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            itens = SubTabPortoMobD.objects.filter(
                idxSubTabPortoMobD=mob_desm
            ).values('id', 'OsMobD', 'DescMobD')
            
            itens_list = list(itens)
            
            print(f"[API] GET /subtab-mob-desm/{mob_desm_id}/ - Retornando {len(itens_list)} itens")
            
            return JsonResponse({
                'success': True,
                'data': itens_list
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /subtab-mob-desm/{mob_desm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /subtab-mob-desm/{mob_desm_id}/ - Criando item")
            
            item = SubTabPortoMobD.objects.create(
                idxSubTabPortoMobD=mob_desm,
                OsMobD=data.get('OsMobD'),
                DescMobD=data.get('DescMobD')
            )
            
            print(f"[API] POST /subtab-mob-desm/{mob_desm_id}/ - Item criado com ID: {item.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Item adicionado com sucesso',
                'data': {
                    'id': item.id,
                    'OsMobD': item.OsMobD,
                    'DescMobD': item.DescMobD
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /subtab-mob-desm/{mob_desm_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def subtab_mob_desm_detail(request, item_id):
    """
    PUT: Atualiza um item da subtabela
    DELETE: Remove um item da subtabela
    """
    
    try:
        item = SubTabPortoMobD.objects.get(id=item_id)
    except SubTabPortoMobD.DoesNotExist:
        print(f"[API ERROR] Item ID {item_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Item não encontrado'
        }, status=404)
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /subtab-mob-desm-item/{item_id}/ - Atualizando item")
            
            item.OsMobD = data.get('OsMobD', item.OsMobD)
            item.DescMobD = data.get('DescMobD', item.DescMobD)
            item.save()
            
            print(f"[API] PUT /subtab-mob-desm-item/{item_id}/ - Item atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Item atualizado com sucesso',
                'data': {
                    'id': item.id,
                    'OsMobD': item.OsMobD,
                    'DescMobD': item.DescMobD
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /subtab-mob-desm-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            item.delete()
            
            print(f"[API] DELETE /subtab-mob-desm-item/{item_id}/ - Item removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Item removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /subtab-mob-desm-item/{item_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)




#===========================================BUSCAR INFORMES DE ANOMALIAS EMITIDOS NA QUINZENA=====================
#================================================ANOMALIAS SMS - API REST=================================================
@csrf_exempt
@require_http_methods(["GET"])
def anom_sms_list(request, ps_id):
    """
    GET: Busca informes de anomalia da embarcação dentro da quinzena e cria/atualiza registros em anomSMS
    """
    try:
        # Buscar PassServ
        ps = PassServ.objects.get(id=ps_id)
        
        print(f"[API] GET /api/ps/{ps_id}/anom-sms/ - Buscando anomalias SMS")
        print(f"[DEBUG] Embarcação: {ps.BarcoPS}, Quinzena: {ps.dataInicio} a {ps.dataFim}")
        
        # Buscar informes que correspondem à embarcação e quinzena
        informes = InformeAnomalia.objects.filter(
            siteInstalacao__icontains=ps.BarcoPS,
            dataEvento__gte=ps.dataInicio,
            dataEvento__lte=ps.dataFim
        ).order_by('-dataEvento', '-horarioEvento')
        
        print(f"[DEBUG] Encontrados {informes.count()} informes")
        
        # Para cada informe, criar ou atualizar anomSMS
        for informe in informes:
            anomSMS.objects.update_or_create(
                idxAnomSMS=ps,
                linkAnomSMS=str(informe.id),
                defaults={
                    'dataAnomSMS': informe.dataEvento,
                    'horaAnomSMS': informe.horarioEvento,
                    'relacAnomSMS': informe.relacaoEvento
                }
            )
        
        # Buscar todos os anomSMS desta PS
        anomalias = anomSMS.objects.filter(idxAnomSMS=ps).order_by('-dataAnomSMS', '-horaAnomSMS')
        
        data = []
        for anom in anomalias:
            data.append({
                'id': anom.id,
                'dataAnomSMS': str(anom.dataAnomSMS),
                'horaAnomSMS': anom.horaAnomSMS.strftime('%H:%M') if anom.horaAnomSMS else '',
                'relacAnomSMS': anom.relacAnomSMS,
                'linkAnomSMS': anom.linkAnomSMS
            })
        
        print(f"[API] Retornando {len(data)} anomalias SMS")
        
        return JsonResponse({
            'success': True,
            'data': data
        })
        
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    except Exception as e:
        print(f"[API ERROR] GET /api/ps/{ps_id}/anom-sms/ - {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
































#================================================FINALIZAR PASSAGEM DE SERVIÇO=================================================
@csrf_exempt
@require_http_methods(["PUT"])
def finalizar_passagem(request, ps_id):
    """
    Finaliza uma Passagem de Serviço (altera status de RASCUNHO para FINALIZADA)
    Esta ação é irreversível
    """
    
    try:
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[API ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    try:
        # VALIDAÇÃO: Verificar se data atual >= data emissão
        from datetime import date
        hoje = date.today()
        
        if hoje < ps.dataEmissaoPS:
            return JsonResponse({
                'success': False,
                'error': f'Não é possível finalizar a PS antes da data de emissão ({ps.dataEmissaoPS.strftime("%d/%m/%Y")})'
            }, status=400)
        
        # Verificar se já está finalizada
        if ps.statusPS == 'FINALIZADA':
            return JsonResponse({
                'success': False,
                'error': 'Esta PS já está finalizada'
            }, status=400)
        
        # Verificar se está em RASCUNHO
        if ps.statusPS != 'RASCUNHO':
            return JsonResponse({
                'success': False,
                'error': 'Apenas PS em RASCUNHO podem ser finalizadas'
            }, status=400)
        
        # Alterar status para FINALIZADA
        ps.statusPS = 'FINALIZADA'
        ps.save()
        
        return JsonResponse({
            'success': True,
            'message': f'PS {ps.numPS}/{ps.anoPS} finalizada com sucesso',
            'data': {
                'id': ps.id,
                'numPS': ps.numPS,
                'anoPS': ps.anoPS,
                'statusPS': ps.statusPS
            }
        })
        
    except Exception as e:
        print(f"[API ERROR] Erro ao finalizar PS {ps_id} - {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

#================================================GERAR PDF DA PASSAGEM DE SERVIÇO=================================================
@csrf_exempt
@require_http_methods(["GET"])
def gerar_pdf_passagem(request, ps_id):
    """
    Gera o PDF da Passagem de Serviço com todos os dados
    """
    
    try:
        # Buscar PS
        ps = PassServ.objects.get(id=ps_id)
    except PassServ.DoesNotExist:
        print(f"[PDF ERROR] PS ID {ps_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'Passagem de Serviço não encontrada'
        }, status=404)
    
    try:
        print(f"[PDF] Gerando PDF para PS {ps.numPS}/{ps.anoPS}")
        
        # Verificar se PS está finalizada
        if ps.statusPS != 'FINALIZADA':
            return JsonResponse({
                'success': False,
                'error': 'Apenas PS finalizadas podem gerar PDF'
            }, status=400)
        
        # Buscar dados da embarcação
        barco = BarcosCad.objects.filter(
            nomeBarco__icontains=ps.BarcoPS.split(' - ')[-1] if ' - ' in ps.BarcoPS else ps.BarcoPS
        ).first()
        
        if not barco:
            print(f"[PDF ERROR] Embarcação não encontrada: {ps.BarcoPS}")
            return JsonResponse({
                'success': False,
                'error': 'Embarcação não encontrada no cadastro'
            }, status=404)
        
        # Buscar dados dos fiscais
        fiscal_emb_dados = None
        fiscal_des_dados = None
        
        if ps.fiscalEmb:
            chave_emb = ps.fiscalEmb.split(' - ')[0] if ' - ' in ps.fiscalEmb else ''
            fiscal_emb_dados = FiscaisCad.objects.filter(chave=chave_emb).first()
        
        if ps.fiscalDes:
            chave_des = ps.fiscalDes.split(' - ')[0] if ' - ' in ps.fiscalDes else ''
            fiscal_des_dados = FiscaisCad.objects.filter(chave=chave_des).first()
        
        # Buscar dados das seções
        troca_turma = PortoTrocaTurma.objects.filter(idxPortoTT=ps).first()
        manut_prev = PortoManutPrev.objects.filter(idxPortoMP=ps).first()
        abastecimento = PortoAbast.objects.filter(idxPortoAB=ps).first()
        insp_norm = PortoInspNorm.objects.filter(idxPortoIN=ps).first()
        insp_petr = PortoInspPetr.objects.filter(idxPortoIP=ps).first()
        emb_equip = PortoEmbEquip.objects.filter(idxPortoEE=ps).first()
        
        # Buscar itens das subtabelas
        itens_insp_norm = []
        if insp_norm:
            itens_insp_norm = list(subTabPortoInspNorm.objects.filter(
                idxsubTabPortoInspNorm=insp_norm
            ).values('DescInspNorm', 'OrdSerInspNorm'))
        
        itens_insp_petr = []
        if insp_petr:
            itens_insp_petr = list(subTabPortoInspPetr.objects.filter(
                idxsubTabPortoIP=insp_petr
            ).values('DescInspPetr', 'auditorPetr', 'gerAuditorPetr'))
        
        itens_emb_equip = []
        if emb_equip:
            itens_emb_equip = list(subTabPortoEmbEquip.objects.filter(
                idxSubTabPortoEE=emb_equip
            ).values('DescEmbEquip', 'equipNome', 'equipFuncao', 'equipEmpre'))
        
        # Definir caminho do PDF
        nome_barco_limpo = ps.BarcoPS.replace('/', '-').replace('\\', '-')
        pasta_destino = os.path.join(
            settings.MEDIA_ROOT,
            'Finalizadas',
            nome_barco_limpo,
            str(ps.anoPS)
        )
        
        # Criar diretórios se não existirem
        os.makedirs(pasta_destino, exist_ok=True)
        
        nome_arquivo = f"PS_{str(ps.numPS).zfill(2)}_{nome_barco_limpo}.pdf"
        caminho_completo = os.path.join(pasta_destino, nome_arquivo)
        
        # Caminho relativo para salvar no banco
        caminho_relativo = os.path.join(
            'Finalizadas',
            nome_barco_limpo,
            str(ps.anoPS),
            nome_arquivo
        )
        
        print(f"[PDF] Salvando em: {caminho_completo}")
        
        # Criar PDF
        doc = SimpleDocTemplate(caminho_completo, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Estilo personalizado para título
        titulo_style = ParagraphStyle(
            'TituloCustom',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#0b7a66'),
            alignment=TA_CENTER,
            spaceAfter=12
        )
        
        subtitulo_style = ParagraphStyle(
            'SubtituloCustom',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.grey,
            alignment=TA_CENTER,
            spaceAfter=20
        )
        
        # Adicionar logo (se existir)
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'assets', 'logo.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=60*mm, height=20*mm)
            elements.append(logo)
            elements.append(Spacer(1, 10))
        
        # Título
        elements.append(Paragraph("PASSAGEM DE SERVIÇO", titulo_style))
        elements.append(Paragraph("Fiscalização - Embarcações", subtitulo_style))
        
        # Dados do cabeçalho
        dados_cabecalho = [
            ['Número PS:', f"{str(ps.numPS).zfill(2)}/{ps.anoPS}"],
            ['Embarcação:', ps.BarcoPS],
            ['Período:', f"{ps.dataInicio.strftime('%d/%m/%Y')} a {ps.dataFim.strftime('%d/%m/%Y')}"],
            ['Data Emissão:', ps.dataEmissaoPS.strftime('%d/%m/%Y')],
            ['Fretadora:', f"{barco.emprNav} (ICJ: {barco.icjEmprNav})"],
            ['Empresa Serviços:', f"{barco.emprServ} (ICJ: {barco.icjEmprServ})"],
        ]
        
        # Adicionar dados dos fiscais
        if fiscal_emb_dados:
            fiscal_emb_texto = f"{fiscal_emb_dados.chave} - {fiscal_emb_dados.nome}"
            if fiscal_emb_dados.celular:
                fiscal_emb_texto += f" - Telefone: {fiscal_emb_dados.celular}"
            dados_cabecalho.append(['Fiscal Embarcando:', fiscal_emb_texto])
        else:
            dados_cabecalho.append(['Fiscal Embarcando:', ps.fiscalEmb or 'Não informado'])
        
        if fiscal_des_dados:
            fiscal_des_texto = f"{fiscal_des_dados.chave} - {fiscal_des_dados.nome}"
            if fiscal_des_dados.celular:
                fiscal_des_texto += f" - Telefone: {fiscal_des_dados.celular}"
            dados_cabecalho.append(['Fiscal Desembarcando:', fiscal_des_texto])
        else:
            dados_cabecalho.append(['Fiscal Desembarcando:', ps.fiscalDes or 'Não informado'])
        
        tabela_cabecalho = Table(dados_cabecalho, colWidths=[40*mm, 130*mm])
        tabela_cabecalho.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0ece8')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0b7a66')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(tabela_cabecalho)
        elements.append(Spacer(1, 20))
        
        # SEÇÃO 1: PORTO
        secao_style = ParagraphStyle(
            'SecaoStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#0b7a66'),
            spaceAfter=10
        )
        
        elements.append(Paragraph("1. PORTO", secao_style))
        elements.append(Spacer(1, 10))
        
        # 1.1 Troca de Turma
        elements.append(Paragraph("1.1 TROCA DE TURMA", styles['Heading3']))
        if troca_turma:
            dados_tt = [
                ['Porto:', troca_turma.Porto or ''],
                ['Terminal:', troca_turma.Terminal or ''],
                ['OS:', troca_turma.OrdSerPorto or ''],
                ['Atracação:', troca_turma.AtracPorto.strftime('%H:%M') if troca_turma.AtracPorto else ''],
                ['Duração (h):', troca_turma.DuracPorto or ''],
            ]
            if troca_turma.ObservPorto:
                dados_tt.append(['Observações:', troca_turma.ObservPorto])
            
            tabela_tt = Table(dados_tt, colWidths=[40*mm, 130*mm])
            tabela_tt.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(tabela_tt)
        elements.append(Spacer(1, 15))
        
        # 1.2 Manutenção Preventiva
        elements.append(Paragraph("1.2 MANUTENÇÃO PREVENTIVA", styles['Heading3']))
        if manut_prev and manut_prev.prevManPrev:
            dados_mp = [
                ['Franquia (min):', str(manut_prev.Franquia)],
                ['Saldo Franquia (min):', str(manut_prev.SaldoFranquia)],
                ['OS:', manut_prev.OrdSerManutPrev or ''],
            ]
            if manut_prev.Rade:
                dados_mp.append(['Anexo RADE:', manut_prev.Rade.name.split('/')[-1]])
            if manut_prev.ObservManPrev:
                dados_mp.append(['Observações:', manut_prev.ObservManPrev])
            
            tabela_mp = Table(dados_mp, colWidths=[40*mm, 130*mm])
            tabela_mp.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(tabela_mp)
        else:
            elements.append(Paragraph("[X] Não Previsto", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        # 1.3 Abastecimento
        elements.append(Paragraph("1.3 ABASTECIMENTO", styles['Heading3']))
        if abastecimento and abastecimento.prevAbast:
            dados_ab = []
            if abastecimento.OrdSerAbast:
                dados_ab.append(['OS:', abastecimento.OrdSerAbast])
            if abastecimento.DataHoraPrevAbast:
                dados_ab.append(['Previsão Início:', abastecimento.DataHoraPrevAbast.strftime('%d/%m/%Y %H:%M')])
            if abastecimento.QuantAbast:
                dados_ab.append(['Quantidade (m³):', str(abastecimento.QuantAbast)])
            if abastecimento.DuracPrev:
                dados_ab.append(['Duração Prevista (h):', str(abastecimento.DuracPrev)])
            if abastecimento.UltAbast:
                dados_ab.append(['Último Abastecimento:', abastecimento.UltAbast.strftime('%d/%m/%Y')])
            if abastecimento.QuantUltAbast:
                dados_ab.append(['Qtd. Último Abast. (m³):', str(abastecimento.QuantUltAbast)])
            if abastecimento.Anexos:
                dados_ab.append(['Anexo:', abastecimento.Anexos.name.split('/')[-1]])
            if abastecimento.ObservAbast:
                dados_ab.append(['Observações:', abastecimento.ObservAbast])
            
            if dados_ab:
                tabela_ab = Table(dados_ab, colWidths=[40*mm, 130*mm])
                tabela_ab.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ]))
                elements.append(tabela_ab)
        else:
            elements.append(Paragraph("[X] Não Previsto", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        # 1.4 Inspeções Normativas
        elements.append(Paragraph("1.4 INSPEÇÕES NORMATIVAS", styles['Heading3']))
        if insp_norm and insp_norm.prevInsNorm and itens_insp_norm:
            dados_in = [['DESCRIÇÃO', 'OS']]
            for item in itens_insp_norm:
                dados_in.append([item['DescInspNorm'], item['OrdSerInspNorm']])
            
            tabela_in = Table(dados_in, colWidths=[85*mm, 85*mm])
            tabela_in.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0ece8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0b7a66')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(tabela_in)
            
            if insp_norm.ObservInspNorm:
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(f"<b>Observações:</b> {insp_norm.ObservInspNorm}", styles['Normal']))
        else:
            elements.append(Paragraph("[X] Não Previsto", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        # 1.5 Inspeções Petrobras
        elements.append(Paragraph("1.5 INSPEÇÕES VISITAS E AUDITORIAS PETROBRAS", styles['Heading3']))
        if insp_petr and insp_petr.prevInspPetr and itens_insp_petr:
            dados_ip = [['DESCRIÇÃO', 'AUDITOR/VISITANTE', 'GERÊNCIA']]
            for item in itens_insp_petr:
                dados_ip.append([
                    item['DescInspPetr'],
                    item['auditorPetr'],
                    item['gerAuditorPetr']
                ])
            
            tabela_ip = Table(dados_ip, colWidths=[57*mm, 57*mm, 56*mm])
            tabela_ip.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0ece8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0b7a66')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(tabela_ip)
            
            if insp_petr.ObservInspPetr:
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(f"<b>Observações:</b> {insp_petr.ObservInspPetr}", styles['Normal']))
        else:
            elements.append(Paragraph("[X] Não Previsto", styles['Normal']))
        elements.append(Spacer(1, 15))
        
        # 1.6 Embarque de Equipes
        elements.append(Paragraph("1.6 EMBARQUE DE EQUIPES", styles['Heading3']))
        if emb_equip and emb_equip.prevEmbEquip and itens_emb_equip:
            dados_ee = [['DESCRIÇÃO', 'NOME', 'FUNÇÃO', 'EMPRESA']]
            for item in itens_emb_equip:
                dados_ee.append([
                    item['DescEmbEquip'],
                    item['equipNome'],
                    item['equipFuncao'],
                    item['equipEmpre']
                ])
            
            tabela_ee = Table(dados_ee, colWidths=[40*mm, 45*mm, 40*mm, 45*mm])
            tabela_ee.setStyle(TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0ece8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0b7a66')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(tabela_ee)
            
            if emb_equip.ObservEmbEquip:
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(f"<b>Observações:</b> {emb_equip.ObservEmbEquip}", styles['Normal']))
        else:
            elements.append(Paragraph("[X] Não Previsto", styles['Normal']))
        
        # Construir PDF
        doc.build(elements)
        
        # Salvar caminho no banco
        ps.pdfPath = caminho_relativo
        ps.save()
        
        print(f"[PDF] PDF gerado com sucesso: {caminho_relativo}")
        
        return JsonResponse({
            'success': True,
            'message': 'PDF gerado com sucesso',
            'pdfPath': caminho_relativo
        })
        
    except Exception as e:
        print(f"[PDF ERROR] Erro ao gerar PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)












































































































