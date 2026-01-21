/**
 * test-dark.js
 * Gestiona el toggle del modo oscuro en la página de Test
 * Implementa persistencia en localStorage para recordar la preferencia del usuario
 * 
 * Este archivo es similar a ramos-dark.js para mantener consistencia
 * en todo el proyecto. Usa la misma clave de localStorage para que
 * el modo oscuro sea consistente entre todas las páginas.
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const body = document.body;
  
  // Usamos la misma clave que ramos-dark.js para consistencia global
  const DARK_MODE_KEY = 'dark-mode';
  
  /**
   * Inicializa el estado del modo oscuro
   * Si existe una preferencia guardada en localStorage, la aplica
   * Si no, usa la preferencia del sistema operativo
   */
  const initDarkMode = () => {
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    
    if (savedDarkMode !== null) {
      // Hay una preferencia guardada
      const isDarkMode = JSON.parse(savedDarkMode);
      setDarkMode(isDarkMode);
    } else {
      // No hay preferencia, usar la del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  };
  
  /**
   * Establece el estado del modo oscuro
   * @param {boolean} isDark - true para activar modo oscuro
   */
  const setDarkMode = (isDark) => {
    if (isDark) {
      body.classList.add('dark-mode');
      if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = 'Modo Claro';
      }
    } else {
      body.classList.remove('dark-mode');
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = 'Modo Oscuro';
      }
    }
    // Guardar preferencia en localStorage
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
  };
  
  /**
   * Alterna el modo oscuro
   * Invierte el estado actual
   */
  const toggleDarkMode = () => {
    const isDarkMode = body.classList.contains('dark-mode');
    setDarkMode(!isDarkMode);
  };
  
  // Event listener para el botón de toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDarkMode);
  }
  
  // Escuchar cambios en la preferencia del sistema operativo
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Solo aplicar si el usuario no ha establecido una preferencia manual
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      setDarkMode(e.matches);
    }
  });

  // Inicializar el modo oscuro al cargar la página
  initDarkMode();
});
