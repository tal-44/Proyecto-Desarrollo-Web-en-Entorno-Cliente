/*
 * PARTE DE IVÁN PARA EL HITO 2, uso de localStorage para gestionar el estado de autenticación y JSON dinámico.
 *
 * GESTIÓN DEL ESTADO DE AUTENTICACIÓN - Información de usuario en cabecera
 * 
 * Este script gestiona la visualización del estado de autenticación en la cabecera,
 * ejecutándose en todas las páginas principales del proyecto.
 * 
 * FUNCIONALIDAD:
 * 1. Lee el usuario actual desde localStorage['currentUser']
 * 2. Actualiza dinámicamente el elemento #user-info en la cabecera:
 *    - Si hay usuario autenticado: muestra "Hola, {username}" + enlace "Cerrar sesión"
 *    - Si no hay usuario: muestra enlaces "Iniciar sesión" y "Registrarse"
 * 3. Maneja el cierre de sesión (logout):
 *    - Elimina currentUser de localStorage
 *    - Recarga la página para actualizar la interfaz
 * 4. Adapta las rutas de los enlaces según la ubicación actual:
 *    - Si estamos en /test/ o /ramos/: usa rutas relativas (../login.html)
 *    - Si estamos en la raíz: usa rutas directas (login.html)
 * 
 * FUNCIONES GLOBALES EXPUESTAS:
 * - window.getCurrentUser(): retorna el usuario actual o null
 *   Utilizado por product.js para controlar acceso a comentarios
 * 
 * ESTRUCTURA DE DATOS EN LOCALSTORAGE:
 * - 'currentUser': { username: string, password: string } | null
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
    // Detectamos si estamos en un subdirectorio para ajustar las rutas
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/test/') || currentPath.includes('/ramos/');
    const loginPath = isInSubdirectory ? '../login.html' : 'login.html';
    const registerPath = isInSubdirectory ? '../register.html' : 'register.html';
    
    userInfoDiv.innerHTML = `
      <a href="${loginPath}" class="auth-link">Iniciar sesión</a>
      <a href="${registerPath}" class="auth-link">Registrarse</a>
    `;
  }
});

/**
 * OBTENER USUARIO ACTUAL (FUNCIÓN GLOBAL)
 * Lee el usuario autenticado desde localStorage['currentUser']
 * 
 * USO:
 * - product.js: verifica si el usuario puede comentar productos
 * - Otros scripts: pueden verificar si hay usuario autenticado
 * 
 * EJEMPLO:
 * const user = getCurrentUser();
 * if (user) {
 *   console.log('Usuario:', user.username);
 *   // Mostrar opciones solo para usuarios autenticados
 * }
 * 
 * @returns {Object|null} Objeto usuario { username, password } o null si no hay sesión
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