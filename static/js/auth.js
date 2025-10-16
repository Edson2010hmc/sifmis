// ===== MÓDULO DE AUTENTICAÇÃO =====

const AuthModule = (() => {
  const API_URL = '/api/validar-usuario/';
  let usuarioLogado = null;

  // ===== CAPTURAR USERNAME DO WINDOWS =====
  async function getWindowsUsername() {
    try {
      const response = await fetch('/api/get-current-user/');
      const result = await response.json();
      
      if (result.success && result.username) {
        return result.username;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // ===== VALIDAR USUÁRIO =====
  async function validarUsuario() {
    const username = await getWindowsUsername();
    
    if (!username) {
      mostrarErroAcesso('USUÁRIO NÃO AUTORIZADO');
      return false;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const result = await response.json();

      if (!result.success || !result.authorized) {
        mostrarErroAcesso(result.message || 'Usuário não autorizado');
        return false;
      }

      // Usuário autorizado
      usuarioLogado = result.data;
      mostrarInterface();
      atualizarHeaderUsuario();
      return true;

    } catch (error) {
      mostrarErroAcesso('Erro ao validar usuário: ' + error.message);
      return false;
    }
  }

  // ===== MOSTRAR ERRO DE ACESSO =====
  function mostrarErroAcesso(mensagem) {
    // Esconde toda a interface
    document.querySelector('.app-header').style.display = 'none';
    document.querySelector('.topnav').style.display = 'none';
    document.querySelector('main').style.display = 'none';

    // Cria tela de erro
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f8fbfa;
      padding: 20px;
      text-align: center;
    `;
    
    errorDiv.innerHTML = `
      <div style="max-width: 500px; background: white; padding: 40px; border-radius: 10px; border: 2px solid #dc2626;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">Acesso Negado</h1>
        <p style="font-size: 16px; color: #666; margin-bottom: 30px;">${mensagem}</p>
        <p style="font-size: 14px; color: #999;">Entre em contato com o administrador do sistema.</p>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  // ===== MOSTRAR INTERFACE =====
  function mostrarInterface() {
    document.querySelector('.app-header').style.display = 'flex';
    document.querySelector('.topnav').style.display = 'flex';
    document.querySelector('main').style.display = 'block';
  }

  // ===== ATUALIZAR HEADER COM DADOS DO USUÁRIO =====
  function atualizarHeaderUsuario() {
    if (!usuarioLogado) return;

    const userName = document.getElementById('userName');
    const userProfile = document.getElementById('userProfile');

    if (userName) {
      userName.textContent = usuarioLogado.nome;
    }

    if (userProfile && usuarioLogado.perfAdm) {
      userProfile.style.display = 'inline-block';
    }
  }

  // ===== OBTER USUÁRIO LOGADO =====
  function getUsuarioLogado() {
    return usuarioLogado;
  }

  // ===== EXPORTAR FUNÇÕES PÚBLICAS =====
  return {
    validarUsuario,
    getUsuarioLogado
  };
})();