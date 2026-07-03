from motor.motor_asyncio import AsyncIOMotorDatabase
from .base_repository import BaseRepository
from typing import List, Dict, Any, Optional
from bson import ObjectId


class ProductRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "products")

    async def get_by_access_query(self, access_query: Dict[str, Any]) -> List[Dict[str, Any]]:
        return await self.find_many(access_query)

    async def get_single_by_access_query(self, access_query: Dict[str, Any], product_id: str) -> Optional[Dict[str, Any]]:
        try:
            query = access_query.copy()
            query["_id"] = ObjectId(product_id)
            return await self.find_one(query)
        except Exception:
            return None

    async def update_by_access_query(self, access_query: Dict[str, Any], product_id: str, update_data: Dict[str, Any]) -> bool:
        try:
            query = access_query.copy()
            query["_id"] = ObjectId(product_id)
            return await self.update_one(query, {"$set": update_data})
        except Exception:
            return False

    async def delete_by_access_query(self, access_query: Dict[str, Any], product_id: str) -> bool:
        try:
            query = access_query.copy()
            query["_id"] = ObjectId(product_id)
            return await self.delete_one(query)
        except Exception:
            return False
