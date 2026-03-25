import os
from dotenv import load_dotenv, find_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Buscamos el archivo .env por todas las carpetas automáticamente y lo cargamos
load_dotenv(find_dotenv())

# Obtenemos la cadena de conexión (connection string)
MONGODB_URL = os.getenv("MONGODB_URL")

# --- HACEMOS UNA PRUEBA DE FUEGO ---
print("\n=== DEBUG INFO ===")
print("Archivo .env encontrado en:", find_dotenv())
print("La URL cargada es:", MONGODB_URL)
print("==================\n")
# -----------------------

# Creamos el cliente de MongoDB asíncrono
client = AsyncIOMotorClient(MONGODB_URL)

# Seleccionamos la base de datos
db = client["stock_app_db"]