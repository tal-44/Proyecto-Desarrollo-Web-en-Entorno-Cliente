/**
 * vista-ramo-dark.js
 * Gestiona el modo oscuro para la página de vista individual de ramos
 * Mantiene consistencia con la lógica de modo oscuro en ramos.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const DARK_MODE_KEY = 'dark-mode';
  
  /**
   * Recupera el estado del modo oscuro desde localStorage o preferencia del sistema
   */
  const initDarkMode = () => {
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    
    if (savedDarkMode !== null) {
      const isDarkMode = JSON.parse(savedDarkMode);
      if (isDarkMode) {
        body.classList.add('dark-mode');
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        body.classList.add('dark-mode');
      }
    }
  };
  
  // Inicializar el modo oscuro al cargar la página
  initDarkMode();
});
