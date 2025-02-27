// Configuración de Supabase
const SUPABASE_URL = 'https://joiayunvjnuvxofgnnch.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaWF5dW52am51dnhvZmdubmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzk0NjQsImV4cCI6MjA1NTcxNTQ2NH0.aJT8J6PQbf7a6-xYZytXUyh14-UDZpRuSJvgEmZIgtc';

// Crear el cliente de Supabase (una sola vez)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let jugadoresA = [];
let jugadoresB = [];
let partidoJSON = null;
let equipoActivo = 'a';
let estadisticasJugadores = {
    a: {},
    b: {}
};

// Función para actualizar la lista visual de jugadores
function actualizarListaJugadores(equipo) {
    const listaId = `lista-jugadores-${equipo}`;
    const lista = document.getElementById(listaId);
    const jugadores = equipo === 'a' ? jugadoresA : jugadoresB;
    
    lista.innerHTML = '';
    jugadores.forEach((jugador, index) => {
        const div = document.createElement('div');
        div.className = 'jugador-item';
        div.innerHTML = `
            <span>${jugador}</span>
            <button class="btn-eliminar-jugador" onclick="eliminarJugador('${equipo}', ${index})">❌</button>
        `;
        lista.appendChild(div);
    });
    
    // Inicializar estadísticas cuando se actualiza la lista
    inicializarEstadisticas();
    cargarTablaEstadisticas();
}

// Función para actualizar los nombres visuales de los equipos
function actualizarNombresEquipos() {
    const nombreA = document.getElementById('nombre-equipo-a').value || 'Equipo A';
    const nombreB = document.getElementById('nombre-equipo-b').value || 'Equipo B';
    
    // Verificar si hay duplicado
    if (nombreA.trim().toLowerCase() === nombreB.trim().toLowerCase() && nombreA !== 'Equipo A' && nombreB !== 'Equipo B') {
        alert('Los equipos no pueden tener el mismo nombre');
        // Restablecer el nombre que acaba de cambiar
        if (event && event.target.id === 'nombre-equipo-a') {
            document.getElementById('nombre-equipo-a').value = '';
            return;
        } else if (event && event.target.id === 'nombre-equipo-b') {
            document.getElementById('nombre-equipo-b').value = '';
            return;
        }
    }
    
    document.getElementById('nombre-visual-a').textContent = nombreA;
    document.getElementById('nombre-visual-b').textContent = nombreB;
    document.getElementById('titulo-jugadores-a').textContent = `Jugadores ${nombreA}`;
    document.getElementById('titulo-jugadores-b').textContent = `Jugadores ${nombreB}`;
}

// Función para eliminar jugadores
function eliminarJugador(equipo, index) {
    if (equipo === 'a') {
        const jugadorEliminado = jugadoresA[index];
        jugadoresA.splice(index, 1);
        // Eliminar las estadísticas del jugador eliminado
        if (estadisticasJugadores.a[jugadorEliminado]) {
            delete estadisticasJugadores.a[jugadorEliminado];
        }
        actualizarListaJugadores('a');
    } else {
        const jugadorEliminado = jugadoresB[index];
        jugadoresB.splice(index, 1);
        // Eliminar las estadísticas del jugador eliminado
        if (estadisticasJugadores.b[jugadorEliminado]) {
            delete estadisticasJugadores.b[jugadorEliminado];
        }
        actualizarListaJugadores('b');
    }
}

// Función para agregar jugadores
function agregarJugador(equipo) {
    const inputId = `nuevo-jugador-${equipo}`;
    const nombreJugador = document.getElementById(inputId).value.trim();
    
    if (!nombreJugador) {
        alert('Por favor ingrese el nombre del jugador');
        return;
    }
    
    // Verificar si el nombre del jugador ya existe en cualquiera de los equipos
    const nombreExisteEnEquipoA = jugadoresA.some(jugador => 
        jugador.toLowerCase() === nombreJugador.toLowerCase()
    );
    
    const nombreExisteEnEquipoB = jugadoresB.some(jugador => 
        jugador.toLowerCase() === nombreJugador.toLowerCase()
    );
    
    // Verificar duplicados en ambos equipos antes de agregar
    if (equipo === 'a') {
        if (nombreExisteEnEquipoA) {
            alert(`Ya existe un jugador llamado "${nombreJugador}" en el equipo local`);
            return;
        }
        
        if (nombreExisteEnEquipoB) {
            alert(`Ya existe un jugador llamado "${nombreJugador}" en el equipo visitante`);
            return;
        }
        
        jugadoresA.push(nombreJugador);
        actualizarListaJugadores('a');
    } else {
        if (nombreExisteEnEquipoB) {
            alert(`Ya existe un jugador llamado "${nombreJugador}" en el equipo visitante`);
            return;
        }
        
        if (nombreExisteEnEquipoA) {
            alert(`Ya existe un jugador llamado "${nombreJugador}" en el equipo local`);
            return;
        }
        
        jugadoresB.push(nombreJugador);
        actualizarListaJugadores('b');
    }
    
    // Limpiar el campo
    document.getElementById(inputId).value = '';
    
    // Inicializar estadísticas del nuevo jugador
    inicializarEstadisticasJugador(nombreJugador, equipo);
    
    // Si el equipo del nuevo jugador es el activo, actualizar la tabla
    if (equipo === equipoActivo) {
        cargarTablaEstadisticas();
    }
}

// Funciones de estadísticas
function inicializarEstadisticasJugador(jugador, equipo) {
    estadisticasJugadores[equipo][jugador] = {
        goles: 0,
        asistencias: 0,
        amarillas: 0,
        rojas: 0
    };
}

function inicializarEstadisticas() {
    // Reiniciar las estadísticas
    estadisticasJugadores = {
        a: {},
        b: {}
    };
    
    // Inicializar para todos los jugadores
    jugadoresA.forEach(jugador => inicializarEstadisticasJugador(jugador, 'a'));
    jugadoresB.forEach(jugador => inicializarEstadisticasJugador(jugador, 'b'));
}

