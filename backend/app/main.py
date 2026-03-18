from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, products, groups

# Crear la aplicación FastAPI
app = FastAPI(
    title="Stock App API",
    description="API para gestión de stock doméstico",
    version="1.0.0"
)

# Configurar CORS (para que el frontend pueda acceder a la API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar las rutas de autenticacion y productos
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(groups.router) # Registramos las rutas de grupos

# Endpoint de prueba
@app.get("/")
def read_root():
    return {"message": "Stock App API funcionando correctamente"}

# Endpoint de health check
@app.get("/health")
def health_check():
    return {"status": "ok", "database": "connected"}