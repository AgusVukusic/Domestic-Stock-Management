from ..config.database import db
from ..models.user import UserInDB
from bson import ObjectId

users_collection = db["users"]

# Crear usuario en MongoDB
def create_user(username: str, hashed_password: str) -> UserInDB:
    user_doc = {
        "username": username,
        "password": hashed_password
    }
    result = users_collection.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return UserInDB(**user_doc)

# Buscar usuario por username (para el login)
def get_user_by_username(username: str):
    user = users_collection.find_one({"username": username})
    if user:
        user["_id"] = str(user["_id"])
        return UserInDB(**user)
    return None

# Buscar usuario por ID
def get_user_by_id(user_id: str):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        return UserInDB(**user)
    return None