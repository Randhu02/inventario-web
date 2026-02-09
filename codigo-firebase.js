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
    "CLORURO DE POTASIO *50 KG.": 7,
    "NITRO S PREMIUM AMARILLO * 50 KG": 8,
    "SUPER BLUE * 50 KG": 9,
    "NPK 20-20-20 * 50 KG": 10,
    "PAPA SIERRA * 50 KG": 11
};

// Variables globales
let usuarioAutenticado = null;
let modoActual = 'vista';
let stockResumen = {};

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
    cargarResumenStock(); // Cargar resumen al mostrar app
}

function actualizarInterfazSegunModo() {
    const userEmail = document.getElementById('userEmail');
    const formContainer = document.getElementById('formContainer');
    const btnLogout = document.getElementById('btnLogout');
    const btnCambiar = document.getElementById('btnCambiarModo');
    const infoModo = document.getElementById('infoModo');
    
    if (modoActual === 'admin' && usuarioAutenticado) {
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
        userEmail.textContent = 'Modo: Visitante (Solo lectura)';
        formContainer.style.display = 'none';
        btnLogout.style.display = 'none';
        btnCambiar.textContent = 'Cambiar a Modo Admin';
        btnCambiar.style.background = '#0d6efd';
        
        infoModo.innerHTML = `
            <div class="vista-message">
                👁️ <strong>Estás en modo Vista</strong><br>
                Solo puedes consultar el inventario.
            </div>
        `;
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================

// Formatear números con separador de miles
function formatearNumero(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Formatear fecha
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ==================== AUTENTICACIÓN ====================

auth.onAuthStateChanged((user) => {
    usuarioAutenticado = user;
    
    if (user && modoActual === 'admin') {
        mostrarApp('admin');
    }
});

// ==================== EVENTOS DEL DOM ====================

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado");
    
    // 1. Botón Modo Vista
    document.getElementById("btnModoVista").addEventListener("click", function() {
        modoActual = 'vista';
        usuarioAutenticado = null;
        mostrarApp('vista');
    });
    
    // 2. Botón Modo Admin
    document.getElementById("btnModoAdmin").addEventListener("click", function() {
        mostrarLogin();
    });
    
    // 3. Volver al inicio
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
            auth.signOut();
            modoActual = 'vista';
            usuarioAutenticado = null;
            mostrarApp('vista');
        } else {
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
    
    // 7. Formulario de Inventario
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
        const observaciones = document.getElementById("observaciones").value;
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
                observaciones: observaciones || '',
                usuario: usuarioAutenticado.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            database.ref("inventario/" + itemProducto).set(movimientos, () => {
                alert("Registro agregado correctamente!");
                document.getElementById("formInventario").reset();
                cargarResumenStock(); // Actualizar resumen
            });
        });
    });

    // 8. Botón Mostrar Tabla
    document.getElementById("btnMostrar").addEventListener("click", mostrarTabla);
    
    // 9. Botón Exportar a Excel
    document.getElementById("btnExportarExcel").addEventListener("click", exportarExcel);
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
            contenedor.innerHTML = `
                <div class="info-box">
                    <h3>${descripcion}</h3>
                    <p>No hay registros para este producto.</p>
                </div>`;
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
                    <th>Observaciones</th>`;
        
        if (modoActual === 'admin' && usuarioAutenticado) {
            cabecera += `<th>Acción</th>`;
        }
        
        cabecera += `<th>Usuario</th></tr></thead><tbody></tbody>`;
        tabla.innerHTML = cabecera;

        const tbody = tabla.querySelector("tbody");

        movimientos.forEach((item, index) => {
            const esUltimoRegistro = index === movimientos.length - 1;
            const claseFila = esUltimoRegistro ? 'ultimo-stock' : '';
            
            let fila = `
                <td class="numero-formateado ${claseFila}">${item.item}</td>
                <td ${claseFila ? 'class="ultimo-stock"' : ''}>${formatearFecha(item.fecha)}</td>
                <td ${claseFila ? 'class="ultimo-stock"' : ''}>${item.operacion}</td>
                <td class="numero-formateado ${claseFila}">${formatearNumero(item.ingreso)}</td>
                <td class="numero-formateado ${claseFila}">${formatearNumero(item.salida)}</td>
                <td class="numero-formateado ${claseFila}"><strong>${formatearNumero(item.stock)}</strong></td>
                <td ${claseFila ? 'class="ultimo-stock"' : ''}>${item.observaciones || '-'}</td>`;
            
            if (modoActual === 'admin' && usuarioAutenticado) {
                fila += `
                <td ${claseFila ? 'class="ultimo-stock"' : ''}>
                    <button class="btn-eliminar" data-item="${itemProducto}" data-index="${index}">
                        Eliminar
                    </button>
                </td>`;
            }
            
            fila += `<td ${claseFila ? 'class="ultimo-stock"' : ''}>${item.usuario || 'N/A'}</td>`;
            
            const tr = document.createElement("tr");
            if (claseFila) tr.className = claseFila;
            tr.innerHTML = fila;
            tbody.appendChild(tr);
        });

        contenedor.appendChild(tabla);
        
        // Agregar eventos a botones eliminar
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
            cargarResumenStock(); // Actualizar resumen
        });
    });
}

// ==================== TABLA RESUMEN ====================

function cargarResumenStock() {
    console.log("Cargando resumen de stock...");
    const container = document.getElementById("tablaResumenContainer");
    
    if (!container) {
        console.error("ERROR: tablaResumenContainer no encontrado");
        return;
    }
    
    container.innerHTML = '<p>Cargando resumen...</p>';
    
    // Obtener todos los productos
    const promesas = Object.keys(productosItem).map(descripcion => {
        const itemProducto = productosItem[descripcion];
        return database.ref("inventario/" + itemProducto).once("value")
            .then(snapshot => {
                const movimientos = snapshot.val();
                let stockActual = 0;
                
                if (movimientos && movimientos.length > 0) {
                    stockActual = movimientos[movimientos.length - 1].stock;
                }
                
                return {
                    item: itemProducto,
                    descripcion: descripcion,
                    stock: stockActual
                };
            });
    });
    
    Promise.all(promesas)
        .then(datos => {
            // Ordenar por item
            datos.sort((a, b) => a.item - b.item);
            
            // Guardar para exportar
            stockResumen = datos;
            
            // Generar tabla
            const tabla = document.createElement("table");
            tabla.innerHTML = `
                <thead>
                    <tr>
                        <th>ITEM</th>
                        <th>DESCRIPCIÓN DEL ARTICULO</th>
                        <th>STOCK ACTUALIZADO</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            `;
            
            const tbody = tabla.querySelector("tbody");
            let totalStock = 0;
            
            datos.forEach(item => {
                totalStock += item.stock;
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td class="numero-formateado">${item.item}</td>
                    <td>${item.descripcion}</td>
                    <td class="numero-formateado"><strong>${formatearNumero(item.stock)}</strong></td>
                `;
                tbody.appendChild(fila);
            });
            
            // Fila de total
            const filaTotal = document.createElement("tr");
            filaTotal.className = "resumen-total";
            filaTotal.innerHTML = `
                <td colspan="2"><strong>TOTAL GENERAL</strong></td>
                <td class="numero-formateado"><strong>${formatearNumero(totalStock)}</strong></td>
            `;
            tbody.appendChild(filaTotal);
            
            container.innerHTML = '';
            container.appendChild(tabla);
        })
        .catch(error => {
            console.error("Error al cargar resumen:", error);
            container.innerHTML = '<p class="error-message">Error al cargar el resumen</p>';
        });
}

