from motor.motor_asyncio import AsyncIOMotorDatabase
from .base_repository import BaseRepository
from typing import Optional, Dict, Any

class UserRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users")

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self.find_one({"username": username})
