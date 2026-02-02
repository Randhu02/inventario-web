from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

def get_db():
    return sqlite3.connect("inventario.db", check_same_thread=False)

def obtener_stock_anterior(descripcion):
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT stock FROM inventario
        WHERE descripcion = ?
        ORDER BY id DESC
        LIMIT 1
    """, (descripcion,))
    row = cur.fetchone()
    return row[0] if row else 0

@app.route("/registrar", methods=["POST"])
def registrar():
    data = request.json

    item = data["item"]
    descripcion = data["descripcion"]
    fecha = data["fecha"]
    operacion = data["operacion"]
    ingreso = float(data["ingreso"])
    salida = float(data["salida"])

    stock_anterior = obtener_stock_anterior(descripcion)
    stock_actual = stock_anterior + ingreso - salida

    db = get_db()
    cur = db.cursor()
    cur.execute("""
        INSERT INTO inventario
        (item, descripcion, fecha, operacion, ingreso, salida, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (item, descripcion, fecha, operacion, ingreso, salida, stock_actual))
    db.commit()

    return jsonify({
        "mensaje": "Registro exitoso",
        "stock": stock_actual
    })

@app.route("/kardex/<descripcion>")
def kardex(descripcion):
    db = get_db()
    cur = db.cursor()
    cur.execute("""
        SELECT fecha, operacion, ingreso, salida, stock
        FROM inventario
        WHERE descripcion = ?
        ORDER BY id
    """, (descripcion,))
    rows = cur.fetchall()

    return jsonify(rows)

if __name__ == "__main__":
    app.run()