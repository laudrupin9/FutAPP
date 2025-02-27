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
