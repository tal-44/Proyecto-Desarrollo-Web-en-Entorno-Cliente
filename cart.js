/*
 * cart.js
 *
 * Implements a simple shopping cart stored in localStorage.  The cart is
 * shared across pages – functions defined here are attached to the
 * `window` object so that other scripts can add items to the cart.
 * When the user clicks the cart icon in the header the cart overlay
 * appears, listing the current items, quantities and the total.  The
 * overlay allows incrementing/decrementing quantities and removing
 * items.  All changes persist immediately to localStorage.
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
   * Reads the cart from localStorage.  Returns an empty array if no
   * cart is stored.
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
   * Saves the cart to localStorage.
   */
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  /**
   * Updates the small number displayed on the cart icon.  Sums the
   * quantities of all items.
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
   * Creates the cart overlay DOM structure.  Returns the root
   * element.  All event handlers for closing and modifying the cart
   * are attached here.
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
      // For this demo we simply clear the cart and show a thank you alert
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
   * Renders the cart items and total in the modal.  Called whenever
   * the cart contents change.
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
   * Adds an item to the cart.  If the item already exists (matching
   * name), its quantity increases.  Exposed globally so other modules
   * can call window.addItemToCart(name, price, image).
   *
   * @param {string} name – product name
   * @param {number|string} price – product price
   * @param {string} image – URL or path to product image
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
});