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
from .models_cad import materiaisOperacao
from .models_invmater import contentoresCestasMateriais, matBordo

# fiscweb/views_invmater.py
# Views para Inventário de Materiais

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .models_cad import materiaisOperacao
from .models_invmater import contentoresCestasMateriais, matBordo


#========================================== MATERIAIS A BORDO API REST ==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def materiais_bordo_list(request):
    """
    GET: Lista todos os materiais a bordo
    POST: Cria novo material a bordo
    """
    
    if request.method == 'GET':
        try:
            materiais = matBordo.objects.all()
            
            data = []
            for mat in materiais:
                data.append({
                    'id': mat.id,
                    'descMat': mat.descMat.descMat if mat.descMat else '',
                    'descMatId': mat.descMat.id if mat.descMat else None,
                    'numSerIden': mat.numSerIden,
                    'dataReceb': str(mat.dataReceb),
                    'origMat': mat.origMat,
                    'outOrigMat': mat.outOrigMat or '',
                    'respMat': mat.respMat,
                    'outRespMat': mat.outRespMat or '',
                    'osAplicMat': mat.osAplicMat,
                    'numReqTranspMat': mat.numReqTranspMat or '',
                    'contCestaMat': mat.contCestaMat,
                    'descContCestaMat': mat.descContCestaMat.descContCesta if mat.descContCestaMat else '',
                    'descContCestaMatId': mat.descContCestaMat.id if mat.descContCestaMat else None,
                    'identContCestaMat': mat.identContCestaMat or '',
                    'numCertContCestaMat': mat.numCertContCestaMat or '',
                    'valCertContCestaMat': str(mat.valCertContCestaMat) if mat.valCertContCestaMat else '',
                    'obsMat': mat.obsMat or '',
                    'criado_em': mat.criado_em.isoformat(),
                    'atualizado_em': mat.atualizado_em.isoformat()
                })
            
            print(f"[API] GET /api/materiais-bordo/ - {len(data)} materiais retornados")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/materiais-bordo/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/materiais-bordo/ - Criando material")
            
            material = matBordo.objects.create(
                descMat_id=data.get('descMatId'),
                numSerIden=data.get('numSerIden', ''),
                dataReceb=data.get('dataReceb'),
                origMat=data.get('origMat', ''),
                outOrigMat=data.get('outOrigMat', ''),
                respMat=data.get('respMat', ''),
                outRespMat=data.get('outRespMat', ''),
                osAplicMat=data.get('osAplicMat', ''),
                numReqTranspMat=data.get('numReqTranspMat', ''),
                contCestaMat=data.get('contCestaMat', False),
                descContCestaMat_id=data.get('descContCestaMatId') if data.get('contCestaMat') else None,
                identContCestaMat=data.get('identContCestaMat', ''),
                numCertContCestaMat=data.get('numCertContCestaMat', ''),
                valCertContCestaMat=data.get('valCertContCestaMat') if data.get('valCertContCestaMat') else None,
                obsMat=data.get('obsMat', '')
            )
            
            print(f"[API] POST /api/materiais-bordo/ - Material {material.id} criado")
            
            return JsonResponse({
                'success': True,
                'message': 'Material criado com sucesso',
                'data': {
                    'id': material.id,
                    'numSerIden': material.numSerIden
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] POST /api/materiais-bordo/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def materiais_bordo_detail(request, material_id):
    """
    GET: Retorna dados do material
    PUT: Atualiza material
    DELETE: Remove material
    """
    
    try:
        material = matBordo.objects.get(id=material_id)
    except matBordo.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Material não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            data = {
                'id': material.id,
                'descMat': material.descMat.descMat if material.descMat else '',
                'descMatId': material.descMat.id if material.descMat else None,
                'numSerIden': material.numSerIden,
                'dataReceb': str(material.dataReceb),
                'origMat': material.origMat,
                'outOrigMat': material.outOrigMat or '',
                'respMat': material.respMat,
                'outRespMat': material.outRespMat or '',
                'osAplicMat': material.osAplicMat,
                'numReqTranspMat': material.numReqTranspMat or '',
                'contCestaMat': material.contCestaMat,
                'descContCestaMat': material.descContCestaMat.descContCesta if material.descContCestaMat else '',
                'descContCestaMatId': material.descContCestaMat.id if material.descContCestaMat else None,
                'identContCestaMat': material.identContCestaMat or '',
                'numCertContCestaMat': material.numCertContCestaMat or '',
                'valCertContCestaMat': str(material.valCertContCestaMat) if material.valCertContCestaMat else '',
                'obsMat': material.obsMat or '',
                'criado_em': material.criado_em.isoformat(),
                'atualizado_em': material.atualizado_em.isoformat()
            }
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            material.descMat_id = data.get('descMatId', material.descMat.id if material.descMat else None)
            material.numSerIden = data.get('numSerIden', material.numSerIden)
            material.dataReceb = data.get('dataReceb', material.dataReceb)
            material.origMat = data.get('origMat', material.origMat)
            material.outOrigMat = data.get('outOrigMat', material.outOrigMat)
            material.respMat = data.get('respMat', material.respMat)
            material.outRespMat = data.get('outRespMat', material.outRespMat)
            material.osAplicMat = data.get('osAplicMat', material.osAplicMat)
            material.numReqTranspMat = data.get('numReqTranspMat', material.numReqTranspMat)
            material.contCestaMat = data.get('contCestaMat', material.contCestaMat)
            material.descContCestaMat_id = data.get('descContCestaMatId') if data.get('contCestaMat') else None
            material.identContCestaMat = data.get('identContCestaMat', material.identContCestaMat)
            material.numCertContCestaMat = data.get('numCertContCestaMat', material.numCertContCestaMat)
            material.valCertContCestaMat = data.get('valCertContCestaMat') if data.get('valCertContCestaMat') else None
            material.obsMat = data.get('obsMat', material.obsMat)
            material.save()
            
            print(f"[API] PUT /api/materiais-bordo/{material_id}/ - Material atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Material atualizado com sucesso',
                'data': {
                    'id': material.id
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/materiais-bordo/{material_id}/ - {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            material.delete()
            
            print(f"[API] DELETE /api/materiais-bordo/{material_id}/ - Material removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Material removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/materiais-bordo/{material_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#========================================== CONTENTORES/CESTAS API REST ==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def contentores_list(request):
    """
    GET: Lista todos os contentores/cestas
    POST: Cria novo contentor/cesta
    """
    
    if request.method == 'GET':
        try:
            contentores = contentoresCestasMateriais.objects.all()
            
            data = []
            for cont in contentores:
                data.append({
                    'id': cont.id,
                    'descContCesta': cont.descContCesta,
                    'identContCesta': cont.identContCesta,
                    'dataEmbContCesta': str(cont.dataEmbContCesta),
                    'reqTranspContCesta': cont.reqTranspContCesta,
                    'respContCesta': cont.respContCesta,
                    'outRespContCesta': cont.outRespContCesta or '',
                    'numCertContCesta': cont.numCertContCesta,
                    'valCertContCesta': str(cont.valCertContCesta),
                    'criado_em': cont.criado_em.isoformat(),
                    'atualizado_em': cont.atualizado_em.isoformat()
                })
            
            print(f"[API] GET /api/contentores/ - {len(data)} contentores retornados")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/contentores/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/contentores/ - Criando contentor")
            
            contentor = contentoresCestasMateriais.objects.create(
                descContCesta=data.get('descContCesta', ''),
                identContCesta=data.get('identContCesta', ''),
                dataEmbContCesta=data.get('dataEmbContCesta'),
                reqTranspContCesta=data.get('reqTranspContCesta', ''),
                respContCesta=data.get('respContCesta', ''),
                outRespContCesta=data.get('outRespContCesta', ''),
                numCertContCesta=data.get('numCertContCesta', ''),
                valCertContCesta=data.get('valCertContCesta')
            )
            
            print(f"[API] POST /api/contentores/ - Contentor {contentor.id} criado")
            
            return JsonResponse({
                'success': True,
                'message': 'Contentor criado com sucesso',
                'data': {
                    'id': contentor.id,
                    'identContCesta': contentor.identContCesta
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] POST /api/contentores/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def contentores_detail(request, contentor_id):
    """
    GET: Retorna dados do contentor
    PUT: Atualiza contentor
    DELETE: Remove contentor
    """
    
    try:
        contentor = contentoresCestasMateriais.objects.get(id=contentor_id)
    except contentoresCestasMateriais.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Contentor não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            data = {
                'id': contentor.id,
                'descContCesta': contentor.descContCesta,
                'identContCesta': contentor.identContCesta,
                'dataEmbContCesta': str(contentor.dataEmbContCesta),
                'reqTranspContCesta': contentor.reqTranspContCesta,
                'respContCesta': contentor.respContCesta,
                'outRespContCesta': contentor.outRespContCesta or '',
                'numCertContCesta': contentor.numCertContCesta,
                'valCertContCesta': str(contentor.valCertContCesta),
                'criado_em': contentor.criado_em.isoformat(),
                'atualizado_em': contentor.atualizado_em.isoformat()
            }
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            contentor.descContCesta = data.get('descContCesta', contentor.descContCesta)
            contentor.identContCesta = data.get('identContCesta', contentor.identContCesta)
            contentor.dataEmbContCesta = data.get('dataEmbContCesta', contentor.dataEmbContCesta)
            contentor.reqTranspContCesta = data.get('reqTranspContCesta', contentor.reqTranspContCesta)
            contentor.respContCesta = data.get('respContCesta', contentor.respContCesta)
            contentor.outRespContCesta = data.get('outRespContCesta', contentor.outRespContCesta)
            contentor.numCertContCesta = data.get('numCertContCesta', contentor.numCertContCesta)
            contentor.valCertContCesta = data.get('valCertContCesta', contentor.valCertContCesta)
            contentor.save()
            
            print(f"[API] PUT /api/contentores/{contentor_id}/ - Contentor atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Contentor atualizado com sucesso',
                'data': {
                    'id': contentor.id
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/contentores/{contentor_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            contentor.delete()
            
            print(f"[API] DELETE /api/contentores/{contentor_id}/ - Contentor removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Contentor removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/contentores/{contentor_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/materiais-operacao/ - Criando material")
            
            material = materiaisOperacao.objects.create(
                descMat=data.get('descMat', ''),
                obsDescMat=data.get('obsDescMat', '')
            )
            
            print(f"[API] POST /api/materiais-operacao/ - Material {material.id} criado")
            
            return JsonResponse({
                'success': True,
                'message': 'Material criado com sucesso',
                'data': {
                    'id': material.id,
                    'descMat': material.descMat
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] POST /api/materiais-operacao/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


