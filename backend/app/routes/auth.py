from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..utils.security import hash_password, verify_password, create_access_token
from ..utils.db_utils import create_user, get_user_by_username
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# 1. Modificamos el modelo de respuesta
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    rol: str  # <-- Añadimos el rol

@router.post("/register", response_model=Token)
async def register(user: UserRegister):
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya existe"
        )
    
    hashed_password = hash_password(user.password)
    new_user = await create_user(user.username, hashed_password)
    
    access_token = create_access_token(
        data={"sub": new_user.id, "username": new_user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    # 2. Devolvemos el rol usando el operador punto (.)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "username": new_user.username,
        "rol": new_user.rol
    }

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await get_user_by_username(user.username)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    access_token = create_access_token(
        data={"sub": db_user.id, "username": db_user.username},
        expires_delta=timedelta(minutes=30)
    )
    
    # 3. Devolvemos el rol usando el operador punto (.)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
        "rol": db_user.rol
    }