function cargarTablaEstadisticas() {
    const tbody = document.getElementById('tbody-estadisticas');
    if (!tbody) return; // Verificar que existe el elemento
    
    tbody.innerHTML = '';
    const jugadores = equipoActivo === 'a' ? jugadoresA : jugadoresB;
    
    jugadores.forEach(jugador => {
        const stats = estadisticasJugadores[equipoActivo][jugador] || {
            goles: 0,
            asistencias: 0,
            amarillas: 0,
            rojas: 0
        };
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${jugador}</td>
            <td>
                <div class="stat-control">
                    <button class="stat-btn stat-btn-decrement" onclick="actualizarEstadistica('${jugador}', 'goles', -1)">-</button>
                    <span class="stat-value">${stats.goles}</span>
                    <button class="stat-btn stat-btn-increment" onclick="actualizarEstadistica('${jugador}', 'goles', 1)">+</button>
                </div>
            </td>
            <td>
                <div class="stat-control">
                    <button class="stat-btn stat-btn-decrement" onclick="actualizarEstadistica('${jugador}', 'asistencias', -1)">-</button>
                    <span class="stat-value">${stats.asistencias}</span>
                    <button class="stat-btn stat-btn-increment" onclick="actualizarEstadistica('${jugador}', 'asistencias', 1)">+</button>
                </div>
            </td>
            <td>
                <div class="stat-control">
                    <button class="stat-btn stat-btn-decrement" onclick="actualizarEstadistica('${jugador}', 'amarillas', -1)">-</button>
                    <span class="stat-value">${stats.amarillas}</span>
                    <button class="stat-btn stat-btn-increment" onclick="actualizarEstadistica('${jugador}', 'amarillas', 1)">+</button>
                </div>
            </td>
            <td>
                <div class="stat-control">
                    <button class="stat-btn stat-btn-decrement" onclick="actualizarEstadistica('${jugador}', 'rojas', -1)">-</button>
                    <span class="stat-value">${stats.rojas}</span>
                    <button class="stat-btn stat-btn-increment" onclick="actualizarEstadistica('${jugador}', 'rojas', 1)">+</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Función para cambiar entre pestañas de equipos
function cambiarTab(equipo) {
    equipoActivo = equipo === 'equipo-a' ? 'a' : 'b';
    
    // Actualizar estado visual de los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Cargar estadísticas del equipo seleccionado
    cargarTablaEstadisticas();
}

// Función para actualizar estadística
function actualizarEstadistica(jugador, tipo, valor) {
    if (!estadisticasJugadores[equipoActivo][jugador]) {
        inicializarEstadisticasJugador(jugador, equipoActivo);
    }
    
    const stats = estadisticasJugadores[equipoActivo][jugador];
    
    if (tipo === 'rojas' && stats.rojas + valor > 1) {
        alert('Un jugador no puede tener más de 1 tarjeta roja');
        return;
    }
    
    if (stats[tipo] + valor < 0) {
        return;
    }
    
    stats[tipo] += valor;
    cargarTablaEstadisticas();
}

// Función para formatear una fecha a DD-MM-AAAA
function formatearFecha(fecha) {
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0'); // Los meses en JS van de 0 a 11
    const año = d.getFullYear();
    
    return `${dia}-${mes}-${año}`;
}

// Función para obtener todas las temporadas
async function cargarTemporadas() {
    const { data, error } = await supabaseClient
        .from('temporadas')
        .select('*')
        .order('fecha_inicio', { ascending: false });
        
    if (error) {
        console.error('Error al cargar temporadas:', error);
        return [];
    }
    
    return data || [];
}

// Función para obtener la temporada correspondiente a una fecha
async function obtenerTemporadaPorFecha(fecha) {
    const fechaFormateada = fecha; // Ya está en formato YYYY-MM-DD
    
    const { data, error } = await supabaseClient
        .from('temporadas')
        .select('id, nombre')
        .lte('fecha_inicio', fechaFormateada) 
        .gte('fecha_fin', fechaFormateada)
        .single();
        
    if (error) {
        console.error('Error al buscar temporada:', error);
        return null;
    }
    
    return data;
}

// Agregar event listeners
document.getElementById('nombre-equipo-a').addEventListener('input', actualizarNombresEquipos);
document.getElementById('nombre-equipo-b').addEventListener('input', actualizarNombresEquipos);

// Inicializar al cargar la página 
window.addEventListener('DOMContentLoaded', function() {
    actualizarNombresEquipos();
    inicializarEstadisticas();
    cargarTablaEstadisticas();
    
    // Establecer la fecha actual por defecto en el campo fecha
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input[type="date"]
    document.getElementById('fecha-partido').value = fechaHoy;
});

// Función para actualizar los minutos en los eventos
function actualizarMinutosEventos() {
    const duracion = parseInt(document.getElementById('duracion-partido').value);
    // Si tienes selectores de minutos en los eventos, aquí actualizarías sus valores máximos
    console.log(`Duración del partido actualizada a ${duracion} minutos`);
}

// Función para obtener eventos (placeholder - ajusta según tus necesidades)
function obtenerEventos() {
    return []; // Si no tienes eventos implementados, retorna un array vacío
}

// Función para validar que las estadísticas coincidan con el resultado
function validarEstadisticasConResultado() {
    const golesLocal = parseInt(document.getElementById('goles-local').value) || 0;
    const golesVisitante = parseInt(document.getElementById('goles-visitante').value) || 0;
    
    // Calcular la suma de goles registrados en las estadísticas
    let totalGolesEstadisticasA = 0;
    let totalGolesEstadisticasB = 0;
    
    // Contar goles del equipo A
    for (const jugador in estadisticasJugadores.a) {
        totalGolesEstadisticasA += estadisticasJugadores.a[jugador].goles;
    }
    
    // Contar goles del equipo B
    for (const jugador in estadisticasJugadores.b) {
        totalGolesEstadisticasB += estadisticasJugadores.b[jugador].goles;
    }
    
    // Validar que los goles coincidan
    if (totalGolesEstadisticasA !== golesLocal) {
        alert(`Error: Los goles individuales del equipo local (${totalGolesEstadisticasA}) no coinciden con el resultado (${golesLocal})`);
        return false;
    }
    
    if (totalGolesEstadisticasB !== golesVisitante) {
        alert(`Error: Los goles individuales del equipo visitante (${totalGolesEstadisticasB}) no coinciden con el resultado (${golesVisitante})`);
        return false;
    }
    
    return true;
}

// Función para exportar a JSON
function exportarJSON() {
    const golesLocal = parseInt(document.getElementById('goles-local').value);
    const golesVisitante = parseInt(document.getElementById('goles-visitante').value);
    const fechaPartido = document.getElementById('fecha-partido').value;
    
    if (!golesLocal && golesLocal !== 0 || !golesVisitante && golesVisitante !== 0) {
        alert('Debe seleccionar el resultado del partido');
        return;
    }
    
    if (!fechaPartido) {
        alert('Debe seleccionar la fecha del partido');
        return;
    }

    // Validar estadísticas antes de exportar
    if (!validarEstadisticasConResultado()) {
        return;
    }

    partidoJSON = {
        fechaPartido: fechaPartido,
        fechaRegistro: new Date().toISOString(),
        duracionPartido: parseInt(document.getElementById('duracion-partido').value),
        equipoA: {
            nombre: document.getElementById('nombre-equipo-a').value || 'Equipo A',
            jugadores: [...jugadoresA],
            goles: golesLocal
        },
        equipoB: {
            nombre: document.getElementById('nombre-equipo-b').value || 'Equipo B',
            jugadores: [...jugadoresB],
            goles: golesVisitante
        },
        estadisticas: {
            equipoA: { ...estadisticasJugadores.a },
            equipoB: { ...estadisticasJugadores.b }
        }
    };

    // Mostrar el JSON en el textarea
    const jsonOutput = document.getElementById('json-output');
    jsonOutput.value = JSON.stringify(partidoJSON, null, 2);
    
    // Crear y descargar el archivo
    const blob = new Blob([JSON.stringify(partidoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partido_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
// Función para abrir el popup de confirmación
function mostrarPopupConfirmacion() {
    const golesLocal = parseInt(document.getElementById('goles-local').value);
    const golesVisitante = parseInt(document.getElementById('goles-visitante').value);
    const fechaPartido = document.getElementById('fecha-partido').value;
    const nombreEquipoA = document.getElementById('nombre-equipo-a').value || 'Equipo A';
    const nombreEquipoB = document.getElementById('nombre-equipo-b').value || 'Equipo B';

    // Validaciones preliminares
    if (jugadoresA.length === 0 || jugadoresB.length === 0) {
        alert('Debe añadir jugadores a ambos equipos');
        return;
    }
    
    if (!golesLocal && golesLocal !== 0 || !golesVisitante && golesVisitante !== 0) {
        alert('Debe seleccionar el resultado del partido');
        return;
    }
    
    if (!fechaPartido) {
        alert('Debe seleccionar la fecha del partido');
        return;
    }
    
    // Validar estadísticas antes de mostrar el popup
    if (!validarEstadisticasConResultado()) {
        return;
    }

    // Preparar la fecha para mostrar en formato legible
    const fechaFormateada = new Date(fechaPartido).toLocaleDateString('es-ES');

    // Generar el contenido del popup
    let popupContent = `
        <div class="popup-info-group">
            <div class="popup-info-title">Información General</div>
            <div class="popup-info-item">
                <span class="popup-label">Fecha del partido:</span>
                <span class="popup-value">${fechaFormateada}</span>
            </div>
            <div class="popup-info-item">
                <span class="popup-label">Duración:</span>
                <span class="popup-value">${document.getElementById('duracion-partido').value} minutos</span>
            </div>
            <div class="popup-info-item">
                <span class="popup-label">Resultado:</span>
                <span class="popup-value">${nombreEquipoA} ${golesLocal} - ${golesVisitante} ${nombreEquipoB}</span>
            </div>
        </div>
    `;

    // Información del equipo local
    popupContent += `
        <div class="popup-info-group">
            <div class="popup-info-title">Equipo Local</div>
            <div class="equipo-info">
                <div class="equipo-header">
                    <span class="equipo-nombre">${nombreEquipoA}</span>
                    <span class="equipo-goles">${golesLocal} goles</span>
                </div>
                <table class="jugadores-stats-table">
                    <thead>
                        <tr>
                            <th>Jugador</th>
                            <th>Goles</th>
                            <th>Asistencias</th>
                            <th>Tarjetas</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Añadir jugadores del equipo local y sus estadísticas
    jugadoresA.forEach(jugador => {
        const stats = estadisticasJugadores.a[jugador] || { goles: 0, asistencias: 0, amarillas: 0, rojas: 0 };
        
        // Generar representación visual de tarjetas
        let tarjetas = '';
        for (let i = 0; i < stats.amarillas; i++) {
            tarjetas += '<span class="tarjeta-amarilla"></span>';
        }
        for (let i = 0; i < stats.rojas; i++) {
            tarjetas += '<span class="tarjeta-roja"></span>';
        }
        if (!tarjetas) tarjetas = '-';
        
        popupContent += `
            <tr>
                <td>${jugador}</td>
                <td>${stats.goles}</td>
                <td>${stats.asistencias}</td>
                <td>${tarjetas}</td>
            </tr>
        `;
    });
    
    popupContent += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Información del equipo visitante
    popupContent += `
        <div class="popup-info-group">
            <div class="popup-info-title">Equipo Visitante</div>
            <div class="equipo-info">
                <div class="equipo-header">
                    <span class="equipo-nombre">${nombreEquipoB}</span>
                    <span class="equipo-goles">${golesVisitante} goles</span>
                </div>
                <table class="jugadores-stats-table">
                    <thead>
                        <tr>
                            <th>Jugador</th>
                            <th>Goles</th>
                            <th>Asistencias</th>
                            <th>Tarjetas</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Añadir jugadores del equipo visitante y sus estadísticas
    jugadoresB.forEach(jugador => {
        const stats = estadisticasJugadores.b[jugador] || { goles: 0, asistencias: 0, amarillas: 0, rojas: 0 };
        
        // Generar representación visual de tarjetas
        let tarjetas = '';
        for (let i = 0; i < stats.amarillas; i++) {
            tarjetas += '<span class="tarjeta-amarilla"></span>';
        }
        for (let i = 0; i < stats.rojas; i++) {
            tarjetas += '<span class="tarjeta-roja"></span>';
        }
        if (!tarjetas) tarjetas = '-';
        
        popupContent += `
            <tr>
                <td>${jugador}</td>
                <td>${stats.goles}</td>
                <td>${stats.asistencias}</td>
                <td>${tarjetas}</td>
            </tr>
        `;
    });
    
    popupContent += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Insertar el contenido en el popup
    document.getElementById('popup-content').innerHTML = popupContent;
    
    // Mostrar el popup
    document.getElementById('confirmation-popup').classList.add('active');
}

// Función para cerrar el popup
function cerrarPopup() {
    document.getElementById('confirmation-popup').classList.remove('active');
}

// Función para confirmar y guardar el partido en la base de datos
async function confirmarGuardarPartido() {
    cerrarPopup(); // Cerrar el popup primero
    
    // Mostrar indicador de carga o deshabilitar botones si es necesario
    document.getElementById('btn-guardar').disabled = true;
    document.getElementById('btn-guardar').textContent = '⏳ Guardando...';
    
    try {
        const golesLocal = parseInt(document.getElementById('goles-local').value);
        const golesVisitante = parseInt(document.getElementById('goles-visitante').value);
        const fechaPartido = document.getElementById('fecha-partido').value;
        const temporadaData = await obtenerTemporadaPorFecha(fechaPartido);

        if (!temporadaData) {
            alert('No se encontró una temporada válida para esta fecha. Verifique que la fecha pertenezca a una temporada configurada.');
            return;
        }

        console.log("Guardando partido con fecha:", fechaPartido);

        // 1. Guardar el partido
        const { data: partidoData, error: partidoError } = await supabaseClient
            .from('partidos')
            .insert([{
                duracionPartido: parseInt(document.getElementById('duracion-partido').value),
                fecha_partido: fechaPartido,
                equipo_local_nombre: document.getElementById('nombre-equipo-a').value || 'Equipo A',
                equipo_local_goles: golesLocal,
                equipo_visitante_nombre: document.getElementById('nombre-equipo-b').value || 'Equipo B',
                equipo_visitante_goles: golesVisitante,
                temporada_id: temporadaData.id
            }])
            .select()
            .single();

        if (partidoError) {
            console.error("Error detallado de Supabase:", partidoError);
            throw partidoError;
        }

        const partido_id = partidoData.id;
        console.log("Partido guardado con ID:", partido_id);

        // 2. Guardar jugadores y sus estadísticas
        for (const jugador of jugadoresA) {
            // Guardar jugador
            const { data: jugadorData, error: jugadorError } = await supabaseClient
                .from('jugadores')
                .insert([{
                    partido_id: partido_id,
                    nombre: jugador,
                    equipo: 'local'
                }])
                .select()
                .single();

            if (jugadorError) throw jugadorError;

            // Guardar estadísticas
            const stats = estadisticasJugadores.a[jugador];
            const { error: statsError } = await supabaseClient
                .from('estadisticas')
                .insert([{
                    partido_id: partido_id,
                    jugador_id: jugadorData.id,
                    goles: stats.goles,
                    asistencias: stats.asistencias,
                    tarjetas_amarillas: stats.amarillas,
                    tarjetas_rojas: stats.rojas
                }]);

            if (statsError) throw statsError;
        }

        // Repetir para jugadores del equipo B
        for (const jugador of jugadoresB) {
            const { data: jugadorData, error: jugadorError } = await supabaseClient
                .from('jugadores')
                .insert([{
                    partido_id: partido_id,
                    nombre: jugador,
                    equipo: 'visitante'
                }])
                .select()
                .single();

            if (jugadorError) throw jugadorError;

            const stats = estadisticasJugadores.b[jugador];
            const { error: statsError } = await supabaseClient
                .from('estadisticas')
                .insert([{
                    partido_id: partido_id,
                    jugador_id: jugadorData.id,
                    goles: stats.goles,
                    asistencias: stats.asistencias,
                    tarjetas_amarillas: stats.amarillas,
                    tarjetas_rojas: stats.rojas
                }]);

            if (statsError) throw statsError;
        }

        alert('Partido guardado exitosamente en la base de datos ✅');
        
        // Opcional: Resetear el formulario o redirigir a otra página
        // resetearFormulario();
        
    } catch (error) {
        console.error('Error al guardar el partido:', error);
        alert('Error al guardar el partido. Por favor, intenta de nuevo. Revisa la consola para más detalles.');
    } finally {
        // Restaurar el botón de guardar
        document.getElementById('btn-guardar').disabled = false;
        document.getElementById('btn-guardar').textContent = '💾 Guardar Partido';
    }
}

// Modificar la función guardarPartido para que ahora muestre el popup
function guardarPartido() {
    mostrarPopupConfirmacion();
}

// Funciones para la sección de clasificación

// Función para mostrar la clasificación
function mostrarClasificacion() {
    document.getElementById('clasificacion-container').classList.add('active');
    
    // Cargar temporadas al abrir la clasificación
    cargarTemporadas().then(temporadas => {
        const selectTemporada = document.getElementById('select-temporada');
        selectTemporada.innerHTML = '';
        
        if (temporadas && temporadas.length > 0) {
            temporadas.forEach(temporada => {
                const option = document.createElement('option');
                option.value = temporada.id;
                option.textContent = temporada.nombre;
                selectTemporada.appendChild(option);
            });
            
            // Cargar la temporada seleccionada por defecto
            cargarDatosTemporada();
        } else {
            selectTemporada.innerHTML = '<option value="">No hay temporadas disponibles</option>';
        }
    });
    
    // Cargar las estadísticas de jugadores
    cargarEstadisticasJugadores();
    
    // Cargar los últimos partidos
    cargarUltimosPartidos();
}

// Función para ocultar la clasificación
function ocultarClasificacion() {
    document.getElementById('clasificacion-container').classList.remove('active');
}

// Función para cambiar entre pestañas de la clasificación
function cambiarTabClasificacion(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.clasificacion-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Actualizar estado de los botones
    document.querySelectorAll('.clasificacion-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Si cambiamos a la pestaña de estadísticas, recargamos
    if (tabId === 'estadisticas-jugadores') {
        cargarEstadisticasJugadores();
    } else if (tabId === 'ultimos-partidos') {
        cargarUltimosPartidos();
    }
}

// Función para cargar los datos de la temporada actual
async function cargarDatosTemporada() {
    const temporadaId = document.getElementById('select-temporada').value;
    if (!temporadaId) return;
    
    try {
        // Obtener todos los partidos de la temporada
        const { data: partidos, error: errorPartidos } = await supabaseClient
            .from('partidos')
            .select('*')
            .eq('temporada_id', temporadaId);
            
        if (errorPartidos) throw errorPartidos;
        
        // Crear un mapa para almacenar los datos de los equipos
        const equiposMap = new Map();
        
        // Procesar cada partido
        partidos.forEach(partido => {
            const equipoLocal = partido.equipo_local_nombre;
            const equipoVisitante = partido.equipo_visitante_nombre;
            const golesLocal = partido.equipo_local_goles;
            const golesVisitante = partido.equipo_visitante_goles;
            
            // Inicializar datos para el equipo local si no existe
            if (!equiposMap.has(equipoLocal)) {
                equiposMap.set(equipoLocal, {
                    nombre: equipoLocal,
                    partidos: 0,
                    ganados: 0,
                    empatados: 0,
                    perdidos: 0,
                    golesFavor: 0,
                    golesContra: 0,
                    diferenciaGoles: 0,
                    puntos: 0
                });
            }
            
            // Inicializar datos para el equipo visitante si no existe
            if (!equiposMap.has(equipoVisitante)) {
                equiposMap.set(equipoVisitante, {
                    nombre: equipoVisitante,
                    partidos: 0,
                    ganados: 0,
                    empatados: 0,
                    perdidos: 0,
                    golesFavor: 0,
                    golesContra: 0,
                    diferenciaGoles: 0,
                    puntos: 0
                });
            }
            
            // Obtener los objetos de equipo
            const local = equiposMap.get(equipoLocal);
            const visitante = equiposMap.get(equipoVisitante);
            
            // Actualizar estadísticas del equipo local
            local.partidos++;
            local.golesFavor += golesLocal;
            local.golesContra += golesVisitante;
            
            // Actualizar estadísticas del equipo visitante
            visitante.partidos++;
            visitante.golesFavor += golesVisitante;
            visitante.golesContra += golesLocal;
            
            // Determinar el resultado (victoria, derrota o empate)
            if (golesLocal > golesVisitante) {
                // Victoria local
                local.ganados++;
                local.puntos += 3;
                visitante.perdidos++;
            } else if (golesLocal < golesVisitante) {
                // Victoria visitante
                visitante.ganados++;
                visitante.puntos += 3;
                local.perdidos++;
            } else {
                // Empate
                local.empatados++;
                local.puntos += 1;
                visitante.empatados++;
                visitante.puntos += 1;
            }
        });
        
        // Calcular diferencia de goles para todos los equipos
        equiposMap.forEach(equipo => {
            equipo.diferenciaGoles = equipo.golesFavor - equipo.golesContra;
        });
        
        // Convertir el mapa a un array y ordenar
        let equiposArray = Array.from(equiposMap.values());
        equiposArray.sort((a, b) => {
            // Ordenar por puntos
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            // Desempate por diferencia de goles
            if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
            // Desempate por goles a favor
            if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
            // Desempate por nombre del equipo (alfabético)
            return a.nombre.localeCompare(b.nombre);
        });
        
        // Generar la tabla HTML
        const tablaBody = document.getElementById('tabla-clasificacion-body');
        tablaBody.innerHTML = '';
        
        equiposArray.forEach((equipo, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${equipo.nombre}</td>
                <td>${equipo.partidos}</td>
                <td>${equipo.ganados}</td>
                <td>${equipo.empatados}</td>
                <td>${equipo.perdidos}</td>
                <td>${equipo.golesFavor}</td>
                <td>${equipo.golesContra}</td>
                <td>${equipo.diferenciaGoles}</td>
                <td>${equipo.puntos}</td>
            `;
            tablaBody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar datos de la temporada:', error);
        document.getElementById('tabla-clasificacion-body').innerHTML = `
            <tr>
                <td colspan="10">Error al cargar los datos. Inténtalo de nuevo.</td>
            </tr>
        `;
    }
}

// Función para cargar estadísticas de jugadores
async function cargarEstadisticasJugadores() {
    try {
        // Obtener la categoría seleccionada
        const categoria = document.getElementById('filtro-categoria').value;
        const busqueda = document.getElementById('buscar-jugador').value.toLowerCase();
        
        // Actualizar el título de la columna de estadísticas
        const categoriasTitulos = {
            'goles': 'Goles',
            'asistencias': 'Asistencias',
            'amarillas': 'Tarjetas Amarillas',
            'rojas': 'Tarjetas Rojas'
        };
        document.getElementById('estadistica-titulo').textContent = categoriasTitulos[categoria];
        
        // Mapear la categoría al campo de la base de datos
        const camposBD = {
            'goles': 'goles',
            'asistencias': 'asistencias',
            'amarillas': 'tarjetas_amarillas',
            'rojas': 'tarjetas_rojas'
        };
        
        // Obtener los jugadores y sus estadísticas
        const { data: estadisticas, error } = await supabaseClient
            .from('estadisticas')
            .select(`
                jugador_id,
                ${camposBD[categoria]},
                jugadores(nombre, equipo, partido_id),
                partidos:jugadores(partidos(equipo_local_nombre, equipo_visitante_nombre))
            `);
            
        if (error) throw error;
        
        // Agrupar por jugador y sumar estadísticas
        const jugadoresMap = new Map();
        
        estadisticas.forEach(est => {
            const jugador = est.jugadores;
            const partidos = est.partidos[0];
            if (!jugador) return; // Ignorar si faltan datos del jugador
            
            const jugadorKey = `${jugador.nombre}-${jugador.equipo}`;
            const equipoNombre = jugador.equipo === 'local' 
                ? partidos.equipo_local_nombre 
                : partidos.equipo_visitante_nombre;
            
            if (!jugadoresMap.has(jugadorKey)) {
                jugadoresMap.set(jugadorKey, {
                    nombre: jugador.nombre,
                    equipo: equipoNombre,
                    valor: 0
                });
            }
            
            // Sumar la estadística correspondiente
            const jugadorStats = jugadoresMap.get(jugadorKey);
            jugadorStats.valor += est[camposBD[categoria]] || 0;
        });
        
        // Convertir a array y filtrar por búsqueda
        let jugadoresArray = Array.from(jugadoresMap.values());
        if (busqueda) {
            jugadoresArray = jugadoresArray.filter(j => 
                j.nombre.toLowerCase().includes(busqueda) || 
                j.equipo.toLowerCase().includes(busqueda)
            );
        }
        
        // Ordenar jugadores por la estadística seleccionada
        jugadoresArray.sort((a, b) => b.valor - a.valor);
        
        // Generar la tabla HTML
        const tablaBody = document.getElementById('tabla-estadisticas-jugadores-body');
        tablaBody.innerHTML = '';
        
        if (jugadoresArray.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4">No se encontraron resultados</td>
                </tr>
            `;
            return;
        }
        
        jugadoresArray.forEach((jugador, index) => {
            if (jugador.valor > 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${jugador.nombre}</td>
                    <td>${jugador.equipo}</td>
                    <td>${jugador.valor}</td>
                `;
                tablaBody.appendChild(tr);
            }
        });
        
    } catch (error) {
        console.error('Error al cargar estadísticas de jugadores:', error);
        document.getElementById('tabla-estadisticas-jugadores-body').innerHTML = `
            <tr>
                <td colspan="4">Error al cargar las estadísticas. Inténtalo de nuevo.</td>
            </tr>
        `;
    }
}

// Función para filtrar estadísticas según los criterios seleccionados
function filtrarEstadisticas() {
    cargarEstadisticasJugadores();
}

// Función para cargar los últimos partidos
async function cargarUltimosPartidos() {
    try {
        // Obtener la cantidad de partidos a mostrar
        const filtro = document.getElementById('filtro-partidos').value;
        const limite = filtro === 'todos' ? 100 : parseInt(filtro); // 100 como límite razonable para "todos"
        
        // Obtener los partidos ordenados por fecha
        const { data: partidos, error } = await supabaseClient
            .from('partidos')
            .select('*, jugadores(*), estadisticas(*)') // Incluir jugadores y estadísticas
            .order('fecha_partido', { ascending: false })
            .limit(limite);
            
        if (error) throw error;
        
        const listaPartidos = document.getElementById('lista-partidos');
        listaPartidos.innerHTML = '';
        
        if (partidos.length === 0) {
            listaPartidos.innerHTML = '<div class="no-partidos">No hay partidos registrados</div>';
            return;
        }
        
        // Generar tarjetas para cada partido
        partidos.forEach(partido => {
            // Organizar estadísticas por equipo
            const estadisticasLocal = [];
            const estadisticasVisitante = [];
            
            // Relacionar jugadores con sus estadísticas
            partido.jugadores.forEach(jugador => {
                // Encontrar estadísticas del jugador
                const stats = partido.estadisticas.find(e => e.jugador_id === jugador.id);
                if (stats) {
                    const estadistica = {
                        jugador: jugador.nombre,
                        goles: stats.goles,
                        asistencias: stats.asistencias,
                        amarillas: stats.tarjetas_amarillas,
                        rojas: stats.tarjetas_rojas
                    };
                    
                    if (jugador.equipo === 'local') {
                        estadisticasLocal.push(estadistica);
                    } else {
                        estadisticasVisitante.push(estadistica);
                    }
                }
            });
            
            // Crear el elemento HTML del partido
            const div = document.createElement('div');
            div.className = 'partido-card';
            
            // Formatear la fecha
            const fecha = new Date(partido.fecha_partido);
            const fechaFormateada = fecha.toLocaleDateString('es-ES');
            
            // HTML de la cabecera
            div.innerHTML = `
                <div class="partido-header">
                    <span>Partido #${partido.id}</span>
                    <span>Duración: ${partido.duracionPartido} min</span>
                </div>
                <div class="partido-resultado">
                    <div class="equipo-resultado">
                        <div class="equipo-nombre">${partido.equipo_local_nombre}</div>
                    </div>
                    <div class="partido-separador">
                        <div class="partido-goles">
                            <span>${partido.equipo_local_goles}</span>
                            <span>-</span>
                            <span>${partido.equipo_visitante_goles}</span>
                        </div>
                        <div class="partido-fecha">${fechaFormateada}</div>
                    </div>
                    <div class="equipo-resultado">
                        <div class="equipo-nombre">${partido.equipo_visitante_nombre}</div>
                    </div>
                </div>
            `;
            
            // Añadir detalles del partido (goles, asistencias, tarjetas)
            let detallesHTML = '<div class="partido-detalles">';
            
            // Goles del equipo local
            const golesLocal = estadisticasLocal.filter(e => e.goles > 0);
            if (golesLocal.length > 0) {
                detallesHTML += `
                    <h4>Goles de ${partido.equipo_local_nombre}</h4>
                    <div class="detalle-list">
                `;
                golesLocal.forEach(est => {
                    for (let i = 0; i < est.goles; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">⚽</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Goles del equipo visitante
            const golesVisitante = estadisticasVisitante.filter(e => e.goles > 0);
            if (golesVisitante.length > 0) {
                detallesHTML += `
                    <h4>Goles de ${partido.equipo_visitante_nombre}</h4>
                    <div class="detalle-list">
                `;
                golesVisitante.forEach(est => {
                    for (let i = 0; i < est.goles; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">⚽</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Asistencias
            const asistenciasTotal = [
                ...estadisticasLocal.filter(e => e.asistencias > 0),
                ...estadisticasVisitante.filter(e => e.asistencias > 0)
            ];
            if (asistenciasTotal.length > 0) {
                detallesHTML += `
                    <h4>Asistencias</h4>
                    <div class="detalle-list">
                `;
                asistenciasTotal.forEach(est => {
                    for (let i = 0; i < est.asistencias; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">👟</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Tarjetas
            const tarjetasTotal = [
                ...estadisticasLocal.filter(e => e.amarillas > 0 || e.rojas > 0),
                ...estadisticasVisitante.filter(e => e.amarillas > 0 || e.rojas > 0)
            ];
            if (tarjetasTotal.length > 0) {
                detallesHTML += `
                    <h4>Tarjetas</h4>
                    <div class="detalle-list">
                `;
                tarjetasTotal.forEach(est => {
                    // Tarjetas amarillas
                    for (let i = 0; i < est.amarillas; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="tarjeta-amarilla-mini"></span> ${est.jugador}
                            </span>
                        `;
                    }
                    // Tarjetas rojas
                    for (let i = 0; i < est.rojas; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="tarjeta-roja-mini"></span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            detallesHTML += '</div>';
            div.innerHTML += detallesHTML;
            
            listaPartidos.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error al cargar los últimos partidos:', error);
        document.getElementById('lista-partidos').innerHTML = `
            <div class="error-message">
                Error al cargar los partidos. Inténtalo de nuevo.
            </div>
        `;
    }
}
// Funciones para la sección de clasificación

// Función para mostrar la clasificación
function mostrarClasificacion() {
    document.getElementById('clasificacion-container').classList.add('active');
    
    // Cargar temporadas al abrir la clasificación
    cargarTemporadas().then(temporadas => {
        const selectTemporada = document.getElementById('select-temporada');
        selectTemporada.innerHTML = '';
        
        if (temporadas && temporadas.length > 0) {
            temporadas.forEach(temporada => {
                const option = document.createElement('option');
                option.value = temporada.id;
                option.textContent = temporada.nombre;
                selectTemporada.appendChild(option);
            });
            
            // Cargar la temporada seleccionada por defecto
            cargarDatosTemporada();
        } else {
            selectTemporada.innerHTML = '<option value="">No hay temporadas disponibles</option>';
        }
    });
    
    // Cargar las estadísticas de jugadores
    cargarEstadisticasJugadores();
    
    // Cargar los últimos partidos
    cargarUltimosPartidos();
}

// Función para ocultar la clasificación
function ocultarClasificacion() {
    document.getElementById('clasificacion-container').classList.remove('active');
}

// Función para cambiar entre pestañas de la clasificación
function cambiarTabClasificacion(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.clasificacion-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Actualizar estado de los botones
    document.querySelectorAll('.clasificacion-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Si cambiamos a la pestaña de estadísticas, recargamos
    if (tabId === 'estadisticas-jugadores') {
        cargarEstadisticasJugadores();
    } else if (tabId === 'ultimos-partidos') {
        cargarUltimosPartidos();
    }
}

// Función para cargar los datos de la temporada actual
async function cargarDatosTemporada() {
    const temporadaId = document.getElementById('select-temporada').value;
    if (!temporadaId) return;
    
    try {
        // Obtener todos los partidos de la temporada
        const { data: partidos, error: errorPartidos } = await supabaseClient
            .from('partidos')
            .select('*')
            .eq('temporada_id', temporadaId);
            
        if (errorPartidos) throw errorPartidos;
        
        // Crear un mapa para almacenar los datos de los equipos
        const equiposMap = new Map();
        
        // Procesar cada partido
        partidos.forEach(partido => {
            const equipoLocal = partido.equipo_local_nombre;
            const equipoVisitante = partido.equipo_visitante_nombre;
            const golesLocal = partido.equipo_local_goles;
            const golesVisitante = partido.equipo_visitante_goles;
            
            // Inicializar datos para el equipo local si no existe
            if (!equiposMap.has(equipoLocal)) {
                equiposMap.set(equipoLocal, {
                    nombre: equipoLocal,
                    partidos: 0,
                    ganados: 0,
                    empatados: 0,
                    perdidos: 0,
                    golesFavor: 0,
                    golesContra: 0,
                    diferenciaGoles: 0,
                    puntos: 0
                });
            }
            
            // Inicializar datos para el equipo visitante si no existe
            if (!equiposMap.has(equipoVisitante)) {
                equiposMap.set(equipoVisitante, {
                    nombre: equipoVisitante,
                    partidos: 0,
                    ganados: 0,
                    empatados: 0,
                    perdidos: 0,
                    golesFavor: 0,
                    golesContra: 0,
                    diferenciaGoles: 0,
                    puntos: 0
                });
            }
            
            // Obtener los objetos de equipo
            const local = equiposMap.get(equipoLocal);
            const visitante = equiposMap.get(equipoVisitante);
            
            // Actualizar estadísticas del equipo local
            local.partidos++;
            local.golesFavor += golesLocal;
            local.golesContra += golesVisitante;
            
            // Actualizar estadísticas del equipo visitante
            visitante.partidos++;
            visitante.golesFavor += golesVisitante;
            visitante.golesContra += golesLocal;
            
            // Determinar el resultado (victoria, derrota o empate)
            if (golesLocal > golesVisitante) {
                // Victoria local
                local.ganados++;
                local.puntos += 3;
                visitante.perdidos++;
            } else if (golesLocal < golesVisitante) {
                // Victoria visitante
                visitante.ganados++;
                visitante.puntos += 3;
                local.perdidos++;
            } else {
                // Empate
                local.empatados++;
                local.puntos += 1;
                visitante.empatados++;
                visitante.puntos += 1;
            }
        });
        
        // Calcular diferencia de goles para todos los equipos
        equiposMap.forEach(equipo => {
            equipo.diferenciaGoles = equipo.golesFavor - equipo.golesContra;
        });
        
        // Convertir el mapa a un array y ordenar
        let equiposArray = Array.from(equiposMap.values());
        equiposArray.sort((a, b) => {
            // Ordenar por puntos
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            // Desempate por diferencia de goles
            if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
            // Desempate por goles a favor
            if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
            // Desempate por nombre del equipo (alfabético)
            return a.nombre.localeCompare(b.nombre);
        });
        
        // Generar la tabla HTML
        const tablaBody = document.getElementById('tabla-clasificacion-body');
        tablaBody.innerHTML = '';
        
        equiposArray.forEach((equipo, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${equipo.nombre}</td>
                <td>${equipo.partidos}</td>
                <td>${equipo.ganados}</td>
                <td>${equipo.empatados}</td>
                <td>${equipo.perdidos}</td>
                <td>${equipo.golesFavor}</td>
                <td>${equipo.golesContra}</td>
                <td>${equipo.diferenciaGoles}</td>
                <td>${equipo.puntos}</td>
            `;
            tablaBody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar datos de la temporada:', error);
        document.getElementById('tabla-clasificacion-body').innerHTML = `
            <tr>
                <td colspan="10">Error al cargar los datos. Inténtalo de nuevo.</td>
            </tr>
        `;
    }
}

// Función para cargar estadísticas de jugadores
async function cargarEstadisticasJugadores() {
    try {
        // Obtener la categoría seleccionada
        const categoria = document.getElementById('filtro-categoria').value;
        const busqueda = document.getElementById('buscar-jugador').value.toLowerCase();
        
        console.log('Cargando estadísticas para categoría:', categoria);
        
        // Actualizar el título de la columna de estadísticas
        const categoriasTitulos = {
            'goles': 'Goles',
            'asistencias': 'Asistencias',
            'amarillas': 'Tarjetas Amarillas',
            'rojas': 'Tarjetas Rojas'
        };
        document.getElementById('estadistica-titulo').textContent = categoriasTitulos[categoria];
        
        // Mapear la categoría al campo de la base de datos
        const camposBD = {
            'goles': 'goles',
            'asistencias': 'asistencias',
            'amarillas': 'tarjetas_amarillas',
            'rojas': 'tarjetas_rojas'
        };
        
        // Primero obtenemos todos los jugadores
        const { data: jugadores, error: errorJugadores } = await supabaseClient
            .from('jugadores')
            .select('id, nombre, equipo, partido_id');
            
        if (errorJugadores) {
            console.error('Error al obtener jugadores:', errorJugadores);
            throw errorJugadores;
        }
        
        console.log(`Obtenidos ${jugadores.length} jugadores`);
        
        // Luego obtenemos todas las estadísticas
        const { data: estadisticas, error: errorStats } = await supabaseClient
            .from('estadisticas')
            .select('*');
            
        if (errorStats) {
            console.error('Error al obtener estadísticas:', errorStats);
            throw errorStats;
        }
        
        console.log(`Obtenidas ${estadisticas.length} estadísticas`);
        
        // Obtenemos todos los partidos para relacionar equipos
        const { data: partidos, error: errorPartidos } = await supabaseClient
            .from('partidos')
            .select('id, equipo_local_nombre, equipo_visitante_nombre');
            
        if (errorPartidos) {
            console.error('Error al obtener partidos:', errorPartidos);
            throw errorPartidos;
        }
        
        console.log(`Obtenidos ${partidos.length} partidos`);
        
        // Crear un mapa para relacionar jugadores con sus estadísticas
        const jugadoresMap = new Map();
        
        // Procesamos cada jugador
        for (const jugador of jugadores) {
            // Encontrar el partido al que pertenece el jugador
            const partido = partidos.find(p => p.id === jugador.partido_id);
            if (!partido) continue;
            
            // Determinar el nombre del equipo según si es local o visitante
            const equipoNombre = jugador.equipo === 'local' 
                ? partido.equipo_local_nombre 
                : partido.equipo_visitante_nombre;
            
            // Crear una clave única para el jugador
            const jugadorKey = `${jugador.nombre}-${equipoNombre}`;
            
            // Inicializar el jugador en el mapa si no existe
            if (!jugadoresMap.has(jugadorKey)) {
                jugadoresMap.set(jugadorKey, {
                    nombre: jugador.nombre,
                    equipo: equipoNombre,
                    valor: 0,
                    jugadorIds: [] // Guardamos todos los IDs para buscar estadísticas
                });
            }
            
            // Añadir el ID del jugador a la lista
            jugadoresMap.get(jugadorKey).jugadorIds.push(jugador.id);
        }
        
        console.log(`Procesados ${jugadoresMap.size} jugadores únicos`);
        
        // Ahora procesamos las estadísticas
        for (const est of estadisticas) {
            // Encontrar a qué jugador pertenece esta estadística
            for (const [key, jugadorInfo] of jugadoresMap.entries()) {
                if (jugadorInfo.jugadorIds.includes(est.jugador_id)) {
                    // Sumar la estadística correspondiente según la categoría
                    jugadorInfo.valor += est[camposBD[categoria]] || 0;
                    break;
                }
            }
        }
        
        // Convertir a array y filtrar por búsqueda
        let jugadoresArray = Array.from(jugadoresMap.values());
        
        console.log('Jugadores con estadísticas antes de filtrar:', jugadoresArray.length);
        
        if (busqueda) {
            jugadoresArray = jugadoresArray.filter(j => 
                j.nombre.toLowerCase().includes(busqueda) || 
                j.equipo.toLowerCase().includes(busqueda)
            );
            console.log(`Filtrados a ${jugadoresArray.length} jugadores por búsqueda: "${busqueda}"`);
        }
        
        // Ordenar jugadores por la estadística seleccionada (de mayor a menor)
        jugadoresArray.sort((a, b) => b.valor - a.valor);
        
        // Generar la tabla HTML
        const tablaBody = document.getElementById('tabla-estadisticas-jugadores-body');
        tablaBody.innerHTML = '';
        
        if (jugadoresArray.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4">No se encontraron resultados</td>
                </tr>
            `;
            return;
        }
        
        // Mostrar solo jugadores con valor > 0 para esta estadística
        const jugadoresConValor = jugadoresArray.filter(j => j.valor > 0);
        
        if (jugadoresConValor.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4">No hay jugadores con ${categoriasTitulos[categoria].toLowerCase()} registrados</td>
                </tr>
            `;
            return;
        }
        
        jugadoresConValor.forEach((jugador, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${jugador.nombre}</td>
                <td>${jugador.equipo}</td>
                <td>${jugador.valor}</td>
            `;
            tablaBody.appendChild(tr);
        });
        
        console.log(`Mostrando ${jugadoresConValor.length} jugadores en la tabla`);
        
    } catch (error) {
        console.error('Error detallado al cargar estadísticas de jugadores:', error);
        document.getElementById('tabla-estadisticas-jugadores-body').innerHTML = `
            <tr>
                <td colspan="4">Error al cargar las estadísticas. Inténtalo de nuevo. (${error.message || 'Error desconocido'})</td>
            </tr>
        `;
    }
}

// Función para filtrar estadísticas según los criterios seleccionados
function filtrarEstadisticas() {
    cargarEstadisticasJugadores();
}

// Función para cargar los últimos partidos
async function cargarUltimosPartidos() {
    try {
        // Obtener la cantidad de partidos a mostrar
        const filtro = document.getElementById('filtro-partidos').value;
        const limite = filtro === 'todos' ? 100 : parseInt(filtro); // 100 como límite razonable para "todos"
        
        // Obtener los partidos ordenados por fecha
        const { data: partidos, error } = await supabaseClient
            .from('partidos')
            .select('*, jugadores(*), estadisticas(*)') // Incluir jugadores y estadísticas
            .order('fecha_partido', { ascending: false })
            .limit(limite);
            
        if (error) throw error;
        
        const listaPartidos = document.getElementById('lista-partidos');
        listaPartidos.innerHTML = '';
        
        if (partidos.length === 0) {
            listaPartidos.innerHTML = '<div class="no-partidos">No hay partidos registrados</div>';
            return;
        }
        
        // Generar tarjetas para cada partido
        partidos.forEach(partido => {
            // Organizar estadísticas por equipo
            const estadisticasLocal = [];
            const estadisticasVisitante = [];
            
            // Relacionar jugadores con sus estadísticas
            partido.jugadores.forEach(jugador => {
                // Encontrar estadísticas del jugador
                const stats = partido.estadisticas.find(e => e.jugador_id === jugador.id);
                if (stats) {
                    const estadistica = {
                        jugador: jugador.nombre,
                        goles: stats.goles,
                        asistencias: stats.asistencias,
                        amarillas: stats.tarjetas_amarillas,
                        rojas: stats.tarjetas_rojas
                    };
                    
                    if (jugador.equipo === 'local') {
                        estadisticasLocal.push(estadistica);
                    } else {
                        estadisticasVisitante.push(estadistica);
                    }
                }
            });
            
            // Crear el elemento HTML del partido
            const div = document.createElement('div');
            div.className = 'partido-card';
            
            // Formatear la fecha
            const fecha = new Date(partido.fecha_partido);
            const fechaFormateada = fecha.toLocaleDateString('es-ES');
            
            // HTML de la cabecera
            div.innerHTML = `
                <div class="partido-header">
                    <span>Partido #${partido.id}</span>
                    <span>Duración: ${partido.duracionPartido} min</span>
                </div>
                <div class="partido-resultado">
                    <div class="equipo-resultado">
                        <div class="equipo-nombre">${partido.equipo_local_nombre}</div>
                    </div>
                    <div class="partido-separador">
                        <div class="partido-goles">
                            <span>${partido.equipo_local_goles}</span>
                            <span>-</span>
                            <span>${partido.equipo_visitante_goles}</span>
                        </div>
                        <div class="partido-fecha">${fechaFormateada}</div>
                    </div>
                    <div class="equipo-resultado">
                        <div class="equipo-nombre">${partido.equipo_visitante_nombre}</div>
                    </div>
                </div>
            `;
            
            // Añadir detalles del partido (goles, asistencias, tarjetas)
            let detallesHTML = '<div class="partido-detalles">';
            
            // Goles del equipo local
            const golesLocal = estadisticasLocal.filter(e => e.goles > 0);
            if (golesLocal.length > 0) {
                detallesHTML += `
                    <h4>Goles de ${partido.equipo_local_nombre}</h4>
                    <div class="detalle-list">
                `;
                golesLocal.forEach(est => {
                    for (let i = 0; i < est.goles; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">⚽</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Goles del equipo visitante
            const golesVisitante = estadisticasVisitante.filter(e => e.goles > 0);
            if (golesVisitante.length > 0) {
                detallesHTML += `
                    <h4>Goles de ${partido.equipo_visitante_nombre}</h4>
                    <div class="detalle-list">
                `;
                golesVisitante.forEach(est => {
                    for (let i = 0; i < est.goles; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">⚽</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Asistencias
            const asistenciasTotal = [
                ...estadisticasLocal.filter(e => e.asistencias > 0),
                ...estadisticasVisitante.filter(e => e.asistencias > 0)
            ];
            if (asistenciasTotal.length > 0) {
                detallesHTML += `
                    <h4>Asistencias</h4>
                    <div class="detalle-list">
                `;
                asistenciasTotal.forEach(est => {
                    for (let i = 0; i < est.asistencias; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="detalle-icono">👟</span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            // Tarjetas
            const tarjetasTotal = [
                ...estadisticasLocal.filter(e => e.amarillas > 0 || e.rojas > 0),
                ...estadisticasVisitante.filter(e => e.amarillas > 0 || e.rojas > 0)
            ];
            if (tarjetasTotal.length > 0) {
                detallesHTML += `
                    <h4>Tarjetas</h4>
                    <div class="detalle-list">
                `;
                tarjetasTotal.forEach(est => {
                    // Tarjetas amarillas
                    for (let i = 0; i < est.amarillas; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="tarjeta-amarilla-mini"></span> ${est.jugador}
                            </span>
                        `;
                    }
                    // Tarjetas rojas
                    for (let i = 0; i < est.rojas; i++) {
                        detallesHTML += `
                            <span class="detalle-item">
                                <span class="tarjeta-roja-mini"></span> ${est.jugador}
                            </span>
                        `;
                    }
                });
                detallesHTML += '</div>';
            }
            
            detallesHTML += '</div>';
            div.innerHTML += detallesHTML;
            
            listaPartidos.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error al cargar los últimos partidos:', error);
        document.getElementById('lista-partidos').innerHTML = `
            <div class="error-message">
                Error al cargar los partidos. Inténtalo de nuevo.
            </div>
        `;
    }
}

// Función para cargar y mostrar la clasificación de jugadores
async function cargarClasificacionJugadores() {
    try {
        console.log('Cargando clasificación de jugadores...');
        
        // Obtener todos los jugadores
        const { data: jugadores, error: errorJugadores } = await supabaseClient
            .from('jugadores')
            .select('id, nombre, equipo, partido_id');
            
        if (errorJugadores) {
            console.error('Error al obtener jugadores:', errorJugadores);
            throw errorJugadores;
        }
        
        console.log(`Obtenidos ${jugadores.length} registros de jugadores`);
        
        // Obtener todas las estadísticas
        const { data: estadisticas, error: errorStats } = await supabaseClient
            .from('estadisticas')
            .select('*');
            
        if (errorStats) {
            console.error('Error al obtener estadísticas:', errorStats);
            throw errorStats;
        }
        
        // Obtener todos los partidos
        const { data: partidos, error: errorPartidos } = await supabaseClient
            .from('partidos')
            .select('*');
            
        if (errorPartidos) {
            console.error('Error al obtener partidos:', errorPartidos);
            throw errorPartidos;
        }
        
        // Crear un mapa para relacionar jugadores con sus partidos y estadísticas
        const jugadoresMap = new Map();
        
        // Primera pasada: Identificar jugadores únicos
        for (const jugador of jugadores) {
            const partido = partidos.find(p => p.id === jugador.partido_id);
            if (!partido) continue;
            
            // Determinar si el jugador estaba en el equipo local o visitante
            const esLocal = jugador.equipo === 'local';
            
            // Identificar el jugador por su nombre (asumiendo que es único)
            if (!jugadoresMap.has(jugador.nombre)) {
                jugadoresMap.set(jugador.nombre, {
                    nombre: jugador.nombre,
                    partidos: [],
                    estadisticas: []
                });
            }
            
            // Obtener la estadística del jugador en este partido
            const estadistica = estadisticas.find(e => e.jugador_id === jugador.id) || {
                goles: 0,
                asistencias: 0,
                tarjetas_amarillas: 0,
                tarjetas_rojas: 0
            };
            
            // Añadir información sobre el partido
            jugadoresMap.get(jugador.nombre).partidos.push({
                id: partido.id,
                fecha: partido.fecha_partido,
                esLocal: esLocal,
                equipoPropio: esLocal ? partido.equipo_local_nombre : partido.equipo_visitante_nombre,
                equipoRival: esLocal ? partido.equipo_visitante_nombre : partido.equipo_local_nombre,
                golesPropios: esLocal ? partido.equipo_local_goles : partido.equipo_visitante_goles,
                golesRivales: esLocal ? partido.equipo_visitante_goles : partido.equipo_local_goles,
                resultado: 
                    (esLocal && partido.equipo_local_goles > partido.equipo_visitante_goles) || 
                    (!esLocal && partido.equipo_visitante_goles > partido.equipo_local_goles) 
                    ? 'victoria' 
                    : (esLocal && partido.equipo_local_goles < partido.equipo_visitante_goles) || 
                      (!esLocal && partido.equipo_visitante_goles < partido.equipo_local_goles) 
                      ? 'derrota' 
                      : 'empate'
            });
            
            // Añadir estadísticas de este partido
            jugadoresMap.get(jugador.nombre).estadisticas.push(estadistica);
        }
        
        console.log(`Identificados ${jugadoresMap.size} jugadores únicos`);
        
        // Segunda pasada: Calcular estadísticas para cada jugador
        const estadisticasJugadores = [];
        
        for (const [nombre, datos] of jugadoresMap.entries()) {
            // Ignorar jugadores sin partidos
            if (datos.partidos.length === 0) continue;
            
            // Calcular estadísticas básicas
            const partidosJugados = datos.partidos.length;
            const partidosGanados = datos.partidos.filter(p => p.resultado === 'victoria').length;
            const partidosEmpatados = datos.partidos.filter(p => p.resultado === 'empate').length;
            const partidosPerdidos = datos.partidos.filter(p => p.resultado === 'derrota').length;
            
            // Calcular goles
            const golesFavor = datos.partidos.reduce((sum, p) => sum + p.golesPropios, 0);
            const golesContra = datos.partidos.reduce((sum, p) => sum + p.golesRivales, 0);
            const diferenciaGoles = golesFavor - golesContra;
            
            // Calcular medias
            const mediaGolesFavor = partidosJugados > 0 ? (golesFavor / partidosJugados).toFixed(2) : 0;
            const mediaGolesContra = partidosJugados > 0 ? (golesContra / partidosJugados).toFixed(2) : 0;
            
            // Calcular puntos (3 por victoria, 1 por empate)
            const puntos = (partidosGanados * 3) + partidosEmpatados;
            
            // Calcular media de puntos por partido
            const mediaPuntos = partidosJugados > 0 ? (puntos / partidosJugados).toFixed(2) : 0;
            
            // Calcular ratios (porcentajes)
            const ganadoRatio = partidosJugados > 0 ? Math.round((partidosGanados / partidosJugados) * 100) : 0;
            const empateRatio = partidosJugados > 0 ? Math.round((partidosEmpatados / partidosJugados) * 100) : 0;
            const perdidoRatio = partidosJugados > 0 ? Math.round((partidosPerdidos / partidosJugados) * 100) : 0;
            
            // Añadir a la lista de estadísticas
            estadisticasJugadores.push({
                nombre: nombre,
                puntos: puntos,
                mediaPuntos: mediaPuntos,
                partidosJugados: partidosJugados,
                partidosGanados: partidosGanados,
                ganadoRatio: ganadoRatio,
                partidosEmpatados: partidosEmpatados,
                empateRatio: empateRatio,
                partidosPerdidos: partidosPerdidos,
                perdidoRatio: perdidoRatio,
                golesFavor: golesFavor,
                golesContra: golesContra,
                mediaGolesFavor: mediaGolesFavor,
                mediaGolesContra: mediaGolesContra,
                diferenciaGoles: diferenciaGoles
            });
        }
        
        // Ordenar jugadores por puntos (y desempate por diferencia de goles)
        estadisticasJugadores.sort((a, b) => {
            if (b.puntos !== a.puntos) return b.puntos - a.puntos;
            if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
            if (b.golesFavor !== a.golesFavor) return b.golesFavor - a.golesFavor;
            return a.nombre.localeCompare(b.nombre);
        });
        
        console.log(`Calculadas estadísticas para ${estadisticasJugadores.length} jugadores`);
        
        // Actualizar la tabla HTML
        const tablaBody = document.getElementById('tabla-clasificacion-body');
        tablaBody.innerHTML = '';
        
        estadisticasJugadores.forEach((jugador, index) => {
            const tr = document.createElement('tr');
            
            // Determinar clases CSS para colores basados en valores
            const clasePuntos = jugador.puntos > 20 ? 'alto' : jugador.puntos > 10 ? 'medio' : 'bajo';
            const claseDiferencia = jugador.diferenciaGoles > 0 ? 'positivo' : jugador.diferenciaGoles < 0 ? 'negativo' : 'neutro';
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${jugador.nombre}</td>
                <td class="${clasePuntos}">${jugador.puntos}</td>
                <td>${jugador.mediaPuntos}</td>
                <td>${jugador.partidosJugados}</td>
                <td>${jugador.partidosGanados}</td>
                <td>${jugador.ganadoRatio}%</td>
                <td>${jugador.partidosEmpatados}</td>
                <td>${jugador.empateRatio}%</td>
                <td>${jugador.partidosPerdidos}</td>
                <td>${jugador.perdidoRatio}%</td>
                <td>${jugador.golesFavor}</td>
                <td>${jugador.golesContra}</td>
                <td>${jugador.mediaGolesFavor}</td>
                <td>${jugador.mediaGolesContra}</td>
                <td class="${claseDiferencia}">${jugador.diferenciaGoles}</td>
            `;
            
            tablaBody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Error al cargar clasificación de jugadores:', error);
        document.getElementById('tabla-clasificacion-body').innerHTML = `
            <tr>
                <td colspan="16">Error al cargar la clasificación de jugadores. ${error.message || 'Error desconocido'}</td>
            </tr>
        `;
    }
}

// Actualizar el HTML para mostrar la nueva tabla de clasificación
function actualizarHTMLClasificacion() {
    // Modificar la tabla de clasificación para incluir todas las columnas necesarias
    const tablaClasificacion = document.querySelector('.tabla-clasificacion');
    if (!tablaClasificacion) return;
    
    // Actualizar encabezados de tabla
    const thead = tablaClasificacion.querySelector('thead');
    thead.innerHTML = `
        <tr>
            <th>Pos</th>
            <th>Jugador</th>
            <th>Puntos</th>
            <th>Media Puntos</th>
            <th>Partidos jugados</th>
            <th>Partidos ganados</th>
            <th>Ganado Ratio</th>
            <th>Partidos empatados</th>
            <th>Empate Ratio</th>
            <th>Partidos perdidos</th>
            <th>Perdido Ratio</th>
            <th>Goles a favor</th>
            <th>Goles en contra</th>
            <th>Media Goles a favor</th>
            <th>Media Goles en contra</th>
            <th>Diferencia de goles</th>
        </tr>
    `;
    
    // Actualizar el título de la pestaña
    const tablaTitle = document.querySelector('#tabla-posiciones .clasificacion-tabs button.active');
    if (tablaTitle) {
        tablaTitle.textContent = 'Clasificación Jugadores';
    }
    
    // Añadir estilos para la tabla
    const estilos = document.createElement('style');
    estilos.innerHTML = `
        .tabla-clasificacion {
            font-size: 14px;
            width: 100%;
            border-collapse: collapse;
            overflow-x: auto;
            display: block;
            white-space: nowrap;
        }
        
        .tabla-clasificacion th, .tabla-clasificacion td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        .tabla-clasificacion th {
            background-color: #1e1860;
            color: white;
            position: sticky;
            top: 0;
        }
        
        .tabla-clasificacion tr:nth-child(even) {
            background-color: #f8f9fc;
        }
        
        .tabla-clasificacion tr:hover {
            background-color: #f0f2f8;
        }
        
        .tabla-clasificacion td.alto {
            background-color: #4CAF50;
            color: white;
        }
        
        .tabla-clasificacion td.medio {
            background-color: #FFC107;
        }
        
        .tabla-clasificacion td.bajo {
            background-color: #F44336;
            color: white;
        }
        
        .tabla-clasificacion td.positivo {
            color: #4CAF50;
        }
        
        .tabla-clasificacion td.negativo {
            color: #F44336;
        }
    `;
    
    // Añadir los estilos al documento si no existen ya
    if (!document.querySelector('style[data-tabla-jugadores]')) {
        estilos.setAttribute('data-tabla-jugadores', 'true');
        document.head.appendChild(estilos);
    }
}

// Reemplazar la función cargarDatosTemporada
function cargarDatosTemporada() {
    // Actualizamos el HTML primero
    actualizarHTMLClasificacion();
    
    // Cargamos la clasificación de jugadores
    cargarClasificacionJugadores();
}

// Modificar la función mostrarClasificacion para inicializar correctamente
function mostrarClasificacion() {
    document.getElementById('clasificacion-container').classList.add('active');
    
    // Actualizar el HTML de la tabla
    actualizarHTMLClasificacion();
    
    // Cargar temporadas al abrir la clasificación
    cargarTemporadas().then(temporadas => {
        const selectTemporada = document.getElementById('select-temporada');
        selectTemporada.innerHTML = '';
        
        if (temporadas && temporadas.length > 0) {
            temporadas.forEach(temporada => {
                const option = document.createElement('option');
                option.value = temporada.id;
                option.textContent = temporada.nombre;
                selectTemporada.appendChild(option);
            });
            
            // Cargar la clasificación de jugadores
            cargarDatosTemporada();
        } else {
            selectTemporada.innerHTML = '<option value="">No hay temporadas disponibles</option>';
        }
    });
    
    // Cargar las estadísticas de jugadores
    cargarEstadisticasJugadores();
    
    // Cargar los últimos partidos
    cargarUltimosPartidos();
}

// Función para cargar las estadísticas individuales de jugadores
async function cargarEstadisticasJugadores() {
    try {
        console.log('Cargando estadísticas individuales de jugadores...');
        
        // Obtener todos los jugadores
        const { data: jugadores, error: errorJugadores } = await supabaseClient
            .from('jugadores')
            .select('id, nombre, equipo, partido_id');
            
        if (errorJugadores) {
            console.error('Error al obtener jugadores:', errorJugadores);
            throw errorJugadores;
        }
        
        // Obtener todas las estadísticas
        const { data: estadisticas, error: errorStats } = await supabaseClient
            .from('estadisticas')
            .select('*');
            
        if (errorStats) {
            console.error('Error al obtener estadísticas:', errorStats);
            throw errorStats;
        }
        
        // Obtener todos los partidos
        const { data: partidos, error: errorPartidos } = await supabaseClient
            .from('partidos')
            .select('*');
            
        if (errorPartidos) {
            console.error('Error al obtener partidos:', errorPartidos);
            throw errorPartidos;
        }
        
        // Crear un mapa para relacionar jugadores con sus estadísticas
        const jugadoresMap = new Map();
        
        // Primera pasada: Identificar jugadores únicos
        for (const jugador of jugadores) {
            const partido = partidos.find(p => p.id === jugador.partido_id);
            if (!partido) continue;
            
            // Determinar si el jugador estaba en el equipo local o visitante
            const esLocal = jugador.equipo === 'local';
            
            // Identificar el jugador por su nombre (asumiendo que es único)
            if (!jugadoresMap.has(jugador.nombre)) {
                jugadoresMap.set(jugador.nombre, {
                    nombre: jugador.nombre,
                    partidos: [],
                    estadisticas: []
                });
            }
            
            // Obtener la estadística del jugador en este partido
            const estadistica = estadisticas.find(e => e.jugador_id === jugador.id) || {
                goles: 0,
                asistencias: 0,
                tarjetas_amarillas: 0,
                tarjetas_rojas: 0
            };
            
            // Añadir información sobre el partido
            jugadoresMap.get(jugador.nombre).partidos.push(partido);
            
            // Añadir estadísticas de este partido
            jugadoresMap.get(jugador.nombre).estadisticas.push(estadistica);
        }
        
        console.log(`Identificados ${jugadoresMap.size} jugadores únicos para estadísticas`);
        
        // Segunda pasada: Calcular estadísticas para cada jugador
        const estadisticasJugadores = [];
        
        for (const [nombre, datos] of jugadoresMap.entries()) {
            // Calcular totales
            const partidosJugados = datos.partidos.length;
            
            // Sumar todas las estadísticas
            const goles = datos.estadisticas.reduce((sum, e) => sum + (e.goles || 0), 0);
            const asistencias = datos.estadisticas.reduce((sum, e) => sum + (e.asistencias || 0), 0);
            const tarjetasAmarillas = datos.estadisticas.reduce((sum, e) => sum + (e.tarjetas_amarillas || 0), 0);
            const tarjetasRojas = datos.estadisticas.reduce((sum, e) => sum + (e.tarjetas_rojas || 0), 0);
            
            // Calcular medias por partido
            const mediaGoles = partidosJugados > 0 ? (goles / partidosJugados).toFixed(2) : 0;
            const mediaAsistencias = partidosJugados > 0 ? (asistencias / partidosJugados).toFixed(2) : 0;
            
            // Añadir a la lista de estadísticas
            estadisticasJugadores.push({
                nombre: nombre,
                partidosJugados: partidosJugados,
                goles: goles,
                mediaGoles: mediaGoles,
                asistencias: asistencias,
                mediaAsistencias: mediaAsistencias,
                tarjetasAmarillas: tarjetasAmarillas,
                tarjetasRojas: tarjetasRojas
            });
        }
        
        // Filtrar jugadores según la categoría seleccionada
        const categoria = document.getElementById('filtro-categoria').value;
        const busqueda = document.getElementById('buscar-jugador').value.toLowerCase();
        
        // Filtrar por búsqueda
        let jugadoresFiltrados = estadisticasJugadores;
        if (busqueda) {
            jugadoresFiltrados = jugadoresFiltrados.filter(j => 
                j.nombre.toLowerCase().includes(busqueda)
            );
        }
        
        // Ordenar según la categoría seleccionada
        switch(categoria) {
            case 'goles':
                jugadoresFiltrados.sort((a, b) => b.goles - a.goles);
                break;
            case 'asistencias':
                jugadoresFiltrados.sort((a, b) => b.asistencias - a.asistencias);
                break;
            case 'amarillas':
                jugadoresFiltrados.sort((a, b) => b.tarjetasAmarillas - a.tarjetasAmarillas);
                break;
            case 'rojas':
                jugadoresFiltrados.sort((a, b) => b.tarjetasRojas - a.tarjetasRojas);
                break;
            default:
                jugadoresFiltrados.sort((a, b) => b.goles - a.goles);
        }
        
        // Actualizar el título y la columna de estadísticas
        actualizarTablaEstadisticas(jugadoresFiltrados);
        
    } catch (error) {
        console.error('Error al cargar estadísticas individuales de jugadores:', error);
        document.getElementById('tabla-estadisticas-jugadores-body').innerHTML = `
            <tr>
                <td colspan="8">Error al cargar las estadísticas. ${error.message || 'Error desconocido'}</td>
            </tr>
        `;
    }
}

// Función para actualizar la tabla de estadísticas
function actualizarTablaEstadisticas(jugadores) {
    // Actualizar los encabezados de la tabla
    const tablaHead = document.querySelector('.tabla-estadisticas-jugadores thead');
    if (tablaHead) {
        tablaHead.innerHTML = `
            <tr>
                <th>Posición</th>
                <th>Jugador</th>
                <th>Goles Marcados</th>
                <th>Media Goles Partido</th>
                <th>Asistencias</th>
                <th>Media Asistencias Partido</th>
                <th>Tarjetas Amarillas</th>
                <th>Tarjetas Rojas</th>
            </tr>
        `;
    }
    
    // Actualizar el cuerpo de la tabla
    const tablaBody = document.getElementById('tabla-estadisticas-jugadores-body');
    if (!tablaBody) return;
    
    tablaBody.innerHTML = '';
    
    if (jugadores.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="8">No se encontraron resultados</td>
            </tr>
        `;
        return;
    }
    
    // Crear filas para cada jugador
    jugadores.forEach((jugador, index) => {
        // Determinar clases CSS para los diferentes valores
        const claseGoles = jugador.goles > 20 ? 'valor-alto' : jugador.goles > 10 ? 'valor-medio' : 'valor-bajo';
        const claseAsistencias = jugador.asistencias > 15 ? 'valor-alto' : jugador.asistencias > 5 ? 'valor-medio' : 'valor-bajo';
        const claseAmarillas = jugador.tarjetasAmarillas > 5 ? 'valor-alto' : jugador.tarjetasAmarillas > 2 ? 'valor-medio' : 'valor-bajo';
        const claseRojas = jugador.tarjetasRojas > 0 ? 'valor-alto' : 'valor-bajo';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${jugador.nombre}</td>
            <td class="${claseGoles}">${jugador.goles}</td>
            <td>${jugador.mediaGoles}</td>
            <td class="${claseAsistencias}">${jugador.asistencias}</td>
            <td>${jugador.mediaAsistencias}</td>
            <td class="${claseAmarillas} tarjeta-amarilla-bg">${jugador.tarjetasAmarillas}</td>
            <td class="${claseRojas} tarjeta-roja-bg">${jugador.tarjetasRojas}</td>
        `;
        
        tablaBody.appendChild(tr);
    });
    
    // Actualizar estilos CSS para la tabla
    const estilos = document.createElement('style');
    estilos.innerHTML = `
        .tabla-estadisticas-jugadores {
            width: 100%;
            border-collapse: collapse;
            overflow-x: auto;
            display: block;
            white-space: nowrap;
        }
        
        .tabla-estadisticas-jugadores th, .tabla-estadisticas-jugadores td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        .tabla-estadisticas-jugadores th {
            background-color: #1e1860;
            color: white;
            position: sticky;
            top: 0;
        }
        
        .tabla-estadisticas-jugadores tr:nth-child(even) {
            background-color: #f8f9fc;
        }
        
        .tabla-estadisticas-jugadores tr:hover {
            background-color: #f0f2f8;
        }
        
        /* Estilos para valores */
        .valor-alto {
            background-color: rgba(76, 175, 80, 0.7);
            color: black;
            font-weight: bold;
        }
        
        .valor-medio {
            background-color: rgba(144, 238, 144, 0.5);
            color: black;
        }
        
        .valor-bajo {
            background-color: rgba(220, 220, 220, 0.5);
            color: black;
        }
        
        /* Estilos para tarjetas */
        .tarjeta-amarilla-bg {
            background-color: rgba(255, 235, 59, 0.2);
        }
        
        .tarjeta-roja-bg {
            background-color: rgba(244, 67, 54, 0.2);
        }
        
        /* Colores para los encabezados de columnas específicas */
        .tabla-estadisticas-jugadores th:nth-child(3),
        .tabla-estadisticas-jugadores th:nth-child(4) {
            background-color: #4CAF50;
        }
        
        .tabla-estadisticas-jugadores th:nth-child(5),
        .tabla-estadisticas-jugadores th:nth-child(6) {
            background-color: #3F51B5;
        }
        
        .tabla-estadisticas-jugadores th:nth-child(7) {
            background-color: #FF9800;
        }
        
        .tabla-estadisticas-jugadores th:nth-child(8) {
            background-color: #F44336;
        }
    `;
    
    // Añadir los estilos al documento si no existen ya
    if (!document.querySelector('style[data-estadisticas-jugadores]')) {
        estilos.setAttribute('data-estadisticas-jugadores', 'true');
        document.head.appendChild(estilos);
    }
}

// Función para cambiar entre pestañas de la clasificación actualizada
function cambiarTabClasificacion(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.clasificacion-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Actualizar estado de los botones
    document.querySelectorAll('.clasificacion-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Si cambiamos a la pestaña de estadísticas, recargamos
    if (tabId === 'estadisticas-jugadores') {
        cargarEstadisticasJugadores();
    } else if (tabId === 'tabla-posiciones') {
        cargarClasificacionJugadores();
    } else if (tabId === 'ultimos-partidos') {
        cargarUltimosPartidos();
    }
}

// Función para mostrar la clasificación con las nuevas tablas
function mostrarClasificacion() {
    document.getElementById('clasificacion-container').classList.add('active');
    
    // Actualizar los títulos de las pestañas
    const tabsContainer = document.querySelector('.clasificacion-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = `
            <button class="tab-btn active" onclick="cambiarTabClasificacion('tabla-posiciones')">Clasificación Jugadores</button>
            <button class="tab-btn" onclick="cambiarTabClasificacion('estadisticas-jugadores')">Estadísticas Individuales</button>
            <button class="tab-btn" onclick="cambiarTabClasificacion('ultimos-partidos')">Últimos Partidos</button>
        `;
    }
    
    // Actualizar los filtros de estadísticas
    const filtrosEstadisticas = document.querySelector('.filtros-estadisticas');
    if (filtrosEstadisticas) {
        const filtroCategoria = filtrosEstadisticas.querySelector('#filtro-categoria');
        if (filtroCategoria) {
            filtroCategoria.innerHTML = `
                <option value="goles">Goles</option>
                <option value="asistencias">Asistencias</option>
                <option value="amarillas">Tarjetas Amarillas</option>
                <option value="rojas">Tarjetas Rojas</option>
            `;
        }
    }
    
    // Cargar temporadas al abrir la clasificación
    cargarTemporadas().then(temporadas => {
        const selectTemporada = document.getElementById('select-temporada');
        selectTemporada.innerHTML = '';
        
        if (temporadas && temporadas.length > 0) {
            temporadas.forEach(temporada => {
                const option = document.createElement('option');
                option.value = temporada.id;
                option.textContent = temporada.nombre;
                selectTemporada.appendChild(option);
            });
            
            // Cargar la clasificación de jugadores
            actualizarHTMLClasificacion();
            cargarClasificacionJugadores();
        } else {
            selectTemporada.innerHTML = '<option value="">No hay temporadas disponibles</option>';
        }
    });
    
    // Cargar las estadísticas de jugadores
    cargarEstadisticasJugadores();
    
    // Cargar los últimos partidos
    cargarUltimosPartidos();
}

// Función para filtrar estadísticas
function filtrarEstadisticas() {
    cargarEstadisticasJugadores();
}

// ====== LÓGICA DEL IMPORTADOR ======

// Función principal para inicializar el importador
function inicializarImportadorCSV() {
    // Cargar las temporadas para el selector
    cargarTemporadas().then(temporadas => {
        const selectTemporada = document.getElementById('temporada-id');
        selectTemporada.innerHTML = '';
        
        if (temporadas && temporadas.length > 0) {
            temporadas.forEach(temporada => {
                const option = document.createElement('option');
                option.value = temporada.id;
                option.textContent = temporada.nombre;
                selectTemporada.appendChild(option);
            });
        } else {
            selectTemporada.innerHTML = '<option value="">No hay temporadas disponibles</option>';
            document.getElementById('btn-import-csv').disabled = true;
        }
    });
    
    // Event listeners
    document.getElementById('btn-preview-csv').addEventListener('click', mostrarVistaPrevia);
    document.getElementById('btn-import-csv').addEventListener('click', iniciarImportacion);
}

// Función para mostrar la vista previa del CSV
async function mostrarVistaPrevia() {
    const fileInput = document.getElementById('csv-file');
    const previewContainer = document.getElementById('csv-preview-container');
    const previewElement = document.getElementById('csv-preview');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CSV');
        return;
    }
    
    const file = fileInput.files[0];
    
    try {
        const parsedData = await parseCSV(file);
        
        if (parsedData.data.length === 0) {
            previewElement.innerHTML = '<p>El archivo CSV no contiene datos.</p>';
            previewContainer.style.display = 'block';
            return;
        }
        
        // Crear tabla HTML para la vista previa
        let tableHTML = '<table><thead><tr>';
        
        // Encabezados
        parsedData.meta.fields.forEach(field => {
            tableHTML += `<th>${field}</th>`;
        });
        
        tableHTML += '</tr></thead><tbody>';
        
        // Datos (mostrar máximo 5 filas)
        const rowsToShow = Math.min(5, parsedData.data.length);
        for (let i = 0; i < rowsToShow; i++) {
            tableHTML += '<tr>';
            parsedData.meta.fields.forEach(field => {
                tableHTML += `<td>${parsedData.data[i][field] || ''}</td>`;
            });
            tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table>';
        
        if (parsedData.data.length > 5) {
            tableHTML += `<p>Mostrando 5 de ${parsedData.data.length} filas.</p>`;
        }
        
        previewElement.innerHTML = tableHTML;
        previewContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error al analizar el CSV:', error);
        previewElement.innerHTML = `<p class="log-error">Error al analizar el CSV: ${error.message}</p>`;
        previewContainer.style.display = 'block';
    }
}

// Función para analizar el CSV
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        resolve(results);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
        
        reader.readAsText(file);
    });
}

// Función para iniciar la importación
async function iniciarImportacion() {
    const fileInput = document.getElementById('csv-file');
    const temporadaId = document.getElementById('temporada-id').value;
    const duracionPartido = parseInt(document.getElementById('duracion-partidos').value);
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecciona un archivo CSV');
        return;
    }
    
    if (!temporadaId) {
        alert('Por favor, selecciona una temporada');
        return;
    }
    
    // Mostrar el contenedor de progreso
    const progressContainer = document.getElementById('import-progress-container');
    const progressBar = document.getElementById('import-progress-bar');
    const statusElement = document.getElementById('import-status');
    const logElement = document.getElementById('import-log');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    statusElement.textContent = 'Analizando CSV...';
    logElement.innerHTML = '';
    
    try {
        // Parsear el CSV
        const file = fileInput.files[0];
        const parsedData = await parseCSV(file);
        
        if (parsedData.data.length === 0) {
            logMessage(logElement, 'El archivo CSV no contiene datos.', 'error');
            return;
        }
        
        logMessage(logElement, `Se han encontrado ${parsedData.data.length} partidos para importar.`, 'info');
        
        // Iniciar la importación
        await importarPartidos(parsedData.data, temporadaId, duracionPartido, {
            progressBar,
            statusElement,
            logElement
        });
        
    } catch (error) {
        console.error('Error en la importación:', error);
        logMessage(logElement, `Error en la importación: ${error.message}`, 'error');
        statusElement.textContent = 'Error en la importación';
    }
}

// Función para importar los partidos
async function importarPartidos(partidos, temporadaId, duracionPartido, ui) {
    const { progressBar, statusElement, logElement } = ui;
    
    // Calcular el total de operaciones
    const totalPartidos = partidos.length;
    let importados = 0;
    
    // Actualizar la UI
    progressBar.style.width = '0%';
    statusElement.textContent = `Importando 0 de ${totalPartidos} partidos...`;
    
    // Procesar cada partido
    for (const [index, partido] of partidos.entries()) {
        try {
            // Verificar que el partido tenga los datos necesarios
            if (!validarPartido(partido)) {
                logMessage(logElement, `Partido #${index + 1} inválido. Faltan datos requeridos.`, 'warning');
                continue;
            }
            
            // 1. Guardar el partido
            const partidoId = await guardarPartido(partido, temporadaId, duracionPartido);
            
            if (!partidoId) {
                logMessage(logElement, `Error al guardar el partido #${index + 1}.`, 'error');
                continue;
            }
            
            // 2. Procesar jugadores y estadísticas del equipo local
            await procesarEquipo(partido, partidoId, 'local', logElement);
            
            // 3. Procesar jugadores y estadísticas del equipo visitante
            await procesarEquipo(partido, partidoId, 'visitante', logElement);
            
            // Actualizar contador y progreso
            importados++;
            const porcentaje = Math.round((importados / totalPartidos) * 100);
            progressBar.style.width = `${porcentaje}%`;
            statusElement.textContent = `Importando ${importados} de ${totalPartidos} partidos (${porcentaje}%)...`;
            
            logMessage(logElement, `Partido #${index + 1} importado correctamente.`, 'success');
            
        } catch (error) {
            console.error(`Error al importar partido #${index + 1}:`, error);
            logMessage(logElement, `Error al importar partido #${index + 1}: ${error.message}`, 'error');
        }
    }
    
    // Actualizar mensaje final
    statusElement.textContent = `Importación completada. ${importados} de ${totalPartidos} partidos importados.`;
    progressBar.style.width = '100%';
    
    // Mostrar mensaje de resumen
    if (importados === totalPartidos) {
        logMessage(logElement, `¡Importación completada exitosamente! Todos los partidos fueron importados.`, 'success');
    } else {
        logMessage(logElement, `Importación completada con advertencias. ${importados} de ${totalPartidos} partidos fueron importados.`, 'warning');
    }
}

// Función para validar que el partido tenga los datos mínimos requeridos
function validarPartido(partido) {
    // Verificar campos requeridos
    const camposRequeridos = [
        'Fecha', 'equipo local', 'equipo visitante', 
        'Goles Local', 'Goles vistante'
    ];
    
    for (const campo of camposRequeridos) {
        if (partido[campo] === undefined || partido[campo] === null || partido[campo] === '') {
            return false;
        }
    }
    
    return true;
}

// Función para guardar el partido en la base de datos
async function guardarPartido(partido, temporadaId, duracionPartido) {
    try {
        // Formatear la fecha (asumiendo que viene en formato DD/MM/YYYY)
        let fechaPartido = partido['Fecha'];
        
        // Convertir la fecha si es necesario
        if (typeof fechaPartido === 'string') {
            // Intentar diferentes formatos comunes
            if (fechaPartido.includes('/')) {
                // Formato DD/MM/YYYY
                const partesFecha = fechaPartido.split('/');
                if (partesFecha.length === 3) {
                    fechaPartido = `${partesFecha[2]}-${partesFecha[1].padStart(2, '0')}-${partesFecha[0].padStart(2, '0')}`;
                }
            }
            // Si es una fecha en formato de Excel (número de serie)
            else if (!isNaN(fechaPartido)) {
                // Convertir número de serie de Excel a fecha
                // Excel usa días desde el 1 de enero de 1900 (o 1904 en Mac)
                const excelDate = new Date((fechaPartido - 25569) * 86400 * 1000);
                fechaPartido = excelDate.toISOString().split('T')[0];
            }
        }
        
        // Crear objeto para insertar
        const partidoData = {
            fecha_partido: fechaPartido,
            equipo_local_nombre: partido['equipo local'],
            equipo_local_goles: parseInt(partido['Goles Local']) || 0,
            equipo_visitante_nombre: partido['equipo visitante'],
            equipo_visitante_goles: parseInt(partido['Goles vistante']) || 0,
            duracionPartido: duracionPartido,
            temporada_id: temporadaId
        };
        
        // Insertar el partido
        const { data, error } = await supabaseClient
            .from('partidos')
            .insert([partidoData])
            .select()
            .single();
            
        if (error) {
            console.error('Error al guardar el partido:', error);
            throw error;
        }
        
        return data.id;
        
    } catch (error) {
        console.error('Error en guardarPartido:', error);
        throw error;
    }
}

// Función para procesar un equipo (jugadores y estadísticas)
async function procesarEquipo(partido, partidoId, tipoEquipo, logElement) {
    try {
        // Determinar los prefijos según el tipo de equipo
        const prefijos = tipoEquipo === 'local' 
            ? { goleadores: 'Goleadores Local', asistencias: 'Asistencias Local', tarjetas: 'Tarjetas amarillas local' }
            : { goleadores: 'Goleadores visitante', asistencias: 'Asistencias visitante', tarjetas: 'Tarjetas amarillas visitante' };
        
        // Extraer las listas de jugadores
        let goleadores = procesarListaJugadores(partido[prefijos.goleadores] || '');
        let asistentes = procesarListaJugadores(partido[prefijos.asistencias] || '');
        let tarjetas = procesarListaJugadores(partido[prefijos.tarjetas] || '');
        
        // Crear un conjunto único de jugadores
        const jugadoresSet = new Set([
            ...goleadores.map(g => g.nombre),
            ...asistentes.map(a => a.nombre),
            ...tarjetas.map(t => t.nombre)
        ]);
        
        // Para cada jugador, guardar datos y estadísticas
        for (const nombreJugador of jugadoresSet) {
            // Guardar el jugador
            const { data: jugadorData, error: jugadorError } = await supabaseClient
                .from('jugadores')
                .insert([{
                    partido_id: partidoId,
                    nombre: nombreJugador,
                    equipo: tipoEquipo
                }])
                .select()
                .single();
                
            if (jugadorError) {
                logMessage(logElement, `Error al guardar jugador ${nombreJugador}: ${jugadorError.message}`, 'error');
                continue;
            }
            
            // Calcular estadísticas
            const golesJugador = goleadores.filter(g => g.nombre === nombreJugador)
                .reduce((sum, g) => sum + g.cantidad, 0);
                
            const asistenciasJugador = asistentes.filter(a => a.nombre === nombreJugador)
                .reduce((sum, a) => sum + a.cantidad, 0);
                
            const tarjetasAmarillasJugador = tarjetas.filter(t => t.nombre === nombreJugador)
                .reduce((sum, t) => sum + t.cantidad, 0);
            
            // Guardar estadísticas
            const { error: statsError } = await supabaseClient
                .from('estadisticas')
                .insert([{
                    partido_id: partidoId,
                    jugador_id: jugadorData.id,
                    goles: golesJugador,
                    asistencias: asistenciasJugador,
                    tarjetas_amarillas: tarjetasAmarillasJugador,
                    tarjetas_rojas: 0 // Por defecto 0, no hay info en el CSV
                }]);
                
            if (statsError) {
                logMessage(logElement, `Error al guardar estadísticas de ${nombreJugador}: ${statsError.message}`, 'error');
            }
        }
        
    } catch (error) {
        console.error(`Error al procesar equipo ${tipoEquipo}:`, error);
        throw error;
    }
}

// Función para procesar una lista de jugadores en formato texto
function procesarListaJugadores(texto) {
    if (!texto || typeof texto !== 'string') {
        return [];
    }
    
    // Diferentes formatos posibles y sus separadores
    const separadores = [',', ';', '/', '\\', '+'];
    let mejorSeparador = null;
    let maxElementos = 0;
    
    // Encontrar el mejor separador
    for (const sep of separadores) {
        const elementos = texto.split(sep).filter(e => e.trim() !== '').length;
        if (elementos > maxElementos) {
            maxElementos = elementos;
            mejorSeparador = sep;
        }
    }
    
    if (!mejorSeparador) {
        // Si no se encontró un buen separador, tratar como un solo nombre
        return texto.trim() !== '' ? [{ nombre: texto.trim(), cantidad: 1 }] : [];
    }
    
    // Dividir y procesar cada elemento
    return texto.split(mejorSeparador)
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(item => {
            // Buscar patrones como "Nombre (2)" o "Nombre x2" para cantidades
            const cantidadRegExp = /\((\d+)\)$|\s+x(\d+)$|\s+(\d+)$/;
            const match = item.match(cantidadRegExp);
            
            if (match) {
                const cantidad = parseInt(match[1] || match[2] || match[3] || 1);
                const nombre = item.replace(cantidadRegExp, '').trim();
                return { nombre, cantidad };
            }
            
            return { nombre: item, cantidad: 1 };
        });
}

// Función para agregar un mensaje al log
function logMessage(logElement, mensaje, tipo) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${tipo}`;
    entry.textContent = mensaje;
    
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
}

// Inicializar el importador cuando se cargue el documento
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe el contenedor del importador
    if (document.getElementById('importador-csv')) {
        inicializarImportadorCSV();
    }
});
