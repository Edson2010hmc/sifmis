from django.contrib import admin

from .models_cad import FiscaisCad,BarcosCad,ModalBarco,contatoUep,subTabcontatosUeps # Seção cadastro

from .models_ps import PassServ, PortoTrocaTurma,PortoManutPrev,PortoAbast,PortoInspNorm,subTabPortoInspNorm,PortoInspPetr,subTabPortoInspPetr,PortoEmbEquip,subTabPortoEmbEquip,PortoEmbMat,subTabPortoEmbMat,PortoDesMat,PortoMobD # Seção 1
from .models_ps import anomSMS,desvSMS 
from .models_ps import inoPendContr 
from .models_ps import iapo, smsLvMang,smsLvSeg

from .models_anom import InformeAnomalia, SubTabPessoasAnomalia


#======================= MODULO CADASTROS================================
admin.site.register(FiscaisCad)
admin.site.register(BarcosCad)
admin.site.register(ModalBarco)
admin.site.register(contatoUep)
admin.site.register(subTabcontatosUeps)
  
#============================MODULO PASSAGEM DE SERVIÇO=================
admin.site.register(PassServ)
admin.site.register(PortoTrocaTurma)
admin.site.register(PortoManutPrev) 
admin.site.register(PortoAbast)
admin.site.register(PortoInspNorm)
admin.site.register(PortoInspPetr)
admin.site.register(PortoEmbEquip)
admin.site.register(PortoEmbMat)
admin.site.register(PortoDesMat)
admin.site.register(PortoMobD)
admin.site.register(subTabPortoInspNorm)
admin.site.register(subTabPortoInspPetr)
admin.site.register(subTabPortoEmbEquip)
admin.site.register(subTabPortoEmbMat)

admin.site.register(anomSMS)
admin.site.register(desvSMS)
admin.site.register(inoPendContr)
admin.site.register(iapo)
admin.site.register(smsLvMang)
admin.site.register(smsLvSeg)



#=============================MODULO INFORME DE ANOMALIA===========================
admin.site.register(InformeAnomalia)
admin.site.register(SubTabPessoasAnomalia)