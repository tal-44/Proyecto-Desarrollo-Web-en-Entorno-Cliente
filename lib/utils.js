/*
 * UTILIDADES COMUNES - Funciones reutilizables en todo el proyecto
 *
 * Este archivo centraliza funciones compartidas para evitar duplicación
 * de código y facilitar el mantenimiento.
 *
 * FUNCIONES DISPONIBLES:
 * - getCurrentUser(): Obtiene el usuario autenticado desde localStorage
 * - capitalizar(texto): Capitaliza la primera letra de un texto
 * - showError(element, message): Muestra mensajes de error en formularios
 * - formatCurrency(value): Formatea números como moneda EUR
 */

/**
 * OBTENER USUARIO ACTUAL
 * Lee el usuario autenticado desde localStorage['currentUser']
 * 
 * USO:
 * - product.js: verifica si el usuario puede comentar productos
 * - history.js: filtra compras del usuario actual
 * - Otros scripts: verifican autenticación
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
    console.error('Error al parsear usuario actual:', e);
    return null;
  }
}

/**
 * CAPITALIZAR TEXTO
 * Convierte el primer carácter a mayúscula y el resto a minúscula
 * 
 * EJEMPLOS:
 * - 'VERANO' -> 'Verano'
 * - 'facil' -> 'Facil'
 * - 'primavera' -> 'Primavera'
 * 
 * @param {string} texto Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * MOSTRAR MENSAJE DE ERROR
 * Utilidad para mostrar mensajes de error en formularios de autenticación
 * y otros formularios del proyecto
 * 
 * USO:
 * - auth.js: errores de login/registro
 * - Otros formularios: validaciones generales
 * 
 * EJEMPLO:
 * const errorElement = document.getElementById('login-error');
 * showError(errorElement, 'Usuario o contraseña incorrectos');
 * 
 * @param {HTMLElement} element Elemento DOM donde mostrar el mensaje (ej: <p id="login-error">)
 * @param {string} message Texto del mensaje de error a mostrar
 */
function showError(element, message) {
  if (!element) {
    console.warn('Elemento de error no encontrado');
    return;
  }
  element.textContent = message;
  element.style.display = 'block';
}

/**
 * FORMATEAR MONEDA
 * Convierte un número a formato EUR con 2 decimales
 * 
 * EJEMPLOS:
 * - 25.5 -> "€25.50"
 * - 100 -> "€100.00"
 * - 15.999 -> "€16.00"
 * 
 * @param {number} value Valor numérico a formatear
 * @returns {string} Valor formateado como "€XX.XX"
 */
function formatCurrency(value) {
  return '€' + parseFloat(value).toFixed(2);
}

/**
 * TOGGLE DE CLASE
 * Añade o elimina una clase de un elemento según su estado actual
 * 
 * @param {HTMLElement} element Elemento DOM
 * @param {string} className Nombre de la clase a alternar
 */
function toggleClass(element, className) {
  if (!element) return;
  element.classList.toggle(className);
}

/**
 * MOSTRAR/OCULTAR ELEMENTO
 * Facilita mostrar u ocultar elementos usando la clase .hidden
 * 
 * @param {HTMLElement|string} elementOrId Elemento DOM o ID del elemento
 * @param {boolean} show true para mostrar, false para ocultar
 */
function toggleElement(elementOrId, show) {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;
  
  if (!element) return;
  
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

// Exponer funciones globalmente para que estén disponibles en todos los scripts
if (typeof window !== 'undefined') {
  window.getCurrentUser = getCurrentUser;
  window.capitalizar = capitalizar;
  window.showError = showError;
  window.formatCurrency = formatCurrency;
  window.toggleClass = toggleClass;
  window.toggleElement = toggleElement;
}
