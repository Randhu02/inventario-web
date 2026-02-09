// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBdiAPbAJ5MZZDYSJYyx9QWpBahcPq156g",
    authDomain: "inventario-ceres.firebaseapp.com",
    databaseURL: "https://inventario-ceres-default-rtdb.firebaseio.com/",
    projectId: "inventario-ceres",
    storageBucket: "inventario-ceres.firebasestorage.app",
    messagingSenderId: "831673885062",
    appId: "1:831673885062:web:d188c71340919255d40c07"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado correctamente");
} catch (error) {
    console.error("Error al inicializar Firebase:", error);
}

const database = firebase.database();
const auth = firebase.auth();

// Mapeo de productos
const productosItem = {
    "UREA FERTI * 50 KG.": 1,
    "FOSFATO DIAMONICO FERTI * 50 KG.": 2,
    "SULFATO DE AMONIO FERTI * 50 KG.": 3,
    "ADITIVO MARRON - BOLSAS * 20 KG.": 4,
    "NITRATO DE AMONIO * 50 KG.": 5,
    "NITRATO DE AMONIO * 50 KG. - POLIPROPILENO": 6,
    "CLORURO DE POTASIO *50 KG.": 7
};

// Variables globales
let usuarioAutenticado = null;
let modoActual = 'vista'; // 'vista' o 'admin'

// ==================== FUNCIONES DE VISUALIZACIÓN ====================

function mostrarInicio() {
    document.getElementById('inicioContainer').style.display = 'flex';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('inicioContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
}

function mostrarApp(modo) {
    modoActual = modo;
    document.getElementById('inicioContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    
    actualizarInterfazSegunModo();
}

function actualizarInterfazSegunModo() {
    const userEmail = document.getElementById('userEmail');
    const formContainer = document.getElementById('formContainer');
    const btnLogout = document.getElementById('btnLogout');
    const btnCambiar = document.getElementById('btnCambiarModo');
    const infoModo = document.getElementById('infoModo');
    
    if (modoActual === 'admin' && usuarioAutenticado) {
        // MODO ADMINISTRADOR
        userEmail.textContent = `Modo: Administrador (${usuarioAutenticado.email})`;
        formContainer.style.display = 'block';
        btnLogout.style.display = 'inline-block';
        btnCambiar.textContent = 'Cambiar a Modo Vista';
        btnCambiar.style.background = '#6c757d';
        
        infoModo.innerHTML = `
            <div class="admin-message">
                ✅ <strong>Estás en modo Administrador</strong><br>
                Puedes agregar nuevos registros y eliminar existentes.
            </div>
        `;
        
    } else {
        // MODO VISTA (SOLO LECTURA)
        userEmail.textContent = 'Modo: Visitante (Solo lectura)';
        formContainer.style.display = 'none';
        btnLogout.style.display = 'none';
        btnCambiar.textContent = 'Cambiar a Modo Admin';
        btnCambiar.style.background = '#0d6efd';
        
        infoModo.innerHTML = `
            <div class="vista-message">
                👁️ <strong>Estás en modo Vista</strong><br>
                Solo puedes consultar el inventario. Para agregar o eliminar registros, 
                cambia a Modo Administrador e ingresa tus credenciales.
            </div>
        `;
    }
}

// ==================== AUTENTICACIÓN ====================

// Verificar si hay usuario logueado al cargar
auth.onAuthStateChanged((user) => {
    usuarioAutenticado = user;
    
    // Si hay usuario logueado y estamos en modo admin, mostrar app
    if (user && modoActual === 'admin') {
        mostrarApp('admin');
    }
});

// ==================== EVENTOS DEL DOM ====================

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado");
    
    // 1. Botón Modo Vista (sin login)
    document.getElementById("btnModoVista").addEventListener("click", function() {
        modoActual = 'vista';
        usuarioAutenticado = null;
        mostrarApp('vista');
    });
    
    // 2. Botón Modo Admin (ir a login)
    document.getElementById("btnModoAdmin").addEventListener("click", function() {
        mostrarLogin();
    });
    
    // 3. Volver al inicio desde login
    document.getElementById("btnVolverInicio").addEventListener("click", function() {
        mostrarInicio();
    });
    
    // 4. Formulario de Login
    document.getElementById("loginForm").addEventListener("submit", function(e) {
        e.preventDefault();
        
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                document.getElementById("loginError").style.display = 'none';
                modoActual = 'admin';
                mostrarApp('admin');
            })
            .catch((error) => {
                document.getElementById("loginError").textContent = error.message;
                document.getElementById("loginError").style.display = 'block';
            });
    });
    
    // 5. Botón Cambiar Modo
    document.getElementById("btnCambiarModo").addEventListener("click", function() {
        if (modoActual === 'admin') {
            // Cambiar de admin a vista
            auth.signOut();
            modoActual = 'vista';
            usuarioAutenticado = null;
            mostrarApp('vista');
        } else {
            // Cambiar de vista a admin (ir a login)
            mostrarLogin();
        }
    });
    
    // 6. Botón Logout
    document.getElementById("btnLogout").addEventListener("click", function() {
        if (confirm("¿Cerrar sesión de administrador?")) {
            auth.signOut();
            modoActual = 'vista';
            mostrarApp('vista');
        }
    });
    
    // 7. Formulario de Inventario (solo funciona en modo admin)
    document.getElementById("formInventario").addEventListener("submit", function(e) {
        e.preventDefault();
        
        if (modoActual !== 'admin' || !usuarioAutenticado) {
            alert("Debe estar en modo Administrador para agregar registros");
            return;
        }
        
        const descripcion = document.getElementById("descripcion").value;
        const fecha = document.getElementById("fecha").value;
        const operacion = document.getElementById("operacion").value;
        const ingreso = Number(document.getElementById("ingreso").value);
        const salida = Number(document.getElementById("salida").value);
        const itemProducto = productosItem[descripcion];

        if (!itemProducto) {
            alert("Por favor seleccione una descripción válida");
            return;
        }

        database.ref("inventario/" + itemProducto).once("value", snapshot => {
            const movimientos = snapshot.val() || [];

            let ultimoStock = 0;
            if (movimientos.length > 0) {
                ultimoStock = movimientos[movimientos.length - 1].stock;
            }

            const stock = ultimoStock + ingreso - salida;

            movimientos.push({
                item: itemProducto,
                descripcion,
                fecha,
                operacion,
                ingreso,
                salida,
                stock,
                usuario: usuarioAutenticado.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            database.ref("inventario/" + itemProducto).set(movimientos, () => {
                alert("Registro agregado correctamente!");
                document.getElementById("formInventario").reset();
            });
        });
    });

    // 8. Botón Mostrar Tabla
    const btnMostrar = document.getElementById("btnMostrar");
    if (btnMostrar) {
        btnMostrar.addEventListener("click", mostrarTabla);
    }
});

