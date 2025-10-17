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

from .models_ps import PassServ
from .models_ps import PortoTrocaTurma
from .models_ps import PortoManutPrev
from .models_ps import PortoAbast
from .models_ps import PortoInspNorm,subTabPortoInspNorm
from .models_ps import PortoInspPetr,subTabPortoInspPetr
from .models_ps import PortoEmbEquip,subTabPortoEmbEquip
from .models_ps import PortoMobD,SubTabPortoMobD


#============================================RENDERIZA TELA PRINCIPAL============================
def index_main(request):
    """
    Renderiza a tela principal (Hub/PAI) do SIFMIS
    Tela de entrada com navegação para os módulos
    """
    return render(request, 'index_main.html')

#===============================================RENDERIZA TELA PASSAGEM DE SERVIÇO================================
def passagens(request):
    """Renderiza a página de Passagens de Serviço"""
    return render(request, 'index_ps.html')

#===============================================RENDERIZA TELA CADASTROS================================
def cadastros(request):
    """Renderiza a página de Cadastros"""
    return render(request, 'index_cad.html')

#===============================================RENDERIZA TELA INFORMES================================
def anomalias(request):
    """Renderiza a página de Informes de Anomalia"""
    return render(request, 'index_anom.html')

#===============================================RENDERIZA TELA PA E CLM================================
def protocolo(request):
    """Renderiza a página de Protocolos e CLM"""
    return render(request, 'index_pa_clm.html')

#===============================================RENDERIZA TELA INVENTARIO DE MATERIAIS================================
def inventario(request):
    """Renderiza a página de Inventario de Materiais"""
    return render(request, 'index_invmater.html')






#===============================================CAPTURA CREDENCIAL WINDOWS - USERNAME=================================================
@csrf_exempt
@require_http_methods(["GET"])
def get_current_user(request):
    """
    Retorna o username do Windows do servidor (temporário para desenvolvimento)
    """
    import getpass
    
    try:
        username = getpass.getuser().upper()
        
        print(f"[AUTH] Username capturado do servidor: '{username}'")
        
        return JsonResponse({
            'success': True,
            'username': username
        })
        
    except Exception as e:
        print(f"[AUTH ERROR] Erro ao capturar username: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
#===============================================VERIFICA CREDENCIAIS DO USUÁRIO=================================================
@csrf_exempt
@require_http_methods(["POST"])
def validar_usuario(request):
    """
    Valida se o username do Windows existe no cadastro de fiscais
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip().upper()
        
        print(f"[AUTH] Validando username: '{username}'")
        
        if not username:
            print("[AUTH ERROR] Username vazio")
            return JsonResponse({
                'success': False,
                'error': 'Username não fornecido'
            }, status=400)
        
        fiscal = FiscaisCad.objects.filter(chave__iexact=username).first()
        
        if not fiscal:
            print(f"[AUTH ERROR] Username '{username}' não encontrado no cadastro")
            return JsonResponse({
                'success': False,
                'authorized': False,
                'message': 'Usuário não autorizado a acessar o sistema'
            }, status=403)
        
        print(f"[AUTH OK] Usuário autorizado: {fiscal.nome}")
        
        return JsonResponse({
            'success': True,
            'authorized': True,
            'data': {
                'id': fiscal.id,
                'chave': fiscal.chave,
                'nome': fiscal.nome,
                'email': fiscal.email,
                'perfFisc': fiscal.perfFisc,
                'perfAdm': fiscal.perfAdm
            }
        })
        
    except Exception as e:
        print(f"[AUTH ERROR] Exceção: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    
    