// ===== PÁGINA PRINCIPAL - Autenticação =====

(async function() {
  'use strict';
  
  if (typeof AuthModule !== 'undefined' && AuthModule.validarUsuario) {
    const autorizado = await AuthModule.validarUsuario();
    if (!autorizado) return;
  }
})();