from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from bson import ObjectId

class AdminRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_all_users(self) -> List[Dict[str, Any]]:
        cursor = self.db["users"].find({}, {"password": 0})
        users = []
        async for user in cursor:
            user["_id"] = str(user["_id"])
            users.append(user)
        return users

    async def get_system_stats(self) -> Dict[str, int]:
        total_users = await self.db["users"].count_documents({})
        total_groups = await self.db["groups"].count_documents({})
        total_products = await self.db["products"].count_documents({})
        return {
            "total_users": total_users,
            "total_groups": total_groups,
            "total_products": total_products
        }

    async def get_user_details(self, username: str) -> List[Dict[str, Any]]:
        user = await self.db["users"].find_one({"username": username})
        if not user:
            return []
            
        user_id = str(user["_id"])
        groups_cursor = self.db["groups"].find({"members": user_id})
        groups = await groups_cursor.to_list(length=100)

        result = []
        for group in groups:
            group_id = str(group["_id"])
            products_cursor = self.db["products"].find({"owner_id": group_id})
            products = await products_cursor.to_list(length=1000)
            
            formatted_products = [
                {
                    "nombre": p["nombre"],
                    "cantidad": p.get("cantidad", 0),
                    "categoria": p.get("categoria", ""),
                }
                for p in products
            ]
            
            result.append({
                "group_id": group_id,
                "group_name": group["nombre"],
                "products": formatted_products
            })
            
        return result

    async def delete_user(self, user_id: str) -> bool:
        result = await self.db["users"].delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
