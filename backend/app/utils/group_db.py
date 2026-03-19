from bson import ObjectId
from datetime import datetime
from ..config.database import db

groups_collection = db["groups"]
users_collection = db["users"]

# Convertimos esto a 'async def' para poder buscar en la DB de usuarios
async def group_helper(group) -> dict:
    """Convierte el documento de MongoDB a un diccionario de Python y busca usernames"""
    member_ids = group.get("members", [])
    members_detail = []
    
    # Buscar el username de cada miembro en la colección de usuarios
    for m_id in member_ids:
        try:
            user = await users_collection.find_one({"_id": ObjectId(m_id)})
            if user:
                members_detail.append({
                    "id": str(user["_id"]), 
                    "username": user["username"]
                })
        except:
            continue

    return {
        "_id": str(group["_id"]),
        "nombre": group["nombre"],
        "created_by": group["created_by"],
        "members": member_ids,
        "members_detail": members_detail, # <-- Agregamos el detalle aquí
        "created_at": group.get("created_at")
    }

async def create_group(nombre: str, user_id: str):
    group_data = {
        "nombre": nombre,
        "created_by": user_id,
        "members": [user_id],
        "created_at": datetime.utcnow()
    }
    result = await groups_collection.insert_one(group_data)
    if result.inserted_id:
        new_group = await groups_collection.find_one({"_id": result.inserted_id})
        return await group_helper(new_group) # Añadido await
    return None

async def get_user_groups(user_id: str):
    groups = []
    async for group in groups_collection.find({"members": user_id}):
        groups.append(await group_helper(group)) # Añadido await
    return groups

async def add_member_by_username(group_id: str, username_to_add: str, current_user_id: str):
    try:
        obj_id = ObjectId(group_id)
    except:
        return None, "ID de grupo inválido"

    user_to_add = await users_collection.find_one({"username": username_to_add})
    if not user_to_add:
        return None, "El usuario no existe"

    user_id_to_add = str(user_to_add["_id"])
    group = await groups_collection.find_one({"_id": obj_id})
    
    if not group:
        return None, "Grupo no encontrado"
    if current_user_id not in group.get("members", []):
        return None, "No tienes permiso para agregar miembros a este grupo"
    if user_id_to_add in group.get("members", []):
        return None, "El usuario ya es miembro del grupo"

    await groups_collection.update_one(
        {"_id": obj_id},
        {"$push": {"members": user_id_to_add}}
    )

    updated_group = await groups_collection.find_one({"_id": obj_id})
    return await group_helper(updated_group), None