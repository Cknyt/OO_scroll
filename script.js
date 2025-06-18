document.addEventListener('DOMContentLoaded', function() {

    // --- FUNCIONALIDAD PARA EL MENÚ DESPLEGABLE DEL USUARIO (se mantiene) ---
    const userMenuButton = document.getElementById('user-menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (userMenuButton) {
        userMenuButton.addEventListener('click', function(event) {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }
    window.addEventListener('click', function(event) {
        if (dropdownMenu && !userMenuButton.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // --- NUEVA FUNCIONALIDAD: SCROLLSPY PARA LA NAVEGACIÓN ---
    const navLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('.page-section');
    // Obtenemos la altura del header para calcular los offsets correctamente
    const headerHeight = document.querySelector('.main-header').offsetHeight;

    // Función que se ejecutará cada vez que el usuario haga scroll
    function highlightNavOnScroll() {
        let scrollPosition = window.scrollY;

        // Iteramos sobre cada sección para ver cuál está en pantalla
        sections.forEach(section => {
            // La sección está en pantalla si el scroll está entre su inicio y su fin
            // Se resta el alto del header para que el cambio ocurra cuando la sección toca el header
            const sectionTop = section.offsetTop - headerHeight - 20; // -20 para un pequeño margen de error
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Si estamos en la sección, encontramos su enlace correspondiente
                const targetId = section.getAttribute('id');
                const targetLink = document.querySelector(`.main-nav a[href="#${targetId}"]`);
                
                // Quitamos la clase 'active' de todos los enlaces
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Añadimos la clase 'active' solo al enlace de la sección actual
                if (targetLink) {
                    targetLink.classList.add('active');
                }
            }
        });
    }

    // Escuchamos el evento 'scroll' en la ventana
    window.addEventListener('scroll', highlightNavOnScroll);
});