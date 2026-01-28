/*
 * PARTE DE IVÁN PARA EL HITO 2
 *
 * AUTENTICACIÓN DE USUARIOS - Gestión de registro e inicio de sesión
 * 
 * Este script implementa un sistema completo de autenticación que:
 * - Maneja el registro de nuevos usuarios
 * - Gestiona el inicio de sesión (login) de usuarios existentes
 * - Valida credenciales contra la lista de usuarios registrados
 * - Almacena usuarios en localStorage bajo la clave 'users' (array de usuarios)
 * - Persiste el usuario actualmente autenticado bajo 'currentUser' en localStorage
 * - Se ejecuta solo en las páginas login.html y register.html
 * 
 * FLUJO DE USUARIO:
 * REGISTRO:
 *   1. Usuario completa formulario con nombre de usuario y contraseña
 *   2. Validación: min 3 caracteres usuario, min 4 caracteres contraseña, coincidencia
 *   3. Se verifica que el usuario no esté ya registrado
 *   4. Se guarda el nuevo usuario en localStorage['users']
 *   5. Se establece como usuario actual en localStorage['currentUser']
 *   6. Se redirige a index.html
 * 
 * LOGIN:
 *   1. Usuario completa formulario con credenciales
 *   2. Se busca el usuario en localStorage['users']
 *   3. Se valida que la contraseña coincida
 *   4. Se establece como usuario actual en localStorage['currentUser']
 *   5. Se redirige a index.html
 *
 * ESTRUCTURA DE DATOS EN LOCALSTORAGE:
 * - 'users': [{ username: string, password: string }, ...]
 * - 'currentUser': { username: string, password: string } | null
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
 * CARGAR LISTA DE USUARIOS DESDE LOCALSTORAGE
 * Lee el array de usuarios registrados desde localStorage['users']
 * - Si localStorage['users'] no existe o está vacío, retorna array vacío
 * - Si hay error al parsear JSON, captura la excepción y retorna array vacío
 * 
 * NOTA: Esta función no valida la estructura de los datos, solo los carga
 * 
 * @returns {Array} Array de objetos usuario con estructura { username, password }
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
 * GUARDAR LISTA DE USUARIOS EN LOCALSTORAGE
 * Persiste el array completo de usuarios en localStorage['users']
 * - Serializa el array a JSON string
 * - Sobrescribe cualquier dato anterior en esa clave
 * - Se llama cada vez que se registra un nuevo usuario
 * 
 * @param {Array} users Array de objetos usuario { username, password }
 */
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

/**
 * PROCESAR FORMULARIO DE REGISTRO
 * Maneja la lógica completa del registro de un nuevo usuario
 * 
 * VALIDACIONES:
 * 1. Username: mínimo 3 caracteres
 * 2. Password: mínimo 4 caracteres
 * 3. Confirmación: las dos contraseñas deben coincidir
 * 4. Unicidad: el username no puede estar ya registrado (case-insensitive)
 * 
 * PROCESO SI VALIDACIONES PASAN:
 * 1. Carga usuarios actuales desde localStorage['users']
 * 2. Añade el nuevo usuario al array
 * 3. Guarda el array actualizado en localStorage
 * 4. Establece el nuevo usuario como currentUser en localStorage
 * 5. Limpia los campos del formulario
 * 6. Redirige a index.html
 * 
 * EN CASO DE ERROR:
 * - Muestra mensaje de error en el elemento #register-error
 * - NO envía el formulario ni guarda datos
 * 
 * @param {Event} e Evento de envío del formulario (submit)
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
  const exists = users.some(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
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
  window.location.href = '../index.html';
}

/**
 * PROCESAR FORMULARIO DE INICIO DE SESIÓN (LOGIN)
 * Autentica un usuario verificando sus credenciales contra localStorage['users']
 * 
 * PROCESO:
 * 1. Valida que usuario y contraseña no estén vacíos
 * 2. Carga la lista de usuarios registrados desde localStorage
 * 3. Busca el usuario por nombre (case-insensitive)
 * 4. Si no existe: muestra error "El usuario no existe"
 * 5. Si existe: compara la contraseña (case-sensitive)
 *    - Si no coincide: muestra error "Contraseña incorrecta"
 *    - Si coincide: establece como currentUser y redirige a index.html
 * 
 * PERSISTENCIA:
 * - El usuario autenticado se guarda en localStorage['currentUser']
 * - Esto permite que user.js acceda a la información del usuario en otras páginas
 * 
 * ERRORES:
 * - Se muestran en elemento #login-error
 * - No se redirige si hay error
 * 
 * @param {Event} e Evento de envío del formulario (submit)
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
  const user = users.find(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
  
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
  window.location.href = '../index.html';
}

/**
 * MOSTRAR MENSAJE DE ERROR
 * Utilidad para mostrar mensajes de error en los formularios de autenticación
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
  console.log('Error mostrado:', message);
}