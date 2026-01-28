/*
 * HISTORIAL DE COMPRAS - Sistema de visualización de compras con FullCalendar
 *
 * GESTIÓN DEL HISTORIAL DE COMPRAS
 *
 * Este script implementa:
 * 1. Verificación de autenticación (solo usuarios registrados pueden ver historial)
 * 2. Integración con FullCalendar para mostrar compras en un calendario
 * 3. Carga de compras desde localStorage['purchases']
 * 4. Renderización de detalles de pedidos al seleccionar una fecha
 * 5. Visualización de productos, cantidad, precio y total por pedido
 *
 * ESTRUCTURA DE DATOS:
 * localStorage['purchases'] = [
 *   {
 *     date: "2026-01-27",
 *     time: "14:32:45",
 *     total: 125.50,
 *     items: [
 *       { name: "Planta A", price: 25.99, qty: 2 },
 *       { name: "Planta B", price: 15.50, qty: 1 }
 *     ]
 *   }
 * ]
 *
 * FUNCIONES PRINCIPALES:
 * - loadPurchases(): Carga el historial desde localStorage
 * - renderCalendar(): Inicializa FullCalendar con eventos de compras
 * - displayOrderSummary(date): Muestra detalles del pedido para una fecha
 * - formatCurrency(value): Formatea valores monetarios
 */

/**
 * FUNCIÓN GLOBAL PARA REGISTRAR UNA COMPRA
 * Llamada desde cart.js cuando se completa un checkout
 * Guarda los detalles del pedido actual en el historial
 * IMPORTANTE: Esta función debe estar FUERA del DOMContentLoaded para ser accesible desde otras páginas
 *
 * @param {Array} cartItems Array de items del carrito a guardar
 * @param {number} total Cantidad total del pedido
 */
window.savePurchaseToHistory = function(cartItems, total) {
  // Obtener usuario actual
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) {
    console.warn('No hay usuario autenticado, no se guardará la compra');
    return;
  }
  
  let currentUser;
  try {
    currentUser = JSON.parse(currentUserData);
  } catch (e) {
    console.error('Error al parsear usuario actual:', e);
    return;
  }
  
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // "2026-01-27"
  const time = now.toTimeString().split(' ')[0]; // "14:32:45"

  const purchase = {
    username: currentUser.username, // ASOCIAR COMPRA AL USUARIO
    date: date,
    time: time,
    total: parseFloat(total),
    items: cartItems.map(item => ({
      name: item.name,
      price: parseFloat(item.price),
      qty: item.qty
    }))
  };

  // Cargar compras existentes
  const saved = localStorage.getItem('purchases');
  let purchases = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      purchases = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error al cargar historial de compras:', err);
      purchases = [];
    }
  }

  // Agregar nueva compra
  purchases.push(purchase);

  // Guardar de nuevo
  localStorage.setItem('purchases', JSON.stringify(purchases));

  // Disparar evento personalizado para actualizar el gráfico de preferencias
  window.dispatchEvent(new CustomEvent('purchaseCompleted', {
    detail: { purchase: purchase }
  }));
};

/**
 * FUNCIÓN GLOBAL PARA OBTENER EL HISTORIAL
 * Permite que otros scripts accedan al historial de compras
 * FILTRADO POR USUARIO ACTUAL
 *
 * @returns {Array} Array de compras registradas del usuario actual
 */
window.getPurchaseHistory = function() {
  // Obtener usuario actual
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) {
    return [];
  }
  
  let currentUser;
  try {
    currentUser = JSON.parse(currentUserData);
  } catch (e) {
    return [];
  }
  
  const saved = localStorage.getItem('purchases');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // FILTRAR SOLO LAS COMPRAS DEL USUARIO ACTUAL
        return parsed.filter(p => p.username === currentUser.username);
      }
      return [];
    } catch (err) {
      console.error('Error al cargar historial de compras:', err);
      return [];
    }
  }
  return [];
};

