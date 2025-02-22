// Configuración de Supabase
const SUPABASE_URL = 'https://joiayunvjnuvxofgnnch.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvaWF5dW52am51dnhvZmdubmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzk0NjQsImV4cCI6MjA1NTcxNTQ2NH0.aJT8J6PQbf7a6-xYZytXUyh14-UDZpRuSJvgEmZIgtc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let jugadoresA = [];
let jugadoresB = [];
let partidoJSON = null;
let equipoActivo = 'a'; // 'a' para local, 'b' para visitante
let estadisticasJugadores = { a: {}, b: {} };

// ======================== EVENTOS Y MANEJO DEL DOM ========================

// Actualizar nombres de equipos en tiempo real
document.getElementById('nombre-equipo-a').addEventListener('input', function() {
    const nombre = this.value || 'Equipo Local';
    document.getElementById('nombre-visual-a').textContent = nombre;
    document.getElementById('titulo-jugadores-a').textContent = `Jugadores ${nombre}`;
    actualizarSelectoresEquipo();
});

document.getElementById('nombre-equipo-b').addEventListener('input', function() {
    const nombre = this.value || 'Equipo Visitante';
    document.getElementById('nombre-visual-b').textContent = nombre;
    document.getElementById('titulo-jugadores-b').textContent = `Jugadores ${nombre}`;
    actualizarSelectoresEquipo();
});

// ======================== FUNCIONES PARA JUGADORES ========================

// Añadir jugador a un equipo
function agregarJugador(equipo) {
    const inputId = `nuevo-jugador-${equipo}`;
    const nombre = document.getElementById(inputId).value.trim();
    
    if (!nombre) {
        alert('⚠️ Ingresa un nombre válido');
        return;
    }

    // Validar duplicados
    const jugadores = equipo === 'a' ? jugadoresA : jugadoresB;
    if (jugadores.includes(nombre)) {
        alert('❌ Este jugador ya existe');
        return;
    }

    // Añadir a la lista
    jugadores.push(nombre);
    actualizarListaJugadores(equipo);
    document.getElementById(inputId).value = '';
    
    // Inicializar estadísticas
    inicializarEstadisticasJugador(nombre, equipo);
    if (equipo === equipoActivo) cargarTablaEstadisticas();
}

// Actualizar lista visual de jugadores
function actualizarListaJugadores(equipo) {
    const listaId = `lista-jugadores-${equipo}`;
    const jugadores = equipo === 'a' ? jugadoresA : jugadoresB;
    const lista = document.getElementById(listaId);
    
    lista.innerHTML = jugadores.map((jugador, index) => `
        <div class="jugador-item">
            <span>${jugador}</span>
            <button class="delete-btn" onclick="eliminarJugador('${equipo}', ${index})">✕</button>
        </div>
    `).join('');
}

// Eliminar jugador
function eliminarJugador(equipo, index) {
    const jugadores = equipo === 'a' ? jugadoresA : jugadoresB;
    const jugadorEliminado = jugadores.splice(index, 1)[0];
    
    // Eliminar estadísticas
    delete estadisticasJugadores[equipo][jugadorEliminado];
    actualizarListaJugadores(equipo);
    if (equipo === equipoActivo) cargarTablaEstadisticas();
}

// ======================== ESTADÍSTICAS DE JUGADORES ========================

// Inicializar estadísticas para un jugador
function inicializarEstadisticasJugador(jugador, equipo) {
    if (!estadisticasJugadores[equipo][jugador]) {
        estadisticasJugadores[equipo][jugador] = {
            goles: 0,
            asistencias: 0,
            amarillas: 0,
            rojas: 0
        };
    }
}

// Cambiar pestaña de estadísticas
function cambiarTab(tab) {
    equipoActivo = tab === 'equipo-a' ? 'a' : 'b';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    cargarTablaEstadisticas();
}

// Cargar tabla de estadísticas
function cargarTablaEstadisticas() {
    const tbody = document.getElementById('tbody-estadisticas');
    const jugadores = equipoActivo === 'a' ? jugadoresA : jugadoresB;
    
    tbody.innerHTML = jugadores.map(jugador => {
        const stats = estadisticasJugadores[equipoActivo][jugador];
        return `
            <tr>
                <td>${jugador}</td>
                <td>
                    <div class="stat-control">
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'goles', -1)">-</button>
                        <span>${stats.goles}</span>
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'goles', 1)">+</button>
                    </div>
                </td>
                <td>
                    <div class="stat-control">
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'asistencias', -1)">-</button>
                        <span>${stats.asistencias}</span>
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'asistencias', 1)">+</button>
                    </div>
                </td>
                <td>
                    <div class="stat-control">
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'amarillas', -1)">-</button>
                        <span>${stats.amarillas}</span>
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'amarillas', 1)">+</button>
                    </div>
                </td>
                <td>
                    <div class="stat-control">
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'rojas', -1)">-</button>
                        <span>${stats.rojas}</span>
                        <button class="stat-btn" onclick="actualizarEstadistica('${jugador}', 'rojas', 1)">+</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Actualizar estadísticas
function actualizarEstadistica(jugador, tipo, delta) {
    const stats = estadisticasJugadores[equipoActivo][jugador];
    
    // Validaciones
    if (stats[tipo] + delta < 0) return;  // No valores negativos
    if (tipo === 'rojas' && stats.rojas + delta > 1) {
        alert('🚨 Un jugador no puede tener más de 1 tarjeta roja');
        return;
    }
    
    stats[tipo] += delta;
    cargarTablaEstadisticas();
}

// ======================== GUARDAR Y EXPORTAR ========================

async function guardarPartido() {
    // Validaciones básicas
    if (jugadoresA.length === 0 || jugadoresB.length === 0) {
        alert('⚠️ ¡Debes añadir jugadores a ambos equipos!');
        return;
    }
    
    const golesLocal = document.getElementById('goles-local').value;
    const golesVisitante = document.getElementById('goles-visitante').value;
    if (!golesLocal || !golesVisitante) {
        alert('⚠️ ¡Selecciona el resultado final!');
        return;
    }
    
    // Construir objeto del partido
    partidoJSON = {
        duracion: parseInt(document.getElementById('duracion-partido').value),
        fecha: new Date().toISOString(),
        equipoA: {
            nombre: document.getElementById('nombre-equipo-a').value || 'Equipo Local',
            jugadores: jugadoresA,
            goles: parseInt(golesLocal)
        },
        equipoB: {
            nombre: document.getElementById('nombre-equipo-b').value || 'Equipo Visitante',
            jugadores: jugadoresB,
            goles: parseInt(golesVisitante)
        },
        estadisticas: estadisticasJugadores
    };
    
    // Guardar en Supabase
    try {
        const { error } = await supabase.from('partidos').insert([partidoJSON]);
        if (error) throw error;
        
        // Backup en localStorage
        localStorage.setItem('partido', JSON.stringify(partidoJSON));
        alert('✅ Partido guardado correctamente');
    } catch (error) {
        alert(`❌ Error al guardar: ${error.message}`);
    }
}

function exportarJSON() {
    if (!partidoJSON) {
        alert('⚠️ Primero guarda el partido');
        return;
    }
    
    const jsonStr = JSON.stringify(partidoJSON, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `partido_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ======================== INICIALIZACIÓN ========================
document.addEventListener('DOMContentLoaded', () => {
    cargarTablaEstadisticas();
    actualizarSelectoresEquipo();
});