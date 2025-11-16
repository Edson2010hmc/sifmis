# /fiscweb/models_ps.py
# Rev 0
import os
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver
from . import models_cad

#================== SIGNAL PARA DELETAR ANEXOS DE REGISTROS EXCLUIDOS==========================================
@receiver(post_delete)
def deletar_arquivos_anexos(sender, instance, **kwargs):
    # Verifica todos os campos FileField do modelo
    for field in instance._meta.get_fields():
        if isinstance(field, models.FileField):
            arquivo = getattr(instance, field.name)
            if arquivo:
                if os.path.isfile(arquivo.path):
                    os.remove(arquivo.path)




#=================================FUNÇÃO DE TRATAMENTO DOS ARQUIVOS ANEXOS=====================================
def caminho_PS(instance, filename):
        """Função genérica que encontra PassServ automaticamente"""
        
        # Buscar campo ForeignKey para PassServ
        pass_serv = None
        for field in instance._meta.get_fields():
            if hasattr(field, 'related_model') and field.related_model == PassServ:
                pass_serv = getattr(instance, field.name)
                break
        
        if not pass_serv:
            raise ValueError("Modelo não tem relacionamento com PassServ")
        
        folder = instance.PASTA_UPLOAD
        # Resto igual
        barco = pass_serv.BarcoPS
        num_ps = pass_serv.numPS
        data_emissao = pass_serv.dataEmissaoPS
        ano = data_emissao.year
        
        nome_original, extensao = os.path.splitext(filename)
        data_formatada = data_emissao.strftime('%d-%m-%Y')
        nome_arquivo = f"PS_{num_ps}_{ano}_{barco}_{nome_original}{extensao}"
        
        return f"storage/PS/{barco}/{ano}/{folder}/{nome_arquivo}"
 
#=================================1 MODELO PASSAGENS DE SERVIÇO================================================
class PassServ(models.Model):
    """Modelo para cadastro de Passagem de Serviço"""

    STATUS_CHOICES = [
        ('RASCUNHO', 'RASCUNHO'),
        ('FINALIZADA', 'FINALIZADA'),
    ]
     
    numPS = models.IntegerField(verbose_name='Numero da PS')
    anoPS=models.CharField(max_length=5,verbose_name='Ano da PS')
    dataInicio = models.DateField(verbose_name='Inicio da Quinzena')
    dataFim = models.DateField(verbose_name='Fim da Quinzena')
    dataEmissaoPS = models.DateField(verbose_name='Data de Emissao',default='2025-01-01')
    TipoBarco = models.CharField(max_length=6,verbose_name='Barco')
    BarcoPS = models.CharField(max_length=30,verbose_name='Barco')
    statusPS = models.CharField(max_length=12,choices=STATUS_CHOICES,default='RASCUNHO',verbose_name='Status da PS')
    fiscalEmb = models.CharField(max_length=30,verbose_name='Fiscal Embarcando')
    fiscalDes = models.CharField(max_length=30,verbose_name='Fiscal Desembarcando')
    pdfPath = models.CharField(max_length=500, verbose_name='Caminho do PDF', blank=True, null=True)
     
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Passagem de Serviço'
        verbose_name_plural = 'Passagens de serviço'
        ordering = ['BarcoPS','-numPS']
    
    def __str__(self):
        return f"{self.numPS} - {self.BarcoPS} - {self.dataEmissaoPS}"
        
