from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..utils.security import hash_password, verify_password, create_access_token
from ..utils.db_utils import create_user, get_user_by_username
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["authentication"]) #todas las rutas van a empezar con "/auth"

# Modelos de request
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Modelo de response
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str

# Endpoint de registro de un nuevo usuario
@router.post("/register", response_model=Token)
async def register(user: UserRegister): # AÑADIDO async
    # Verificar si el usuario ya existe
    existing_user = await get_user_by_username(user.username) # AÑADIDO await
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya existe"
        )
    
    # Hashear la contraseña
    hashed_password = hash_password(user.password)
    
    # Crear el usuario
    new_user = await create_user(user.username, hashed_password) # AÑADIDO await
    
    # Crear el token
    access_token = create_access_token(
        data={"sub": new_user.id, "username": new_user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "username": new_user.username
    }

# Endpoint de login para un usuario existente
@router.post("/login", response_model=Token)
async def login(user: UserLogin): # AÑADIDO async
    # Buscar el usuario
    db_user = await get_user_by_username(user.username) # AÑADIDO await
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    # Verificar la contraseña
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    # Crear el token JWT
    access_token = create_access_token(
        data={"sub": db_user.id, "username": db_user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username
    }