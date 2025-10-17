# fiscweb/views_anom.py
# Views para Informe de Anomalia

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime

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