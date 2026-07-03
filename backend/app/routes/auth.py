from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from ..config.dependencies import get_auth_service
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    rol: str

@router.post("/register", response_model=Token)
async def register(
    user: UserRegister, 
    auth_service: AuthService = Depends(get_auth_service)
):
    new_user, error = await auth_service.register_user(user.username, user.password)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    access_token = auth_service.create_token_for_user(new_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "username": new_user.username,
        "rol": new_user.rol
    }

@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    db_user, error = await auth_service.login_user(user.username, user.password)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error
        )
    
    access_token = auth_service.create_token_for_user(db_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "username": db_user.username,
        "rol": db_user.rol
    }
