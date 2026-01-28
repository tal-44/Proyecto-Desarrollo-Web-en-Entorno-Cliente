/*
 * PARTE DE IVÁN PARA EL HITO 2 (carro renderizado, añadido funciones globales y JSON dinámic)
 *
 * CARRITO DE COMPRAS - Sistema de gestión del carrito de compras persistente
 * 
 * Este script implementa un carrito de compras funcional que:
 * - Almacena los productos en localStorage para persistencia entre sesiones
 * - Expone funciones globales (window.addItemToCart, window.openCart, window.closeCart)
 *   que pueden ser llamadas desde otros scripts (script.js, product.js, ramos.js, etc.)
 * - Crea una interfaz modal flotante que se muestra al hacer clic en el icono de carrito
 * - Permite modificar cantidades (incrementar/decrementar) y eliminar productos
 * - Calcula automáticamente el total de la compra
 * - Sincroniza cambios inmediatamente con localStorage para persistencia
 * 
 * ESTRUCTURA DE DATOS:
 * Cada elemento del carrito en localStorage tiene la forma:
 * { name: string, price: number, image: string, qty: number }
 * 
 * El carrito se almacena con la clave 'cart' en localStorage como JSON string
 */

document.addEventListener('DOMContentLoaded', () => {
  // Internal cart array.  Each entry is of the form
  // { name: string, price: number, image: string, qty: number }
  let cart = loadCart();

  // Create overlay when first loaded
  const overlay = createOverlay();
  document.body.appendChild(overlay);

  // Update count on page load
  updateCartCount();

  // Attach open cart behaviour to button if present
  const cartBtn = document.getElementById('open-cart');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }

  /**
   * CARGAR CARRITO DESDE LOCALSTORAGE
   * Lee el carrito almacenado en localStorage bajo la clave 'cart'.
   * - Si no existe un carrito guardado, retorna un array vacío
   * - Valida y normaliza cada item: name, price (number), image, qty (number)
   * - Captura errores en caso de JSON malformado
   * 
   * @returns {Array} Array de objetos con estructura { name, price, image, qty }
   */
  function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure each item has required properties
        return Array.isArray(parsed) ? parsed.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          image: item.image,
          qty: parseInt(item.qty, 10) || 1
        })) : [];
      } catch (err) {
        console.error('Error parsing cart from localStorage', err);
      }
    }
    return [];
  }

  /**
   * GUARDAR CARRITO EN LOCALSTORAGE
   * Persiste el estado actual del carrito en localStorage bajo la clave 'cart'
   * - Serializa el array de items a JSON string
   * - Se llama automáticamente después de cualquier modificación (añadir, eliminar, cambiar cantidad)
   * - Permite que el carrito persista entre recargas de página y sesiones
   */
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  /**
   * ACTUALIZAR CONTADOR DEL CARRITO
   * Actualiza el número que aparece en el icono de carrito de la cabecera
   * - Suma todas las cantidades (qty) de los items del carrito
   * - Se llama cada vez que el carrito cambia para mantener sincronizado el contador visual
   * - El contador muestra el número total de unidades, no de productos diferentes
   */
  function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    let total = 0;
    cart.forEach(item => {
      total += item.qty;
    });
    countEl.textContent = total;
  }

  /**
   * CREAR INTERFAZ MODAL DEL CARRITO
   * Construye la estructura DOM del modal que se muestra al hacer clic en el icono de carrito
   * 
   * ESTRUCTURA:
   * - Overlay: capa semitransparente que cubre la página
   * - Modal: contenedor principal con header, items, y resumen
   *   - Header: título "Tu cesta" + botón cerrar (×)
   *   - Items container: donde se renderizan los productos del carrito
   *   - Summary: total de precio y botones de acción (Vaciar, Comprar)
   * 
   * EVENTOS:
   * - Botón Vaciar: elimina todos los items, guarda, renderiza y actualiza contador
   * - Botón Comprar: vacía el carrito, muestra alerta de éxito, cierra el modal
   * 
   * @returns {HTMLElement} El elemento raíz del overlay (contenedor del modal)
   */
  function createOverlay() {
    const overlayEl = document.createElement('div');
    overlayEl.className = 'cart-overlay';

    const modal = document.createElement('div');
    modal.className = 'cart-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'cart-header';
    const title = document.createElement('h2');
    title.textContent = 'Tu cesta';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'cart-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Cerrar carrito');
    closeBtn.addEventListener('click', () => {
      closeCart();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'cart-items';

    // Summary
    const summary = document.createElement('div');
    summary.className = 'cart-summary';
    const totalText = document.createElement('p');
    totalText.id = 'cart-total';
    summary.appendChild(totalText);
    const actions = document.createElement('div');
    actions.className = 'cart-actions';
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Vaciar';
    clearBtn.addEventListener('click', () => {
      cart = [];
      saveCart();
      renderCart();
      updateCartCount();
    });
    const checkoutBtn = document.createElement('button');
    checkoutBtn.textContent = 'Comprar';
    checkoutBtn.addEventListener('click', () => {
      // Verificar si el usuario está autenticado antes de guardar compra
      const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
      
      if (currentUser && currentUser.username) {
        // Si hay usuario autenticado, guardar compra en historial
        if (window.savePurchaseToHistory) {
          const cartCopy = JSON.parse(JSON.stringify(cart)); // Deep copy
          const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
          window.savePurchaseToHistory(cartCopy, total);
        }
      }
      
      // Vaciar carrito
      cart = [];
      saveCart();
      renderCart();
      updateCartCount();
      
      Swal.fire({
        icon: 'success',
        title: '¡Gracias por tu compra!',
        text: 'Tu pedido se ha procesado correctamente.',
        toast: true,
        position: 'bottom-end',
        timer: 3000,
        showConfirmButton: false,
        background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
        color: document.body.classList.contains('dark-mode') ? '#e8e8e8' : '#333333'
      });
      closeCart();
    });
    actions.appendChild(clearBtn);
    actions.appendChild(checkoutBtn);
    summary.appendChild(actions);

    modal.appendChild(header);
    modal.appendChild(itemsContainer);
    modal.appendChild(summary);
    overlayEl.appendChild(modal);

    return overlayEl;
  }

  /**
   * RENDERIZAR ITEMS DEL CARRITO
   * Actualiza dinámicamente el contenido del modal del carrito
   * 
   * PROCESO:
   * 1. Limpia el contenido anterior del contenedor de items
   * 2. Si el carrito está vacío, muestra mensaje "Tu cesta está vacía"
   * 3. Si hay items:
   *    - Itera cada item y crea una fila con:
   *      * Imagen del producto
   *      * Nombre y precio unitario
   *      * Controles de cantidad (−, cantidad, +)
   *      * Botón para eliminar el item
   * 4. Calcula el total multiplicando (precio × cantidad) para cada item
   * 5. Actualiza el texto del total al final del modal
   * 
   * Se llama automáticamente tras cualquier cambio en el carrito
   */
    function renderCart() {
      const overlayEl = document.querySelector('.cart-overlay');
      if (!overlayEl) return;
      const itemsContainer = overlayEl.querySelector('.cart-items');
      const totalEl = overlayEl.querySelector('#cart-total');
      // Clear previous content
      itemsContainer.innerHTML = '';
      let total = 0;
      if (cart.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-center';
        emptyMsg.textContent = 'Tu cesta está vacía.';
        itemsContainer.appendChild(emptyMsg);
      } else {
      cart.forEach((item, index) => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-item';
        // Image
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        row.appendChild(img);
        // Details
        const details = document.createElement('div');
        details.className = 'cart-item-details';
        const nameEl = document.createElement('h4');
        nameEl.textContent = item.name;
        const priceEl = document.createElement('p');
        priceEl.textContent = `€${parseFloat(item.price).toFixed(2)}`;
        details.appendChild(nameEl);
        details.appendChild(priceEl);
        row.appendChild(details);
        // Actions
        const actions = document.createElement('div');
        actions.className = 'cart-item-actions';
        // Quantity controls
        const qtyWrapper = document.createElement('div');
        qtyWrapper.className = 'cart-qty';
        const minusBtn = document.createElement('button');
        minusBtn.textContent = '−';
        minusBtn.addEventListener('click', () => {
          if (item.qty > 1) {
            item.qty -= 1;
          } else {
            // remove item if quantity goes to zero
            cart.splice(index, 1);
          }
          saveCart();
          renderCart();
          updateCartCount();
        });
        const qtySpan = document.createElement('span');
        qtySpan.textContent = item.qty;
        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.addEventListener('click', () => {
          item.qty += 1;
          saveCart();
          renderCart();
          updateCartCount();
        });
        qtyWrapper.appendChild(minusBtn);
        qtyWrapper.appendChild(qtySpan);
        qtyWrapper.appendChild(plusBtn);
        actions.appendChild(qtyWrapper);
        // Remove link
        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-remove';
        removeBtn.textContent = 'Eliminar';
        removeBtn.addEventListener('click', () => {
          cart.splice(index, 1);
          saveCart();
          renderCart();
          updateCartCount();
        });
        actions.appendChild(removeBtn);
        row.appendChild(actions);
        itemsContainer.appendChild(row);
      });
    }
    totalEl.textContent = `Total: €${total.toFixed(2)}`;
  }

  /**
   * Shows the cart overlay and renders current items.
   */
  function openCart() {
    const overlayEl = document.querySelector('.cart-overlay');
    if (overlayEl) {
      renderCart();
      overlayEl.style.display = 'flex';
    }
  }

  /**
   * Hides the cart overlay.
   */
  function closeCart() {
    const overlayEl = document.querySelector('.cart-overlay');
    if (overlayEl) {
      overlayEl.style.display = 'none';
    }
  }

  /**
   * AÑADIR ITEM AL CARRITO (FUNCIÓN GLOBAL)
   * Añade un producto al carrito. Si el producto ya existe, incrementa su cantidad.
   * 
   * LÓGICA:
   * 1. Convierte el precio a número
   * 2. Busca si el item ya existe (comparando nombres)
   * 3. Si existe: incrementa qty en 1
   * 4. Si no existe: crea nuevo item { name, price, image, qty: 1 }
   * 5. Guarda en localStorage y actualiza el contador visual
   * 
   * EXPOSICIÓN GLOBAL:
   * Se asigna a window.addItemToCart para que pueda ser llamada desde:
   * - script.js (catálogo)
   * - product.js (página de detalle)
   * - ramos.js (ramos pre-hechos)
   * - test.js (test con sugerencias)
   * 
   * @param {string} name Nombre del producto
   * @param {number|string} price Precio unitario del producto
   * @param {string} image Ruta o URL de la imagen del producto (verificada con default.jpg)
   */
  function addItemToCart(name, price, image) {
    price = parseFloat(price);
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, image, qty: 1 });
    }
    saveCart();
    updateCartCount();
  }

  // Expose public functions on the window object
  window.addItemToCart = addItemToCart;
  window.openCart = openCart;
  window.closeCart = closeCart;

  /**
   * RENDERIZAR PÁGINA DE CARRITO
   * Esta función se llama desde carrito.html para mostrar un resumen completo
   * del carrito en una página dedicada (no en el modal flotante)
   * 
   * Crea una tabla con todos los items del carrito y permite su gestión
   * Se invoca con: renderCartPage()
   */
  window.renderCartPage = function() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: #999;">
          <p style="font-size: 3rem; margin-bottom: 1rem;">🛒</p>
          <h2>Tu carrito está vacío</h2>
          <p>Añade productos para empezar tu compra.</p>
          <a href="../index.html" style="color: #2c662d; text-decoration: none; padding: 0.5rem 1rem; background-color: #e5f5e0; border-radius: 4px; display: inline-block; margin-top: 1rem;">Ir al catálogo</a>
        </div>
      `;
      return;
    }

    let html = `
      <table class="cart-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;

    let grandTotal = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.qty;
      grandTotal += itemTotal;
      html += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
              <span>${item.name}</span>
            </div>
          </td>
          <td>€${parseFloat(item.price).toFixed(2)}</td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: center;">
              <button onclick="decrementQty(${index})" style="width: 30px; height: 30px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; background: #fff;">−</button>
              <span style="width: 30px; text-align: center;">${item.qty}</span>
              <button onclick="incrementQty(${index})" style="width: 30px; height: 30px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; background: #fff;">+</button>
            </div>
          </td>
          <td>€${itemTotal.toFixed(2)}</td>
          <td>
            <button onclick="removeFromCartPage(${index})" style="color: #c0392b; background: #ffe6e6; border: 1px solid #c0392b; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer;">Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <div style="text-align: right; margin-top: 1rem; padding: 1rem; background-color: #f5f5f5; border-radius: 4px;">
        <h3 style="color: #2c662d; margin: 0 0 0.5rem 0;">Total: €${grandTotal.toFixed(2)}</h3>
        <button id="checkout-page-btn" style="background-color: #2c662d; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600;">Proceder a Compra</button>
      </div>
    `;

    container.innerHTML = html;

    // Añadir evento al botón de compra
    const checkoutBtn = document.getElementById('checkout-page-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
        
        if (currentUser && currentUser.username) {
          if (window.savePurchaseToHistory) {
            const cartCopy = JSON.parse(JSON.stringify(cart));
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            window.savePurchaseToHistory(cartCopy, total);
          }
        }
        
        cart = [];
        saveCart();
        window.renderCartPage();
        updateCartCount();
        
        Swal.fire({
          icon: 'success',
          title: '¡Gracias por tu compra!',
          text: 'Tu pedido se ha procesado correctamente.',
          confirmButtonText: 'Continuar comprando',
          background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
          color: document.body.classList.contains('dark-mode') ? '#e8e8e8' : '#333333'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '../index.html';
          }
        });
      });
    }
  };

  /**
   * FUNCIONES DE GESTIÓN PARA LA PÁGINA DEL CARRITO
   */
  window.decrementQty = function(index) {
    if (cart[index].qty > 1) {
      cart[index].qty -= 1;
    } else {
      cart.splice(index, 1);
    }
    saveCart();
    window.renderCartPage();
    updateCartCount();
  };

  window.incrementQty = function(index) {
    cart[index].qty += 1;
    saveCart();
    window.renderCartPage();
    updateCartCount();
  };

  window.removeFromCartPage = function(index) {
    cart.splice(index, 1);
    saveCart();
    window.renderCartPage();
    updateCartCount();
  };
});