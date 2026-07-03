from motor.motor_asyncio import AsyncIOMotorDatabase
from .base_repository import BaseRepository
from typing import List, Dict, Any

class GroupRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "groups")

    async def get_groups_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.find_many({"members": user_id})

    async def add_member(self, group_id: str, user_id: str) -> bool:
        from bson import ObjectId
        try:
            return await self.update_one(
                {"_id": ObjectId(group_id)},
                {"$push": {"members": user_id}}
            )
        except Exception:
            return False