// ==================== FUNCIÓN MOSTRAR TABLA ====================

function mostrarTabla() {
    console.log("Función mostrarTabla() ejecutada - Modo:", modoActual);
    
    const descripcion = document.getElementById("productoFiltro").value;
    const contenedor = document.getElementById("contenedorTablas");
    
    if (!contenedor) {
        console.error("ERROR: contenedorTablas no encontrado");
        return;
    }
    
    contenedor.innerHTML = "";

    if (!descripcion) {
        alert("Por favor seleccione un producto");
        return;
    }

    const itemProducto = productosItem[descripcion];

    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        const movimientos = snapshot.val();

        if (!movimientos || movimientos.length === 0) {
            contenedor.innerHTML = "<p>No hay registros para este producto.</p>";
            return;
        }

        const titulo = document.createElement("h3");
        titulo.textContent = descripcion;
        contenedor.appendChild(titulo);

        const tabla = document.createElement("table");
        tabla.border = "1";
        
        // Cabecera de tabla
        let cabecera = `
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Fecha</th>
                    <th>Operación</th>
                    <th>Ingreso</th>
                    <th>Salida</th>
                    <th>Stock</th>
                    <th>Usuario</th>`;
        
        // Solo mostrar columna Acción en modo admin
        if (modoActual === 'admin' && usuarioAutenticado) {
            cabecera += `<th>Acción</th>`;
        }
        
        cabecera += `</tr></thead><tbody></tbody>`;
        tabla.innerHTML = cabecera;

        const tbody = tabla.querySelector("tbody");

        movimientos.forEach((item, index) => {
            let fila = `
                <td>${item.item}</td>
                <td>${item.fecha}</td>
                <td>${item.operacion}</td>
                <td>${item.ingreso}</td>
                <td>${item.salida}</td>
                <td>${item.stock}</td>
                <td>${item.usuario || 'N/A'}</td>`;
            
            // Solo mostrar botón eliminar en modo admin
            if (modoActual === 'admin' && usuarioAutenticado) {
                fila += `
                <td>
                    <button class="btn-eliminar" data-item="${itemProducto}" data-index="${index}">
                        Eliminar
                    </button>
                </td>`;
            }
            
            const tr = document.createElement("tr");
            tr.innerHTML = fila;
            tbody.appendChild(tr);
        });

        contenedor.appendChild(tabla);
        
        // Agregar eventos a los botones eliminar (solo en modo admin)
        if (modoActual === 'admin' && usuarioAutenticado) {
            document.querySelectorAll(".btn-eliminar").forEach(btn => {
                btn.addEventListener("click", function() {
                    const itemProd = this.getAttribute("data-item");
                    const idx = this.getAttribute("data-index");
                    eliminarRegistro(parseInt(itemProd), parseInt(idx));
                });
            });
        }
    });
}

// ==================== ELIMINAR REGISTRO ====================

function eliminarRegistro(itemProducto, index) {
    if (modoActual !== 'admin' || !usuarioAutenticado) {
        alert("Debe estar en modo Administrador para eliminar registros");
        return;
    }
    
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        let movimientos = snapshot.val() || [];

        movimientos.splice(index, 1);

        // Recalcular stock
        let stock = 0;
        movimientos = movimientos.map(m => {
            stock = stock + m.ingreso - m.salida;
            return { ...m, stock };
        });

        database.ref("inventario/" + itemProducto).set(movimientos, () => {
            mostrarTabla();
        });
    });
}



