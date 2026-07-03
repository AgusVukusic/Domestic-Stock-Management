from .user_service import UserService
from ..utils.security import hash_password, verify_password, create_access_token
from ..models.user import UserInDB
from datetime import timedelta
from typing import Tuple, Optional

class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def register_user(self, username: str, password: str) -> Tuple[Optional[UserInDB], Optional[str]]:
        existing_user = await self.user_service.get_user_by_username(username)
        if existing_user:
            return None, "El usuario ya existe"
        
        hashed_password = hash_password(password)
        new_user = await self.user_service.create_user(username, hashed_password)
        return new_user, None

    async def login_user(self, username: str, password: str) -> Tuple[Optional[UserInDB], Optional[str]]:
        db_user = await self.user_service.get_user_by_username(username)
        if not db_user or not verify_password(password, db_user.password):
            return None, "Usuario o contraseña incorrectos"
            
        return db_user, None

    def create_token_for_user(self, user: UserInDB) -> str:
        return create_access_token(
            data={"sub": user.id, "username": user.username},
            expires_delta=timedelta(minutes=30)
        )