document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  const currentUser = getCurrentUser();
  const authRequiredDiv = document.getElementById('auth-required');
  const historyContentDiv = document.getElementById('history-content');

  // Si no estamos en la página de historial, no hacer nada
  if (!authRequiredDiv || !historyContentDiv) {
    return;
  }

  if (!currentUser || !currentUser.username) {
    // Usuario no autenticado
    authRequiredDiv.classList.remove('hidden');
    historyContentDiv.classList.add('hidden');
    return;
  }

  // Usuario autenticado: mostrar contenido
  authRequiredDiv.classList.add('hidden');
  historyContentDiv.classList.remove('hidden');

  // Variables globales
  let calendar;
  let purchases = window.getPurchaseHistory(); // USAR LA FUNCIÓN GLOBAL QUE FILTRA POR USUARIO
  let selectedDate = null;

  /**
   * CARGAR COMPRAS DESDE LOCALSTORAGE (FILTRADAS POR USUARIO)
   * Usa la función global getPurchaseHistory() que filtra automáticamente
   *
   * @returns {Array} Array de objetos con compras del usuario actual
   */
  function loadPurchases() {
    return window.getPurchaseHistory();
  }

  /**
   * FORMATEAR MONEDA
   * Convierte un número a formato EUR con 2 decimales
   *
   * @param {number} value Valor a formatear
   * @returns {string} Valor formateado como "€25.50"
   */
  function formatCurrency(value) {
    return '€' + parseFloat(value).toFixed(2);
  }

  /**
   * AGRUPAR COMPRAS POR FECHA
   * Agrupa las compras para facilitar la búsqueda y renderización
   * Retorna un objeto con formato { "2026-01-27": [...compras de esa fecha] }
   *
   * @returns {Object} Objeto con compras agrupadas por fecha
   */
  function groupPurchasesByDate() {
    const grouped = {};
    purchases.forEach(purchase => {
      if (!grouped[purchase.date]) {
        grouped[purchase.date] = [];
      }
      grouped[purchase.date].push(purchase);
    });
    return grouped;
  }

  /**
   * RENDERIZAR CALENDARIO CON FULLCALENDAR
   * Inicializa FullCalendar con los eventos de compras
   * Cada día con compra aparece marcado con un evento
   * Al hacer clic en un evento, se muestra el resumen del pedido
   */
  function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const grouped = groupPurchasesByDate();

    // Convertir compras a eventos de FullCalendar
    const events = purchases.map(purchase => {
      const dateObj = new Date(purchase.date + 'T00:00:00');
      return {
        title: `Compra: ${formatCurrency(purchase.total)}`,
        date: purchase.date,
        backgroundColor: '#2c662d',
        borderColor: '#1f4820',
        extendedProps: {
          purchase: purchase,
          allPurchases: grouped[purchase.date]
        }
      };
    });

    // Inicializar FullCalendar si no existe
    if (!calendar) {
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listMonth'
        },
        events: events,
        eventClick: function(info) {
          selectedDate = info.event.extendedProps.purchase.date;
          displayOrderSummary(selectedDate);
        },
        dayCellDidMount: function(info) {
          // Añadir clase visual a días con compras
          const dateStr = info.date.toISOString().split('T')[0];
          if (grouped[dateStr]) {
            info.el.classList.add('has-purchase');
          }
        },
        noEventsText: 'Sin compras registradas'
      });
      calendar.render();
    } else {
      // Actualizar eventos si el calendario ya existe
      calendar.removeAllEvents();
      calendar.addEventSource(events);
    }
  }

  /**
   * MOSTRAR RESUMEN DEL PEDIDO
   * Renderiza los detalles completos de un pedido para una fecha seleccionada
   * Muestra:
   * - Fecha y hora de compra
   * - Lista de productos (nombre, cantidad, precio unitario)
   * - Total del pedido
   *
   * @param {string} date Fecha en formato "YYYY-MM-DD"
   */
  function displayOrderSummary(date) {
    const summaryDiv = document.getElementById('order-summary');

    // Buscar todas las compras para esa fecha
    const dayPurchases = purchases.filter(p => p.date === date);

    if (!dayPurchases || dayPurchases.length === 0) {
      summaryDiv.innerHTML = `
        <div class="no-order-selected">
          <p>No hay compras registradas para esta fecha.</p>
        </div>
      `;
      return;
    }

    // Si hay compras, mostrarlas
    let html = '';
    let dayTotal = 0;

    dayPurchases.forEach((purchase, index) => {
      dayTotal += purchase.total;
      const timeObj = new Date(`2000-01-01T${purchase.time}`);
      const timeFormatted = timeObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <div class="order-details">
          <h4>Pedido ${index + 1}</h4>
          <p><strong>Fecha:</strong> ${date}</p>
          <p><strong>Hora:</strong> ${timeFormatted}</p>
          <div class="order-products">
      `;

      purchase.items.forEach(item => {
        const itemTotal = item.price * item.qty;
        html += `
          <div class="product-item">
            <span class="product-name">${item.name}</span>
            <div>
              <span class="product-qty">x${item.qty}</span>
              <span class="product-price">${formatCurrency(itemTotal)}</span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
          <div class="order-total">
            <span>Total del Pedido:</span>
            <span>${formatCurrency(purchase.total)}</span>
          </div>
        </div>
      `;
    });

    // Si hay múltiples compras en el día, mostrar total del día
    if (dayPurchases.length > 1) {
      html += `
        <div class="order-details" style="background-color: #e5f5e0; border-color: #2c662d;">
          <h4>Total del día:</h4>
          <div class="order-total">
            <span>Gasto Total del ${date}:</span>
            <span>${formatCurrency(dayTotal)}</span>
          </div>
        </div>
      `;
    }

    summaryDiv.innerHTML = html;
  }

  /**
   * CLASIFICAR PRODUCTOS EN RAMOS O PLANTAS
   * Determina si un producto es un ramo basándose en:
   * 1. Si el nombre contiene "Ramo"
   * 2. Si está asociado a ramos
   *
   * @param {string} productName
   * @returns {string}
   */
  function classifyProduct(productName) {
    const name = productName.toLowerCase();
    if (name.includes('ramo')) {
      return 'ramos';
    }
    return 'plantas';
  }

  /**
   * CALCULAR PREFERENCIAS DE COMPRA
   * Recorre todas las compras del usuario y clasifica los items
   * en Ramos y Plantas, contando la cantidad total de cada tipo
   *
   * @returns {Object}
   */
  function calculatePurchasePreferences() {
    let plantasCount = 0;
    let ramosCount = 0;

    purchases.forEach(purchase => {
      if (purchase.items && Array.isArray(purchase.items)) {
        purchase.items.forEach(item => {
          const qty = item.qty || 1;
          const category = classifyProduct(item.name);
          if (category === 'ramos') {
            ramosCount += qty;
          } else {
            plantasCount += qty;
          }
        });
      }
    });

    return {
      plantas: plantasCount,
      ramos: ramosCount,
      total: plantasCount + ramosCount
    };
  }

  /**
   * RENDERIZAR GRÁFICO DE PREFERENCIAS
   * Crea el grafico de Chart.js
   * mostrando la distribución entre Plantas y Ramos
   */
  let preferencesChart = null;

  function renderPreferencesChart() {
    const chartContainer = document.getElementById('preferences-chart-container');
    const noPreferencesDiv = document.getElementById('no-preferences');
    const statsDiv = document.getElementById('preferences-stats');
    const canvas = document.getElementById('preferencesChart');

    // Calcular preferencias
    const preferences = calculatePurchasePreferences();

    // Si no hay compras, mostrar mensaje y ocultar gráfico
    if (preferences.total === 0) {
      chartContainer.classList.add('hidden');
      noPreferencesDiv.classList.remove('hidden');
      return;
    }

    // Mostrar contenedor y ocultar mensaje
    chartContainer.classList.remove('hidden');
    noPreferencesDiv.classList.add('hidden');

    // Calcular porcentajes
    const plantasPct = ((preferences.plantas / preferences.total) * 100).toFixed(1);
    const ramosPct = ((preferences.ramos / preferences.total) * 100).toFixed(1);

    // Renderizar estadísticas
    statsDiv.innerHTML = `
      <div class="stat-item plantas">
        <div class="stat-value">${preferences.plantas}</div>
        <div class="stat-label">🌱 Plantas (${plantasPct}%)</div>
      </div>
      <div class="stat-item ramos">
        <div class="stat-value">${preferences.ramos}</div>
        <div class="stat-label">💐 Ramos (${ramosPct}%)</div>
      </div>
    `;

    // Destruir gráfico anterior
    if (preferencesChart) {
      preferencesChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Crear el gráfico
    preferencesChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['🌱 Plantas', '💐 Ramos'],
        datasets: [{
          data: [preferences.plantas, preferences.ramos],
          backgroundColor: [
            '#2c662d',
            '#8bc34a'
          ],
          borderColor: [
            '#1f4820',
            '#6b9b3a'
          ],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 14
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} unidades (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Inicializar el calendario y historial
  if (purchases.length === 0) {
    // Si no hay compras, mostrar mensaje vacío
    document.getElementById('order-summary').innerHTML = `
      <div class="no-order-selected">
        <p>📝 Aún no tienes compras registradas.</p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #ccc;">
          Realiza tu primer pedido para ver el historial aquí.
        </p>
      </div>
    `;
  }

  // Renderizar calendario
  renderCalendar();

  // Renderizar gráfico de preferencias (no afecta a FullCalendar)
  renderPreferencesChart();

  // Escuchar evento de compra completada para actualizar automáticamente
  // el calendario y el gráfico de preferencias sin recargar la página
  window.addEventListener('purchaseCompleted', function(event) {
    purchases = window.getPurchaseHistory();
    renderCalendar();
    renderPreferencesChart();
    if (purchases.length > 0) {
      const summaryDiv = document.getElementById('order-summary');
      if (summaryDiv && summaryDiv.querySelector('.no-order-selected')) {
        summaryDiv.innerHTML = `
          <div class="no-order-selected">
            <p>Selecciona una fecha con compra para ver los detalles.</p>
          </div>
        `;
      }
    }
  });
});
