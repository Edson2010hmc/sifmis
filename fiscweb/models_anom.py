# fiscweb/models_anom.py
# Modelos para Informe de Anomalia

from django.core.validators import MinLengthValidator
import os
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver

class InformeAnomalia(models.Model):
    """Modelo para Informe de Anomalia"""
    
    TIPO_CHOICES = [
        ('', '— selecione —'),
        ('DESVIO', 'Desvio'),
        ('NAO_CONFORMIDADE', 'Não Conformidade'),
        ('INCIDENTE_ALTO_POTENCIAL', 'Incidente Alto Potencial'),
        ('ACIDENTE', 'Acidente'),
    ]
    
    MUNICIPIO_CHOICES = [
        ('RIO_DE_JANEIRO_RJ', 'Rio de Janeiro – RJ'),
        ('MACAE_RJ', 'Macaé – RJ'),
        ('SAO_JOAO_DA_BARRA_RJ', 'S. João da Barra – RJ'),
        ('VITORIA_ES', 'Vitória – ES'),
        ('BACIA_CAMPOS_OFFSHORE', 'Bacia de Campos – Offshore'),
        ('BACIA_SANTOS_OFFSHORE', 'Bacia de Santos – Offshore'),
        ('OUTRO', 'Outro'),
    ]
    
    RELACAO_CHOICES = [
        ('PESSOAS', 'Pessoas'),
        ('EMBARCACAO', 'Embarcação'),
        ('OPERACAO', 'Operação'),
    ]
    
    SIMNAO_CHOICES = [
        ('SIM', 'Sim'),
        ('NAO', 'Não'),
    ]
    
    # Campos principais
    tipo = models.CharField( max_length=30, choices=TIPO_CHOICES,verbose_name='Tipo',blank=True
    )
    
    siteInstalacao = models.CharField(max_length=100,verbose_name='Site/Instalação', help_text='Formato: [tipo] [Nome da embarcação]' )
    empresa = models.CharField(max_length=100,verbose_name='Empresa' )
    subcontratada = models.CharField(max_length=50,verbose_name='Subcontratada',blank=True,null=True )
    subcontratadaNaoAplicavel = models.BooleanField(default=False,verbose_name='Subcontratada Não Aplicável' )
    dataEvento = models.DateField(verbose_name='Data do Evento' )
    horarioEvento = models.TimeField(verbose_name='Horário do Evento' )
    municipioUF = models.CharField(max_length=30,choices=MUNICIPIO_CHOICES,verbose_name='Município/UF' )
    municipioOutro = models.CharField(max_length=50,verbose_name='Outro Município',blank=True, null=True)
    descricao = models.TextField(max_length=2000,verbose_name='Descrição')
    relacaoEvento = models.CharField(max_length=15,choices=RELACAO_CHOICES,verbose_name='Relação do Evento')
    acoesAdotadas = models.TextField(max_length=2000,verbose_name='Ações Adotadas')
    ordemServico1 = models.CharField(max_length=13,verbose_name='Ordem de Serviço 1',blank=True )
    ordemServico2 = models.CharField(max_length=50,verbose_name='Ordem de Serviço 2',blank=True )
    operacaoParalisada = models.CharField(max_length=3,choices=SIMNAO_CHOICES,verbose_name='Operação/Instalação Paralisada?')
     # Campos específicos para Embarcação
    sistemaDegradado = models.CharField(max_length=3,verbose_name='Embarcação operou com sistema degradado?',blank=True,null=True)
    embarcacaoDerivou = models.CharField(max_length=3,verbose_name='Embarcação derivou?',blank=True,null=True)
    embarcacaoPerdeuPosicao = models.CharField(max_length=3,verbose_name='Embarcação perdeu posição?',blank=True,null=True )
    informacoesComplementares = models.TextField(max_length=2000,verbose_name='Informações Complementares',blank=True)
        
    # Metadados
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Informe de Anomalia'
        verbose_name_plural = 'Informes de Anomalia'
        ordering = ['-dataEvento', '-horarioEvento']
    
    def __str__(self):
        return f"Anomalia {self.id} - {self.siteInstalacao} - {self.dataEvento}"

#=================================SUBTABELA INFORME - PESSOAS==================================
class SubTabPessoasAnomalia(models.Model):
    """Subtabela para pessoas envolvidas na anomalia"""
    
    SIMNAO_CHOICES = [
        ('SIM', 'Sim'),
        ('NAO', 'Não'),
    ]
    
    # Relacionamento com tabela principal
    idxAnomalia = models.ForeignKey(InformeAnomalia,on_delete=models.CASCADE,related_name='pessoas',verbose_name='Informe de Anomalia Pessoas')
    nome = models.CharField(max_length=50,verbose_name='Nome')
    idade = models.CharField(max_length=4,verbose_name='Idade')
    funcao = models.CharField(max_length=30,verbose_name='Função')
    tempoExpFuncao = models.CharField(max_length=15,verbose_name='Tempo de experiência na função')
    tempoExpEmpresa = models.CharField(max_length=15,verbose_name='Tempo de experiência na empresa')
    duracaoUltimaFolga = models.CharField(max_length=12,verbose_name='Duração da última folga')
    necessarioDesembarque = models.CharField(max_length=3,choices=SIMNAO_CHOICES,verbose_name='Necessário Desembarque?')
    resgateAeromedico = models.CharField(max_length=3,choices=SIMNAO_CHOICES,verbose_name='Resgate Aeromédico?')
    situacaoAtual = models.TextField(max_length=500,verbose_name='Situação Atual (estado de saúde)')
    
    class Meta:
        verbose_name = 'Pessoa Envolvida'
        verbose_name_plural = 'Pessoas Envolvidas'
    
    def __str__(self):
        return f"{self.nome} - {self.funcao}"