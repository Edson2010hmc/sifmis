# fiscweb/views_invmat.py
# Views para Inventário de Materiais

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.utils.dateparse import parse_date

from .models_invmat import materialEmb, subMatEmb, subMatDesemb
from .models_cad import BarcosCad


#========================================== MATERIAIS EMBARQUE - API REST ==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def materiais_embarque_list(request):
    """
    GET: Lista todos os materiais de embarque (com filtros opcionais)
    POST: Cria novo material de embarque
    """
    
    if request.method == 'GET':
        try:
            barco_id = request.GET.get('barco_id')
            status = request.GET.get('status')
            
            materiais = materialEmb.objects.all()
            
            if barco_id:
                materiais = materiais.filter(barcoMatEmb_id=barco_id)
            
            if status:
                materiais = materiais.filter(statusProgMatEmb=status)
            
            data = []
            for mat in materiais:
                # Buscar último embarque da subtabela
                ultimo_embarque = mat.embarques.first()
                
                data.append({
                    'id': mat.id,
                    'barcoMatEmb': mat.barcoMatEmb.nomeBarco,
                    'barcoMatEmbId': mat.barcoMatEmb.id,
                    'tipoBarco': mat.barcoMatEmb.tipoBarco,
                    'descMatEmb': mat.descMatEmb,
                    'identMatEmb': mat.identMatEmb or '',
                    'pesoMatEmb': mat.pesoMatEmb,
                    'alturaMatEmb': str(mat.alturaMatEmb) if mat.alturaMatEmb else '',
                    'larguraMatEmb': str(mat.larguraMatEmb) if mat.larguraMatEmb else '',
                    'comprimentoMatEmb': str(mat.comprimentoMatEmb) if mat.comprimentoMatEmb else '',
                    'respEmbMat': mat.respEmbMat or '',
                    'outRespEmbMat': mat.outRespEmbMat or '',
                    'contBordoEmbMat': mat.contBordoEmbMat,
                    'descContMatEmb': mat.descContMatEmb or '',
                    'idContMatEmb': mat.idContMatEmb or '',
                    'respContMatEmb': mat.respContMatEmb or '',
                    'certContMatEmb': mat.certContMatEmb or '',
                    'valContMatEmb': str(mat.valContMatEmb) if mat.valContMatEmb else '',
                    'obsMatEmb': mat.obsMatEmb or '',
                    'statusProgMatEmb': mat.statusProgMatEmb,
                    'dataPrevEmb': str(ultimo_embarque.dataPrevEmbMat) if ultimo_embarque else '',
                    'numRtEmb': ultimo_embarque.numRtMatEmb if ultimo_embarque else '',
                    'osEmb': ultimo_embarque.osEmbMat if ultimo_embarque else '',
                    'criado_em': mat.criado_em.isoformat(),
                    'atualizado_em': mat.atualizado_em.isoformat()
                })
            
            print(f"[API] GET /api/materiais-embarque/ - {len(data)} materiais retornados")
            
            return JsonResponse({'success': True, 'data': data})
            
        except Exception as e:
            print(f"[API ERROR] GET /api/materiais-embarque/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/materiais-embarque/ - Dados recebidos: {data.keys()}")
            
            # Criar material
            material = materialEmb.objects.create(
                barcoMatEmb_id=data['barcoMatEmb'],
                descMatEmb=data['descMatEmb'],
                identMatEmb=data.get('identMatEmb'),
                pesoMatEmb=data.get('pesoMatEmb'),
                alturaMatEmb=data.get('alturaMatEmb'),
                larguraMatEmb=data.get('larguraMatEmb'),
                comprimentoMatEmb=data.get('comprimentoMatEmb'),
                respEmbMat=data.get('respEmbMat'),
                outRespEmbMat=data.get('outRespEmbMat'),
                contBordoEmbMat=data['contBordoEmbMat'],
                descContMatEmb=data.get('descContMatEmb'),
                idContMatEmb=data.get('idContMatEmb'),
                respContMatEmb=data.get('respContMatEmb'),
                certContMatEmb=data.get('certContMatEmb'),
                valContMatEmb=parse_date(data['valContMatEmb']) if data.get('valContMatEmb') else None,
                obsMatEmb=data.get('obsMatEmb'),
                statusProgMatEmb=data['statusProgMatEmb']
            )
            
            # Criar registro na subtabela de embarque
            subMatEmb.objects.create(
                idxMatEmb=material,
                dataPrevEmbMat=parse_date(data['dataPrevEmbMat']),
                numRtMatEmb=data.get('numRtMatEmb'),
                numNotaFiscMatEmb=data.get('numNotaFiscMatEmb'),
                meioRecEmbMat=data.get('meioRecEmbMat'),
                uepRecMatEmb=data.get('uepRecMatEmb'),
                misBarcoFlag=data.get('misBarcoFlag', True),
                misBarcoRecMatEmb=data.get('misBarcoRecMatEmb'),
                barcoRecMatEmb=data.get('barcoRecMatEmb'),
                osEmbMat=data.get('osEmbMat'),
                statusRegEmb=data['statusProgMatEmb']
            )
            
            print(f"[API] Material criado com sucesso - ID: {material.id}")
            
            return JsonResponse({'success': True, 'id': material.id, 'message': 'Material criado com sucesso'})
            
        except Exception as e:
            print(f"[API ERROR] POST /api/materiais-embarque/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def materiais_embarque_detail(request, material_id):
    """
    GET: Retorna detalhes de um material específico
    PUT: Atualiza um material
    DELETE: Exclui um material
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    if request.method == 'GET':
        try:
            # Buscar embarques relacionados
            embarques = []
            for emb in material.embarques.all():
                embarques.append({
                    'id': emb.id,
                    'dataPrevEmbMat': str(emb.dataPrevEmbMat),
                    'numRtMatEmb': emb.numRtMatEmb or '',
                    'numNotaFiscMatEmb': emb.numNotaFiscMatEmb or '',
                    'meioRecEmbMat': emb.meioRecEmbMat or '',
                    'uepRecMatEmb': emb.uepRecMatEmb or '',
                    'misBarcoFlag': emb.misBarcoFlag,
                    'misBarcoRecMatEmb': emb.misBarcoRecMatEmb or '',
                    'barcoRecMatEmb': emb.barcoRecMatEmb or '',
                    'osEmbMat': emb.osEmbMat or '',
                    'statusRegEmb': emb.statusRegEmb
                })
            
            # Buscar desembarques relacionados
            desembarques = []
            for des in material.desembarques.all():
                desembarques.append({
                    'id': des.id,
                    'dataPrevDesmbMat': str(des.dataPrevDesmbMat),
                    'meioEnvDesmbMat': des.meioEnvDesmbMat or '',
                    'uepDesembMatEmb': des.uepDesembMatEmb or '',
                    'misBarcoFlagDesemb': des.misBarcoFlagDesemb,
                    'misBarcoDesembMatEmb': des.misBarcoDesembMatEmb or '',
                    'barcoDesembMatEmb': des.barcoDesembMatEmb or '',
                    'osRecDesembMat': des.osRecDesembMat or '',
                    'numRtMatDesemb': des.numRtMatDesemb or '',
                    'numNotaFiscMatDesemb': des.numNotaFiscMatDesemb or '',
                    'statusRegDesemb': des.statusRegDesemb
                })
            
            data = {
                'id': material.id,
                'barcoMatEmb': material.barcoMatEmb.nomeBarco,
                'barcoMatEmbId': material.barcoMatEmb.id,
                'tipoBarco': material.barcoMatEmb.tipoBarco,
                'descMatEmb': material.descMatEmb,
                'identMatEmb': material.identMatEmb or '',
                'pesoMatEmb': material.pesoMatEmb,
                'alturaMatEmb': str(material.alturaMatEmb) if material.alturaMatEmb else '',
                'larguraMatEmb': str(material.larguraMatEmb) if material.larguraMatEmb else '',
                'comprimentoMatEmb': str(material.comprimentoMatEmb) if material.comprimentoMatEmb else '',
                'respEmbMat': material.respEmbMat or '',
                'outRespEmbMat': material.outRespEmbMat or '',
                'contBordoEmbMat': material.contBordoEmbMat,
                'descContMatEmb': material.descContMatEmb or '',
                'idContMatEmb': material.idContMatEmb or '',
                'respContMatEmb': material.respContMatEmb or '',
                'certContMatEmb': material.certContMatEmb or '',
                'valContMatEmb': str(material.valContMatEmb) if material.valContMatEmb else '',
                'obsMatEmb': material.obsMatEmb or '',
                'statusProgMatEmb': material.statusProgMatEmb,
                'embarques': embarques,
                'desembarques': desembarques
            }
            
            print(f"[API] GET /api/materiais-embarque/{material_id}/ - Material retornado")
            
            return JsonResponse({'success': True, 'data': data})
            
        except Exception as e:
            print(f"[API ERROR] GET /api/materiais-embarque/{material_id}/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /api/materiais-embarque/{material_id}/ - Atualizando material")
            
            # Atualizar material
            material.barcoMatEmb_id = data['barcoMatEmb']
            material.descMatEmb = data['descMatEmb']
            material.identMatEmb = data.get('identMatEmb')
            material.pesoMatEmb = data.get('pesoMatEmb')
            material.alturaMatEmb = data.get('alturaMatEmb')
            material.larguraMatEmb = data.get('larguraMatEmb')
            material.comprimentoMatEmb = data.get('comprimentoMatEmb')
            material.respEmbMat = data.get('respEmbMat')
            material.outRespEmbMat = data.get('outRespEmbMat')
            material.contBordoEmbMat = data['contBordoEmbMat']
            material.descContMatEmb = data.get('descContMatEmb')
            material.idContMatEmb = data.get('idContMatEmb')
            material.respContMatEmb = data.get('respContMatEmb')
            material.certContMatEmb = data.get('certContMatEmb')
            material.valContMatEmb = parse_date(data['valContMatEmb']) if data.get('valContMatEmb') else None
            material.obsMatEmb = data.get('obsMatEmb')
            material.statusProgMatEmb = data.get('statusProgMatEmb', material.statusProgMatEmb)
            material.save()
            
            print(f"[API] Material {material_id} atualizado com sucesso")
            
            return JsonResponse({'success': True, 'message': 'Material atualizado com sucesso'})
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/materiais-embarque/{material_id}/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'DELETE':
        try:
            print(f"[API] DELETE /api/materiais-embarque/{material_id}/ - Excluindo material")
            
            material.delete()
            
            print(f"[API] Material {material_id} excluído com sucesso")
            
            return JsonResponse({'success': True, 'message': 'Material excluído com sucesso'})
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/materiais-embarque/{material_id}/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def materiais_embarque_status(request, material_id):
    """
    PUT: Atualiza apenas o status do material e replica para subtabelas
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    try:
        data = json.loads(request.body)
        novo_status = data.get('status')
        
        print(f"[API] PUT /api/materiais-embarque/{material_id}/status/ - Novo status: {novo_status}")
        
        # Atualizar status do material
        material.statusProgMatEmb = novo_status
        material.save()
        
        # Replicar para subtabelas de embarque
        material.embarques.update(statusRegEmb=novo_status)
        
        # Replicar para subtabelas de desembarque
        material.desembarques.update(statusRegDesemb=novo_status)
        
        print(f"[API] Status do material {material_id} atualizado para: {novo_status}")
        
        return JsonResponse({'success': True, 'message': 'Status atualizado com sucesso'})
        
    except Exception as e:
        print(f"[API ERROR] PUT /api/materiais-embarque/{material_id}/status/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def materiais_desembarque_add(request, material_id):
    """
    POST: Adiciona registro de desembarque para um material
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    try:
        data = json.loads(request.body)
        
        print(f"[API] POST /api/materiais-embarque/{material_id}/desembarque/ - Adicionando desembarque")
        
        # Criar registro de desembarque
        desembarque = subMatDesemb.objects.create(
            idxMatDesemb=material,
            dataPrevDesmbMat=parse_date(data['dataPrevDesmbMat']),
            meioEnvDesmbMat=data.get('meioEnvDesmbMat'),
            uepDesembMatEmb=data.get('uepDesembMatEmb'),
            misBarcoFlagDesemb=data.get('misBarcoFlagDesemb', True),
            misBarcoDesembMatEmb=data.get('misBarcoDesembMatEmb'),
            barcoDesembMatEmb=data.get('barcoDesembMatEmb'),
            osRecDesembMat=data.get('osRecDesembMat'),
            numRtMatDesemb=data.get('numRtMatDesemb'),
            numNotaFiscMatDesemb=data.get('numNotaFiscMatDesemb'),
            statusRegDesemb=material.statusProgMatEmb
        )
        
        print(f"[API] Desembarque criado com sucesso - ID: {desembarque.id}")
        
        return JsonResponse({'success': True, 'id': desembarque.id, 'message': 'Desembarque adicionado com sucesso'})
        
    except Exception as e:
        print(f"[API ERROR] POST /api/materiais-embarque/{material_id}/desembarque/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)