#=================================1.1 =MODELO PORTO TROCA DE TURMA=============================================
class PortoTrocaTurma(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Porto"""

    idxPortoTT = models.ForeignKey(PassServ,on_delete=models.CASCADE)

    Porto = models.CharField(max_length=40,verbose_name='Porto')
    Terminal = models.CharField(max_length=40,verbose_name='Terminal')
    OrdSerPorto = models.CharField(max_length=12,verbose_name='Ordem de Serviço')
    AtracPorto = models.TimeField(verbose_name='Horario da Atracação')
    DuracPorto = models.CharField(max_length=6,verbose_name='Duração da estadia(h)')
    ObservPorto = models.TextField(max_length=500,verbose_name='Observações', blank=True)
    class Meta:
        verbose_name = 'Troca de Turma - Porto'
        verbose_name_plural = 'Trocas de Turma - Portos'
        ordering = ['idxPortoTT__BarcoPS','-idxPortoTT__numPS']
    
    def __str__(self):
        return f"{self.idxPortoTT} - {self.Porto}"
    
#================================1.2 MODELO PORTO MANUTENÇÃO PREVENTIVA========================================
class PortoManutPrev(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Manutenção Preventiva - porto"""

    PASTA_UPLOAD = 'Rade'

    idxPortoMP = models.ForeignKey(PassServ, on_delete=models.CASCADE)

    prevManPrev = models.BooleanField(default=False, verbose_name='Manutenção preventiva prevista?')

    Franquia = models.IntegerField(verbose_name='Franquia solicitada')
    SaldoFranquia = models.IntegerField(verbose_name='Saldo de Franquia')
    OrdSerManutPrev = models.CharField(max_length=12, verbose_name='Ordem de Serviço')
    Rade = models.FileField(upload_to=caminho_PS, verbose_name='Anexo Rade', blank=True, null=True)
    ObservManPrev = models.TextField(max_length=500, verbose_name='Observações', blank=True)
    
    class Meta:
        verbose_name = 'Manutenção Preventiva - Porto'
        verbose_name_plural = 'Manutenções Preventivas - Portos'
        ordering = ['idxPortoMP__BarcoPS','-idxPortoMP__numPS']  
        
    def __str__(self):
        return f"{self.idxPortoMP} - {self.OrdSerManutPrev}"
    
#=================================1.3 MODELO PORTO ABASTECIMENTO===============================================
class PortoAbast(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Abastecimento - porto"""

    PASTA_UPLOAD = 'Abast'

    idxPortoAB = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    prevAbast = models.BooleanField(default=False, verbose_name='Abastecimento previsto?')
    OrdSerAbast = models.CharField(max_length=12, verbose_name='Ordem de Serviço', blank=True)
    DataHoraPrevAbast = models.DateTimeField(verbose_name='Data e Hora Prevista', blank=True, null=True)
    QuantAbast = models.IntegerField(verbose_name='Quantidade (m³)', blank=True, null=True)
    DuracPrev = models.IntegerField(verbose_name='Duração Prevista(h)', blank=True, null=True)
    UltAbast = models.DateField(verbose_name='Último Abastecimento', blank=True, null=True)
    QuantUltAbast = models.IntegerField(verbose_name='Quantidade Ultimo Abastecimento (m³)', blank=True, null=True)
    Anexos = models.FileField(upload_to=caminho_PS, verbose_name='Anexos', blank=True, null=True)
    ObservAbast = models.TextField(max_length=500, verbose_name='Observações', blank=True)
    
    class Meta:
        verbose_name = 'Abastecimento - Porto'
        verbose_name_plural = 'Abastecimentos - Portos'
        ordering = ['idxPortoAB__BarcoPS','-idxPortoAB__numPS']  

    def __str__(self):
        return f"{self.idxPortoAB} - {self.OrdSerAbast}"
    
#=================================1.4 MODELO INSPEÇÕES NORMATIVAS===============================================
class PortoInspNorm(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Inspeções Normativas - porto"""

 
    idxPortoIN = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    prevInsNorm = models.BooleanField(default=False, verbose_name='Inspeção Normativa?')
    ObservInspNorm = models.TextField(max_length=500, verbose_name='Observações', blank=True)
   
    class Meta:
        verbose_name = 'Inspeção Normativa - Porto'
        verbose_name_plural = 'Inspeções Normativas - Portos'
        ordering = ['idxPortoIN__BarcoPS','-idxPortoIN__numPS']  

    def __str__(self):
        return f"{self.idxPortoIN}"
class subTabPortoInspNorm(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Inspeções Normativas - porto"""

    inspNormDescChoices = [
                            ('anvisa' , 'ANVISA'),
                            ('classe' , 'CLASSE'),
                            ('marinha','MARINHA'),
                            ('outros' , 'OUTROS'),
                                                  ]

    idxsubTabPortoInspNorm = models.ForeignKey(PortoInspNorm, on_delete=models.CASCADE)
    DescInspNorm = models.CharField(max_length=10,choices=inspNormDescChoices,verbose_name='Inspeções Normativas')
    OrdSerInspNorm = models.CharField(max_length=12, verbose_name='Ordem de Serviço')
    
    class Meta:
        verbose_name = 'Lista Inspeção Normativa - Porto'
        verbose_name_plural = 'Lista Inspeções Normativas - Portos'
        ordering = ['idxsubTabPortoInspNorm__idxPortoIN__BarcoPS','-idxsubTabPortoInspNorm__idxPortoIN__numPS']  

    def __str__(self):
        return f"{self.idxsubTabPortoInspNorm} - {self.DescInspNorm}"
 
#==================================1.5 MODELO INSPEÇÕES PETROBRAS===============================================
class PortoInspPetr(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Inspeções Petrobras - porto"""

    idxPortoIP = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    prevInspPetr = models.BooleanField(default=False, verbose_name='Inspeção Petrobras?')
    ObservInspPetr = models.TextField(max_length=500, verbose_name='Observações', blank=True)
    
    class Meta:
        verbose_name = 'Inspeção Petrobras - Porto'
        verbose_name_plural = 'Inspeções Petrobras - Portos'
        ordering = ['idxPortoIP__BarcoPS','-idxPortoIP__numPS']  

    def __str__(self):
        return f"{self.idxPortoIP} - {self.idxPortoIP.numPS}"
class subTabPortoInspPetr(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Inspeções Petrobras - porto"""

    inspPetrDescChoices = [
                            ('GSOP/SMS' ,'GSOP/SMS'),
                            ('GERENCIA CONTRATO' ,'GERENCIA CONTRATO'),
                            ('STEE' ,'STEE'),
                            ('GERENTE MIS'  ,'GERENTE MIS'),
                            ('STO MIS'      ,'STO MIS'),
                            ('OUTROS'   ,'OUTROS'),
                          ]

    idxsubTabPortoIP = models.ForeignKey(PortoInspPetr, on_delete=models.CASCADE)
    DescInspPetr = models.CharField(max_length=20,choices=inspPetrDescChoices,verbose_name='Descrição da visita')
    auditorPetr = models.CharField(max_length=30, verbose_name='Auditor/Visitante')
    gerAuditorPetr = models.CharField(max_length=30, verbose_name='Gerencia')
        
    class Meta:
        verbose_name = 'Lista Inspeção Petrobras - Porto'
        verbose_name_plural = 'Lista Inspeções Petrobras - Portos'
        ordering = ['idxsubTabPortoIP__idxPortoIP__BarcoPS','-idxsubTabPortoIP__idxPortoIP__numPS']  

    def __str__(self):
        return f"{self.idxsubTabPortoIP} - {self.DescInspPetr}"

#=================================1.6 MODELO EMBARQUE EQUIPES===================================================
class PortoEmbEquip(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Embarque Equipes - porto"""

   
    idxPortoEE = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    prevEmbEquip = models.BooleanField(default=False, verbose_name='Embarque de Equipe?')
    ObservEmbEquip = models.TextField(max_length=200, verbose_name='Observações', blank=True)
    
    class Meta:
        verbose_name = 'Embarque Equipe - Porto'
        verbose_name_plural = 'Embarque Equipes - Portos'
        ordering = ['idxPortoEE__BarcoPS','-idxPortoEE__numPS']  

    def __str__(self):
        return f"{self.idxPortoEE} - {self.idxPortoEE.numPS}"
class subTabPortoEmbEquip(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Embarque Equipes - porto"""

    EmbEquipDescChoices = [
                            ('CRD'               ,'CRD'),
                            ('STC'               ,'STC'),
                            ('EQSE'              ,'EQSE'),
                            ('STO'               ,'STO'),
                            ('CENPES'            ,'CENPES'),
                            ('AMBIENTAÇÃO MIS'   ,'AMBIENTAÇÃO MIS'),
                            ('OUTROS'            ,'OUTROS'),
                          ]

    idxSubTabPortoEE = models.ForeignKey(PortoEmbEquip, on_delete=models.CASCADE)

    DescEmbEquip = models.CharField(max_length=18,choices=EmbEquipDescChoices,verbose_name='Descrição')
    equipNome = models.CharField(max_length=30, verbose_name='Nome')
    equipFuncao = models.CharField(max_length=30, verbose_name='Função')
    equipEmpre = models.CharField(max_length=30, verbose_name='Empresa')
    
    class Meta:
        verbose_name = 'Lista Embarque Equipe - Porto'
        verbose_name_plural = 'Lista Embarque Equipes - Portos'
        ordering = ['idxSubTabPortoEE__idxPortoEE','-idxSubTabPortoEE__idxPortoEE__numPS']  

    def __str__(self):
        return f"{self.idxSubTabPortoEE} - {self.DescEmbEquip}"

#================================1.7 MODELO MOBILIZAÇÃO DESMOBILIZAÇÃO========================================
class PortoMobD(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Operações de Mobilização e desmobilização - Porto"""

    idxPortoMobD = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    prevMobD = models.BooleanField(default=False, verbose_name='Mobilização ou Desmobilização?')
    ObservMobD = models.TextField(max_length=500, verbose_name='Observações', blank=True)
    
    class Meta:
        verbose_name = 'MObilização e Desmobilização - Porto'
        verbose_name_plural = 'Mobilizações Desmobilizações - Portos'
        ordering = ['idxPortoMobD__BarcoPS','-idxPortoMobD__numPS']  

    def __str__(self):
        return f"{self.idxPortoMobD} - {self.idxPortoMobD.numPS}"
class SubTabPortoMobD(models.Model):
    """Modelo para cadastro de Passagem de Serviço - Operações de Mobilização e desmobilização - Porto"""

    idxSubTabPortoMobD = models.ForeignKey(PortoMobD, on_delete=models.CASCADE)
    
    OsMobD = models.CharField(max_length=12,verbose_name='OS de Origem')
    DescMobD = models.CharField(max_length=300, verbose_name='Descrição dada OS de Mobilização ou Desmobilização')
        
    class Meta:
        verbose_name = 'MObilização e Desmobilização - Porto'
        verbose_name_plural = 'Mobilizações Desmobilizações - Portos'
        ordering = ['idxSubTabPortoMobD']  

    def __str__(self):
        return f"{self.idxSubTabPortoMobD} - {self.OsMobD}"

#=================================1.8 MODELO EMBARQUE MATERIAIS================================================
class portoMatEmb(models.Model):
    """Modelo para  registro de Embarque de Materiais - porto"""

 
    idxPortoMatEmb = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    descMatEmbPs = models.CharField(max_length=40,blank=True,null=True, verbose_name='Descrição do Material')
    numRtMatEmbPs = models.CharField(max_length=12,blank=True,null=True, verbose_name='Numero RT')
    osMatEmbPs = models.CharField(max_length=15,blank=True,null=True, verbose_name='Ordem de Serviço')
    respMatEmbPs = models.CharField(max_length=8,blank=True,null=True, verbose_name='Responsavel Material')
    descContMatEmbPs = models.CharField(max_length=30,blank=True,null=True, verbose_name='Descrição do Contentor')
    dataPrevEmbMatPs = models.DateField(blank=True,null=True, verbose_name='Data Embarque')
    
    class Meta:
        verbose_name = 'Embarque Material - Porto'
        verbose_name_plural = 'Embarque Materiais - Porto'
        ordering = ['idxPortoMatEmb__BarcoPS','-idxPortoMatEmb__numPS']  

    def __str__(self):
        return f"{self.idxPortoMatEmb} - {self.idxPortoMatEmb.numPS}"
    
#=================================1.9 MODELO DESEMBARQUE MATERIAIS===============================================
class portoMatDesemb(models.Model):
    """Modelo para  registro de Desemmbarque de Materiais - porto"""

 
    idxPortoMatDesemb = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    descMatDesembPs = models.CharField(max_length=40,blank=True,null=True, verbose_name='Descrição do Material')
    numRtMatDesembPs = models.CharField(max_length=12,blank=True,null=True, verbose_name='Numero RT')
    osMatDesembPs = models.CharField(max_length=15,blank=True,null=True, verbose_name='Ordem de Serviço')
    respMatDesembPs = models.CharField(max_length=8,blank=True,null=True, verbose_name='Responsavel Material')
    descContMatDesembPs = models.CharField(max_length=30,blank=True,null=True, verbose_name='Descrição do Contentor')
    statusProgMatEmbPs = models.CharField(max_length=30, blank=True,null=True, verbose_name='Status do Material')
    dataPrevDesembMatPs = models.DateField(blank=True,null=True, verbose_name='Data Desembarque')
    
    class Meta:
        verbose_name = 'Desembarque Material - Porto'
        verbose_name_plural = 'Desembarque Materiais - Porto'
        ordering = ['idxPortoMatDesemb__BarcoPS','-idxPortoMatDesemb__numPS']  

    def __str__(self):
        return f"{self.idxPortoMatDesemb} - {self.idxPortoMatDesemb.numPS}"


#================================2  PENDENCIAS OCORRENCIAS E ORIENTAÇÕES =================================================================
#================================2.1 ASSUNTOS E PENDÊNCIAS CONTRATUAIS=======================================
class assunPendContr(models.Model):
    """Modelo para  PASSAGEM DE SERVIÇOAssuntos e Pendências Contratuais"""

    CLASS_PEND_CHOICES = [
                            ('PENDENCIA DE ACEITAÇÃO' ,'PENDENCIA DE ACEITAÇÃO'),
                            ('ITENS CONTRATUAIS' ,'ITENS CONTRATUAIS'),
                            ('OUTROS' , 'OUTROS'),
                        ]
    
    idxAssunPendContr = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    dataRegistroInicial = models.DateField(blank=True,null=True, verbose_name='Data Regitro Inicial')
    fiscRegistroInicial = models.CharField(max_length=30,blank=True,null=True, verbose_name='Fiscal Registro Inicial')
    classeRegistroInicial = models.CharField(max_length=30,choices=CLASS_PEND_CHOICES,blank=True,null=True, verbose_name='Numero RT')
    itemContr=models.CharField(max_length=30,blank=True,null=True, verbose_name='Item Contratual')
    anexoContr=models.CharField(max_length=50,blank=True,null=True, verbose_name='Anexo Contratual')
    contrato=models.CharField(max_length=50,blank=True,null=True, verbose_name='Contrato')
    descrRegistroInicial = models.TextField(max_length=400, blank=True,verbose_name='Descrição')
    abertoBroa = models.BooleanField(default=False, verbose_name='Abertura de BROA?')   
    numeroBroa = models.CharField(max_length=30,blank=True,null=True, verbose_name='Numero do BROA')   
    mantRegistroInicial = models.BooleanField(default=True, verbose_name='Mantém ativo para proxima PS')
   
    
    class Meta:
        verbose_name = 'Assunto e Pendência Contratual - Rotina'
        verbose_name_plural = 'Assuntos e Penências Contratuais- Rotina'
        ordering = ['-dataRegistroInicial','classeRegistroInicial']  

    def __str__(self):
        return f"{self.dataRegistroInicial} - {self.classeRegistroInicial}"
class subAssunPendContr(models.Model):
    """Modelo subtabela Assuntos e Pendencias Contratuai"""

    idxAssunPendContr = models.ForeignKey(assunPendContr, on_delete=models.CASCADE)
    dataRegistroComent = models.DateField(blank=True,null=True, verbose_name='Data Comentario')
    fiscRegistroComent = models.CharField(max_length=30,blank=True,null=True, verbose_name='Fiscal Registro Inicial')
    descrRegistroComent = models.TextField(max_length=400, blank=True,verbose_name='Descrição')
    
    class Meta:
        verbose_name = 'Comentario assunto e pendencia - Rotina'
        verbose_name_plural = 'Comentários assuntos e pendências- Rotina'
        ordering = ['-dataRegistroComent','idxAssunPendContr__classeRegistroInicial']  

    def __str__(self):
        return f"{self.dataRegistroComent} - {self.idxAssunPendContr}"

#================================2.2 DESVIOS E NÃO CONFORMIDADES=============================================
#class desvNaoConf(models.Model):
    # A implementar

#================================2.3 INFORMES DE ANOMALIA EMITIDOS============================================
class anomSMS(models.Model):
    """Modelo para  Passagem de Serviço - Anomalias de SMS"""

    idxAnomSMS = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    dataAnomSMS = models.DateField(verbose_name='Data da Anomalia')
    horaAnomSMS = models.TimeField(verbose_name='Hora da Anomalia')
    relacAnomSMS = models.CharField(max_length=15, verbose_name='Referente a')
    linkAnomSMS = models.IntegerField(verbose_name='ID do informe')
    class Meta:
        verbose_name = 'Anomalia de SMS'
        verbose_name_plural = 'Anomalias de SMS'
        ordering = ['-dataAnomSMS','-horaAnomSMS']  

    def __str__(self):
        return f"{self.dataAnomSMS} - {self.horaAnomSMS} - {self.relacAnomSMS}" 

#================================2.4 EMISSÃO DE FRO=============================================
#class emissFro(models.Model):
    #A implementar - depende de dados de outra aplicação

#================================2.5 PENDENCIAS BROA =============================================
#class pendBroa(models.Model):
    #A implementar - depende de dados de outra aplicação

#=============================== 3  LISTAS DE VERIFICAÇÃO-SMS =========================================
#================================3.1 LV SOB DEMANDA===========================================
class lvSobDemanda(models.Model):
    """Modelo para  Passagem de Serviço - LV SOB DEMANDA"""
    
    STATUS_ENVIO_LV_SOB_DEMANDA_CHOICES = [('ENVIADA', 'ENVIADA'),
                                           ('A ENVIAR', 'A ENVIAR')]

    ORIGEM_LV_SOB_DEMANDA_CHOICES = [('AIS','AIS'),
                                     ('AÇÕES DE ABRANGENCIA','AÇÕES DE ABRANGENCIA'),
                                     ('VERIFICAR EFICÁCIA DE PLANO DE ACAO','VERIFICAR EFICÁCIA DE PLANO DE ACAO')]    

    idxLvSobDemanda = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    dataRecebLvSobDemanda = models.DateField(verbose_name='Data do Recebimento')
    origemLvSobDemanda = models.CharField(max_length=45,choices=ORIGEM_LV_SOB_DEMANDA_CHOICES, verbose_name='Origem')
    numLvSobDemanda = models.CharField(max_length=15,verbose_name='Numero/Código da LV')
    descrLvSobDemanda = models.TextField(max_length=300, verbose_name='Descrição')
    linkFormsLvSobDemanda = models.CharField(max_length=100, verbose_name='Link Forms')
    prazoEnvLvSobDemanda = models.DateField(verbose_name='Prazo de Envio')
    statusEnvLvSobDemanda = models.CharField(max_length=10,choices=STATUS_ENVIO_LV_SOB_DEMANDA_CHOICES,verbose_name='Status')
    dataEnvioLvSobDemanda = models.DateField(verbose_name='Data do Envio')# Exibir campo apenas se status=ENVIADA, CASO CONTRARIO SERÁ NULL E OCULTO
    removeDaPsLvSobDemanda = models.BooleanField(default=False,verbose_name='Remover da PS?')# Essa opção só aparecerá nas PSs seguintes à PS cuja data de envio ocorreu dentro da quinzena. 
    
    class Meta:
        verbose_name = 'LV sob Demanda'
        verbose_name_plural = 'LVs sob Demanda'
        ordering = ['-idxLvSobDemanda__numPS','origemLvSobDemanda','-numLvSobDemanda']  

    def __str__(self):
        return f"{self.idxLvSobDemanda.numPS} - {self.origemLvSobDemanda} - {self.numLvSobDemanda}" 

#================================3.2 LV DE SEGURANÇA =============================================
class LvSeg(models.Model):
    """Modelo para PASSAGEM DE SERVIÇO - LV de Segurança - SMS"""

    FAROIS_LV_SEG_CHOICES = [('VERMELHO','VERMELHO'),
                             ('LARANJA','LARANJA'),
                             ('VERDE','VERDE')]
                            
    idxFreqLvSeg= models.ForeignKey(models_cad.freqLvSeg, on_delete=models.PROTECT)
    idxPsLvSeg = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    LvSegCamoAsogUlt = models.DateField(verbose_name='Data da Última LV CAMO/ASOG')
    LvSegCamoAsogProx = models.DateField(verbose_name='Data da Próxima LV CAMO/ASOG')
    LvlSegCamoAsogFarol = models.CharField(max_length=3,verbose_name='Farol LV CAMO/ASOG')
    
    LvSegCondNavioCpUlt = models.DateField(verbose_name='Data da Última LV Condição Navio(Curto Prazo)')  
    LvSegCondNavioCpProx = models.DateField(verbose_name='Data da Próxima LV Condição Navio(Curto Prazo)') 
    LvSegCondNavioCpFarol = models.CharField(max_length=3,verbose_name='Farol LV Condição Navio(Curto Prazo)')
    
    LvlSegCondNavioLpUlt = models.DateField(verbose_name='Data da Última LV Condição Navio(Longo Prazo)')  
    LvSegCondNavioLpProx = models.DateField(verbose_name='Data da Próxima LV Condição Navio(Longo Prazo)') 
    LvSegCondNavioLpFarol = models.CharField(max_length=3,verbose_name='Farol LV Condição Navio(Longo Prazo)') 
    
    LvSegEspConfUlt = models.DateField(verbose_name='Data da Última LV Espaço Confinado')
    LvSegEspConfProx = models.DateField(verbose_name='Data da Próxima LV Espaço Confinado')
    LvSegEspConfFarol = models.CharField(max_length=3,verbose_name='Farol LV Espaço Confinado')
    
    LvSegMovCargasUlt = models.DateField(verbose_name='Data da Última LV Movimentação de Cargas')
    LvSegMovCargasProx = models.DateField(verbose_name='Data da Próxima LV Movimentação de Cargas')
    LvSegMovCargasFarol = models.CharField(max_length=3,verbose_name='Farol LV Movimentação de Cargas') 
    
    LvSegPintQuimPerUlt = models.DateField(verbose_name='Data da Última LV Pintura e Produtos Químicos Perigosos')
    LvSegPintQuimPerProx = models.DateField(verbose_name='Data da Próxima LV Pintura e Produtos Químicos Perigosos')
    LvSegPintQuimPerFarol = models.CharField(max_length=3,verbose_name='Farol LV Pintura e Produtos Químicos Perigosos')
    
    LvSegProcVcpUlt = models.DateField(verbose_name='Data da Última LV de Processo de VCP')
    LvSegProcVcpProx = models.DateField(verbose_name='Data da Próxima LV de Processo de VCP')
    LvSegProcVcpFarol = models.CharField(max_length=3,verbose_name='Farol LV de Processo de VCP')
    
    LvlSegRespEmergUlt = models.DateField(verbose_name='Data da Última LV de Resposta a Emergência')
    LvSegRespEmergProx = models.DateField(verbose_name='Data da Próxima LV de Resposta a Emergência')
    LvSegRespEmergFarol = models.CharField(max_length=3,verbose_name='Farol LV de Resposta a Emergência')
    
    LvlSegRiscSanitUlt = models.DateField(verbose_name='Data da Última LV de Risco Sanitário')
    LvSegRiscSanitProx = models.DateField(verbose_name='Data da Próxima LV de Risco Sanitário')
    LvSegRiscSanitFarol = models.CharField(max_length=3,verbose_name='Farol LV de Risco Sanitário')
    
    LvSegTestHidrostUlt = models.DateField(verbose_name='Data da Última LV de Teste Hidrostático')
    LvSegTestHidrostProx = models.DateField(verbose_name='Data da Próxima LV de Teste Hidrostático')
    LvSegTestHidrostFarol = models.CharField(max_length=3,verbose_name='Farol LV de Teste Hidrostático')
    
    LvlSegTrabQuentUlt = models.DateField(verbose_name='Data da Última LV de Trabalho a Quente')
    LvSegTrabQuentProx = models.DateField(verbose_name='Data da Próxima LV de Trabalho a Quente')
    LvSegTrabQuentFarol = models.CharField(max_length=3,verbose_name='Farol LV de Trabalho a Quente')
    
    LvlSegTrabAltUlt = models.DateField(verbose_name='Data da Última LV de Trabalho em Altura')
    LvSegTrabAltProx = models.DateField(verbose_name='Data da Próxima LV de Trabalho em Altura')
    LvSegTrabAltFarol = models.CharField(max_length=3,verbose_name='Farol LV de Trabalho em Altura')
    
    LvlSegTrabEletrUlt = models.DateField(verbose_name='Data da Última LV de Trabalho em eletricidade')
    LvSegTrabEletrProx = models.DateField(verbose_name='Data da Próxima LV de Trabalho em eletricidade')
    LvSegTrabEletrFarol = models.CharField(max_length=3,verbose_name='Farol LV de Trabalho em eletricidade')
    
    obsLvSeg = models.TextField(max_length=300, verbose_name='Observações', blank=True)

    class Meta:
        verbose_name = 'LV de Segurança'
        verbose_name_plural = 'LVs de Segurança'
        ordering = ['idxPsLvSeg__BarcoPS','-idxPsLvSeg__numPS']  

    def __str__(self):
        return f"{self.idxPsLvSeg} - {self.idxPsLvSeg.numPS}"
    

#================================3.3 LV DE MANGUEIRAS=========================================
class lvMangueiras(models.Model):
    """Modelo Passagem de Serviço - LV de Mangueiras - SMS"""

    idxLvMangueiras = models.ForeignKey(PassServ, on_delete=models.CASCADE)
    dataUltLvMang = models.DateField(verbose_name='Data da Última LV') #unico campo editável valor do registro da PS anterior sempre carregado como default, se não houver passagem anterior , será vazio, mas para salvar é obrigatorio o preenchimento
    dataProxLvMang = models.DateField(verbose_name='Data da Próxima LV') #Campo calculado pela função save dentro dessa classe, deverá ser somente leitura  
    obsLvMang = models.TextField(max_length=500, verbose_name='Observações', blank=True)

    class Meta:
        verbose_name = 'LV de Mangueiras'
        verbose_name_plural = 'LVs de Mangueiras'
        ordering = ['idxLvMangueiras__BarcoPS','-idxLvMangueiras__numPS']  

    def __str__(self):
        return f"{self.idxLvMangueiras} - {self.idxLvMangueiras.BarcoPS}"
    
    def save(self, *args, **kwargs):
        """Calcula automaticamente a próxima LV (60 dias após a última)"""
        if self.dataUltLvMang:
            self.dataProxLvMang = self.dataUltLvMang + timedelta(days=60)
        
        super().save(*args, **kwargs)





#================================3.2 DESVIOS DE SMS===========================================


#================================3.3  LV de Mangueiras====================================


        


#================================3.4 LV de Segurança====================================

        

    
  #-==========================================================4.1 IAPO===================================================
class iapo(models.Model):
    """Modelo para cadastro de Passagem de Serviço - IAPO - Rotinas"""

    iapoConfChoices=[
                        ('sim' ,'SIM'),
                        ('nao' ,'NÃO'),
                        ('n_ap','N/A'),
                        ]

    idxIapo = models.ForeignKey(PassServ, on_delete=models.CASCADE)

    priDomIapo = models.DateField(verbose_name='IAPO Primeira Semana')
    priDomIapoOs = models.CharField(max_length=4, choices=iapoConfChoices, verbose_name='OSs para IAPO?')
    segDomIapo = models.DateField(verbose_name='IAPO Segunda Semana')
    segDomIapoOs = models.CharField(max_length=4, choices=iapoConfChoices, verbose_name='OSs para IAPO?')
    terDomIapo = models.DateField(verbose_name='IAPO Terceira Semana')  # Corrigido
    terDomIapoOsConc = models.CharField(max_length=4, choices=iapoConfChoices, verbose_name='OSs concluidas para esse envio?')
    ObservIapo = models.TextField(max_length=500, verbose_name='Observações', blank=True)

    class Meta:
        verbose_name = 'IAPO'
        ordering = ['idxIapo__BarcoPS','-idxIapo__numPS']  

    def __str__(self):
        return f"{self.idxIapo}"

    def save(self, *args, **kwargs):
        """Calcula os três domingos automaticamente"""
        if self.idxIapo and self.idxIapo.dataEmissaoPS:
            data_base = self.idxIapo.dataEmissaoPS
            
            # Achar próximo domingo
            dias_ate_domingo = (6 - data_base.weekday()) % 7
            if dias_ate_domingo == 0:  
                dias_ate_domingo = 7
            
            primeiro_domingo = data_base + timedelta(days=dias_ate_domingo)
            
            # Calcular os três domingos
            self.priDomIapo = primeiro_domingo
            self.segDomIapo = primeiro_domingo + timedelta(weeks=1)
            self.terDomIapo = primeiro_domingo + timedelta(weeks=2)

            print(f"priDomIapo: {self.priDomIapo}")
            print(f"segDomIapo: {self.segDomIapo}")
            print(f"terDomIapo: {self.terDomIapo}")
        
        super().save(*args, **kwargs)


#-===============================4.2 SMS===================================================





















