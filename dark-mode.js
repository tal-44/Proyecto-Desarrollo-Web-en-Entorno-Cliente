/**
 * dark-mode.js
 * Gestiona el toggle del modo oscuro con persistencia en localStorage
 * Implementa detección de preferencia del sistema operativo
 * 
 * Este archivo centralizado proporciona la funcionalidad de modo oscuro
 * para todas las páginas del proyecto.
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const toggleBtn = document.getElementById('dark-mode-toggle');
  // Clave para localStorage (consistente en todas las páginas)
  const DARK_MODE_KEY = 'dark-mode';

  /**
   * Establece el estado del modo oscuro
   * @param {boolean} isDark
   */
  function setDarkMode(isDark) {
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
  }

  /**
   * Inicializa el estado del modo oscuro
   * Prioridad: 1) Preferencia guardada, 2) Preferencia del sistema
   */
  function init() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      // Hay una preferencia guardada
      const isDarkMode = JSON.parse(saved);
      setDarkMode(isDarkMode);
    } else {
      // No hay preferencia, usar la del sistema operativo
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }

  /**
   * Alterna el modo oscuro
   */
  function toggleDarkMode() {
    const isDarkMode = body.classList.contains('dark-mode');
    setDarkMode(!isDarkMode);
  }

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
  init();
});