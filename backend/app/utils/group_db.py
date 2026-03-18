from bson import ObjectId
from datetime import datetime
from ..config.database import db

groups_collection = db["groups"]
users_collection = db["users"]

def group_helper(group) -> dict:
    """Convierte el documento de MongoDB a un diccionario de Python"""
    return {
        "_id": str(group["_id"]),
        "nombre": group["nombre"],
        "created_by": group["created_by"],
        "members": group.get("members", []),
        "created_at": group.get("created_at")
    }

async def create_group(nombre: str, user_id: str):
    """Crea un grupo y añade al creador como el primer miembro"""
    group_data = {
        "nombre": nombre,
        "created_by": user_id,
        "members": [user_id], # El creador se une automáticamente
        "created_at": datetime.utcnow()
    }
    result = await groups_collection.insert_one(group_data)
    if result.inserted_id:
        new_group = await groups_collection.find_one({"_id": result.inserted_id})
        return group_helper(new_group)
    return None

async def get_user_groups(user_id: str):
    """Obtiene todos los grupos a los que pertenece un usuario"""
    groups = []
    # Buscamos grupos donde el user_id esté dentro del array 'members'
    async for group in groups_collection.find({"members": user_id}):
        groups.append(group_helper(group))
    return groups

async def add_member_by_username(group_id: str, username_to_add: str, current_user_id: str):
    """Agrega un nuevo miembro al grupo buscando por su nombre de usuario"""
    try:
        obj_id = ObjectId(group_id)
    except:
        return None, "ID de grupo inválido"

    # 1. Verificar si el usuario que queremos agregar existe en la base de datos
    user_to_add = await users_collection.find_one({"username": username_to_add})
    if not user_to_add:
        return None, "El usuario no existe"

    user_id_to_add = str(user_to_add["_id"])

    # 2. Verificar que el grupo existe
    group = await groups_collection.find_one({"_id": obj_id})
    if not group:
        return None, "Grupo no encontrado"

    # 3. Verificar que el usuario que hace la petición ya es miembro del grupo
    if current_user_id not in group.get("members", []):
        return None, "No tienes permiso para agregar miembros a este grupo"

    # 4. Verificar que el usuario no esté ya en el grupo
    if user_id_to_add in group.get("members", []):
        return None, "El usuario ya es miembro del grupo"

    # 5. Agregar el ID del nuevo usuario al array de miembros
    await groups_collection.update_one(
        {"_id": obj_id},
        {"$push": {"members": user_id_to_add}}
    )

    updated_group = await groups_collection.find_one({"_id": obj_id})
    return group_helper(updated_group), None