import os
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver

#=================================TABELAS DE APOIO - MODELO MODAL BARCO==============================================#
class ModalBarco(models.Model):
    """Modelo para cadastro de Modais de barcos """
       
    # Campos
    modal = models.CharField(max_length=20,verbose_name='Modal')
    def __str__(self):
        return self.modal
    
    class Meta:
        verbose_name = 'Modal'
        verbose_name_plural = "Modais"

#==================================MODELO FISCAIS CADASTRO================================================#
class FiscaisCad(models.Model):
    """Modelo para cadastro de fiscaiss"""
      
    celular_validator = RegexValidator(
        regex=r'^\(\d{2}\)\d{4,5}-\d{4}$',
        message='Celular deve estar no formato: (99)99999-9999'
    )
    
    # Campos
    chave = models.CharField(max_length=4,verbose_name='Chave', unique=True)
    nome = models.CharField(max_length=80, verbose_name='Nome')
    email = models.EmailField(max_length=40, verbose_name='E-mail')
    celular = models.CharField(max_length=15,validators=[celular_validator],blank=True,verbose_name='Celular' )
    perfFisc = models.BooleanField(default=False, verbose_name='Perfil Fiscal?')
    perfAdm = models.BooleanField(default=False, verbose_name='Perfil ADM?')    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fiscal'
        verbose_name_plural = 'Fiscais'
        ordering = ['nome']
    
    def __str__(self):
        return self.nome

#==================================MODELO BARCOS CADASTRO================================================#
class BarcosCad(models.Model):
    """Modelo para cadastro de embarcações"""
    
    barcoTipoChoice =   [
                        ('RSV' , 'RSV'),
                        ('SDSV', 'SDSV'),
                        ('DSV' , 'DSV'),
                        ('TUP' , 'TUP'),
                                          ]
    
    celular_validator = RegexValidator(
        regex=r'^\(\d{2}\)\d{4,5}-\d{4}$',
        message='Celular deve estar no formato: (99)99999-9999'
    )
                   
    tipoBarco = models.CharField(max_length=6,choices=barcoTipoChoice, verbose_name='Tipo')
    nomeBarco = models.CharField(max_length=50, verbose_name='Nome',unique=True)
    modalSelec = models.ForeignKey(ModalBarco,on_delete=models.SET_NULL,null=True, blank=True,verbose_name='Seleciona Modal')    
    modalBarco=models.CharField(max_length=20,verbose_name='Modal')
    emailPetr = models.EmailField(max_length=40, verbose_name='E-mail Petrobras',unique=True)
    dataPrimPorto = models.DateField(verbose_name='Data Primeiro Porto')
    emprNav = models.CharField(max_length=80,verbose_name='Empresa Navegação')
    icjEmprNav = models.CharField(max_length=20,verbose_name='ICJ Empresa Navegação', unique=True)
    emprServ = models.CharField(max_length=80,verbose_name='Empresa Serviço')
    icjEmprServ = models.CharField(max_length=20,verbose_name='ICJ Empresa Serviço', unique=True)
    emailFiscContr=models.EmailField(max_length=40, verbose_name='E-mail Fiscal-Contratada',unique=True)
    gerOper = models.CharField(max_length=25,verbose_name='Gerência Operacional')
    emailCiop = models.EmailField(max_length=40, verbose_name='E-mail Controle CIOp',unique=True)
    chaveAto = models.CharField(max_length=4,verbose_name='Chave ATO', unique=True)
    nomeAto = models.CharField(max_length=25,verbose_name='Nome ATO do barco')
    emailAto = models.EmailField(max_length=40, verbose_name='E-mail ATO',unique=True)
    contAto = models.CharField(max_length=15,validators=[celular_validator],blank=True,verbose_name='Celular ATO' )
    chaveSto = models.CharField(max_length=4,verbose_name='Chave STO do Barco', unique=True)
    nomeSto = models.CharField(max_length=25,verbose_name='Nome STO do barco')
    emailSto = models.EmailField(max_length=40, verbose_name='E-mail STO',unique=True)
    contSto = models.CharField(max_length=15,validators=[celular_validator],blank=True,verbose_name='Celular STO' )
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Barco'
        verbose_name_plural = 'Barcos'
        ordering = ['nomeBarco']
    
    def __str__(self):
        return f"{self.tipoBarco} - {self.nomeBarco}"
    
    def save(self, *args, **kwargs):
        # COPIA o nome da categoria selecionada
        if self.modalSelec:
            self.modalBarco = self.modalSelec.modal

        super().save(*args, **kwargs)
    
#==================================SUBTABELA CADASTRO BARCOS TELEFONES===============#
