from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Any, Dict, List, Optional

class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.db = db
        self.collection = db[collection_name]

    async def get_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one(query)
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def find_many(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        cursor = self.collection.find(query)
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results

    async def insert_one(self, document: Dict[str, Any]) -> str:
        result = await self.collection.insert_one(document)
        return str(result.inserted_id)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        result = await self.collection.update_one(query, update)
        return result.modified_count > 0 or result.matched_count > 0

    async def delete_one(self, query: Dict[str, Any]) -> bool:
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0
