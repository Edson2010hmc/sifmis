from django.urls import path
from . import views

urlpatterns = [
    # API Index

    
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


    #===========================================CADASTROS========================================
    # API Usuarios
    path('api/fiscais/', views.fiscais_list, name='fiscais_list'), #filtro por perfil
    path('api/fiscais/<int:fiscal_id>/', views.fiscais_detail, name='fiscais_detail'),
    path('api/fiscais/perfil-fiscal/', views.fiscais_perfil_fiscal, name='fiscais_perfil_fiscal'),

    # API Barcos
    path('api/barcos/', views.barcos_list, name='barcos_list'),
    path('api/barcos/<int:barco_id>/', views.barcos_detail, name='barcos_detail'),
    path('api/barcos/tipos/', views.barcos_tipos, name='barcos_tipos'),

    # API Modais
    path('api/modais/', views.modais_list, name='modais_list'),


    #===========================================PASSAGEM DE SERVIÇO=================================
    # API Passagem de Serviço
    path('api/verificar-rascunho/', views.verificar_rascunho, name='verificar_rascunho'),
    path('api/verificar-rascunho-embarcacao/', views.verificar_rascunho_embarcacao, name='verificar_rascunho_embarcacao'),
    path('api/verificar-ps-anterior/', views.verificar_ps_anterior, name='verificar_ps_anterior'),
    path('api/passagens/criar/', views.criar_nova_ps, name='criar_nova_ps'),
    path('api/passagens/<int:ps_id>/', views.passagem_detail, name='passagem_detail'),
    path('api/passagens/', views.passagem_list, name='passagens_list'),
    path('api/passagens/usuario/', views.listar_passagens_usuario, name='listar_passagens_usuario'),

    # API Troca de Turma
    path('api/ps/<int:ps_id>/troca-turma/', views.porto_troca_turma_list, name='porto_troca_turma_list'),
    path('api/troca-turma/<int:troca_turma_id>/', views.porto_troca_turma_detail, name='porto_troca_turma_detail'),

    # API Manutenção Preventiva
    path('api/ps/<int:ps_id>/manut-prev/', views.porto_manut_prev_list, name='porto_manut_prev_list'),
    path('api/manut-prev/<int:manut_prev_id>/', views.porto_manut_prev_detail, name='porto_manut_prev_detail'),

    # API Abastecimento
    path('api/ps/<int:ps_id>/abast/', views.porto_abast_list, name='porto_abast_list'),
    path('api/abast/<int:abast_id>/', views.porto_abast_detail, name='porto_abast_detail'),
    path('api/ps/<int:ps_id>/ultimo-abastecimento/', views.buscar_ultimo_abastecimento, name='buscar_ultimo_abastecimento'),
  
    # API Inspeção Normativa (Principal e subtabelas)
    path('api/ps/<int:ps_id>/insp-norm/', views.porto_insp_norm_list, name='porto_insp_norm_list'),
    path('api/insp-norm/<int:insp_norm_id>/', views.porto_insp_norm_detail, name='porto_insp_norm_detail'),
    path('api/insp-norm/<int:insp_norm_id>/subtab/', views.subtab_insp_norm_list, name='subtab_insp_norm_list'),
    path('api/insp-norm-item/<int:item_id>/', views.subtab_insp_norm_detail, name='subtab_insp_norm_detail'),

# API Inspeção Petrobras (Principal e subtabelas)
    path('api/ps/<int:ps_id>/insp-petr/', views.porto_insp_petr_list, name='porto_insp_petr_list'),
    path('api/insp-petr/<int:insp_petr_id>/', views.porto_insp_petr_detail, name='porto_insp_petr_detail'),
    path('api/insp-petr/<int:insp_petr_id>/subtab/', views.subtab_insp_petr_list, name='subtab_insp_petr_list'),
    path('api/insp-petr-item/<int:item_id>/', views.subtab_insp_petr_detail, name='subtab_insp_petr_detail'),

# API Embarque de Equipes (Principal e subtabelas)
    path('api/ps/<int:ps_id>/emb-equip/', views.porto_emb_equip_list, name='porto_emb_equip_list'),
    path('api/emb-equip/<int:emb_equip_id>/', views.porto_emb_equip_detail, name='porto_emb_equip_detail'),
    path('api/emb-equip/<int:emb_equip_id>/subtab/', views.subtab_emb_equip_list, name='subtab_emb_equip_list'),
    path('api/emb-equip-item/<int:item_id>/', views.subtab_emb_equip_detail, name='subtab_emb_equip_detail'),

# API Mobilização/Desmobilização (Principal e subtabelas)
    path('api/ps/<int:ps_id>/mob-desm/', views.porto_mob_desm_list, name='porto_mob_desm_list'),
    path('api/mob-desm/<int:mob_desm_id>/', views.porto_mob_desm_detail, name='porto_mob_desm_detail'),
    path('api/mob-desm/<int:mob_desm_id>/subtab/', views.subtab_mob_desm_list, name='subtab_mob_desm_list'),
    path('api/mob-desm-item/<int:item_id>/', views.subtab_mob_desm_detail, name='subtab_mob_desm_detail'),




# API Finalizar Passagem de Serviço
    path('api/passagens/<int:ps_id>/finalizar/', views.finalizar_passagem, name='finalizar_passagem'),   

# API Gerar PDF da Passagem de Serviço
    path('api/passagens/<int:ps_id>/gerar-pdf/', views.gerar_pdf_passagem, name='gerar_pdf_passagem'),
]