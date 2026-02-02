import sqlite3
import tkinter as tk
from tkinter import ttk, messagebox

# =========================
# BASE DE DATOS
# =========================
conn = sqlite3.connect("inventario.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item INTEGER,
    descripcion TEXT,
    fecha TEXT,
    operacion TEXT,
    ingreso REAL,
    salida REAL,
    stock REAL
)
""")
conn.commit()

# =========================
# DATOS FIJOS
# =========================
PRODUCTOS = [
    "UREA FERTI * 50 KG.",
    "FOSFATO DIAMONICO FERTI * 50 KG.",
    "SULFATO DE AMONIO FERTI * 50 KG.",
    "ADITIVO MARRON - BOLSAS * 20 KG.",
    "NITRATO DE AMONIO * 50 KG.",
    "NITRATO DE AMONIO * 50 KG. - POLIPROPILENO",
    "CLORURO DE POTASIO * 50 KG."
]

# =========================
# FUNCIONES
# =========================
def obtener_stock_anterior(descripcion):
    cursor.execute("""
        SELECT stock FROM inventario
        WHERE descripcion = ?
        ORDER BY id DESC
        LIMIT 1
    """, (descripcion,))
    fila = cursor.fetchone()
    return fila[0] if fila else 0

def registrar_movimiento():
    try:
        item = int(entry_item.get())
        descripcion = combo_desc.get()
        fecha = entry_fecha.get()
        operacion = entry_op.get()
        ingreso = float(entry_ingreso.get() or 0)
        salida = float(entry_salida.get() or 0)

        if descripcion == "":
            raise ValueError("Seleccione un producto")

        stock_anterior = obtener_stock_anterior(descripcion)
        stock_actual = stock_anterior + ingreso - salida

        cursor.execute("""
            INSERT INTO inventario
            (item, descripcion, fecha, operacion, ingreso, salida, stock)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (item, descripcion, fecha, operacion, ingreso, salida, stock_actual))

        conn.commit()
        messagebox.showinfo("Registro guardado", f"Stock actual: {stock_actual}")
        limpiar_campos()

    except Exception as e:
        messagebox.showerror("Error", str(e))

def limpiar_campos():
    entry_item.delete(0, tk.END)
    entry_fecha.delete(0, tk.END)
    entry_op.delete(0, tk.END)
    entry_ingreso.delete(0, tk.END)
    entry_salida.delete(0, tk.END)
    combo_desc.set("")

def ver_kardex():
    descripcion = combo_desc.get()
    if descripcion == "":
        messagebox.showwarning("Aviso", "Seleccione un producto")
        return

    ventana = tk.Toplevel(root)
    ventana.title(f"KARDEX - {descripcion}")
    ventana.geometry("800x400")

    tree = ttk.Treeview(
        ventana,
        columns=("fecha", "operacion", "ingreso", "salida", "stock"),
        show="headings"
    )

    for col in tree["columns"]:
        tree.heading(col, text=col.upper())
        tree.column(col, anchor="center")

    tree.pack(expand=True, fill="both", padx=10, pady=10)

    cursor.execute("""
        SELECT fecha, operacion, ingreso, salida, stock
        FROM inventario
        WHERE descripcion = ?
        ORDER BY id
    """, (descripcion,))

    for fila in cursor.fetchall():
        tree.insert("", tk.END, values=fila)

# =========================
# INTERFAZ
# =========================
root = tk.Tk()
root.title("Módulo de Inventario")
root.geometry("520x420")

frame = ttk.Frame(root, padding=15)
frame.pack(expand=True, fill="both")

ttk.Label(frame, text="Item").grid(row=0, column=0, sticky="w")
entry_item = ttk.Entry(frame)
entry_item.grid(row=0, column=1, sticky="ew")

ttk.Label(frame, text="Producto").grid(row=1, column=0, sticky="w")
combo_desc = ttk.Combobox(frame, values=PRODUCTOS, state="readonly")
combo_desc.grid(row=1, column=1, sticky="ew")

ttk.Label(frame, text="Fecha").grid(row=2, column=0, sticky="w")
entry_fecha = ttk.Entry(frame)
entry_fecha.grid(row=2, column=1, sticky="ew")

ttk.Label(frame, text="Operación").grid(row=3, column=0, sticky="w")
entry_op = ttk.Entry(frame)
entry_op.grid(row=3, column=1, sticky="ew")

ttk.Label(frame, text="Ingreso").grid(row=4, column=0, sticky="w")
entry_ingreso = ttk.Entry(frame)
entry_ingreso.grid(row=4, column=1, sticky="ew")

ttk.Label(frame, text="Salida").grid(row=5, column=0, sticky="w")
entry_salida = ttk.Entry(frame)
entry_salida.grid(row=5, column=1, sticky="ew")

btn_frame = ttk.Frame(frame)
btn_frame.grid(row=6, column=0, columnspan=2, pady=15)

ttk.Button(btn_frame, text="Registrar", command=registrar_movimiento).pack(side="left", padx=5)
ttk.Button(btn_frame, text="Ver Kardex", command=ver_kardex).pack(side="left", padx=5)

frame.columnconfigure(1, weight=1)

root.mainloop()