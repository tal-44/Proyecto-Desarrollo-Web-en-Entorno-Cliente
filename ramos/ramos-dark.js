/**
 * ramos-dark.js
 * Gestiona el toggle del modo oscuro en la sección de Ramos Pre-hechos
 * Implementa persistencia en localStorage para recordar la preferencia del usuario
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  const body = document.body;
  
  const DARK_MODE_KEY = 'ramos-dark-mode';  
  /**
   * Inicializa el estado del modo oscuro
   * Si ya existe una preferencia de modo oscuro en localStorage, la aplica
   * Si no, usa la que tiene el usuario en su sistema operativo
   */
  const initDarkMode = () => {
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    
    if (savedDarkMode !== null) {
      const isDarkMode = JSON.parse(savedDarkMode);
      setDarkMode(isDarkMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  };
  
  /**
   * Establece el estado del modo oscuro
   * @param {boolean} isDark - true para modo oscuro
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
    // Guardar la preferencia en localStorage
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
  };
  
  /**
   * Toggle del modo oscuro
   * Invierte el estado actual del modo oscuro
   */
  const toggleDarkMode = () => {
    const isDarkMode = body.classList.contains('dark-mode');
    setDarkMode(!isDarkMode);
  };
  
  // Event listener para el botón de toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDarkMode);
  }
  
  // Escuchar cambios de preferencia por defecto del sistema operativo
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      setDarkMode(e.matches);
    }
  });

  initDarkMode();
});
