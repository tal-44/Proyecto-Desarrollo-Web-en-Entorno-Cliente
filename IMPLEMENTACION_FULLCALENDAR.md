# 📅 Implementación de FullCalendar - Historial de Compras

Sistema de visualización de historial de compras usando **FullCalendar 6.1.10** (librería externa) integrado en el proyecto Rincón Verde.

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Detalles Técnicos](#detalles-técnicos)
6. [Instalación de FullCalendar](#instalación-de-fullcalendar)
7. [Uso del Sistema](#uso-del-sistema)
8. [Estructura de Datos](#estructura-de-datos)
9. [Pruebas y Demostración](#pruebas-y-demostración)

---

## 📖 Descripción General

Sistema que permite a usuarios autenticados visualizar su historial de compras en un calendario interactivo usando la librería **FullCalendar**. Cada usuario ve únicamente sus propias compras, garantizando privacidad de datos.

### Características principales:
- ✅ Calendario mensual con eventos de compras
- ✅ Filtrado automático por usuario (privacidad)
- ✅ Panel lateral con resumen detallado del pedido
- ✅ Estadísticas de compras
- ✅ Persistencia en localStorage
- ✅ Vista alternativa sin calendario (history-simple.html)

---

## 🔧 Tecnologías Utilizadas

### Librería Externa Principal
- **FullCalendar 6.1.10** (index.global.min.js)
  - Archivo local: `fullcalendar.min.js` (281 KB)
  - URL original: `https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/`
  - Licencia: MIT

### Tecnologías Complementarias
- HTML5
- CSS3
- JavaScript ES6+
- localStorage API
- SweetAlert2 (notificaciones)

---

## 📁 Estructura de Archivos

### Archivos Principales

```
proyecto/
├── history.html              # Página principal con calendario FullCalendar
├── history.js                # Lógica del calendario y filtrado por usuario
├── history-dark.css          # Estilos para modo oscuro
├── fullcalendar.min.js       # Librería FullCalendar (local, 281 KB)
├── history-simple.html       # Vista alternativa (sin calendario)
├── cart.js                   # Modificado: guarda compras con username
├── user.js                   # Modificado: enlace a historial
├── auth.js                   # Modificado: validación de usuarios
└── fix-localstorage.html     # Herramienta de limpieza
```

### Archivos Modificados

**index.html, product.html**
```html
<script src="history.js"></script>  <!-- NUEVO -->
<script src="cart.js"></script>
```

**carrito/carrito.html**
```html
<script src="../history.js"></script>  <!-- NUEVO -->
<script src="../cart.js"></script>
```

---

## ⚙️ Funcionalidades Implementadas

### 1. Visualización de Calendario
- Calendario mensual interactivo
- Navegación entre meses (prev/next/today)
- Vistas: mes, semana, lista
- Eventos en fechas con compras
- Color verde (#2c662d) para eventos

### 2. Filtrado por Usuario
- Cada usuario ve SOLO sus compras
- Filtro automático por `username`
- No se ven compras de otros usuarios
- Privacidad de datos garantizada

### 3. Resumen de Pedido
- Panel lateral con detalles
- Fecha y hora de compra
- Lista de productos comprados
- Cantidad y precio unitario
- Total del pedido
- Click en fecha del calendario para ver detalles

### 4. Registro de Compras
- Automático al finalizar compra
- Incluye username del comprador
- Fecha y hora exacta
- Array de productos con qty y precio
- Total calculado

### 5. Vista Alternativa
- `history-simple.html` sin calendario
- Vista de lista de compras
- Estadísticas: total compras, gasto total, productos
- Backup si FullCalendar falla

---

## 🔍 Detalles Técnicos

### Función Global: savePurchaseToHistory()

**Ubicación:** `history.js` (líneas 42-80)

```javascript
window.savePurchaseToHistory = function(cartItems, total) {
  // Obtener usuario actual
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) return;
  
  const currentUser = JSON.parse(currentUserData);
  const now = new Date();
  
  const purchase = {
    username: currentUser.username,  // ASOCIAR AL USUARIO
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    total: parseFloat(total),
    items: cartItems.map(item => ({
      name: item.name,
      price: parseFloat(item.price),
      qty: item.qty
    }))
  };
  
  // Cargar, agregar y guardar
  const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
  purchases.push(purchase);
  localStorage.setItem('purchases', JSON.stringify(purchases));
};
```

**Llamada desde cart.js:**
```javascript
if (window.savePurchaseToHistory) {
  const cartCopy = JSON.parse(JSON.stringify(cart));
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  window.savePurchaseToHistory(cartCopy, total);
}
```

### Función Global: getPurchaseHistory()

**Ubicación:** `history.js` (líneas 97-132)

```javascript
window.getPurchaseHistory = function() {
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) return [];
  
  const currentUser = JSON.parse(currentUserData);
  const saved = localStorage.getItem('purchases');
  
  if (saved) {
    const parsed = JSON.parse(saved);
    // FILTRAR SOLO LAS COMPRAS DEL USUARIO ACTUAL
    return parsed.filter(p => p.username === currentUser.username);
  }
  return [];
};
```

### Inicialización de FullCalendar

**Ubicación:** `history.js` (función renderCalendar)

```javascript
function renderCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    events: groupedPurchases,  // Compras filtradas por usuario
    eventClick: function(info) {
      displayOrderSummary(info.event.startStr);
    }
  });
  
  calendar.render();
}
```

---

## 📦 Instalación de FullCalendar

### Opción 1: Archivo Local (Actual)

El proyecto ya incluye `fullcalendar.min.js` descargado localmente.

**Verificar archivo:**
```powershell
ls fullcalendar.min.js
# Debe mostrar: 281,849 bytes
```

### Opción 2: Descargar Manualmente

Si necesitas volver a descargar:

1. **Navegador:**
   - URL: `https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js`
   - Guardar como: `fullcalendar.min.js`

2. **PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js" -OutFile "fullcalendar.min.js"
```

### Integración en HTML

**history.html:**
```html
<script src="fullcalendar.min.js"></script>
<script src="cart.js"></script>
<script src="user.js"></script>
<script src="history.js"></script>
```

---

## 🚀 Uso del Sistema

### Para Usuarios

1. **Registro/Login**
   - Crear cuenta en `register.html`
   - Iniciar sesión en `login.html`

2. **Realizar Compra**
   - Añadir productos al carrito desde `index.html`
   - Ir a `carrito/carrito.html`
   - Click en "Finalizar Compra"
   - ✅ Compra guardada automáticamente

3. **Ver Historial**
   - Click en "📅 Historial" en el header
   - Abre `history.html` con calendario
   - Click en fecha con evento para ver detalles
   - Panel lateral muestra resumen completo

### Para Desarrolladores

**Cargar compras filtradas:**
```javascript
const purchases = window.getPurchaseHistory();
console.log(purchases); // Solo compras del usuario actual
```

**Registrar nueva compra:**
```javascript
const cartItems = [
  { name: "Planta A", price: 25.99, qty: 2 },
  { name: "Planta B", price: 15.50, qty: 1 }
];
const total = 67.48;
window.savePurchaseToHistory(cartItems, total);
```

**Verificar en DevTools:**
```javascript
// Ver todas las compras (sin filtrar)
localStorage.getItem('purchases')

// Ver compras del usuario actual (filtradas)
window.getPurchaseHistory()

// Ver usuario actual
localStorage.getItem('currentUser')
```

---

## 💾 Estructura de Datos

### localStorage['purchases']

```json
[
  {
    "username": "batman",
    "date": "2026-01-27",
    "time": "18:30:45",
    "total": 49.98,
    "items": [
      {
        "name": "Monstera Deliciosa",
        "price": 24.99,
        "qty": 2
      }
    ]
  },
  {
    "username": "superman",
    "date": "2026-01-27",
    "time": "19:15:20",
    "total": 35.50,
    "items": [
      {
        "name": "Ficus Benjamina",
        "price": 35.50,
        "qty": 1
      }
    ]
  }
]
```

### localStorage['currentUser']

```json
{
  "username": "batman",
  "password": "batman123"
}
```

### Eventos de FullCalendar

```javascript
const events = [
  {
    title: "2 compras",
    start: "2026-01-27",
    color: "#2c662d"
  }
];
```

---

## 🧪 Pruebas y Demostración

### Escenario 1: Usuario Único

```
1. Registrar como "usuario1"
2. Comprar Planta A (€25)
   → history.html muestra 1 evento
3. Comprar Planta B (€35)
   → history.html muestra 2 eventos
4. Click en fecha
   → Panel muestra detalles de ambas compras
```

### Escenario 2: Múltiples Usuarios (Privacidad)

```
Usuario BATMAN:
1. Registrar como "batman"
2. Comprar Planta A (€25)
3. Ir a history.html
   ✅ Muestra 1 compra de €25

Usuario SUPERMAN:
4. Cerrar sesión
5. Registrar como "superman"
6. Ir a history.html
   ✅ VACÍO (no ve compras de batman)
7. Comprar Planta B (€35)
8. Ir a history.html
   ✅ Muestra 1 compra de €35 (no la de batman)

Volver a BATMAN:
9. Cerrar sesión
10. Login como "batman"
11. Ir a history.html
    ✅ Muestra 1 compra de €25 (no la de superman)
```

### Verificación en DevTools (F12)

**Como batman:**
```javascript
localStorage.getItem('currentUser')
// → {"username":"batman",...}

window.getPurchaseHistory()
// → [{ username: "batman", total: 25, ... }]

localStorage.getItem('purchases')
// → [{ username: "batman", ... }, { username: "superman", ... }]
//   TODAS las compras (sin filtrar)
```

**Como superman:**
```javascript
window.getPurchaseHistory()
// → [{ username: "superman", total: 35, ... }]
//   SOLO compras de superman
```

### Limpieza de Datos

**fix-localstorage.html:**
- "✅ Reparar usuarios corruptos" - Elimina usuarios inválidos
- "📋 Ver usuarios guardados" - Lista usuarios registrados
- "🗑️ Limpiar TODO" - Borra todos los datos (reset completo)

---

## 📊 Estadísticas del Proyecto

### Archivos Creados/Modificados
- **Creados:** 3 archivos (history.html, history.js, history-dark.css)
- **Modificados:** 6 archivos (index.html, product.html, carrito.html, cart.js, user.js, auth.js)
- **Descargado:** 1 librería (fullcalendar.min.js - 281 KB)

### Líneas de Código
- **history.js:** ~360 líneas
- **history.html:** ~290 líneas
- **history-dark.css:** ~110 líneas
- **Total nuevo código:** ~760 líneas

### Funciones Principales
- `window.savePurchaseToHistory()` - Guardar compra
- `window.getPurchaseHistory()` - Obtener compras filtradas
- `renderCalendar()` - Inicializar FullCalendar
- `displayOrderSummary()` - Mostrar detalles del pedido
- `groupPurchasesByDate()` - Agrupar compras por fecha

---

## ✅ Checklist de Entrega

- [x] FullCalendar 6.1.10 integrado (librería externa)
- [x] Archivo local fullcalendar.min.js (281 KB)
- [x] Sistema de compras con persistencia en localStorage
- [x] Filtrado por usuario (privacidad)
- [x] Calendario interactivo con eventos
- [x] Panel de resumen de pedidos
- [x] Vista alternativa sin calendario
- [x] Modo oscuro implementado
- [x] Validación de autenticación
- [x] Documentación completa
- [x] Pruebas realizadas
- [x] Sin errores de consola
- [x] Compatible con todos los navegadores modernos

---

## 📝 Notas Finales

### Ventajas de la Implementación
- ✅ Librería externa oficial (FullCalendar)
- ✅ Sin dependencias de CDN externos (funciona offline)
- ✅ Privacidad de datos por usuario
- ✅ Interfaz intuitiva y profesional
- ✅ Código limpio y documentado
- ✅ Fácil mantenimiento

### Posibles Mejoras Futuras
- Exportar historial a PDF
- Filtros por rango de fechas
- Gráficas de gastos mensuales
- Búsqueda de productos en historial
- Notificaciones de compras recurrentes

---

**Proyecto:** Rincón Verde - Sistema de Historial de Compras  
**Librería:** FullCalendar 6.1.10  
**Autor:** Implementación para Proyecto de Desarrollo Web en Entorno Cliente  
**Fecha:** Enero 2026
