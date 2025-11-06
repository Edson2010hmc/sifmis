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

from .models_cad import FiscaisCad, BarcosCad, ModalBarco, contatoUep, subTabcontatosUeps,materiaisOperacao

from .models_ps import PassServ
from .models_ps import PortoTrocaTurma
from .models_ps import PortoManutPrev
from .models_ps import PortoAbast
from .models_ps import PortoInspNorm,subTabPortoInspNorm
from .models_ps import PortoInspPetr,subTabPortoInspPetr
from .models_ps import PortoEmbEquip,subTabPortoEmbEquip
from .models_ps import PortoMobD,SubTabPortoMobD


#================================================CADASTRO FISCAIS - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def fiscais_list(request):
    """
    GET: Lista todos os fiscais
    POST: Cria um novo fiscal
    """
    
    if request.method == 'GET':
        try:
            fiscais = FiscaisCad.objects.all().values(
                'id', 'chave', 'nome', 'email', 'celular', 
                'perfFisc', 'perfAdm',
                'criado_em', 'atualizado_em'
            )
            fiscais_list = list(fiscais)
            
            print(f"[API] GET /fiscais - Retornando {len(fiscais_list)} fiscais")
            
            return JsonResponse({
                'success': True,
                'data': fiscais_list,
                'count': len(fiscais_list)
            }, safe=False)
            
        except Exception as e:
            print(f"[API ERROR] GET /fiscais - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /fiscais - Criando fiscal: {data.get('nome')}")
            
            fiscal = FiscaisCad.objects.create(
                chave=data.get('chave'),
                nome=data.get('nome'),
                email=data.get('email'),
                celular=data.get('celular', ''),
                perfFisc=data.get('perfFisc', False),
                perfAdm=data.get('perfAdm', False)
            )
            
            print(f"[API] POST /fiscais - Fiscal criado com ID: {fiscal.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Fiscal criado com sucesso',
                'data': {
                    'id': fiscal.id,
                    'chave': fiscal.chave,
                    'nome': fiscal.nome,
                    'email': fiscal.email,
                    'celular': fiscal.celular,
                    'perfFisc': fiscal.perfFisc,
                    'perfAdm': fiscal.perfAdm
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /fiscais - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def fiscais_detail(request, fiscal_id):
    """
    GET: Retorna um fiscal específico
    PUT: Atualiza um fiscal
    DELETE: Remove um fiscal
    """
    
    try:
        fiscal = FiscaisCad.objects.get(id=fiscal_id)
    except FiscaisCad.DoesNotExist:
        print(f"[API ERROR] Fiscal ID {fiscal_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Fiscal não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        print(f"[API] GET /fiscais/{fiscal_id} - {fiscal.nome}")
        return JsonResponse({
            'success': True,
            'data': {
                'id': fiscal.id,
                'chave': fiscal.chave,
                'nome': fiscal.nome,
                'email': fiscal.email,
                'celular': fiscal.celular,
                'perfFisc': fiscal.perfFisc,
                'perfAdm': fiscal.perfAdm,
                'criado_em': fiscal.criado_em,
                'atualizado_em': fiscal.atualizado_em
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /fiscais/{fiscal_id} - Atualizando: {fiscal.nome}")
            
            fiscal.chave = data.get('chave', fiscal.chave)
            fiscal.nome = data.get('nome', fiscal.nome)
            fiscal.email = data.get('email', fiscal.email)
            fiscal.celular = data.get('celular', fiscal.celular)
            fiscal.perfFisc = data.get('perfFisc', fiscal.perfFisc)
            fiscal.perfAdm = data.get('perfAdm', fiscal.perfAdm)
            fiscal.save()
            
            print(f"[API] PUT /fiscais/{fiscal_id} - Atualizado com sucesso")
            
            return JsonResponse({
                'success': True,
                'message': 'Fiscal atualizado com sucesso',
                'data': {
                    'id': fiscal.id,
                    'chave': fiscal.chave,
                    'nome': fiscal.nome,
                    'email': fiscal.email,
                    'celular': fiscal.celular,
                    'perfFisc': fiscal.perfFisc,
                    'perfAdm': fiscal.perfAdm
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /fiscais/{fiscal_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            nome_fiscal = fiscal.nome
            fiscal.delete()
            
            print(f"[API] DELETE /fiscais/{fiscal_id} - Fiscal '{nome_fiscal}' removido")
            
            return JsonResponse({
                'success': True,
                'message': f'Fiscal {nome_fiscal} removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /fiscais/{fiscal_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
        

#================================================CADASTRO FISCAIS - API REST - USUARIOS COM PERFIL DE FISCAL=================================================
@csrf_exempt
@require_http_methods(["GET"])
def fiscais_perfil_fiscal(request):
    """
    Retorna fiscais que possuem perfFisc=True
    """
    try:
        fiscais = FiscaisCad.objects.filter(perfFisc=True).values('id', 'chave', 'nome')
        fiscais_list = list(fiscais)
        
        return JsonResponse({
            'success': True,
            'data': fiscais_list
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


#================================================CADASTRO BARCOS - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def barcos_list(request):
    """
    GET: Lista todos os barcos
    POST: Cria um novo barco
    """
    
    if request.method == 'GET':
        try:
            barcos = BarcosCad.objects.all().values(
                'id', 'tipoBarco', 'nomeBarco', 'modalBarco', 'modalSelec_id',
                'emailPetr','dataPrimPorto', 'emprNav', 'icjEmprNav',
                'emprServ', 'icjEmprServ', 'emailFiscContr',  'gerOper', 'emailCiop', 'chaveAto',
                'nomeAto', 'emailAto', 'contAto', 'chaveSto', 'nomeSto', 'emailSto', 
                'contSto', 'RamalBrOper', 'TelExtoper', 'emailOper', 'RamalBrPassad',
                'TelExtpassad', 'contPassad', 'emailPassad', 'listEmailAssDig',
                'criado_em', 'atualizado_em'
            )
            barcos_list = list(barcos)
            
            print(f"[API] GET /barcos - Retornando {len(barcos_list)} barcos")
            
            return JsonResponse({
                'success': True,
                'data': barcos_list,
                'count': len(barcos_list)
            }, safe=False)
            
        except Exception as e:
            print(f"[API ERROR] GET /barcos - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /barcos - Criando barco: {data.get('nomeBarco')}")
            
            # Buscar modalSelec se informado
            modal_selec = None
            if data.get('modalSelec_id'):
                try:
                    modal_selec = ModalBarco.objects.get(id=data.get('modalSelec_id'))
                except ModalBarco.DoesNotExist:
                    print(f"[API ERROR] POST /barcos - Modal ID {data.get('modalSelec_id')} não encontrado")
                    return JsonResponse({
                        'success': False,
                        'error': 'Modal não encontrado'
                    }, status=400)
            
            barco = BarcosCad.objects.create(
                tipoBarco=data.get('tipoBarco'),
                nomeBarco=data.get('nomeBarco'),
                modalSelec=modal_selec,
                emailPetr=data.get('emailPetr'),
                dataPrimPorto=data.get('dataPrimPorto'),
                emprNav=data.get('emprNav'),
                icjEmprNav=data.get('icjEmprNav'),
                emprServ=data.get('emprServ'),
                icjEmprServ=data.get('icjEmprServ'),
                emailFiscContr=data.get('emailFiscContr'),
                gerOper=data.get('gerOper'),
                emailCiop=data.get('emailCiop'),
                chaveAto=data.get('chaveAto'),
                nomeAto=data.get('nomeAto'),
                emailAto=data.get('emailAto'),
                contAto=data.get('contAto'),
                chaveSto=data.get('chaveSto'),
                nomeSto=data.get('nomeSto'),
                emailSto=data.get('emailSto'),
                contSto=data.get('contSto'),
                RamalBrOper=data.get('RamalBrOper'),
                TelExtoper=data.get('TelExtoper'),
                emailOper=data.get('emailOper'),
                RamalBrPassad=data.get('RamalBrPassad'),
                TelExtpassad=data.get('TelExtpassad'),
                contPassad=data.get('contPassad'),
                emailPassad=data.get('emailPassad'),
                listEmailAssDig=data.get('listEmailAssDig'),
            )
            
            print(f"[API] POST /barcos - Barco criado com ID: {barco.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Barco criado com sucesso',
                'data': {
                    'id': barco.id,
                    'tipoBarco': barco.tipoBarco,
                    'nomeBarco': barco.nomeBarco,
                    'modalBarco': barco.modalBarco,
                    'emailPetr': barco.emailPetr,
                    'dataPrimPorto': str(barco.dataPrimPorto),
                    'emprNav': barco.emprNav,
                    'icjEmprNav': barco.icjEmprNav,
                    'emprServ': barco.emprServ,
                    'icjEmprServ': barco.icjEmprServ,
                    'emailFiscContr': barco.emailFiscContr,
                    'gerOper': barco.gerOper,
                    'emailCiop': barco.emailCiop,
                    'chaveAto': barco.chaveAto,
                    'nomeAto': barco.nomeAto,
                    'emailAto': barco.emailAto,
                    'contAto': barco.contAto,
                    'chaveSto': barco.chaveSto,
                    'nomeSto': barco.nomeSto,
                    'emailSto': barco.emailSto,
                    'contSto': barco.contSto,
                    'RamalBrOper': barco.RamalBrOper,
                    'TelExtoper': barco.TelExtoper,
                    'emailOper': barco.emailOper,
                    'RamalBrPassad': barco.RamalBrPassad,
                    'TelExtpassad': barco.TelExtpassad,
                    'contPassad': barco.contPassad,
                    'emailPassad': barco.emailPassad,
                    'listEmailAssDig': barco.listEmailAssDig
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /barcos - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def barcos_detail(request, barco_id):
    """
    GET: Retorna um barco específico
    PUT: Atualiza um barco
    DELETE: Remove um barco
    """
    
    try:
        barco = BarcosCad.objects.get(id=barco_id)
    except BarcosCad.DoesNotExist:
        print(f"[API ERROR] Barco ID {barco_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Barco não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        print(f"[API] GET /barcos/{barco_id} - {barco.nomeBarco}")
        return JsonResponse({
            'success': True,
                        'data': {
                'id': barco.id,
                'tipoBarco': barco.tipoBarco,
                'nomeBarco': barco.nomeBarco,
                'modalBarco': barco.modalBarco,
                'modalSelec_id': barco.modalSelec.id if barco.modalSelec else None,
                'emailPetr': barco.emailPetr,
                'dataPrimPorto': str(barco.dataPrimPorto),
                'emprNav': barco.emprNav,
                'icjEmprNav': barco.icjEmprNav,
                'emprServ': barco.emprServ,
                'icjEmprServ': barco.icjEmprServ,
                'emailFiscContr': barco.emailFiscContr,
                'gerOper': barco.gerOper,
                'emailCiop': barco.emailCiop,
                'chaveAto': barco.chaveAto,
                'nomeAto': barco.nomeAto,
                'emailAto': barco.emailAto,
                'contAto': barco.contAto,
                'chaveSto': barco.chaveSto,
                'nomeSto': barco.nomeSto,
                'emailSto': barco.emailSto,
                'contSto': barco.contSto,
                'RamalBrOper': barco.RamalBrOper,
                'TelExtoper': barco.TelExtoper,
                'emailOper': barco.emailOper,
                'RamalBrPassad': barco.RamalBrPassad,
                'TelExtpassad': barco.TelExtpassad,
                'contPassad': barco.contPassad,
                'emailPassad': barco.emailPassad,
                'listEmailAssDig': barco.listEmailAssDig,
                'criado_em': barco.criado_em,
                'atualizado_em': barco.atualizado_em
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /barcos/{barco_id} - Atualizando: {barco.nomeBarco}")
            
            # Atualizar modalSelec se informado
            if 'modalSelec_id' in data:
                if data['modalSelec_id']:
                    try:
                        barco.modalSelec = ModalBarco.objects.get(id=data['modalSelec_id'])
                    except ModalBarco.DoesNotExist:
                        return JsonResponse({
                            'success': False,
                            'error': 'Modal não encontrado'
                        }, status=400)
                else:
                    barco.modalSelec = None
            
            barco.tipoBarco = data.get('tipoBarco', barco.tipoBarco)
            barco.nomeBarco = data.get('nomeBarco', barco.nomeBarco)
            barco.emailPetr = data.get('emailPetr', barco.emailPetr)
            barco.dataPrimPorto = data.get('dataPrimPorto', barco.dataPrimPorto)
            barco.emprNav = data.get('emprNav', barco.emprNav)
            barco.icjEmprNav = data.get('icjEmprNav', barco.icjEmprNav)
            barco.emprServ = data.get('emprServ', barco.emprServ)
            barco.icjEmprServ = data.get('icjEmprServ', barco.icjEmprServ)
            barco.emailFiscContr = data.get('emailFiscContr', barco.emailFiscContr)
            barco.gerOper = data.get('gerOper', barco.gerOper)
            barco.emailCiop = data.get('emailCiop', barco.emailCiop)
            barco.chaveAto = data.get('chaveAto', barco.chaveAto)
            barco.nomeAto = data.get('nomeAto', barco.nomeAto)
            barco.emailAto = data.get('emailAto', barco.emailAto)
            barco.contAto = data.get('contAto', barco.contAto)
            barco.chaveSto = data.get('chaveSto', barco.chaveSto)
            barco.nomeSto = data.get('nomeSto', barco.nomeSto)
            barco.emailSto = data.get('emailSto', barco.emailSto)
            barco.contSto = data.get('contSto', barco.contSto)
            barco.RamalBrOper = data.get('RamalBrOper', barco.RamalBrOper)
            barco.TelExtoper = data.get('TelExtoper', barco.TelExtoper)
            barco.emailOper = data.get('emailOper', barco.emailOper)
            barco.RamalBrPassad = data.get('RamalBrPassad', barco.RamalBrPassad)
            barco.TelExtpassad = data.get('TelExtpassad', barco.TelExtpassad)
            barco.contPassad = data.get('contPassad', barco.contPassad)
            barco.emailPassad = data.get('emailPassad', barco.emailPassad)
            barco.listEmailAssDig = data.get('listEmailAssDig', barco.listEmailAssDig)
            barco.save()
            
            print(f"[API] PUT /barcos/{barco_id} - Atualizado com sucesso")
            
            return JsonResponse({
                'success': True,
                'message': 'Barco atualizado com sucesso',
                'data': {
                    'id': barco.id,
                    'tipoBarco': barco.tipoBarco,
                    'nomeBarco': barco.nomeBarco,
                    'modalBarco': barco.modalBarco,
                    'emailPetr': barco.emailPetr,
                    'dataPrimPorto': str(barco.dataPrimPorto),
                    'emprNav': barco.emprNav,
                    'icjEmprNav': barco.icjEmprNav,
                    'emprServ': barco.emprServ,
                    'icjEmprServ': barco.icjEmprServ,
                    'emailFiscContr': barco.emailFiscContr,
                    'gerOper': barco.gerOper,
                    'emailCiop': barco.emailCiop,
                    'chaveAto': barco.chaveAto,
                    'nomeAto': barco.nomeAto,
                    'emailAto': barco.emailAto,
                    'contAto': barco.contAto,
                    'chaveSto': barco.chaveSto,
                    'nomeSto': barco.nomeSto,
                    'emailSto': barco.emailSto,
                    'contSto': barco.contSto,
                    'RamalBrOper': barco.RamalBrOper,
                    'TelExtoper': barco.TelExtoper,
                    'emailOper': barco.emailOper,
                    'RamalBrPassad': barco.RamalBrPassad,
                    'TelExtpassad': barco.TelExtpassad,
                    'contPassad': barco.contPassad,
                    'emailPassad': barco.emailPassad,
                    'listEmailAssDig': barco.listEmailAssDig
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /barcos/{barco_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            nome_barco = barco.nomeBarco
            barco.delete()
            
            print(f"[API] DELETE /barcos/{barco_id} - Barco '{nome_barco}' removido")
            
            return JsonResponse({
                'success': True,
                'message': f'Barco {nome_barco} removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /barcos/{barco_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


#================================================ENDPOINTS DE CHOICES E LISTAS=================================================
@csrf_exempt
@require_http_methods(["GET"])
def barcos_tipos(request):
    """
    GET: Retorna as choices de tipos de barcos
    """
    try:
        tipos = [
            {'value': choice[0], 'label': choice[1]} 
            for choice in BarcosCad.barcoTipoChoice
        ]
        
        return JsonResponse({
            'success': True,
            'data': tipos
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def modais_list(request):
    """
    GET: Retorna lista de modais cadastrados
    """
    try:
        modais = ModalBarco.objects.all().values('id', 'modal')
        modais_list = list(modais)
        
        return JsonResponse({
            'success': True,
            'data': modais_list
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


#================================================ CONTATOS UEP - API REST=================================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def uep_contatos_list(request, uep_id):
    """
    GET: Lista todos os contatos de uma UEP específica
    POST: Cria um novo contato para uma UEP
    """
    
    # Verificar se a UEP existe
    try:
        uep = contatoUep.objects.get(id=uep_id)
    except contatoUep.DoesNotExist:
        print(f"[API ERROR] UEP ID {uep_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'UEP não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        try:
            contatos = subTabcontatosUeps.objects.filter(idxcontatoUep=uep).values(
                'id', 'tipoContato', 'chaveCompartilhada', 'emailExterno', 
                'ramalBR', 'telExterno'
            )
            contatos_list = list(contatos)
            
            print(f"[API] GET /ueps/{uep_id}/contatos - Retornando {len(contatos_list)} contatos")
            
            return JsonResponse({
                'success': True,
                'data': contatos_list,
                'count': len(contatos_list)
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /ueps/{uep_id}/contatos - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            print(f"[API] POST /ueps/{uep_id}/contatos - Criando contato: {data.get('tipoContato')}")
            
            contato = subTabcontatosUeps.objects.create(
                idxcontatoUep=uep,
                tipoContato=data.get('tipoContato'),
                chaveCompartilhada=data.get('chaveCompartilhada'),
                emailExterno=data.get('emailExterno'),
                ramalBR=data.get('ramalBR'),
                telExterno=data.get('telExterno')
            )
            
            print(f"[API] POST /ueps/{uep_id}/contatos - Contato criado com ID: {contato.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'Contato criado com sucesso',
                'data': {
                    'id': contato.id,
                    'tipoContato': contato.tipoContato,
                    'chaveCompartilhada': contato.chaveCompartilhada,
                    'emailExterno': contato.emailExterno,
                    'ramalBR': contato.ramalBR,
                    'telExterno': contato.telExterno
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ueps/{uep_id}/contatos - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def ueps_detail(request, uep_id):
    
    """
    GET: Retorna uma UEP específica
    PUT: Atualiza uma UEP
    DELETE: Remove uma UEP
    """
    
    try:
        uep = contatoUep.objects.get(id=uep_id)
    except contatoUep.DoesNotExist:
        print(f"[API ERROR] UEP ID {uep_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'UEP não encontrada'
        }, status=404)
    
    if request.method == 'GET':
        print(f"[API] GET /ueps/{uep_id}")
        return JsonResponse({
            'success': True,
            'data': {
                'id': uep.id,
                'afretUep': uep.afretUep,
                'unidade': uep.unidade,
                'criado_em': uep.criado_em,
                'atualizado_em': uep.atualizado_em
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /ueps/{uep_id} - Atualizando")
            
            # Atualizar campo afretUep
            if 'afretUep' in data:
                uep.afretUep = data['afretUep']
            if 'unidade' in data:
                unidade = (data.get('unidade') or '').strip()
                if not unidade:
                    return JsonResponse({
                        'success': False,
                        'error': "Campo 'unidade' não pode ser vazio"
                    }, status=400)
                uep.unidade = unidade
            uep.save()
            
            print(f"[API] PUT /ueps/{uep_id} - Atualizado com sucesso")
            
            return JsonResponse({
                'success': True,
                'message': 'UEP atualizada com sucesso',
                'data': {
                    'id': uep.id,
                    'afretUep': uep.afretUep,
                    'unidade': uep.unidade,
                    'criado_em': uep.criado_em,
                    'atualizado_em': uep.atualizado_em
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /ueps/{uep_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            uep_id_deletado = uep.id
            uep.delete()
            
            print(f"[API] DELETE /ueps/{uep_id} - UEP removida")
            
            return JsonResponse({
                'success': True,
                'message': f'UEP ID {uep_id_deletado} removida com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /ueps/{uep_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def ueps_list(request):
    """
    GET: Lista todas as UEPs
    POST: Cria uma nova UEP
    """
    
    if request.method == 'GET':
        try:
            ueps = contatoUep.objects.all().values(
                'id', 'afretUep', 'unidade', 'criado_em', 'atualizado_em'
            )
            ueps_list = list(ueps)
            
            print(f"[API] GET /ueps - Retornando {len(ueps_list)} UEPs")
            
            return JsonResponse({
                'success': True,
                'data': ueps_list,
                'count': len(ueps_list)
            }, safe=False)
            
        except Exception as e:
            print(f"[API ERROR] GET /ueps - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            afret_uep = data.get('afretUep', False)
            unidade = (data.get('unidade') or '').strip()

            if not unidade:
                return JsonResponse({
                    'success': False,
                    'error': "Informe a Unidade"
                }, status=400)
            
            print(f"[API] POST /ueps - Criando UEP: Afretada={afret_uep}")
            
            uep = contatoUep.objects.create(
                afretUep=afret_uep,
                unidade=unidade,
            )
            
            print(f"[API] POST /ueps - UEP criada com ID: {uep.id}")
            
            return JsonResponse({
                'success': True,
                'message': 'UEP criada com sucesso',
                'data': {
                    'id': uep.id,
                    'afretUep': uep.afretUep,
                    'unidade': uep.unidade,
                    'criado_em': uep.criado_em,
                    'atualizado_em': uep.atualizado_em
                }
            }, status=201)
            
        except Exception as e:
            print(f"[API ERROR] POST /ueps - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def uep_contatos_detail(request, contato_id):
    """
    GET: Retorna um contato UEP específico
    PUT: Atualiza um contato UEP
    DELETE: Remove um contato UEP
    """
    
    try:
        contato = subTabcontatosUeps.objects.get(id=contato_id)
    except subTabcontatosUeps.DoesNotExist:
        print(f"[API ERROR] Contato UEP ID {contato_id} não encontrado")
        return JsonResponse({
            'success': False,
            'error': 'Contato não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        print(f"[API] GET /uep-contatos/{contato_id}")
        return JsonResponse({
            'success': True,
            'data': {
                'id': contato.id,
                'idxcontatoUep_id': contato.idxcontatoUep.id,
                'tipoContato': contato.tipoContato,
                'chaveCompartilhada': contato.chaveCompartilhada,
                'emailExterno': contato.emailExterno,
                'ramalBR': contato.ramalBR,
                'telExterno': contato.telExterno
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            print(f"[API] PUT /uep-contatos/{contato_id} - Atualizando")
            
            # Atualizar campos
            contato.tipoContato = data.get('tipoContato', contato.tipoContato)
            contato.chaveCompartilhada = data.get('chaveCompartilhada', contato.chaveCompartilhada)
            contato.emailExterno = data.get('emailExterno', contato.emailExterno)
            contato.ramalBR = data.get('ramalBR', contato.ramalBR)
            contato.telExterno = data.get('telExterno', contato.telExterno)
            
            contato.save()
            
            print(f"[API] PUT /uep-contatos/{contato_id} - Atualizado com sucesso")
            
            return JsonResponse({
                'success': True,
                'message': 'Contato atualizado com sucesso',
                'data': {
                    'id': contato.id,
                    'idxcontatoUep_id': contato.idxcontatoUep.id,
                    'tipoContato': contato.tipoContato,
                    'chaveCompartilhada': contato.chaveCompartilhada,
                    'emailExterno': contato.emailExterno,
                    'ramalBR': contato.ramalBR,
                    'telExterno': contato.telExterno
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /uep-contatos/{contato_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            contato_id_deletado = contato.id
            contato.delete()
            
            print(f"[API] DELETE /uep-contatos/{contato_id} - Contato removido")
            
            return JsonResponse({
                'success': True,
                'message': f'Contato ID {contato_id_deletado} removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /uep-contatos/{contato_id} - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

# As opções da descrição do contato dependem da escolha da check box
@csrf_exempt
@require_http_methods(["GET"])
def uep_choices(request, uep_id):
    """
    GET: Retorna os choices de tipoContato baseado no valor de afretUep
    """
    
    try:
        uep = contatoUep.objects.get(id=uep_id)
    except contatoUep.DoesNotExist:
        print(f"[API ERROR] UEP ID {uep_id} não encontrada")
        return JsonResponse({
            'success': False,
            'error': 'UEP não encontrada'
        }, status=404)
    
    try:
        # Determinar qual lista de choices usar baseado em afretUep
        if uep.afretUep:
            # UEP Afretada - usar contatoUepAfretChoices
            choices = [
                {'value': choice[0], 'label': choice[1]} 
                for choice in subTabcontatosUeps.contatoUepAfretChoices
            ]
        else:
            # UEP Petrobras (Não Afretada) - usar contatoUepBrChoices
            choices = [
                {'value': choice[0], 'label': choice[1]} 
                for choice in subTabcontatosUeps.contatoUepBrChoices
            ]
        
        print(f"[API] GET /ueps/{uep_id}/choices - Retornando {len(choices)} opções (Afretada={uep.afretUep})")
        
        return JsonResponse({
            'success': True,
            'data': {
                'afretUep': uep.afretUep,
                'unidade': uep.unidade,
                'choices': choices
            }
        })
        
    except Exception as e:
        print(f"[API ERROR] GET /ueps/{uep_id}/choices - {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)



#========================================== MATERIAIS OPERAÇÃO API REST==========================================
@csrf_exempt
@require_http_methods(["GET", "POST"])
def materiais_operacao_list(request):
    """
    GET: Lista todos os materiais de operação
    POST: Cria novo material de operação
    """
    
    if request.method == 'GET':
        try:
            materiais = materiaisOperacao.objects.all()
            
            data = []
            for mat in materiais:
                data.append({
                    'id': mat.id,
                    'descMat': mat.descMat,
                    'obsDescMat': mat.obsDescMat or '',
                    'criado_em': mat.criado_em.isoformat(),
                    'atualizado_em': mat.atualizado_em.isoformat()
                })
            
            print(f"[API] GET /api/materiais-operacao/ - {len(data)} materiais retornados")
            
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        except Exception as e:
            print(f"[API ERROR] GET /api/materiais-operacao/ - {str(e)}")
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
            import traceback
            traceback.print_exc()
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def materiais_operacao_detail(request, material_id):
    """
    GET: Retorna dados do material
    PUT: Atualiza material
    DELETE: Remove material
    """
    
    try:
        material = materiaisOperacao.objects.get(id=material_id)
    except materiaisOperacao.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Material não encontrado'
        }, status=404)
    
    if request.method == 'GET':
        try:
            data = {
                'id': material.id,
                'descMat': material.descMat,
                'obsDescMat': material.obsDescMat or '',
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
            
            material.descMat = data.get('descMat', material.descMat)
            material.obsDescMat = data.get('obsDescMat', material.obsDescMat)
            material.save()
            
            print(f"[API] PUT /api/materiais-operacao/{material_id}/ - Material atualizado")
            
            return JsonResponse({
                'success': True,
                'message': 'Material atualizado com sucesso',
                'data': {
                    'id': material.id
                }
            })
            
        except Exception as e:
            print(f"[API ERROR] PUT /api/materiais-operacao/{material_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            material.delete()
            
            print(f"[API] DELETE /api/materiais-operacao/{material_id}/ - Material removido")
            
            return JsonResponse({
                'success': True,
                'message': 'Material removido com sucesso'
            })
            
        except Exception as e:
            print(f"[API ERROR] DELETE /api/materiais-operacao/{material_id}/ - {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)