// ==================== EXPORTAR A EXCEL COMPLETO ====================

async function exportarExcel() {
    console.log("Exportando a Excel completo...");
    
    try {
        // Mostrar mensaje de carga
        const btnExportar = document.getElementById("btnExportarExcel");
        const textoOriginal = btnExportar.textContent;
        btnExportar.textContent = "⏳ Generando Excel...";
        btnExportar.disabled = true;
        
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // ========== HOJA 1: RESUMEN ==========
        const datosResumen = [];
        
        // Título
        datosResumen.push(["STOCK DE ENVASES VACIOS CERES PERÚ"]);
        datosResumen.push([]);
        datosResumen.push(["Fecha de exportación:", new Date().toLocaleString('es-PE')]);
        datosResumen.push([]);
        datosResumen.push(["ITEM", "DESCRIPCIÓN DEL ARTICULO", "STOCK ACTUALIZADO"]);
        
        // Obtener datos del resumen desde Firebase
        let totalStock = 0;
        const productosKeys = Object.keys(productosItem);
        
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            
            let stockActual = 0;
            if (movimientos.length > 0) {
                stockActual = movimientos[movimientos.length - 1].stock;
            }
            
            totalStock += stockActual;
            datosResumen.push([
                itemProducto,
                descripcion,
                stockActual
            ]);
        }
        
        // Línea en blanco y total
        datosResumen.push([]);
        datosResumen.push(["TOTAL GENERAL", "", totalStock]);
        
        // Crear hoja de resumen
        const wsResumen = XLSX.utils.aoa_to_sheet(datosResumen);
        
        // Ajustar ancho de columnas para resumen
        wsResumen['!cols'] = [
            {wch: 8},  // ITEM
            {wch: 60}, // DESCRIPCIÓN
            {wch: 18}  // STOCK
        ];
        
        // Agregar hoja al libro con nombre "RESUMEN"
        XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN");
        
        // ========== HOJAS POR PRODUCTO ==========
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            
            const datosProducto = [];
            
            // Título del producto
            datosProducto.push([`INVENTARIO: ${descripcion}`]);
            datosProducto.push([]);
            
            if (movimientos.length > 0) {
                // Encabezados
                datosProducto.push(["ITEM", "FECHA", "OPERACIÓN", "INGRESO", "SALIDA", "STOCK", "OBSERVACIONES", "USUARIO"]);
                
                // Datos de movimientos
                movimientos.forEach(mov => {
                    datosProducto.push([
                        mov.item,
                        mov.fecha,
                        mov.operacion,
                        mov.ingreso,
                        mov.salida,
                        mov.stock,
                        mov.observaciones || '-',
                        mov.usuario || 'N/A'
                    ]);
                });
                
                // Línea en blanco y stock final
                datosProducto.push([]);
                const ultimoStock = movimientos[movimientos.length - 1].stock;
                datosProducto.push(["STOCK FINAL:", "", "", "", "", ultimoStock, "", ""]);
                
            } else {
                datosProducto.push(["NO HAY REGISTROS PARA ESTE PRODUCTO"]);
            }
            
            // Crear hoja del producto
            const wsProducto = XLSX.utils.aoa_to_sheet(datosProducto);
            
            // Ajustar ancho de columnas para producto
            wsProducto['!cols'] = [
                {wch: 8},   // ITEM
                {wch: 12},  // FECHA
                {wch: 25},  // OPERACIÓN
                {wch: 10},  // INGRESO
                {wch: 10},  // SALIDA
                {wch: 10},  // STOCK
                {wch: 30},  // OBSERVACIONES
                {wch: 25}   // USUARIO
            ];
            
            // Nombre de hoja (ITEM 1, ITEM 2, etc.)
            const nombreHoja = `ITEM ${itemProducto}`;
            
            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, wsProducto, nombreHoja);
        }
        
        // ========== HOJA DE ÍNDICE ==========
        const datosIndice = [];
        datosIndice.push(["REPORTE COMPLETO DE INVENTARIO - CERES PERÚ SAC"]);
        datosIndice.push([]);
        datosIndice.push(["Fecha de generación:", new Date().toLocaleString('es-PE')]);
        datosIndice.push([]);
        datosIndice.push(["Este archivo contiene las siguientes hojas:"]);
        datosIndice.push([]);
        datosIndice.push(["HOJA", "CONTENIDO", "CANTIDAD DE REGISTROS"]);
        
        // RESUMEN
        datosIndice.push(["RESUMEN", "Resumen general de stock", productosKeys.length]);
        
        // Productos
        for (let i = 0; i < productosKeys.length; i++) {
            const descripcion = productosKeys[i];
            const itemProducto = i + 1;
            const snapshot = await database.ref("inventario/" + itemProducto).once("value");
            const movimientos = snapshot.val() || [];
            
            datosIndice.push([
                `ITEM ${itemProducto}`,
                descripcion,
                movimientos.length
            ]);
        }
        
        const wsIndice = XLSX.utils.aoa_to_sheet(datosIndice);
        wsIndice['!cols'] = [
            {wch: 10},   // HOJA
            {wch: 60},   // CONTENIDO
            {wch: 20}    // REGISTROS
        ];
        
        XLSX.utils.book_append_sheet(wb, wsIndice, "ÍNDICE");
        
        // ========== GENERAR ARCHIVO ==========
        const fecha = new Date();
        const fechaStr = fecha.toISOString().slice(0,10).replace(/-/g, '');
        const horaStr = fecha.getHours().toString().padStart(2, '0') + 
                       fecha.getMinutes().toString().padStart(2, '0');
        
        const nombreArchivo = `Inventario_Completo_Ceres_${fechaStr}_${horaStr}.xlsx`;
        
        // Exportar archivo
        XLSX.writeFile(wb, nombreArchivo);
        
        // Restaurar botón
        btnExportar.textContent = textoOriginal;
        btnExportar.disabled = false;
        
        // Mensaje de confirmación
        const cantidadHojas = 1 + productosKeys.length + 1; // RESUMEN + Productos + ÍNDICE
        alert(`✅ Archivo "${nombreArchivo}" exportado exitosamente.\n\nContiene ${cantidadHojas} hojas:\n• RESUMEN: Stock actual de todos los productos\n• ITEM 1-${productosKeys.length}: Tablas completas por producto\n• ÍNDICE: Resumen del archivo`);
        
    } catch (error) {
        console.error("Error al exportar Excel:", error);
        alert("❌ Error al exportar a Excel: " + error.message);
        
        // Restaurar botón en caso de error
        const btnExportar = document.getElementById("btnExportarExcel");
        if (btnExportar) {
            btnExportar.textContent = "📊 Exportar a Excel";
            btnExportar.disabled = false;
        }
    }
}



