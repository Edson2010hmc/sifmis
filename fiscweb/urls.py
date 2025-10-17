from django.urls import path
from . import views
from . import views_cad
from . import views_ps
from . import views_anom



urlpatterns = [
    #======================================PAGINAS HTML
    path('', views.index_main, name='index_main'),
    path('passagens/', views.passagens, name='passagens'),
    path('anomalias/', views.anomalias, name='anomalias'),
    path('protocolo/', views.protocolo, name='protocolo'),
    path('inventario/', views.inventario, name='inventario'),
    path('cadastros/', views.cadastros, name='cadastros'),

    #========================================AUTENTICAÇÃO E AUTORIZAÇÃO=================================
    # API Validação de Usuário
    path('api/validar-usuario/', views.validar_usuario, name='validar_usuario'),
    path('api/get-current-user/', views.get_current_user, name='get_current_user'),


    #===========================================MODULO CADASTROS========================================
    # API Usuarios
    path('api/fiscais/', views_cad.fiscais_list, name='fiscais_list'), #filtro por perfil
    path('api/fiscais/<int:fiscal_id>/', views_cad.fiscais_detail, name='fiscais_detail'),
    path('api/fiscais/perfil-fiscal/', views_cad.fiscais_perfil_fiscal, name='fiscais_perfil_fiscal'),

    # API Barcos
    path('api/barcos/', views_cad.barcos_list, name='barcos_list'),
    path('api/barcos/<int:barco_id>/', views_cad.barcos_detail, name='barcos_detail'),
    path('api/barcos/tipos/', views_cad.barcos_tipos, name='barcos_tipos'),

    # API Modais
    path('api/modais/', views_cad.modais_list, name='modais_list'),


    #===========================================MODULO PASSAGEM DE SERVIÇO=================================
    # API Passagem de Serviço
    path('api/verificar-rascunho/', views_ps.verificar_rascunho, name='verificar_rascunho'),
    path('api/verificar-rascunho-embarcacao/', views_ps.verificar_rascunho_embarcacao, name='verificar_rascunho_embarcacao'),
    path('api/verificar-ps-anterior/', views_ps.verificar_ps_anterior, name='verificar_ps_anterior'),
    path('api/passagens/criar/', views_ps.criar_nova_ps, name='criar_nova_ps'),
    path('api/passagens/<int:ps_id>/', views_ps.passagem_detail, name='passagem_detail'),
    path('api/passagens/', views_ps.passagem_list, name='passagens_list'),
    path('api/passagens/usuario/', views_ps.listar_passagens_usuario, name='listar_passagens_usuario'),

    # API Troca de Turma
    path('api/ps/<int:ps_id>/troca-turma/', views_ps.porto_troca_turma_list, name='porto_troca_turma_list'),
    path('api/troca-turma/<int:troca_turma_id>/', views_ps.porto_troca_turma_detail, name='porto_troca_turma_detail'),

    # API Manutenção Preventiva
    path('api/ps/<int:ps_id>/manut-prev/', views_ps.porto_manut_prev_list, name='porto_manut_prev_list'),
    path('api/manut-prev/<int:manut_prev_id>/', views_ps.porto_manut_prev_detail, name='porto_manut_prev_detail'),

    # API Abastecimento
    path('api/ps/<int:ps_id>/abast/', views_ps.porto_abast_list, name='porto_abast_list'),
    path('api/abast/<int:abast_id>/', views_ps.porto_abast_detail, name='porto_abast_detail'),
    path('api/ps/<int:ps_id>/ultimo-abastecimento/', views_ps.buscar_ultimo_abastecimento, name='buscar_ultimo_abastecimento'),
  
    # API Inspeção Normativa (Principal e subtabelas)
path('api/ps/<int:ps_id>/insp-norm/', views_ps.porto_insp_norm_list, name='porto_insp_norm_list'),
    path('api/insp-norm/<int:insp_norm_id>/', views_ps.porto_insp_norm_detail, name='porto_insp_norm_detail'),
    path('api/insp-norm/<int:insp_norm_id>/subtab/', views_ps.subtab_insp_norm_list, name='subtab_insp_norm_list'),
    path('api/insp-norm-item/<int:item_id>/', views_ps.subtab_insp_norm_detail, name='subtab_insp_norm_detail'),

# API Inspeção Petrobras (Principal e subtabelas)
path('api/ps/<int:ps_id>/insp-petr/', views_ps.porto_insp_petr_list, name='porto_insp_petr_list'),
path('api/insp-petr/<int:insp_petr_id>/', views_ps.porto_insp_petr_detail, name='porto_insp_petr_detail'),
path('api/insp-petr/<int:insp_petr_id>/subtab/', views_ps.subtab_insp_petr_list, name='subtab_insp_petr_list'),
path('api/insp-petr-item/<int:item_id>/', views_ps.subtab_insp_petr_detail, name='subtab_insp_petr_detail'),

# API Embarque de Equipes (Principal e subtabelas)
path('api/ps/<int:ps_id>/emb-equip/', views_ps.porto_emb_equip_list, name='porto_emb_equip_list'),
path('api/emb-equip/<int:emb_equip_id>/', views_ps.porto_emb_equip_detail, name='porto_emb_equip_detail'),
path('api/emb-equip/<int:emb_equip_id>/subtab/', views_ps.subtab_emb_equip_list, name='subtab_emb_equip_list'),
path('api/emb-equip-item/<int:item_id>/', views_ps.subtab_emb_equip_detail, name='subtab_emb_equip_detail'),

# API Mobilização/Desmobilização (Principal e subtabelas)
path('api/ps/<int:ps_id>/mob-desm/', views_ps.porto_mob_desm_list, name='porto_mob_desm_list'),
path('api/mob-desm/<int:mob_desm_id>/', views_ps.porto_mob_desm_detail, name='porto_mob_desm_detail'),
path('api/mob-desm/<int:mob_desm_id>/subtab/', views_ps.subtab_mob_desm_list, name='subtab_mob_desm_list'),
path('api/mob-desm-item/<int:item_id>/', views_ps.subtab_mob_desm_detail, name='subtab_mob_desm_detail'),

# API Finalizar Passagem de Serviço
path('api/passagens/<int:ps_id>/finalizar/', views_ps.finalizar_passagem, name='finalizar_passagem'),   

# API Gerar PDF da Passagem de Serviço
path('api/passagens/<int:ps_id>/gerar-pdf/', views_ps.gerar_pdf_passagem, name='gerar_pdf_passagem'),


#=================================MODULO INFORME DE ANOMALIA==============================
path('api/informes/', views_anom.informe_anomalia_list, name='informe_anomalia_list'),
path('api/informes/<int:informe_id>/', views_anom.informe_anomalia_detail, name='informe_anomalia_detail'),
path('api/informes/<int:informe_id>/pessoas/', views_anom.subtab_pessoas_list, name='subtab_pessoas_list'),
path('api/pessoas/<int:pessoa_id>/', views_anom.subtab_pessoas_detail, name='subtab_pessoas_detail'),
path('api/embarcacoes/<int:embarcacao_id>/empresas/', views_anom.buscar_empresas_embarcacao, name='buscar_empresas_embarcacao'),
path('api/informes/<int:informe_id>/enviar/', views_anom.enviar_informe, name='enviar_informe'),
path('api/informes/<int:informe_id>/html/', views_anom.obter_html_informe, name='obter_html_informe'),
]