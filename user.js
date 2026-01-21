/*
 * user.js
 *
 * Este script gestiona el estado de autenticación del usuario en el lado
 * cliente. Lee y escribe en localStorage para almacenar la lista de
 * usuarios registrados y el usuario actualmente autenticado. Su función
 * principal es actualizar la interfaz de usuario (cabecera) con enlaces
 * apropiados: mostrar enlaces de inicio de sesión y registro cuando nadie
 * ha iniciado sesión, o el nombre del usuario junto con un enlace de
 * cierre de sesión cuando hay un usuario activo. También expone una
 * función para recuperar la información del usuario actual.
 */

document.addEventListener('DOMContentLoaded', () => {
  const userInfoDiv = document.getElementById('user-info');
  if (!userInfoDiv) return;
  // Intenta recuperar el usuario actual desde localStorage
  const userData = localStorage.getItem('currentUser');
  let currentUser = null;
  try {
    currentUser = userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('No se pudo parsear currentUser:', e);
    currentUser = null;
  }
  // Función para cerrar sesión: elimina el usuario actual y recarga la página
  function cerrarSesion() {
    localStorage.removeItem('currentUser');
    // También podemos borrar preferencias u otros datos del usuario si existiesen
    location.reload();
  }
  // Si hay un usuario logueado, mostramos su nombre y el enlace de salir
  if (currentUser && currentUser.username) {
    userInfoDiv.innerHTML = `
      <span class="user-name">Hola, ${currentUser.username}</span>
      <a href="#" id="logout-link">Cerrar sesión</a>
    `;
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarSesion();
      });
    }
  } else {
    // Si no hay usuario, mostramos enlaces de iniciar sesión y registrarse
    userInfoDiv.innerHTML = `
      <a href="login.html" class="auth-link">Iniciar sesión</a>
      <a href="register.html" class="auth-link">Registrarse</a>
    `;
  }
});

/**
 * Devuelve el usuario actualmente autenticado o null si no hay ninguno.
 * Esta función puede ser utilizada por otros scripts para comprobar
 * permisos (por ejemplo, habilitar el área de comentarios sólo para
 * usuarios registrados).
 * @returns {Object|null} El objeto de usuario con al menos la propiedad username
 */
function getCurrentUser() {
  const data = localStorage.getItem('currentUser');
  try {
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Exponemos la función a nivel global para que pueda ser utilizada desde
// otros módulos sin necesidad de volver a implementarla.
window.getCurrentUser = getCurrentUser;