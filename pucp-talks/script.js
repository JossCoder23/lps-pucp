document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.bloque3InfoCards__item');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Solo ejecutamos el click si la pantalla es menor a 1024px (Mobile/Tablet)
            // En desktop dejamos que el CSS :hover haga el trabajo
            if (window.innerWidth < 1024) {
                card.classList.toggle('is-flipped');
            }
        });
    });


    const inputBusqueda = document.querySelector('.bloque3Carreras__lupa input');
    const bloquesSemana = document.querySelectorAll('.bloque3CarrerasContent__ct');

    // Función auxiliar para quitar tildes y pasar todo a minúsculas
    const normalizarTexto = (texto) => {
        return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // 2. Escuchamos el evento 'input' (cada vez que el usuario escribe o borra algo)
    inputBusqueda.addEventListener('input', (e) => {
        // Obtenemos el texto del buscador normalizado (sin tildes y en minúsculas)
        const textoBuscado = normalizarTexto(e.target.value);

        // 3. Recorremos cada bloque de semana
        bloquesSemana.forEach(bloque => {
            // Buscamos todas las carreras DENTRO de esta semana específica
            const carreras = bloque.querySelectorAll('.bloque3CtInfo__bottom h3');
            let contieneBusqueda = false;

            // 4. Revisamos cada carrera para ver si coincide con la búsqueda
            carreras.forEach(carrera => {
                const textoCarrera = normalizarTexto(carrera.textContent);
                
                // Si el texto de la carrera incluye lo que escribimos en el input
                if (textoCarrera.includes(textoBuscado)) {
                    contieneBusqueda = true;
                }
            });

            // 5. Mostramos u ocultamos el bloque completo de la semana
            if (contieneBusqueda) {
                bloque.style.display = ''; // Vuelve a su valor por defecto (visible)
            } else {
                bloque.style.display = 'none'; // Se oculta
            }
        });
    });

    const preguntas = document.querySelectorAll(".bloque4Item__pregunta");

    // Novedad: Inicializar la pregunta que ya viene con la clase "open" en tu HTML
    const abiertaPorDefecto = document.querySelector(".bloque4Item__respuesta.open");
    if(abiertaPorDefecto) {
        abiertaPorDefecto.style.maxHeight = abiertaPorDefecto.scrollHeight + "px";
        abiertaPorDefecto.style.opacity = 1;
    }

    preguntas.forEach((pregunta) => {
        pregunta.addEventListener("click", () => {
            const itemActual = pregunta.closest(".bloque4__item");
            const respuestaActual = itemActual.querySelector(".bloque4Item__respuesta");
            const spanActual = pregunta.querySelector("span");

            const estaAbierto = respuestaActual.classList.contains("open");

            // 1. Cerramos TODAS las respuestas con animación
            document.querySelectorAll(".bloque4Item__respuesta").forEach((respuesta) => {
                respuesta.classList.remove("open");
                respuesta.classList.add("close");
                
                // Quitamos el max-height para que regrese a 0 (por el CSS)
                respuesta.style.maxHeight = null; 
                respuesta.style.opacity = 0;
            });
            
            document.querySelectorAll(".bloque4Item__pregunta span").forEach((span) => {
                span.textContent = "+";
                span.style.transform = "rotate(0deg)"; // Reinicia el giro
            });

            // 2. Si la que clickeamos estaba cerrada, la abrimos con animación
            if (!estaAbierto) {
                respuestaActual.classList.remove("close");
                respuestaActual.classList.add("open");
                
                // scrollHeight calcula la altura exacta necesaria según el texto que contenga
                respuestaActual.style.maxHeight = respuestaActual.scrollHeight + "px"; 
                respuestaActual.style.opacity = 1;
                
                spanActual.textContent = "-";
                spanActual.style.transform = "rotate(180deg)"; // Efecto visual de voltereta
            }
        });
    });

    // FORMULARIO
    const form = document.querySelector('#my-form-pregrado');

    if (!form) {
        console.error('ERROR: No se encontró el formulario "#my-form-pregrado" en el DOM.');
        return;
    }

    console.log('JavaScript de Evento Padres cargado y formulario detectado.');

    form.addEventListener('submit', async (e) => {
        // Detiene la recarga de la página
        e.preventDefault(); 
        console.log('Envío interceptado en Evento Padres. Procesando datos...');

        // Gestión de estado del botón (UX)
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const originalText = submitBtn ? submitBtn.textContent : 'Enviar';
        
        if (submitBtn) {
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
        }

        // 2. RECOLECCIÓN DE DATA NATIVA
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());

        // =========================================================================
        // 3. OPTIMIZACIÓN CRUCIAL: INYECCIÓN DE IDENTIFICADOR DE CAMPAÑA
        // Asegura que Salesforce clasifique este Lead en "Evento Padres Ori"
        // =========================================================================
        // Nota: Asegúrate de que tu backend en Drupal esté preparado para leer esta key ('origin_landing')
        rawData.origin_landing = 'pucp-talks'; 
        // Si Salesforce te pide un ID de Campaña específico (tipo 701Hr000...), ponlo aquí:
        // rawData.campaign_id = '701Hr000000xxxxx'; 
        // =========================================================================

        const urlParams = new URLSearchParams(window.location.search);
        const defaults = window.DEFAULT_UTMS || {};
        
        rawData.utm_source = urlParams.get('utm_source') || defaults.source || '';
        rawData.utm_medium = urlParams.get('utm_medium') || defaults.medium || '';
        rawData.utm_campaign = urlParams.get('utm_campaign') || defaults.campaign || '';
        rawData.campaign = urlParams.get('campaign') || defaults.id || '';

        console.log('Payload final a enviar (incluyendo origen):', rawData);

        try {
            // Petición hacia nuestro backend único en Drupal
            const response = await fetch('/api/salesforce/admision/enviar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(rawData)
            });

            const result = await response.json();
            console.log('Respuesta recibida del backend:', result);

            if (response.ok) {
                // Éxito UX: Podrías redirigir a una Thank You Page aquí en lugar de un alert
                window.location.reload();

                // alert('¡Éxito! ' + (result.message || 'Datos procesados correctamente'));
                // form.reset();
                
                // // Si usas el autocompletado global, deberías resetear el borde del input visible manualmente
                // const searchColegio = document.getElementById('search-colegio');
                // if (searchColegio) searchColegio.style.borderColor = '';

            } else {
                console.error("Detalle del error del servidor:", result);
                alert('Contacte al administrador');
            }

        } catch (error) {
            console.error('Error crítico de red o fetch:', error);
            alert('No se pudo conectar con el endpoint de Drupal.');
        } finally {
            // Restauramos el botón
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    const selectCarreras = document.getElementById('career-1');

    if (selectCarreras) {
        // Deshabilitamos temporalmente mientras carga
        selectCarreras.disabled = true;
        selectCarreras.innerHTML = '<option value="" disabled selected>Cargando carreras...</option>';

        // Hacemos el llamado a tu API de Salesforce (la misma que usa el otro script)
        fetch('/api/salesforce/carreras')
            .then(response => {
                if (!response.ok) throw new Error('Error de red al cargar carreras');
                return response.json();
            })
            .then(data => {
                // Limpiamos y ponemos la opción por defecto
                selectCarreras.innerHTML = '<option value="" disabled selected>- Selecciona una carrera -</option>';

                // 'data' viene agrupado por facultades (las llaves del objeto)
                for (const [slugFacultad, listaCarreras] of Object.entries(data)) {
                    
                    // Creamos el grupo para la facultad
                    const optGroup = document.createElement('optgroup');
                    // Formateamos un poco el slug para que se vea como título (opcional)
                    optGroup.label = slugFacultad.toUpperCase().replace(/-/g, ' ');

                    // Iteramos las carreras de esta facultad y las agregamos al grupo
                    listaCarreras.forEach(carrera => {
                        const option = document.createElement('option');
                        option.value = carrera.codigo; // El código que espera tu backend
                        option.textContent = carrera.nombre; // El nombre visible para el usuario
                        optGroup.appendChild(option);
                    });

                    // Agregamos el grupo completo al select
                    selectCarreras.appendChild(optGroup);
                }

                // Habilitamos el select para que el usuario pueda interactuar
                selectCarreras.disabled = false;
            })
            .catch(error => {
                console.error('Error al precargar carreras:', error);
                selectCarreras.innerHTML = '<option value="" disabled selected>Error al cargar carreras</option>';
            });
    }

    const fechas = document.querySelectorAll('.bloque3CarrerasContent__ct--fecha');

    fechas.forEach(fecha => {
        fecha.addEventListener('click', function() {
            // Buscamos al contenedor padre principal de esa semana
            const contenedorPadre = this.closest('.bloque3CarrerasContent__ct');
            
            // Le ponemos o quitamos la clase 'is-active'
            contenedorPadre.classList.toggle('is-active');
        });
    });


    document.getElementById('btn-inscribirme1').addEventListener('click', () => {
        const formulario = document.getElementById('registro');
        
        // Hace el scroll suave hacia el elemento
        formulario.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' // Alinea el borde superior del form con la parte superior de la pantalla
        });
    });

    document.getElementById('btn-inscribirme2').addEventListener('click', () => {
        const formulario = document.getElementById('registro');
        
        // Hace el scroll suave hacia el elemento
        formulario.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' // Alinea el borde superior del form con la parte superior de la pantalla
        });
    });

    document.getElementById('btn-inscribirme3').addEventListener('click', () => {
        const formulario = document.getElementById('registro');
        
        // Hace el scroll suave hacia el elemento
        formulario.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' // Alinea el borde superior del form con la parte superior de la pantalla
        });
    });

});