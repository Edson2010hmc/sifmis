# fiscweb/views_invmat.py
# Views para Inventário de Materiais

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.utils.dateparse import parse_date

from .models_invmat import materialEmb, subMatEmb, subMatDesemb,emailsSolicDesemb
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
                    'meioRecEmbMat': ultimo_embarque.meioRecEmbMat if ultimo_embarque else '',
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
    

    #========================================== E-MAILS SOLICITAÇÃO DESEMBARQUE - API REST ==========================================

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT"])
def emails_solic_desemb(request):
    """
    GET: Retorna os e-mails cadastrados (sempre o último registro)
    POST: Cria novo registro de e-mails
    PUT: Atualiza registro existente
    """
    
    if request.method == 'GET':
        try:
            emails = emailsSolicDesemb.objects.first()
            
            if emails:
                data = {
                    'id': emails.id,
                    'emailMatCrd': emails.emailMatCrd or '',
                    'emailMatMis': emails.emailMatMis or '',
                    'emailsMatCc': emails.emailsMatCc or ''
                }
            else:
                data = {
                    'id': None,
                    'emailMatCrd': '',
                    'emailMatMis': '',
                    'emailsMatCc': ''
                }
            
            print(f"[API] GET /api/emails-desembarque/ - E-mails retornados")
            
            return JsonResponse({'success': True, 'data': data})
            
        except Exception as e:
            print(f"[API ERROR] GET /api/emails-desembarque/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /api/emails-desembarque/ - Criando e-mails")
            
            emails = emailsSolicDesemb.objects.create(
                emailMatCrd=data.get('emailMatCrd'),
                emailMatMis=data.get('emailMatMis'),
                emailsMatCc=data.get('emailsMatCc')
            )
            
            print(f"[API] E-mails criados com sucesso - ID: {emails.id}")
            
            return JsonResponse({'success': True, 'id': emails.id, 'message': 'E-mails cadastrados com sucesso'})
            
        except Exception as e:
            print(f"[API ERROR] POST /api/emails-desembarque/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            email_id = data.get('id')
            
            print(f"[API] PUT /api/emails-desembarque/ - Atualizando e-mails ID: {email_id}")
            
            if email_id:
                emails = emailsSolicDesemb.objects.get(id=email_id)
                emails.emailMatCrd = data.get('emailMatCrd')
                emails.emailMatMis = data.get('emailMatMis')
                emails.emailsMatCc = data.get('emailsMatCc')
                emails.save()
            else:
                emails = emailsSolicDesemb.objects.first()
                if emails:
                    emails.emailMatCrd = data.get('emailMatCrd')
                    emails.emailMatMis = data.get('emailMatMis')
                    emails.emailsMatCc = data.get('emailsMatCc')
                    emails.save()
                else:
                    emails = emailsSolicDesemb.objects.create(
                        emailMatCrd=data.get('emailMatCrd'),
                        emailMatMis=data.get('emailMatMis'),
                        emailsMatCc=data.get('emailsMatCc')
                    )
            
            print(f"[API] E-mails atualizados com sucesso")
            
            return JsonResponse({'success': True, 'message': 'E-mails atualizados com sucesso'})
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/emails-desembarque/ - {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
        

#========================================== MATERIAIS DESEMBARQUE - LISTAGEM ==========================================
@csrf_exempt
@require_http_methods(["GET"])
def materiais_desembarque_list(request):
    """
    GET: Lista materiais com status 'RELACIONADO PARA DESEMBARQUE' filtrados por embarcação
    """
    
    try:
        barco_id = request.GET.get('barco_id')
        
        if not barco_id:
            return JsonResponse({'success': False, 'error': 'ID da embarcação não fornecido'}, status=400)
        
        materiais = materialEmb.objects.filter(
            barcoMatEmb_id=barco_id,
            statusProgMatEmb='RELACIONADO PARA DESEMBARQUE'
        )
        
        data = []
        for mat in materiais:
            # Buscar primeiro embarque para pegar OS
            primeiro_embarque = mat.embarques.first()
            
            data.append({
                'id': mat.id,
                'barcoMatEmb': mat.barcoMatEmb.nomeBarco,
                'tipoBarco': mat.barcoMatEmb.tipoBarco,
                'descMatEmb': mat.descMatEmb,
                'identMatEmb': mat.identMatEmb or '',
                'respEmbMat': mat.respEmbMat or '',
                'outRespEmbMat': mat.outRespEmbMat or '',
                'contBordoEmbMat': mat.contBordoEmbMat,
                'descContMatEmb': mat.descContMatEmb or '',
                'idContMatEmb': mat.idContMatEmb or '',
                'pesoMatEmb': mat.pesoMatEmb,
                'alturaMatEmb': str(mat.alturaMatEmb) if mat.alturaMatEmb else '',
                'larguraMatEmb': str(mat.larguraMatEmb) if mat.larguraMatEmb else '',
                'comprimentoMatEmb': str(mat.comprimentoMatEmb) if mat.comprimentoMatEmb else '',
                'osEmb': primeiro_embarque.osEmbMat if primeiro_embarque else ''
            })
        
        print(f"[API] GET /api/materiais-desembarque/ - {len(data)} materiais retornados para barco {barco_id}")
        
        return JsonResponse({'success': True, 'data': data})
        
    except Exception as e:
        print(f"[API ERROR] GET /api/materiais-desembarque/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== VERIFICAR PS RASCUNHO ==========================================
@csrf_exempt
@require_http_methods(["POST"])
def verificar_ps_rascunho_material(request):
    """
    POST: Verifica se existe PS em rascunho para o usuário e embarcação
    Retorna dados da PS se existir
    """
    
    try:
        data = json.loads(request.body)
        barco_id = data.get('barcoId')
        fiscal_nome = data.get('fiscalNome', '').strip()
        
        if not barco_id:
            return JsonResponse({'success': False, 'error': 'ID da embarcação não fornecido'}, status=400)
        
        if not fiscal_nome:
            return JsonResponse({'success': False, 'error': 'Nome do fiscal não fornecido'}, status=400)
        
        # Buscar embarcação
        try:
            barco = BarcosCad.objects.get(id=barco_id)
        except BarcosCad.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Embarcação não encontrada'}, status=404)
        
        # Buscar PS em rascunho
        from .models_ps import PassServ, PortoTrocaTurma
        
        barco_nome = f"{barco.tipoBarco} - {barco.nomeBarco}"
        ps_rascunho = PassServ.objects.filter(
            BarcoPS=barco_nome,
            fiscalDes=fiscal_nome,
            statusPS='RASCUNHO'
        ).first()
        
        if not ps_rascunho:
            return JsonResponse({
                'success': True,
                'existeRascunho': False
            })
        
        # Buscar dados de porto da PS
        troca_turma = PortoTrocaTurma.objects.filter(idxPortoTT=ps_rascunho).first()
        
        if not troca_turma or not troca_turma.Porto or not troca_turma.AtracPorto or not troca_turma.DuracPorto:
            return JsonResponse({
                'success': True,
                'existeRascunho': True,
                'dadosCompletos': False
            })
        
        return JsonResponse({
            'success': True,
            'existeRascunho': True,
            'dadosCompletos': True,
            'psData': {
                'id': ps_rascunho.id,
                'dataEmissao': str(ps_rascunho.dataEmissaoPS),
                'porto': troca_turma.Porto,
                'atracacao': str(troca_turma.AtracPorto),
                'duracao': troca_turma.DuracPorto
            }
        })
        
    except Exception as e:
        print(f"[API ERROR] POST /api/verificar-ps-rascunho-material/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== SOLICITAR DESEMBARQUE ==========================================
@csrf_exempt
@require_http_methods(["POST"])
def solicitar_desembarque_materiais(request):
    """
    POST: Processa solicitação de desembarque com envio de e-mail
    """
    
    try:
        data = json.loads(request.body)
        barco_id = data.get('barcoId')
        fiscal_nome = data.get('fiscalNome', '').strip()
        ps_data = data.get('psData')
        modelo = data.get('modelo')  # 001, 002, 003, 004
        dados_modal = data.get('dadosModal', {})  # Para modelos 002 e 003
        tipo_material = data.get('tipoMaterial', '')  # 'CRD' ou 'NAO_CRD'
        print(f"[API] POST /api/solicitar-desembarque/ - Modelo: {modelo}, Barco: {barco_id}")
        
        if not barco_id or not fiscal_nome or not ps_data or not modelo:
            return JsonResponse({'success': False, 'error': 'Dados incompletos'}, status=400)
        
        # Buscar embarcação
        try:
            barco = BarcosCad.objects.get(id=barco_id)
        except BarcosCad.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Embarcação não encontrada'}, status=404)
        
        # Buscar materiais relacionados para desembarque
        materiais_query = materialEmb.objects.filter(
            barcoMatEmb_id=barco_id,
            statusProgMatEmb='RELACIONADO PARA DESEMBARQUE'
        )
        
        # Filtrar por tipo de responsável
        if tipo_material == 'CRD':
            materiais = materiais_query.filter(respEmbMat='CRD')
        elif tipo_material == 'NAO_CRD':
            materiais = materiais_query.exclude(respEmbMat='CRD')
        else:
            materiais = materiais_query
        
        if not materiais.exists():
            return JsonResponse({'success': False, 'error': 'Nenhum material encontrado'}, status=404)
        
        # Buscar e-mails
        emails_config = emailsSolicDesemb.objects.first()
        if not emails_config:
            return JsonResponse({'success': False, 'error': 'Configuração de e-mails não encontrada'}, status=404)
        
        # Preparar dados do fiscal
        nome_fiscal = fiscal_nome.split(' - ')[1] if ' - ' in fiscal_nome else fiscal_nome
        
        # Importar módulo de envio de e-mail
        import smtplib
        from email.message import EmailMessage
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        # Calcular horário de saída
        # Extrair apenas HH:MM (ignorar segundos se existir)
        hora_atrac_str = ps_data['atracacao'][:5]  # Pega apenas HH:MM
        hora_atrac = datetime.strptime(hora_atrac_str, '%H:%M')
        duracao_horas = int(ps_data['duracao'])
        hora_saida_str = (hora_atrac + timedelta(hours=duracao_horas)).strftime('%H:%M')
        
        # Formatar horas com "h" no final
        hora_atrac_formatada = hora_atrac_str + 'h'
        hora_saida_formatada = hora_saida_str + 'h'
        data_emissao_formatada = datetime.strptime(ps_data['dataEmissao'], '%Y-%m-%d').strftime('%d/%m/%Y')
        # Preparar assunto e destinatários baseado no modelo
        if modelo == '004':
            # Modelo CRD
            to_addr_list = [e.strip() for e in (emails_config.emailMatCrd or '').split(';') if e.strip()]
            assunto_tipo = 'CRD'
        else:
            # Modelos MIS
            to_addr_list = [e.strip() for e in (emails_config.emailMatMis or '').split(';') if e.strip()]
            assunto_tipo = ''
        
        cc_list = [e.strip() for e in (emails_config.emailsMatCc or '').split(';') if e.strip()]
        from_addr = barco.emailPetr or ''
        
        if not to_addr_list or not from_addr:
            return JsonResponse({'success': False, 'error': 'E-mails não configurados corretamente'}, status=400)
        
        # Montar assunto
        tipo_texto = f" {assunto_tipo}" if assunto_tipo else ""
        assunto = f"#### IMPORTANTE #### SOLICITAÇÃO DE DESEMBARQUE DE MATERIAIS{tipo_texto} - {barco.tipoBarco} {barco.nomeBarco} {ps_data['dataEmissao']}"
        
        # Gerar corpo do e-mail baseado no modelo
        corpo_html = gerar_corpo_email_desembarque(
            modelo=modelo,
            materiais=materiais,
            barco=barco,
            ps_data=ps_data,
            data_emissao_formatada=data_emissao_formatada,
            hora_atrac_formatada=hora_atrac_formatada,
            hora_saida_formatada=hora_saida_formatada,
            nome_fiscal=nome_fiscal,
            from_addr=from_addr,
            dados_modal=dados_modal
        )
        # Enviar e-mail
        msg = EmailMessage()
        msg.set_content("Este e-mail requer visualização em HTML.")
        msg.add_alternative(corpo_html, subtype='html')
        msg['Subject'] = assunto
        msg['From'] = from_addr
        msg['To'] = ", ".join(to_addr_list)
        if cc_list:
            msg['Cc'] = ", ".join(cc_list)
        
        try:
            s = smtplib.SMTP('smtp.petrobras.com.br', 25)
            s.send_message(msg)
            s.quit()
        except Exception as e:
            print(f"[EMAIL][ERRO] Falha no envio: {e}")
            return JsonResponse({'success': False, 'error': 'Falha ao enviar e-mail'}, status=500)
        
        # Atualizar status e observações dos materiais
        agora = timezone.localtime()
        data_envio = agora.strftime('%d/%m/%Y')
        hora_envio = agora.strftime('%H:%M')
        
        for mat in materiais:
            # Atualizar status
            mat.statusProgMatEmb = 'DESEMBARQUE SOLICITADO'
            
            # Adicionar observação
            obs_adicional = f"\nSolicitado o desembarque deste material em e-mail enviado em {data_envio} às {hora_envio} por {nome_fiscal}."
            
            if modelo in ['002', '003']:
                qtde_cont = dados_modal.get('qtdeContentores', '')
                desc_cont = dados_modal.get('descContentores', '')
                obs_adicional += f" Solicitados {qtde_cont} {desc_cont} para o desembarque dos materiais."
            
            mat.obsMatEmb = (mat.obsMatEmb or '') + obs_adicional
            mat.save()
            
            # Replicar status para subtabelas
            mat.embarques.update(statusRegEmb='DESEMBARQUE SOLICITADO')
            mat.desembarques.update(statusRegDesemb='DESEMBARQUE SOLICITADO')
        
        print(f"[EMAIL][OK] Desembarque solicitado - {materiais.count()} materiais")
        
        return JsonResponse({'success': True, 'message': 'Desembarque solicitado com sucesso'})
        
    except Exception as e:
        print(f"[API ERROR] POST /api/solicitar-desembarque/ - {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== GERAR CORPO EMAIL DESEMBARQUE ==========================================
def gerar_corpo_email_desembarque(modelo, materiais, barco, ps_data, data_emissao_formatada, hora_atrac_formatada, hora_saida_formatada, nome_fiscal, from_addr, dados_modal):

    """
    Gera o corpo HTML do e-mail baseado no modelo
    """
    
    # Filtrar materiais baseado no modelo
    if modelo == '004':
        # CRD
        mats_filtrados = [m for m in materiais if m.respEmbMat == 'CRD']
    else:
        # Não CRD
        mats_filtrados = [m for m in materiais if m.respEmbMat != 'CRD']
    
    # Construir lista de materiais
    if modelo == '001':
        # Materiais com contentor
        lista_materiais = ""
        for mat in mats_filtrados:
            if mat.contBordoEmbMat == 'SIM':
                primeiro_emb = mat.embarques.first()
                os_texto = primeiro_emb.osEmbMat if primeiro_emb else ''
                lista_materiais += f"""
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descMatEmb}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.identMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{os_texto}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descContMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.idContMatEmb or ''}</td>
                </tr>
                """
        
        corpo = f"""
        <p>Solicito o desembarque dos materiais relacionados abaixo, que se encontram a bordo do {barco.tipoBarco} {barco.nomeBarco}, para a próxima estadia de porto prevista para {data_emissao_formatada} das {hora_atrac_formatada} às {hora_saida_formatada}</p>
      
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <thead>
                <tr style="background-color:#0b7a66; color:white;">
                    <th style="border:1px solid #ddd; padding:10px;">Descrição Material</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificador/Num Série</th>
                    <th style="border:1px solid #ddd; padding:10px;">Ordem de serviço</th>
                    <th style="border:1px solid #ddd; padding:10px;">Contentor</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificação do contentor</th>
                </tr>
            </thead>
            <tbody>
                {lista_materiais}
            </tbody>
        </table>
        
        <p>Importante destacar que é fundamental que a coleta do material seja realizada dentro do período de estadia.</p>
        """
    
    elif modelo == '002':
        # Materiais sem contentor
        lista_materiais = ""
        for mat in mats_filtrados:
            if mat.contBordoEmbMat != 'SIM':
                primeiro_emb = mat.embarques.first()
                os_texto = primeiro_emb.osEmbMat if primeiro_emb else ''
                dimensoes = f"A{mat.alturaMatEmb or ''}m x L{mat.larguraMatEmb or ''}m x C{mat.comprimentoMatEmb or ''}m"
                lista_materiais += f"""
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descMatEmb}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.identMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{os_texto}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.pesoMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{dimensoes}</td>
                </tr>
                """
        
        qtde_cont = dados_modal.get('qtdeContentores', '')
        desc_cont = dados_modal.get('descContentores', '')
        
        corpo = f"""
        <p>Solicito o desembarque dos materiais relacionados abaixo, que se encontram a bordo do {barco.tipoBarco} {barco.nomeBarco}, para a próxima estadia de porto prevista para {data_emissao_formatada} das {hora_atrac_formatada} às {hora_saida_formatada}</p>

       
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <thead>
                <tr style="background-color:#0b7a66; color:white;">
                    <th style="border:1px solid #ddd; padding:10px;">Descrição Material</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificador/Num Série</th>
                    <th style="border:1px solid #ddd; padding:10px;">Ordem de serviço</th>
                    <th style="border:1px solid #ddd; padding:10px;">Peso</th>
                    <th style="border:1px solid #ddd; padding:10px;">Dimensões</th>
                </tr>
            </thead>
            <tbody>
                {lista_materiais}
            </tbody>
        </table>
        
        <p>Para o desembarque dos materiais acima, serão necessários {qtde_cont} contentores {desc_cont} para acomodação do material.</p>
        
        <p>Informo que os contentores não poderão permanecer a bordo para coleta posterior devido espaço restrito de convés. Dessa forma os contentores deverão ser entregues à embarcação, onde posicionaremos os materiais e o contentor deve ser coletado em seguida. Importante destacar que é fundamental que a manobra para coleta do material seja realizada dentro do período de estadia de porto informada.</p>
        """
    
    elif modelo == '003':
        # Misto - com e sem contentor
        lista_sem_cont = ""
        lista_com_cont = ""
        
        for mat in mats_filtrados:
            primeiro_emb = mat.embarques.first()
            os_texto = primeiro_emb.osEmbMat if primeiro_emb else ''
            
            if mat.contBordoEmbMat == 'SIM':
                lista_com_cont += f"""
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descMatEmb}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.identMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{os_texto}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descContMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.idContMatEmb or ''}</td>
                </tr>
                """
            else:
                dimensoes = f"A{mat.alturaMatEmb or ''}m x L{mat.larguraMatEmb or ''}m x C{mat.comprimentoMatEmb or ''}m"
                lista_sem_cont += f"""
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.descMatEmb}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.identMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{os_texto}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{mat.pesoMatEmb or ''}</td>
                    <td style="border:1px solid #ddd; padding:8px;">{dimensoes}</td>
                </tr>
                """
        
        qtde_cont = dados_modal.get('qtdeContentores', '')
        desc_cont = dados_modal.get('descContentores', '')
        
        corpo = f"""
        <p>Solicito o desembarque dos materiais relacionados abaixo, que se encontram a bordo do {barco.tipoBarco} {barco.nomeBarco}, para a próxima estadia de porto prevista para {data_emissao_formatada} das {hora_atrac_formatada} às {hora_saida_formatada}</p>
       
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <thead>
                <tr style="background-color:#0b7a66; color:white;">
                    <th style="border:1px solid #ddd; padding:10px;">Descrição Material</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificador/Num Série</th>
                    <th style="border:1px solid #ddd; padding:10px;">Ordem de serviço</th>
                    <th style="border:1px solid #ddd; padding:10px;">Peso</th>
                    <th style="border:1px solid #ddd; padding:10px;">Dimensões</th>
                </tr>
            </thead>
            <tbody>
                {lista_sem_cont}
            </tbody>
        </table>
        
        <p>Para o desembarque dos materiais acima, serão necessários {qtde_cont} contentores {desc_cont} para acomodação do material. Informo que os contentores não poderão permanecer a bordo para coleta posterior devido espaço restrito de convés. Dessa forma os contentores deverão ser entregues à embarcação, onde posicionaremos os materiais e o contentor deve ser coletado em seguida.</p>
        
        <p>Da mesma forma, solicito o desembarque dos materiais relacionados abaixo que já se encontram acondicionados em contentores:</p>
        
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <thead>
                <tr style="background-color:#0b7a66; color:white;">
                    <th style="border:1px solid #ddd; padding:10px;">Descrição Material</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificador/Num Série</th>
                    <th style="border:1px solid #ddd; padding:10px;">Ordem de serviço</th>
                    <th style="border:1px solid #ddd; padding:10px;">Contentor</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificação do contentor</th>
                </tr>
            </thead>
            <tbody>
                {lista_com_cont}
            </tbody>
        </table>
        
        <p>Importante destacar que é fundamental que a manobra para coleta do material seja realizada dentro do período de estadia de porto informada.</p>
        """
    
    elif modelo == '004':
        # CRD
        lista_materiais = ""
        for mat in mats_filtrados:
            primeiro_emb = mat.embarques.first()
            os_texto = primeiro_emb.osEmbMat if primeiro_emb else ''
            lista_materiais += f"""
            <tr>
                <td style="border:1px solid #ddd; padding:8px;">{mat.descMatEmb}</td>
                <td style="border:1px solid #ddd; padding:8px;">{mat.identMatEmb or ''}</td>
                <td style="border:1px solid #ddd; padding:8px;">{os_texto}</td>
            </tr>
            """
        
        corpo = f"""
        <p>Solicito o desembarque dos materiais relacionados abaixo, que se encontram a bordo do {barco.tipoBarco} {barco.nomeBarco}, para a próxima estadia de porto prevista para {data_emissao_formatada} das {hora_atrac_formatada} às {hora_saida_formatada}</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
            <thead>
                <tr style="background-color:#0b7a66; color:white;">
                    <th style="border:1px solid #ddd; padding:10px;">Descrição Material</th>
                    <th style="border:1px solid #ddd; padding:10px;">Identificador/Num Série</th>
                    <th style="border:1px solid #ddd; padding:10px;">Ordem de serviço</th>
                </tr>
            </thead>
            <tbody>
                {lista_materiais}
            </tbody>
        </table>
        
        <p>Importante destacar que é fundamental que a manobra para coleta do material seja realizada dentro do período de estadia de porto informada.</p>
        """
    
    # Template completo
    html_completo = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px;">
    
    <div style="background-color:#0b7a66; color:white; padding:20px; text-align:center; border-radius:8px 8px 0 0;">
        <h1 style="margin:0; font-size:24px;">SOLICITAÇÃO DE DESEMBARQUE DE MATERIAIS</h1>
        <p style="margin:5px 0 0 0; font-size:16px; font-weight:bold;">{barco.tipoBarco} {barco.nomeBarco}</p>
    </div>

    <div style="background-color:#fff; padding:20px; border:1px solid #ddd; border-top:none;">
        {corpo}
    </div>

    <div style="background-color:#f8f9fa; padding:20px; border:1px solid #ddd; border-top:none; border-radius:0 0 8px 8px;">
        <p style="margin:0; font-size:14px; line-height:1.8; text-align:left;">
            <strong>at.te,</strong><br>
            {nome_fiscal}<br>
            <span style="color:#0b7a66; font-weight:bold;">Fiscal Offshore – {barco.tipoBarco} {barco.nomeBarco}</span><br>
            Petroleo Brasileiro S/A<br>
            SSUB/OPSUB/MIS<br>
            <a href="mailto:{from_addr}" style="color:#0b7a66; text-decoration:none;">{from_addr}</a>
        </p>
    </div>

</body>
</html>
    """
    
    return html_completo


#========================================== SOLICITAÇÕES DE DESEMBARQUE - LISTAGEM ==========================================
@csrf_exempt
@require_http_methods(["GET"])
def solicitacoes_desembarque_list(request):
    """
    GET: Lista materiais com status 'DESEMBARQUE SOLICITADO' filtrados por embarcação
    """
    
    try:
        barco_id = request.GET.get('barco_id')
        
        if not barco_id:
            return JsonResponse({'success': False, 'error': 'ID da embarcação não fornecido'}, status=400)
        
        materiais = materialEmb.objects.filter(
            barcoMatEmb_id=barco_id,
            statusProgMatEmb='DESEMBARQUE SOLICITADO'
        )
        
        data = []
        for mat in materiais:
            # Buscar primeiro embarque para pegar OS
            primeiro_embarque = mat.embarques.first()
            
            # Buscar data de solicitação do desembarque (campo atualizado_em)
            data_solicitacao = mat.atualizado_em.strftime('%d/%m/%Y %H:%M') if mat.atualizado_em else ''
            
            data.append({
                'id': mat.id,
                'barcoMatEmb': mat.barcoMatEmb.nomeBarco,
                'tipoBarco': mat.barcoMatEmb.tipoBarco,
                'descMatEmb': mat.descMatEmb,
                'osEmb': primeiro_embarque.osEmbMat if primeiro_embarque else '',
                'respEmbMat': mat.respEmbMat or '',
                'outRespEmbMat': mat.outRespEmbMat or '',
                'dataSolicitacao': data_solicitacao
            })
        
        print(f"[API] GET /api/solicitacoes-desembarque/ - {len(data)} materiais retornados para barco {barco_id}")
        
        return JsonResponse({'success': True, 'data': data})
        
    except Exception as e:
        print(f"[API ERROR] GET /api/solicitacoes-desembarque/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== REMOVER SOLICITAÇÃO DESEMBARQUE ==========================================
@csrf_exempt
@require_http_methods(["PUT"])
def remover_solicitacao_desembarque(request, material_id):
    """
    PUT: Remove solicitação de desembarque, mudando status para 'MATERIAL A BORDO'
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    try:
        print(f"[API] PUT /api/materiais-embarque/{material_id}/remover-solicitacao/ - Removendo solicitação")
        
        # Atualizar status
        material.statusProgMatEmb = 'MATERIAL A BORDO'
        material.save()
        
        # Replicar para subtabelas
        material.embarques.update(statusRegEmb='MATERIAL A BORDO')
        material.desembarques.update(statusRegDesemb='MATERIAL A BORDO')
        
        print(f"[API] Solicitação de desembarque removida - Material {material_id}")
        
        return JsonResponse({'success': True, 'message': 'Solicitação de desembarque removida'})
        
    except Exception as e:
        print(f"[API ERROR] PUT /api/materiais-embarque/{material_id}/remover-solicitacao/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== MATERIAL COLETADO ==========================================
@csrf_exempt
@require_http_methods(["PUT"])
def material_coletado(request, material_id):
    """
    PUT: Registra material como coletado (desembarcado)
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    try:
        from datetime import datetime
        data = json.loads(request.body)
        num_rt = data.get('numRtDesemb', '').strip()
        
        if not num_rt:
            return JsonResponse({'success': False, 'error': 'Número da RT é obrigatório'}, status=400)
        
        print(f"[API] PUT /api/materiais-embarque/{material_id}/material-coletado/ - RT: {num_rt}")
        
        # Atualizar status
        material.statusProgMatEmb = 'MATERIAL DESEMBARCADO'
        
        # Adicionar observação
        data_atual = datetime.now().strftime('%d/%m/%Y')
        obs_adicional = f"\nRT {num_rt} atendida. Material desembarcado {data_atual}"
        material.obsMatEmb = (material.obsMatEmb or '') + obs_adicional
        
        material.save()
        
        # Atualizar subtabela de desembarque com o número da RT
        material.desembarques.update(
            numRtMatDesemb=num_rt,
            statusRegDesemb='MATERIAL DESEMBARCADO'
        )
        
        # Replicar para subtabelas de embarque
        material.embarques.update(statusRegEmb='MATERIAL DESEMBARCADO')
        
        print(f"[API] Material coletado registrado - Material {material_id}, RT {num_rt}")
        
        return JsonResponse({'success': True, 'message': 'Material coletado registrado'})
        
    except Exception as e:
        print(f"[API ERROR] PUT /api/materiais-embarque/{material_id}/material-coletado/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


#========================================== MATERIAL NÃO COLETADO ==========================================
@csrf_exempt
@require_http_methods(["PUT"])
def material_nao_coletado(request, material_id):
    """
    PUT: Registra material como não coletado (permanece a bordo)
    """
    
    try:
        material = materialEmb.objects.get(id=material_id)
    except materialEmb.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Material não encontrado'}, status=404)
    
    try:
        from datetime import datetime
        data = json.loads(request.body)
        num_rt = data.get('numRtDesemb', '').strip()
        
        if not num_rt:
            return JsonResponse({'success': False, 'error': 'Número da RT é obrigatório'}, status=400)
        
        print(f"[API] PUT /api/materiais-embarque/{material_id}/material-nao-coletado/ - RT: {num_rt}")
        
        # Atualizar status
        material.statusProgMatEmb = 'RELACIONADO PARA DESEMBARQUE'
        
        # Adicionar observação
        data_atual = datetime.now().strftime('%d/%m/%Y')
        obs_adicional = f"\nRT {num_rt} não atendida. Material permanece a bordo {data_atual}"
        material.obsMatEmb = (material.obsMatEmb or '') + obs_adicional
        
        material.save()
        
        # Atualizar subtabela de desembarque com o número da RT
        material.desembarques.update(
            numRtMatDesemb=num_rt,
            statusRegDesemb='RELACIONADO PARA DESEMBARQUE'
        )
        
        # Replicar para subtabelas de embarque
        material.embarques.update(statusRegEmb='RELACIONADO PARA DESEMBARQUE')
        
        print(f"[API] Material não coletado registrado - Material {material_id}, RT {num_rt}")
        
        return JsonResponse({'success': True, 'message': 'Material não coletado registrado'})
        
    except Exception as e:
        print(f"[API ERROR] PUT /api/materiais-embarque/{material_id}/material-nao-coletado/ - {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)