from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "tu_secret_key_super_segura_123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Convierte la "contrasena" en un hash incomprensible
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Compara una contrasena con un hash para verificar si coincide
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Crea un token JWT que expira en 30 minutos
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt