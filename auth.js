/*
 * auth.js
 *
 * Este script maneja el registro e inicio de sesión de usuarios en el
 * proyecto. Utiliza localStorage para persistir la lista de usuarios
 * registrados y el usuario actualmente autenticado. Contiene funciones
 * auxiliares para cargar/guardar usuarios y para procesar los formularios
 * de registro e inicio de sesión.
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

/**
 * Carga la lista de usuarios desde localStorage. Si no existe, devuelve
 * un array vacío.
 * @returns {Array} Lista de usuarios almacenados
 */
function loadUsers() {
  const data = localStorage.getItem('users');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error al parsear usuarios:', e);
    return [];
  }
}

/**
 * Guarda la lista de usuarios en localStorage.
 * @param {Array} users Lista de usuarios a persistir
 */
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

/**
 * Maneja el envío del formulario de registro. Valida la entrada,
 * comprueba si el usuario ya existe y, si todo es correcto, almacena
 * el nuevo usuario y lo establece como usuario actual.
 * @param {Event} e Evento de envío de formulario
 */
function handleRegister(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('reg-username');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm');
  const errorP = document.getElementById('register-error');
  
  // Limpiar mensaje de error anterior
  if (errorP) {
    errorP.textContent = '';
    errorP.style.display = 'none';
  }
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  
  // Validaciones básicas
  if (username.length < 3) {
    showError(errorP, 'El nombre de usuario debe tener al menos 3 caracteres.');
    return;
  }
  if (password.length < 4) {
    showError(errorP, 'La contraseña debe tener al menos 4 caracteres.');
    return;
  }
  if (password !== confirm) {
    showError(errorP, 'Las contraseñas no coinciden.');
    return;
  }
  const users = loadUsers();
  // Comprobamos si el usuario ya existe (insensible a mayúsculas/minúsculas)
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    showError(errorP, 'El nombre de usuario ya está registrado.');
    return;
  }
  // Creamos el nuevo usuario y lo añadimos a la lista
  const newUser = { username, password };
  users.push(newUser);
  saveUsers(users);
  console.log('Nuevo usuario registrado:', username);
  // Establecemos al nuevo usuario como el usuario actual
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  // Limpiamos los campos del formulario
  usernameInput.value = '';
  passwordInput.value = '';
  confirmInput.value = '';
  // Redirigimos al catálogo o mostramos mensaje de éxito
  window.location.href = 'index.html';
}

/**
 * Maneja el envío del formulario de inicio de sesión. Comprueba las
 * credenciales introducidas contra la lista de usuarios y, si son
 * correctas, establece el usuario actual en localStorage.
 * @param {Event} e Evento de envío de formulario
 */
function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const errorP = document.getElementById('login-error');
  
  // Limpiar mensaje de error anterior
  if (errorP) {
    errorP.textContent = '';
    errorP.style.display = 'none';
  }
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  // Validar que los campos no estén vacíos
  if (!username || !password) {
    showError(errorP, 'Por favor, completa todos los campos.');
    return;
  }
  
  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    showError(errorP, 'El usuario no existe. Por favor, regístrate primero.');
    console.log('Usuario no encontrado:', username);
    return;
  }
  if (user.password !== password) {
    showError(errorP, 'Contraseña incorrecta.');
    console.log('Contraseña incorrecta para usuario:', username);
    return;
  }
  // Credenciales correctas: almacenamos el usuario actual
  localStorage.setItem('currentUser', JSON.stringify(user));
  console.log('Login exitoso para usuario:', username);
  // Limpiamos los campos
  usernameInput.value = '';
  passwordInput.value = '';
  // Redirigimos al catálogo
  window.location.href = 'index.html';
}

/**
 * Muestra un mensaje de error en el elemento indicado y lo hace visible.
 * @param {HTMLElement} element Elemento donde mostrar el mensaje
 * @param {string} message Texto del error
 */
function showError(element, message) {
  if (!element) {
    console.warn('Elemento de error no encontrado');
    return;
  }
  element.textContent = message;
  element.style.display = 'block';
  console.log('Error mostrado:', message);
}