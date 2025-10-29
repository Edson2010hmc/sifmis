# fiscweb/migrations/0014_informeanomalia_fiscalcriador.py
# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('fiscweb', '0013_contentorescestasmateriais_materiaisoperacao_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='informeanomalia',
            name='fiscalCriador',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to='fiscweb.fiscaiscad',
                verbose_name='Fiscal Criador'
            ),
        ),
    ]