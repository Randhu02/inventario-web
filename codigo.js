const productosItem = {
    "UREA FERTI * 50 KG.": 1,
    "FOSFATO DIAMONICO FERTI * 50 KG.": 2,
    "SULFATO DE AMONIO FERTI * 50 KG.": 3,
    "ADITIVO MARRON - BOLSAS * 20 KG.": 4,
    "NITRATO DE AMONIO * 50 KG.": 5,
    "NITRATO DE AMONIO * 50 KG. - POLIPROPILENO": 6,
    "CLORURO DE POTASIO *50 KG.": 7
};

// Cargar inventario
let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

document.getElementById("formInventario").addEventListener("submit", function(e) {
    e.preventDefault();

    let descripcion = document.getElementById("descripcion").value;
    let fecha = document.getElementById("fecha").value;
    let operacion = document.getElementById("operacion").value;
    let ingreso = Number(document.getElementById("ingreso").value);
    let salida = Number(document.getElementById("salida").value);

    // Último stock del producto
    let ultimoStock = 0;
    let movimientos = inventario.filter(i => i.descripcion === descripcion);

    if (movimientos.length > 0) {
        ultimoStock = movimientos[movimientos.length - 1].stock;
    }

    let stock = ultimoStock + ingreso - salida;
    let itemProducto = productosItem[descripcion];

    inventario.push({
        item: itemProducto,
        descripcion,
        fecha,
        operacion,
        ingreso,
        salida,
        stock
    });

    localStorage.setItem("inventario", JSON.stringify(inventario));
    this.reset();
});

function mostrarTabla() {
    let descripcion = document.getElementById("productoFiltro").value;
    let contenedor = document.getElementById("contenedorTablas");
    contenedor.innerHTML = "";

    if (!descripcion) return;

    let movimientos = inventario.filter(i => i.descripcion === descripcion);

    if (movimientos.length === 0) {
        contenedor.innerHTML = "<p>No hay registros para este producto.</p>";
        return;
    }

    let titulo = document.createElement("h3");
    titulo.textContent = descripcion;
    contenedor.appendChild(titulo);

    let tabla = document.createElement("table");
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

    let tbody = tabla.querySelector("tbody");

    movimientos.forEach((item, index) => {
        let fila = `
            <tr>
                <td>${item.item}</td>
                <td>${item.fecha}</td>
                <td>${item.operacion}</td>
                <td>${item.ingreso}</td>
                <td>${item.salida}</td>
                <td>${item.stock}</td>
                <td>
                    <button onclick="eliminarRegistro(${inventario.indexOf(item)})">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });

    contenedor.appendChild(tabla);
}

function eliminarRegistro(index) {
    if (confirm("¿Seguro que deseas eliminar este registro?")) {
        inventario.splice(index, 1);
        localStorage.setItem("inventario", JSON.stringify(inventario));
        mostrarTabla(); // refresca la vista actual
    }
}



