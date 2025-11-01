# fiscweb/models_invmat.py
# Modelos para Inventário de Materiais

from django.db import models
from .models_cad import BarcosCad


#================================ MODELO PRINCIPAL - MATERIAL EMBARQUE ================================================
class materialEmb(models.Model):
    """Modelo de Tabela de Programação de Embarque de Materiais"""
    
    RESPONSAVEL_CHOICES = [
        ('CRD', 'CRD'),
        ('MIS', 'MIS'),
        ('CENPES', 'CENPES'),
        ('EQSE', 'EQSE'),
        ('ISBM', 'ISBM'),
        ('ANC', 'ANC'),
        ('OUTRO', 'Outro'),
    ]
    
    CONTENTOR_BORDO_CHOICES = [
        ('SIM', 'SIM'),
        ('NÃO', 'NÃO'),
        ('N/A', 'N/A'),
    ]
    
    RESPONSAVEL_CONTENTOR_CHOICES = [
        ('CRD', 'CRD'),
        ('LOEP', 'LOEP'),
    ]
    
    STATUS_CHOICES = [
        ('', ''),
        ('EMBARQUE PROGRAMADO', 'EMBARQUE PROGRAMADO'),
        ('MATERIAL A BORDO', 'MATERIAL A BORDO'),
        ('EMBARQUE NÃO CONCLUIDO', 'EMBARQUE NÃO CONCLUIDO'),
        ('APLICADO NA OPERAÇÃO', 'APLICADO NA OPERAÇÃO'),
        ('RELACIONADO PARA DESEMBARQUE', 'RELACIONADO PARA DESEMBARQUE'),
        ('DESEMBARQUE SOLICITADO', 'DESEMBARQUE SOLICITADO'),
        ('DESEMBARQUE PROGRAMADO', 'DESEMBARQUE PROGRAMADO'),
        ('DESEMBARQUE NÃO CONCLUIDO', 'DESEMBARQUE NÃO CONCLUIDO'),
    ]
    
    # Campos
    barcoMatEmb = models.ForeignKey(BarcosCad, on_delete=models.PROTECT, verbose_name='Embarcação')
    descMatEmb = models.CharField(max_length=40, verbose_name='Descrição do Material')
    identMatEmb = models.CharField(max_length=15, verbose_name='Identificação/N.Série', blank=True, null=True)
    pesoMatEmb = models.IntegerField(verbose_name='Peso (kg)', blank=True, null=True)
    alturaMatEmb = models.DecimalField(max_digits=3, decimal_places=2, verbose_name='Altura (m)', blank=True, null=True)
    larguraMatEmb = models.DecimalField(max_digits=3, decimal_places=2, verbose_name='Largura (m)', blank=True, null=True)
    comprimentoMatEmb = models.DecimalField(max_digits=3, decimal_places=2, verbose_name='Comprimento (m)', blank=True, null=True)
    respEmbMat = models.CharField(max_length=8, choices=RESPONSAVEL_CHOICES, verbose_name='Responsável pelo Material', blank=True, null=True)
    outRespEmbMat = models.CharField(max_length=20, verbose_name='Outro Responsável', blank=True, null=True)
    contBordoEmbMat = models.CharField(max_length=4, choices=CONTENTOR_BORDO_CHOICES, verbose_name='Material em contentor que ficará a bordo?')
    descContMatEmb = models.CharField(max_length=30, verbose_name='Descrição do contentor', blank=True, null=True)
    idContMatEmb = models.CharField(max_length=20, verbose_name='Identificação do Contentor', blank=True, null=True)
    respContMatEmb = models.CharField(max_length=6, choices=RESPONSAVEL_CONTENTOR_CHOICES, verbose_name='Responsável pelo Contentor', blank=True, null=True)
    certContMatEmb = models.CharField(max_length=12, verbose_name='Numero do Certificado do Contentor', blank=True, null=True)
    valContMatEmb = models.DateField(verbose_name='Validade do Certificado do Contentor', blank=True, null=True)
    obsMatEmb = models.TextField(max_length=500, verbose_name='Observações', blank=True, null=True)
    statusProgMatEmb = models.CharField(max_length=30, choices=STATUS_CHOICES, verbose_name='Status do Material', default='', blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Material - Programação de Embarque'
        verbose_name_plural = 'Materiais - Programação de Embarque'
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"{self.barcoMatEmb.nomeBarco} - {self.descMatEmb}"


#================================ SUBTABELA - EMBARQUE DE MATERIAIS ================================================
class subMatEmb(models.Model):
    """Modelo de subtabela para embarque de materiais"""
    
    MEIO_RECEBIMENTO_CHOICES = [
        ('PORTO', 'PORTO'),
        ('TRANSBORDO UEP', 'TRANSBORDO UEP'),
        ('TRANSBORDO BARCO', 'TRANSBORDO BARCO'),
        ('RETIRADO DE OS', 'RETIRADO DE OS'),
    ]
    
    # ForeignKey para tabela principal
    idxMatEmb = models.ForeignKey(materialEmb, on_delete=models.CASCADE, related_name='embarques')
    dataPrevEmbMat = models.DateField(verbose_name='Data Prevista para embarque')
    numRtMatEmb = models.CharField(max_length=12, verbose_name='Numero da RT de Embarque', blank=True, null=True)
    numNotaFiscMatEmb = models.CharField(max_length=12, verbose_name='Numero da Nota Fiscal', blank=True, null=True)
    meioRecEmbMat = models.CharField(max_length=20, choices=MEIO_RECEBIMENTO_CHOICES, verbose_name='Meio de recebimento', blank=True, null=True)
    uepRecMatEmb = models.CharField(max_length=20, verbose_name='UEP transbordo', blank=True, null=True)
    misBarcoFlag = models.BooleanField(default=True, verbose_name='Barco MIS?')
    misBarcoRecMatEmb = models.CharField(max_length=30, verbose_name='Barco MIS transbordo', blank=True, null=True)
    barcoRecMatEmb = models.CharField(max_length=30, verbose_name='Barco Não MIS Transbordo', blank=True, null=True)
    osEmbMat = models.CharField(max_length=15, verbose_name='Ordem de Serviço', blank=True, null=True)
    statusRegEmb = models.CharField(max_length=30, verbose_name='Status do registro', default='', blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Subtabela - Embarque Material'
        verbose_name_plural = 'Subtabelas - Embarque Materiais'
        ordering = ['-dataPrevEmbMat']
    
    def __str__(self):
        return f"Embarque - {self.idxMatEmb.descMatEmb} - {self.dataPrevEmbMat}"


#================================ SUBTABELA - DESEMBARQUE DE MATERIAIS ================================================
class subMatDesemb(models.Model):
    """Modelo de subtabela para desembarque de materiais"""
    
    MEIO_ENVIO_CHOICES = [
        ('PORTO', 'PORTO'),
        ('TRANSBORDO UEP', 'TRANSBORDO UEP'),
        ('TRANSBORDO BARCO', 'TRANSBORDO BARCO'),
        ('APLICADO A OS', 'APLICADO A OS'),
    ]
    
    # ForeignKey para tabela principal
    idxMatDesemb = models.ForeignKey(materialEmb, on_delete=models.CASCADE, related_name='desembarques')
    dataPrevDesmbMat = models.DateField(verbose_name='Data Prevista para Desembarque')
    meioEnvDesmbMat = models.CharField(max_length=20, choices=MEIO_ENVIO_CHOICES, verbose_name='Meio de Envio', blank=True, null=True)
    uepDesembMatEmb = models.CharField(max_length=20, verbose_name='UEP transbordo', blank=True, null=True)
    misBarcoFlagDesemb = models.BooleanField(default=True, verbose_name='Barco MIS?')
    misBarcoDesembMatEmb = models.CharField(max_length=30, verbose_name='Barco MIS transbordo', blank=True, null=True)
    barcoDesembMatEmb = models.CharField(max_length=30, verbose_name='Barco Não MIS Transbordo', blank=True, null=True)
    osRecDesembMat = models.CharField(max_length=15, verbose_name='Ordem de serviço', blank=True, null=True)
    numRtMatDesemb = models.CharField(max_length=12, verbose_name='Numero da RT de Desembarque', blank=True, null=True)
    numNotaFiscMatDesemb = models.CharField(max_length=12, verbose_name='Numero da Nota Fiscal', blank=True, null=True)
    statusRegDesemb = models.CharField(max_length=30, verbose_name='Status do registro', default='', blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Subtabela - Desembarque Material'
        verbose_name_plural = 'Subtabelas - Desembarque Materiais'
        ordering = ['-dataPrevDesmbMat']
    
    def __str__(self):
        return f"Desembarque - {self.idxMatDesemb.descMatEmb} - {self.dataPrevDesmbMat}"