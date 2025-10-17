import os
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.signals import post_delete
from django.dispatch import receiver


#===========MODELO DE CADASTRO DE INFORME DE ANOMALIA======================