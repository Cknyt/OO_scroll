document.addEventListener('DOMContentLoaded', function () {

  // --- MENÚ DESPLEGABLE DEL USUARIO ---
  const userMenuButton = document.getElementById('user-menu-button');
  const dropdownMenu = document.getElementById('dropdown-menu');
  if (userMenuButton) {
    userMenuButton.addEventListener('click', function (event) {
      event.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });
  }
  window.addEventListener('click', function (event) {
    if (dropdownMenu && !userMenuButton.contains(event.target)) {
      dropdownMenu.classList.remove('show');
    }
  });




// --- NAVEGACIÓN CON GRUPOS DE VISIBILIDAD ------------------------------
const navLinks  = document.querySelectorAll('.main-nav a');
const sections  = document.querySelectorAll('.page-section');

/* agrupaciones */
const GROUP_AFC   = ['aula','foro','comunidad'];  // se cargan juntas
const GROUP_TIENDA= ['tienda'];                   // solo tienda
const GROUP_ME    = ['mi-espacio'];               // solo mi-espacio

function showGroup(targetId){
  /* 1. ¿qué grupo debo mostrar? */
  let visibleIds = [];
  if (GROUP_AFC.includes(targetId)){      visibleIds = GROUP_AFC; }
  else if (GROUP_TIENDA.includes(targetId)){ visibleIds = GROUP_TIENDA; }
  else if (GROUP_ME.includes(targetId)){      visibleIds = GROUP_ME; }

  /* 2. ocultar/mostrar secciones */
  sections.forEach(sec=>{
    if (visibleIds.includes(sec.id)){ sec.classList.remove('page-hidden'); }
    else                             { sec.classList.add   ('page-hidden'); }
  });

  /* 3. marcar menú activo */
  navLinks.forEach(link=>{
    link.classList.toggle('active', link.getAttribute('href')===`#${targetId}`);
  });

  /* 4. desplazar suavemente hacia la sección elegida */
  document.getElementById(targetId)?.scrollIntoView({behavior:'smooth',block:'start'});

    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
    cartPanel.style.display = (targetId === 'tienda') ? 'flex' : 'none';
    }
}

    /* Al cargar la página – usa el hash si existe o cae por defecto en Aula */

    const first = window.location.hash ? window.location.hash.slice(1) : 'aula';
    showGroup(first);

    if (!window.location.hash) {
        const banner = document.getElementById('banner-sorteo');
        if (banner) {
            setTimeout(() => {
            const y = banner.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: y - 120, // sube un poco más por si hay cabecera
                behavior: 'smooth'
            });
            }, 300);
        }
    }



    /* Clic en el menú: evita el scroll nativo y llama a showGroup */
    navLinks.forEach(link=>{
        link.addEventListener('click',e=>{
            e.preventDefault();
            const id = link.getAttribute('href').slice(1);
            showGroup(id);
            history.replaceState(null,'',`#${id}`);   // mantiene el hash en la URL
        });
    });







  // --- CARRUSELES REUTILIZABLES ---
  function initCarousel(trackSel, prevSel, nextSel, cardSel, visible = 3) {
    const track = document.querySelector(trackSel);
    const prev = document.querySelector(prevSel);
    const next = document.querySelector(nextSel);
    let cards = [...document.querySelectorAll(cardSel)];
    let index = 0;

    function updateCards() {
      cards = [...document.querySelectorAll(cardSel)].filter(c => c.style.display !== 'none');
      index = Math.min(index, Math.max(cards.length - visible, 0));
    }

    function slide() {
      if (!cards.length) return;
      const w = cards[0].offsetWidth +
        parseFloat(getComputedStyle(cards[0]).marginLeft) +
        parseFloat(getComputedStyle(cards[0]).marginRight);
      track.style.transform = `translateX(-${index * w}px)`;
    }

    next?.addEventListener('click', () => {
      updateCards();
      index = (index >= cards.length - visible) ? 0 : index + 1;
      slide();
    });

    prev?.addEventListener('click', () => {
      updateCards();
      index = (index <= 0) ? Math.max(cards.length - visible, 0) : index - 1;
      slide();
    });

    window.addEventListener('resize', slide);
    return {
      reset() { index = 0; slide(); },
      refresh() { updateCards(); slide(); }
    };
  }

  const comunidadCarousel = initCarousel(
    '.recommendation-carousel-track',
    '.rec-prev',
    '.rec-next',
    '.recommendation-card'
  );
  initCarousel('.course-carousel-track', '.carousel-button.prev', '.carousel-button.next', '.course-card');

  // --- FILTROS DE COMUNIDAD ---
  const themeSel = document.getElementById('filter-theme');
  const suppSel = document.getElementById('filter-support');
  const orderSel = document.getElementById('filter-order');
  const searchInp = document.getElementById('filter-search');
  const track = document.querySelector('.recommendation-carousel-track');

  function applyFilters() {
    const theme = themeSel.value.toLowerCase();
    const supp = suppSel.value.toLowerCase();
    const order = orderSel.value;
    const query = searchInp.value.trim().toLowerCase();
    const cards = [...track.querySelectorAll('.recommendation-card')];

    cards.forEach(card => {
      const cardTheme = (card.dataset.theme || '').toLowerCase();
      const cardSupp = (card.dataset.support || '').toLowerCase();
      const text = card.textContent.toLowerCase();
      const okTheme = theme === 'todo' || cardTheme === theme;
      const okSupp = supp === 'todo' || cardSupp === supp;
      const okQuery = !query || text.includes(query);
      card.style.display = (okTheme && okSupp && okQuery) ? '' : 'none';
    });

    const visibles = cards.filter(c => c.style.display !== 'none');
    visibles.sort((a, b) => {
      if (order === 'likes') return +b.dataset.likes - +a.dataset.likes;
      if (order === 'new') return new Date(b.dataset.date) - new Date(a.dataset.date);
      return new Date(a.dataset.date) - new Date(b.dataset.date);
    });
    visibles.forEach(card => track.appendChild(card));
    comunidadCarousel.reset();
    comunidadCarousel.refresh();
  }

  [themeSel, suppSel, orderSel].forEach(el => el.addEventListener('change', applyFilters));
  searchInp.addEventListener('input', applyFilters);
  applyFilters();

  // --- NUEVA RECOMENDACIÓN ---
  const newTheme = document.getElementById('new-theme');
  const newSupport = document.getElementById('new-support');
  const newTitle = document.getElementById('new-title');
  const newAuthor = document.getElementById('new-author');
  const newComment = document.getElementById('new-comment');
  const sendBtn = document.getElementById('btn-add-rec');
  const resultPar = document.getElementById('rec-resultado');

  const iconMap = {
    Libro: 'book-open',
    Película: 'film',
    Video: 'video',
    Podcast: 'podcast',
    Serie: 'tv',
    Otros: 'star'
  };

    function launchFireworkConfetti() {
        var count = 200;
        var defaults = { origin: { y: 0.7 }, colors: ['#D90429'] }; // rojo OOO
        function fire(particleRatio, opts) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }


    function heartLikeHandler(e) {
        const span = e.currentTarget;
        const text = span.textContent.trim();
        const match = text.match(/\d+/);  // busca número visible
        const currentLikes = match ? parseInt(match[0]) : 0;
        const newLikes = currentLikes + 1;

        span.dataset.likes = newLikes;
        span.innerHTML = `<i class="fa-solid fa-heart"></i> ${newLikes}`;
        showHeartConfetti(e.clientX, e.clientY);
    }


  sendBtn.addEventListener('click', () => {
    const theme = newTheme.value;
    const support = newSupport.value;
    const title = newTitle.value.trim();
    const author = newAuthor.value.trim();
    const comment = newComment.value.trim();

    if (!theme || !support || !title || !author || !comment) {
      resultPar.textContent = 'Por favor, completa todos los campos.';
      resultPar.style.color = 'red';
      return;
    }

    const art = document.createElement('article');
    art.className = 'recommendation-card';
    art.dataset.theme = theme;
    art.dataset.support = support;
    art.dataset.likes = '0';
    art.dataset.date = new Date().toISOString().slice(0, 10);
    art.innerHTML = `
      <div class="rec-icon"><i class="fa-solid fa-${iconMap[support] || 'star'}"></i></div>
      <h3>${title}</h3>
      <p class="rec-author">${support} de ${author}</p>
      <p class="rec-comment">"${comment}"</p>
      <div class="rec-footer">
        <span>Recomendado por ${author}</span>
        <span class="rec-likes" data-likes="0"><i class="fa-solid fa-heart"></i> 0</span>
      </div>`;
    track.insertBefore(art, track.firstChild);
    art.querySelector('.rec-likes').addEventListener('click', heartLikeHandler);
    comunidadCarousel.refresh();
    applyFilters?.();
    setTimeout(() => {
      resultPar.textContent = '¡Gracias por tu aporte! Has ganado 50 puntos.';
      resultPar.style.color = 'black';
      resultPar.style.display = 'block';
      resultPar.style.opacity = '1';
    }, 100);
    launchFireworkConfetti();
    sumarPuntos(50);
    newTheme.value = newSupport.value = '';
    newTitle.value = newAuthor.value = newComment.value = '';
  });

  document.querySelectorAll('.rec-likes').forEach(span => {
    span.addEventListener('click', heartLikeHandler);
  });

    // === RUTINAS: cambio de tipo → categoría ===
    document.getElementById('tipo')?.addEventListener('change', function () {
    const categoria = document.getElementById('categoria');
    const tipo = this.value;
    const opcionesIndoor = ['Spinning', 'Yoga', 'Crossfit'];
    const opcionesOutdoor = ['Running', 'Ciclismo', 'Senderismo'];

    categoria.innerHTML = '<option value="">Selecciona</option>';

    if (tipo === 'indoor') {
        opcionesIndoor.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op.toLowerCase();
        opt.textContent = op;
        categoria.appendChild(opt);
        });
        categoria.disabled = false;
    } else if (tipo === 'outdoor') {
        opcionesOutdoor.forEach(op => {
        const opt = document.createElement('option');
        opt.value = op.toLowerCase();
        opt.textContent = op;
        categoria.appendChild(opt);
        });
        categoria.disabled = false;
    } else {
        categoria.disabled = true;
        categoria.innerHTML = '<option value="">Selecciona tipo primero</option>';
    }
    });

    // === RUTINAS: botón calcular ===
    document.getElementById('btn-calcular')?.addEventListener('click', function () {
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const frecuencia = document.getElementById('frecuencia').value;
    const duracion = document.getElementById('duracion').value;
    const resultado = document.getElementById('resultado');

    if (!tipo || !categoria || !frecuencia || !duracion) {
        resultado.textContent = 'Por favor, completa todos los campos.';
        resultado.style.color = 'red';
        return;
    }

    const puntos = parseInt(frecuencia) * parseInt(duracion) * 0.1;
    resultado.textContent = `Has ganado ${Math.round(puntos)} puntos.`;
    sumarPuntos(Math.round(puntos));

    resultado.style.color = 'black';
    launchFireworkConfetti();
    document.getElementById('tipo').value = '';
    document.getElementById('categoria').innerHTML = '<option value="">Selecciona tipo primero</option>';
    document.getElementById('categoria').disabled = true;
    document.getElementById('frecuencia').value = '';
    document.getElementById('duracion').value = '';
    });

    // === PRUEBAS DEPORTIVAS: botón enviar ===
    document.getElementById('enviar-prueba')?.addEventListener('click', () => {
    const descripcion = document.getElementById('descripcion').value.trim();
    const archivo = document.getElementById('foto-prueba').files[0];
    const mensaje = document.getElementById('mensaje-confirmacion');

    if (!descripcion) {
        mensaje.textContent = 'Por favor, añade una descripción.';
        mensaje.style.color = 'red';
        return;
    }

    mensaje.textContent = '¡Gracias por subir tu prueba! Has ganado 40 puntos.';
    sumarPuntos(40);
    mensaje.style.color = 'black';
    launchFireworkConfetti();
    document.getElementById('descripcion').value = '';
    document.getElementById('foto-prueba').value = '';
    });
    

    function showHeartConfetti(clientX, clientY) {
    const x = clientX / window.innerWidth;
    const y = clientY / window.innerHeight;

    const settings = {
        particleCount: 80,
        spread: 140,
        origin: { x, y },
        colors: ['#ff4d6d', '#ff85a1', '#ffc1cc', '#ff69b4'],
        shapes: ['circle'],
        scalar: 1.6,
        gravity: 0.3,
        ticks: 250  // duración de la animación (más alto = más largo)
    };

    // Lanza múltiples ráfagas con delay
    for (let i = 0; i < 5; i++) {
        setTimeout(() => confetti(settings), i * 200);  // una cada 200 ms
    }
    }





    // --- CARRITO, STOCK, PUNTOS Y CANJEAR CON SUCURSAL ---

    /* Elementos básicos del panel */
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalEl       = document.getElementById('cart-total');
    const pointsLeftEl      = document.getElementById('points-left');
    const redeemBtn         = document.querySelector('#cart-panel .btn-action');
    const userPointsEl      = document.querySelector('.user-points');


    /* Leer puntos disponibles del span .user-points (ej. "1.200 puntos") */
    const userPointsText       = document.querySelector('.user-points')?.textContent || '0';
    let totalPointsAvailable = parseInt(userPointsText.replace(/\./g, '').match(/\d+/)[0]) || 0;

    /* Lista de sucursales (puedes cambiar o cargar dinámicamente) */
    const branches = [
    'Madrid - Sol',
    'Barcelona - Gràcia',
    'Bilbao - Casco Viejo',
    'Valencia - Ruzafa'
    ];

    /* --------------------------------------------------------------------------------- */
    /* UTILIDADES                                                                       */
    /* --------------------------------------------------------------------------------- */

    /* Precio del producto leído del texto "750 Puntos" */
    function getProductCost(card) {
    const priceText = card.querySelector('.product-price')?.textContent || '';
    const match     = priceText.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
    }

    /* Recalcula totales y actualiza la UI */
    function updateCartSummary() {
        let total = 0;

        [...cartItemsContainer.children].forEach(item => {
            const name  = item.dataset.name;
            const count = parseInt(item.dataset.count);
            const card  = [...document.querySelectorAll('.product-card')]
                            .find(c => c.querySelector('h3')?.textContent.trim() === name);
            total += count * getProductCost(card);
        });

        cartTotalEl.textContent  = total;
        pointsLeftEl.textContent = totalPointsAvailable - total;

        // 🔄 Actualiza también la cabecera
        userPointsEl.textContent = `${(totalPointsAvailable - total).toLocaleString()} puntos`;

    }

    /* Asigna el manejador para el botón "−" dentro de un ítem del carrito */
    function addRemoveHandler(itemDiv, stockEl) {
    itemDiv.querySelector('.btn-remove').addEventListener('click', () => {
        let count = parseInt(itemDiv.dataset.count) - 1;

        /* Devolver 1 al stock */
        const stockNow = parseInt(stockEl.textContent.match(/\d+/)[0]) + 1;
        stockEl.textContent = `Stock: ${stockNow} unidades`;

        if (count <= 0) {
        itemDiv.remove();
        } else {
        itemDiv.dataset.count = count;
        itemDiv.querySelector('.item-qty').textContent = `x${count}`;
        }

        updateCartSummary();
    });
    }

    /* --------------------------------------------------------------------------------- */
    /* BOTÓN "SELECCIONAR" EN CADA PRODUCTO                                             */
    /* --------------------------------------------------------------------------------- */

    document.querySelectorAll('#tienda .btn-redeem').forEach(btn => {
    btn.textContent = 'Seleccionar';

    btn.addEventListener('click', () => {
        const card    = btn.closest('.product-card');
        const name    = card.querySelector('h3')?.textContent.trim();
        const stockEl = card.querySelector('.product-stock');
        let   stock   = parseInt(stockEl.textContent.match(/\d+/)[0]);

        const cost           = getProductCost(card);
        const currentTotal   = parseInt(cartTotalEl.textContent);
        const wouldBeTotal   = currentTotal + cost;

        /* Saldo insuficiente */
        if (wouldBeTotal > totalPointsAvailable) {
        alert('No dispones de puntos suficientes para este producto.');
        return;
        }

        /* Stock agotado */
        if (stock <= 0) {
        alert('Este producto está agotado.');
        return;
        }

        /* Restar del stock y actualizar */
        stockEl.textContent = `Stock: ${stock - 1} unidades`;

        /* ¿Ya está en el carrito? */
        const existing = [...cartItemsContainer.children]
                        .find(el => el.dataset.name === name);

        if (existing) {
        const newCount = parseInt(existing.dataset.count) + 1;
        existing.dataset.count = newCount;
        existing.querySelector('.item-qty').textContent = `x${newCount}`;
        } else {
        const itemDiv = document.createElement('div');
        itemDiv.className   = 'cart-item';
        itemDiv.dataset.name  = name;
        itemDiv.dataset.count = 1;
        itemDiv.innerHTML = `
            <span>${name}</span>
            <span>
            <span class="item-qty">x1</span>
            <button class="btn-remove" title="Eliminar uno">−</button>
            </span>
        `;
        cartItemsContainer.appendChild(itemDiv);
        addRemoveHandler(itemDiv, stockEl);        // botón "−"
        }

        updateCartSummary();
    });
    });

    /* --------------------------------------------------------------------------------- */
    /* FLUJO BOTÓN "CANJEAR" – ELEGIR SUCURSAL                                           */
    /* --------------------------------------------------------------------------------- */

    let branchSelect;   // <select> que se mostrará cuando sea necesario
    let cartMsg;        // <p> de mensajes al usuario
    let lastClickX = 0;
    let lastClickY = 0;

    redeemBtn.addEventListener('click', (e) => {
        lastClickX = e.clientX;
        lastClickY = e.clientY;

        // Si ya se ha completado el pedido → limpiar todo
        if (redeemBtn.textContent === 'Hecho') {
            // 1. Vaciar carrito
            cartItemsContainer.innerHTML = '';

            // 2. Resetear stock
            document.querySelectorAll('.product-card').forEach(card => {
                const stockEl = card.querySelector('.product-stock');
                const originalStock = stockEl.dataset.originalStock;
                if (originalStock) {
                    stockEl.textContent = `Stock: ${originalStock} unidades`;
                }
            });

            // 3. Actualizar puntos a los que quedaban
            const pointsLeft = parseInt(pointsLeftEl.textContent) || 0;
            totalPointsAvailable = pointsLeft;

            cartTotalEl.textContent  = '0';
            pointsLeftEl.textContent = totalPointsAvailable;
            userPointsEl.textContent = `${totalPointsAvailable.toLocaleString()} puntos`;

            // 4. Eliminar sucursal y mensaje
            if (branchSelect) {
                branchSelect.remove();
                branchSelect = null;
            }
            if (cartMsg) {
                cartMsg.remove();
                cartMsg = null;
            }

            // 5. Restaurar botón
            redeemBtn.disabled = false;
            redeemBtn.textContent = 'Canjear';
            return;
        }

        // Si no hay productos en la cesta
        if (parseInt(cartTotalEl.textContent) === 0) {
            alert('Añade algún producto antes de canjear.');
            return;
        }

        // Primera vez → mostrar sucursales
        if (!branchSelect) {
            branchSelect = document.createElement('select');
            branchSelect.id = 'branch-select';
            branchSelect.innerHTML = `
                <option value="">Selecciona sucursal...</option>
                ${branches.map(b => `<option value="${b}">${b}</option>`).join('')}
            `;
            branchSelect.style.margin = '0.5rem 0';

            cartMsg = document.createElement('p');
            cartMsg.id    = 'cart-message';
            cartMsg.style.fontSize = '0.9rem';
            cartMsg.style.color    = 'var(--primary-red)';
            cartMsg.style.textAlign = 'center';
            cartMsg.textContent = 'Selecciona tu sucursal y pulsa de nuevo "Canjear".';

            redeemBtn.parentNode.insertBefore(branchSelect, redeemBtn);
            redeemBtn.parentNode.insertBefore(cartMsg, redeemBtn);
            return;
        }

        // Si no ha elegido sucursal aún
        if (branchSelect.value === '') {
            cartMsg.textContent = '⚠️ Debes elegir una sucursal antes de continuar.';
            return;
        }

        // 🎊 Mostrar confeti justo antes del mensaje
        confetti({
            particleCount: 120,
            spread: 80,
            origin: {
                x: lastClickX / window.innerWidth,
                y: lastClickY / window.innerHeight
            },
            colors: ['#c8001a'] // Rojo brillante (puedes cambiarlo por otro tono si prefieres)
        });

        // Asegurar que el canvas esté por encima del carrito
        setTimeout(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.classList.add('confetti-canvas');
            }
        }, 0);


        // ✅ Pedido completado
        cartMsg.textContent = `🎉 Enhorabuena, pedido completado. Te llegará a la sucursal "${branchSelect.value}" con tu nombre lo antes posible.`;
        branchSelect.disabled = true;
        redeemBtn.textContent = 'Hecho';
    });

    function sumarPuntos(cantidad) {
        totalPointsAvailable += cantidad;

        // Actualizar texto de cabecera
        userPointsEl.textContent = `${totalPointsAvailable.toLocaleString()} puntos`;

        // Actualizar panel de tienda si está visible
        const pointsLeftEl = document.getElementById('points-left');
        if (pointsLeftEl) {
            const currentCartTotal = parseInt(document.getElementById('cart-total')?.textContent || '0');
            pointsLeftEl.textContent = totalPointsAvailable - currentCartTotal;
        }
    }





});