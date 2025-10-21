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
from .models_ps import PassServ,anomSMS
from .models_anom import InformeAnomalia

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