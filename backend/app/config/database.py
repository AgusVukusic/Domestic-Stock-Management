from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde .env
load_dotenv()

# Obtener connection string desde variable de entorno
MONGODB_URL = os.getenv("MONGODB_URL")

# Crear cliente de MongoDB
client = MongoClient(MONGODB_URL)

# Seleccionar la base de datos
db = client["stock_app_db"]