import os
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver

#==================================MODELO CONTENTORES E CESTAS DE MATERIAIS================================================#
class contentoresCestasMateriais(models.Model):
    """Contentores e Cestas a bordo"""
    
    RESPONSAVEL_CHOICES = [
        ('CRD', 'CRD'),
        ('MIS', 'MIS'),
        ('EQSE', 'EQSE'),
        ('ISBM', 'ISBM'),
        ('ANC', 'ANC'),
        ('OUTROS', 'Outros'),
    ]
    
    # Campos
    descContCesta = models.CharField(max_length=50, verbose_name='Descrição do Contentor/Cesta')
    identContCesta = models.CharField(max_length=20, verbose_name='Identificação do Contentor/Cesta', unique=True)
    dataEmbContCesta = models.DateField(verbose_name='Data de Embarque')
    reqTranspContCesta = models.CharField(max_length=12, verbose_name='Número de Requisição de Transporte')
    respContCesta = models.CharField(max_length=10, choices=RESPONSAVEL_CHOICES, verbose_name='Responsável')
    outRespContCesta = models.CharField(max_length=40, verbose_name='Outro Responsável', blank=True, null=True)
    numCertContCesta = models.CharField(max_length=20, verbose_name='Número do Certificado')
    valCertContCesta = models.DateField(verbose_name='Validade do Certificado')
    barcoCertContCesta = models.ForeignKey('BarcosCad',on_delete=models.PROTECT,verbose_name='Embarcação')
    altCertContCesta = models.DecimalField(max_digits=6,decimal_places=2,null=True,blank=True,verbose_name='Altura (m)')
    largCertContCesta = models.DecimalField(max_digits=6,decimal_places=2,null=True,blank=True,verbose_name='Largura (m)')
    comprCertContCesta = models.DecimalField(max_digits=6,decimal_places=2,null=True,blank=True,verbose_name='Comprimento (m)')
    pesoCertContCesta = models.DecimalField(max_digits=6,decimal_places=2,null=True,blank=True,verbose_name='Peso (kg)')
    solicDesembContCesta = models.BooleanField(default=False,verbose_name='Solicitar Desembarque' ) 
    dataDesembContCesta = models.DateField(verbose_name='Data de Desembarquem')
    DesembContCesta = models.BooleanField(default=False,verbose_name='A bordo?' )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Contentor/Cesta Material'
        verbose_name_plural = 'Contentores/Cestas Materiais'
        ordering = ['descContCesta']
    
    def __str__(self):
        return f"{self.descContCesta} - {self.identContCesta}"
    

#==================================MODELO MATERIAIS A BORDO================================================#
class matBordo(models.Model):
    """Materiais a bordo"""
    
    ORIGEM_CHOICES = [
        ('ORDEM_SERVICO', 'Ordem de Serviço'),
        ('UEP', 'UEP'),
        ('BARCO', 'Barco'),
        ('PORTO', 'Porto'),
        ('OUTROS', 'Outros'),
    ]
    
    RESPONSAVEL_CHOICES = [
        ('CRD', 'CRD'),
        ('MIS', 'MIS'),
        ('EQSE', 'EQSE'),
        ('ISBM', 'ISBM'),
        ('ANC', 'ANC'),
        ('OUTROS', 'Outros'),
    ]
    
    # Campos
    descMat = models.ForeignKey('fiscweb.materiaisOperacao', on_delete=models.PROTECT, verbose_name='Descrição Material')
    numSerIden = models.CharField(max_length=30, verbose_name='Número Série/Identificação')
    dataReceb = models.DateField(verbose_name='Data do Recebimento')
    origMat = models.CharField(max_length=15, choices=ORIGEM_CHOICES, verbose_name='Origem do Material')
    outOrigMat = models.CharField(max_length=40, verbose_name='Outra Origem', blank=True, null=True)
    respMat = models.CharField(max_length=10, choices=RESPONSAVEL_CHOICES, verbose_name='Responsável')
    outRespMat = models.CharField(max_length=40, verbose_name='Outro Responsável', blank=True, null=True)
    osAplicMat = models.CharField(max_length=13, verbose_name='Ordem de Serviço de Aplicação')
    numReqTranspMat = models.CharField(max_length=12, verbose_name='Número da Requisição de Transporte', blank=True, null=True)
    contCestaMat = models.BooleanField(default=False, verbose_name='Está em Contentor/Cesta?')
    
    # Campos relacionados ao contentor/cesta (visíveis se contCestaMat=True)
    descContCestaMat = models.ForeignKey(contentoresCestasMateriais, on_delete=models.SET_NULL, null=True, blank=True, 
                                         related_name='desc_contentor', verbose_name='Descrição do Contentor/Cesta')
    identContCestaMat = models.CharField(max_length=20, verbose_name='Identificação do Contentor/Cesta', blank=True, null=True)
    numCertContCestaMat = models.CharField(max_length=20, verbose_name='Número do Certificado Contentor/Cesta', blank=True, null=True)
    valCertContCestaMat = models.DateField(verbose_name='Validade do Certificado Contentor/Cesta', null=True, blank=True)
    
    obsMat = models.TextField(max_length=400, verbose_name='Observações', blank=True, null=True)
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Material a Bordo'
        verbose_name_plural = 'Materiais a Bordo'
        ordering = ['-dataReceb']
    
    def __str__(self):
        return f"{self.descMat} - {self.numSerIden}"
    


