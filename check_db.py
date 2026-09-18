import sqlite3

for db_path in ['./milliy_narx.db', './backend/milliy_narx.db']:
    print(f"\n=== {db_path} ===")
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in c.fetchall()]
        print("Tables:", len(tables), tables[:5])
        if 'users' in tables:
            c.execute("SELECT email, role FROM users")
            print("Users:", c.fetchall())
        if 'sellers' in tables:
            c.execute("SELECT store_name, status FROM sellers")
            print("Sellers:", c.fetchall())
        if 'products' in tables:
            c.execute("SELECT name, status FROM products")
            print("Products:", c.fetchall())
        conn.close()
    except Exception as e:
        print("ERROR:", e)
