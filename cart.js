/*
 * cart.js
 *
 * Este archivo centraliza la lógica del carrito de compras. Está
 * pensado para utilizarse en todas las páginas del proyecto. Se
 * encarga de almacenar los productos seleccionados en localStorage,
 * actualizar el contador del carrito en la cabecera, gestionar
 * eventos de añadir al carrito y renderizar el resumen del carrito
 * en la página dedicada (carrito.html). Todo el código está
 * comentado para facilitar su comprensión a estudiantes de nivel
 * básico.
 */

// Ejecutamos la lógica básica cuando se carga el DOM. Esta
// función comprueba si existen botones de añadir al carrito y el
// botón de apertura del carrito. También actualiza el contador
// inicial.
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  setupAddToCartButtons();
  setupCartButton();
  setupVaciarButton();
});

/**
 * Carga el carrito desde localStorage. Si no existe, devuelve un
 * array vacío. Cada elemento del carrito es un objeto con las
 * propiedades: nombre (string), precio (number), cantidad (number)
 * e imagen (string) para mostrar una miniatura en el resumen.
 *
 * @returns {Array} Array de productos en el carrito
 */
function loadCart() {
  const data = localStorage.getItem('cartItems');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error al leer el carrito:', e);
    return [];
  }
}

/**
 * Guarda el carrito en localStorage. Se utiliza después de
 * modificar las cantidades o añadir productos.
 *
 * @param {Array} cart Array de productos a guardar
 */
function saveCart(cart) {
  localStorage.setItem('cartItems', JSON.stringify(cart));
}

/**
 * Actualiza el contador del carrito en la cabecera. Suma las
 * cantidades de cada producto y muestra ese valor en el span con
 * id "cart-count". Si no hay artículos, oculta el contador para
 * que no aparezca un cero.
 */
function updateCartCount() {
  const countSpan = document.getElementById('cart-count');
  if (!countSpan) return;
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  if (totalItems > 0) {
    countSpan.textContent = totalItems;
    countSpan.style.display = 'inline-block';
  } else {
    countSpan.textContent = '0';
    countSpan.style.display = 'none';
  }
}

/**
 * Configura los botones de añadir al carrito. Recorre todas las
 * etiquetas con clase "add-to-cart" y asigna un manejador que
 * obtiene los datos del producto a partir de su tarjeta
 * correspondiente. Esta función es segura de ejecutar incluso en
 * páginas donde no existan dichos botones.
 */
function setupAddToCartButtons() {
  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // localizamos el contenedor .producto-card más cercano
      const card = btn.closest('.producto-card');
      if (!card) return;
      const nombre = card.dataset.nombre;
      const precio = parseFloat(card.dataset.precio);
      const imagen = card.dataset.imagen;
      addItemToCart(nombre, precio, imagen);
    });
  });
}

/**
 * Añade un producto al carrito. Si el producto ya existe (según
 * su nombre), incrementa la cantidad; en caso contrario, lo
 * inserta con cantidad 1. Después se guarda el carrito y se
 * actualiza el contador.
 *
 * @param {string} nombre Nombre del producto
 * @param {number} precio Precio unitario del producto
 * @param {string} imagen Ruta de la imagen para mostrar en el carrito
 */
function addItemToCart(nombre, precio, imagen) {
  const cart = loadCart();
  // Buscamos si ya existe un producto con el mismo nombre
  const existing = cart.find(item => item.nombre === nombre);
  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({ nombre, precio, cantidad: 1, imagen });
  }
  saveCart(cart);
  updateCartCount();
}

/**
 * Configura el botón del carrito en la cabecera. Al hacer clic,
 * redirecciona a la página "carrito.html". La ruta se calcula
 * dinámicamente basada en la ubicación actual de la página.
 */
function setupCartButton() {
  const cartButton = document.getElementById('open-cart');
  if (cartButton) {
    cartButton.addEventListener('click', () => {
      // Determinar la ruta correcta según la ubicación actual
      const currentPath = window.location.pathname;
      let carritoPath;
      
      if (currentPath.includes('/ramos/vista_ramo/')) {
        // Desde ramos/vista_ramo/ -> subir 2 niveles
        carritoPath = '../../carrito/carrito.html';
      } else if (currentPath.includes('/ramos/')) {
        // Desde ramos/ -> subir 1 nivel
        carritoPath = '../carrito/carrito.html';
      } else if (currentPath.includes('/test/')) {
        // Desde test/ -> subir 1 nivel
        carritoPath = '../carrito/carrito.html';
      } else if (currentPath.includes('/carrito/')) {
        // Ya estamos en carrito/
        carritoPath = 'carrito.html';
      } else {
        // Desde la raíz (index.html)
        carritoPath = 'carrito/carrito.html';
      }
      
      window.location.href = carritoPath;
    });
  }
}

/**
 * Configura el botón de vaciar carrito en la página de carrito.
 * El botón debe tener id "vaciar-carrito". Al pulsarlo, se
 * limpia el array del carrito, se actualiza el contador y se
 * vuelve a renderizar la página del carrito para reflejar los
 * cambios. Si no existe dicho botón, la función retorna sin
 * hacer nada.
 */
function setupVaciarButton() {
  const vaciarBtn = document.getElementById('vaciar-carrito');
  if (vaciarBtn) {
    vaciarBtn.addEventListener('click', () => {
      localStorage.removeItem('cartItems');
      updateCartCount();
      // Si estamos en la página del carrito, volvemos a pintar la tabla
      if (typeof renderCartPage === 'function') {
        renderCartPage();
      }
    });
  }
}

/**
 * Renderiza la tabla de resumen del carrito. Esta función debe
 * ejecutarse en la página carrito.html cuando el DOM esté listo.
 * Obtiene el div con id "cart-container" y lo rellena con una
 * tabla que muestra cada producto, su cantidad, el precio
 * unitario y el subtotal (cantidad * precio). También calcula el
 * total de la compra. Si el carrito está vacío, se muestra un
 * mensaje indicando que no hay artículos.
 */
function renderCartPage() {
  const container = document.getElementById('cart-container');
  if (!container) return;
  const cart = loadCart();
  // Limpiamos el contenedor
  container.innerHTML = '';
  if (cart.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'Tu carrito está vacío. Añade productos desde el catálogo.';
    container.appendChild(msg);
    return;
  }
  // Creamos la tabla
  const table = document.createElement('table');
  table.className = 'cart-table';
  // Encabezado
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Producto</th>
      <th>Cantidad</th>
      <th>Precio</th>
      <th>Subtotal</th>
    </tr>`;
  table.appendChild(thead);
  // Cuerpo de la tabla
  const tbody = document.createElement('tbody');
  let total = 0;
  cart.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.imagen}" alt="${item.nombre}" style="width:40px;height:40px;object-fit:cover;margin-right:0.5rem;vertical-align:middle;">${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>€${item.precio.toFixed(2)}</td>
      <td>€${subtotal.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  // Fila de total
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `
    <tr>
      <td colspan="3" style="text-align:right;font-weight:bold;">Total:</td>
      <td style="font-weight:bold;">€${total.toFixed(2)}</td>
    </tr>`;
  table.appendChild(tfoot);
  container.appendChild(table);
}

// Hacemos que las funciones principales estén disponibles en el
// objeto global para poder ser llamadas desde HTML (carrito.html) y desde scripts dinámicos
window.renderCartPage = renderCartPage;
window.addItemToCart = addItemToCart;
window.updateCartCount = updateCartCount;