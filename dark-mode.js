/*
 * dark-mode.js
 *
 * Provides a site‑wide dark mode toggle.  When included on a page,
 * this script looks for an element with the ID `dark-mode-toggle` and
 * attaches a click handler to toggle between light and dark themes.
 * The user's preference is persisted in localStorage so that future
 * visits remember the selected mode.  If no preference has been set
 * yet, the script falls back to the user’s system colour scheme.
 */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const toggleBtn = document.getElementById('dark-mode-toggle');
  // Key used for persistence
  const DARK_MODE_KEY = 'global-dark-mode';

  /**
   * Applies or removes the `.dark-mode` class on the body and adjusts
   * the toggle button label.  The toggle button is optional – pages
   * without a dark mode toggle simply get the appropriate class.
   *
   * @param {boolean} isDark
   */
  function setDarkMode(isDark) {
    if (isDark) {
      body.classList.add('dark-mode');
      if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.textContent = 'Modo Claro';
      }
    } else {
      body.classList.remove('dark-mode');
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.textContent = 'Modo Oscuro';
      }
    }
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
  }

  /**
   * Determine the initial mode: read from localStorage if present,
   * otherwise use the OS preference.
   */
  function init() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }

  /**
   * Invert the current theme.
   */
  function toggleDark() {
    const isDark = body.classList.contains('dark-mode');
    setDarkMode(!isDark);
  }

  // Attach event listeners
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDark);
  }
  // Listen to system preference changes when no preference is stored
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(DARK_MODE_KEY) === null) {
      setDarkMode(e.matches);
    }
  });

  init();
});