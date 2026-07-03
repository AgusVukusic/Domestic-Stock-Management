from ..repositories.user_repository import UserRepository
from ..models.user import UserInDB
from typing import Optional

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        user_dict = await self.user_repo.get_by_username(username)
        if user_dict:
            return UserInDB(**user_dict)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        user_dict = await self.user_repo.get_by_id(user_id)
        if user_dict:
            return UserInDB(**user_dict)
        return None

    async def create_user(self, username: str, hashed_password: str) -> UserInDB:
        user_doc = {
            "username": username,
            "password": hashed_password,
            "rol": "user"
        }
        user_id = await self.user_repo.insert_one(user_doc)
        user_doc["_id"] = user_id
        return UserInDB(**user_doc)
