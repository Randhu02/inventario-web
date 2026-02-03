// CONFIGURACIÓN DE FIREBASE (Opción clásica)
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

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente cargado");
    
    // 1. Agregar registro
    const formInventario = document.getElementById("formInventario");
    if (formInventario) {
        formInventario.addEventListener("submit", function(e) {
            e.preventDefault();

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
                    stock
                });

                database.ref("inventario/" + itemProducto).set(movimientos, () => {
                    alert("Registro agregado correctamente!");
                    document.getElementById("formInventario").reset();
                });
            });
        });
    }

    // 2. Configurar botón "Mostrar"
    const btnMostrar = document.getElementById("btnMostrar");
    if (btnMostrar) {
        btnMostrar.addEventListener("click", mostrarTabla);
        console.log("Evento click agregado al botón Mostrar");
    } else {
        console.error("ERROR: Botón 'btnMostrar' no encontrado");
    }
});

// Mostrar tabla
function mostrarTabla() {
    console.log("Función mostrarTabla() ejecutada");
    
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
    console.log("Buscando producto:", descripcion, "Item:", itemProducto);

    database.ref("inventario/" + itemProducto).once("value", snapshot => {
        const movimientos = snapshot.val();
        console.log("Datos obtenidos de Firebase:", movimientos);

        if (!movimientos || movimientos.length === 0) {
            contenedor.innerHTML = "<p>No hay registros para este producto.</p>";
            return;
        }

        const titulo = document.createElement("h3");
        titulo.textContent = descripcion;
        contenedor.appendChild(titulo);

        const tabla = document.createElement("table");
        tabla.border = "1";
        tabla.innerHTML = `
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Fecha</th>
                    <th>Operación</th>
                    <th>Ingreso</th>
                    <th>Salida</th>
                    <th>Stock</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = tabla.querySelector("tbody");

        movimientos.forEach((item, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${item.item}</td>
                <td>${item.fecha}</td>
                <td>${item.operacion}</td>
                <td>${item.ingreso}</td>
                <td>${item.salida}</td>
                <td>${item.stock}</td>
                <td>
                    <button class="btn-eliminar" data-item="${itemProducto}" data-index="${index}">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        contenedor.appendChild(tabla);
        
        // Agregar eventos a los botones eliminar
        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", function() {
                const itemProd = this.getAttribute("data-item");
                const idx = this.getAttribute("data-index");
                eliminarRegistro(parseInt(itemProd), parseInt(idx));
            });
        });
    });
}

// Eliminar registro
function eliminarRegistro(itemProducto, index) {
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
            mostrarTabla(); // Volver a mostrar la tabla actualizada
        });
    });
}



