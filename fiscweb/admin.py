from django.contrib import admin

from .models_cad import FiscaisCad,BarcosCad,ModalBarco # Seção cadastro

from .models_ps import PassServ, PortoTrocaTurma,PortoManutPrev,PortoAbast,PortoInspNorm,subTabPortoInspNorm,PortoInspPetr,subTabPortoInspPetr,PortoEmbEquip,subTabPortoEmbEquip,PortoEmbMat,subTabPortoEmbMat,PortoDesMat,PortoMobD # Seção 1
from .models_ps import anocSMS #Seção 2
from .models_ps import inoPendContr #Seção 3
from .models_ps import iapo, smsLvMang,smsLvSeg


admin.site.register(FiscaisCad)
admin.site.register(BarcosCad)
admin.site.register(ModalBarco)
  

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


admin.site.register(anocSMS)
admin.site.register(inoPendContr)
admin.site.register(iapo)
admin.site.register(smsLvMang)
admin.site.register(smsLvSeg)



