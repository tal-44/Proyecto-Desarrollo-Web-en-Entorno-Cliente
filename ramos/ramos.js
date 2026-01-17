/**
 * ramos.js
 * Gestiona la funcionalidad de la página de ramos
 * - Carga los ramos desde product_data.json (es_ramo: true)
 * - Renderiza las tarjetas de producto dinámicamente
 * - Hace que las tarjetas sean clickeables para ir a vista_ramo.html
 * - Guarda el ramo seleccionado en sessionStorage para que vista_ramo.js lo recupere
 */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('productos-grid');
  
  /**
   * Carga los productos desde el JSON
   */
  const cargarProductos = async () => {
    try {
      const response = await fetch('../product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      return data.productos || [];
    } catch (error) {
      console.error('Error cargando productos:', error);
      return [];
    }
  };

  /**
   * Filtra solo los ramos (es_ramo === true)
   */
  const filtrarRamos = (productos) => {
    return productos.filter(p => p.es_ramo === true);
  };

  /**
   * Capitaliza la primera letra
   */
  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  /**
   * Crea una tarjeta de producto HTML
   */
  const crearTarjetaProducto = (ramo) => {
    const article = document.createElement('article');
    article.className = 'producto-card';
    article.setAttribute('data-es-ramo', 'true');
    article.setAttribute('data-temporada', ramo.temporada);
    article.setAttribute('data-dificultad', ramo.dificultad.toLowerCase());
    article.setAttribute('data-nombre', ramo.nombre);
    article.setAttribute('data-precio', ramo.precio);
    article.setAttribute('data-imagen', `../img/plantas/${ramo.imagen}`);
    article.style.cursor = 'pointer';

    // Contenedor de imagen
    const imagenDiv = document.createElement('div');
    imagenDiv.className = 'producto-imagen';

    // Badge de dificultad
    const badgeDif = document.createElement('span');
    const dificultadLower = ramo.dificultad.toLowerCase();
    badgeDif.className = `badge badge-dificultad ${dificultadLower}`;
    badgeDif.textContent = capitalizar(ramo.dificultad);

    // Badge de temporada
    const badgeTem = document.createElement('span');
    badgeTem.className = `badge badge-temporada ${ramo.temporada}`;
    badgeTem.textContent = capitalizar(ramo.temporada);

    // Imagen
    const img = document.createElement('img');
    img.src = `../img/plantas/${ramo.imagen}`;
    img.alt = ramo.nombre;

    imagenDiv.appendChild(badgeDif);
    imagenDiv.appendChild(badgeTem);
    imagenDiv.appendChild(img);

    // Info del producto
    const infoDiv = document.createElement('div');
    infoDiv.className = 'producto-info';

    const titulo = document.createElement('h3');
    titulo.textContent = ramo.nombre;

    const descripcion = document.createElement('p');
    descripcion.className = 'nombre-cientifico';
    descripcion.textContent = ramo.nombre_cientifico || '';

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = `€${parseFloat(ramo.precio).toFixed(2)}`;

    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = 'Añadir a la cesta';

    infoDiv.appendChild(titulo);
    infoDiv.appendChild(descripcion);
    infoDiv.appendChild(precio);
    infoDiv.appendChild(btn);

    article.appendChild(imagenDiv);
    article.appendChild(infoDiv);

    // Event listener para hacer click en la tarjeta
    article.addEventListener('click', (e) => {
      // Si el click fue en el botón de añadir al carrito, no navegar
      if (e.target.classList.contains('add-to-cart')) {
        return;
      }
      
      // Preparar datos del ramo para vista_ramo.html
      // La imagen necesita ruta ajustada para vista_ramo/ (subir un nivel más)
      const ramoData = {
        nombre: ramo.nombre,
        precio: ramo.precio,
        imagen: `../../img/plantas/${ramo.imagen}`,
        temporada: ramo.temporada,
        dificultad: ramo.dificultad.toLowerCase(),
        es_ramo: true,
        nombre_cientifico: ramo.nombre_cientifico || '',
        descripcion: ramo.descripcion || ''
      };
      
      // Guardar en sessionStorage
      sessionStorage.setItem('ramoActual', JSON.stringify(ramoData));
      
      // Navegar a la página de detalle
      const nombreEncoded = encodeURIComponent(ramo.nombre);
      window.location.href = `vista_ramo/vista_ramo.html?nombre=${nombreEncoded}`;
    });

    return article;
  };

  /**
   * Renderiza los ramos en la cuadrícula
   */
  const renderizarRamos = (ramos) => {
    grid.innerHTML = '';
    
    if (ramos.length === 0) {
      grid.innerHTML = '<p class="sin-resultados">No hay ramos disponibles en este momento.</p>';
      return;
    }

    ramos.forEach(ramo => {
      const tarjeta = crearTarjetaProducto(ramo);
      grid.appendChild(tarjeta);
    });
  };

  // Inicialización
  const productos = await cargarProductos();
  const ramos = filtrarRamos(productos);
  renderizarRamos(ramos);
});
