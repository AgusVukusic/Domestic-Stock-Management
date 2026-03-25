from fastapi import APIRouter, Depends, HTTPException, status
from ..models.user import UserInDB
from ..utils.auth_middleware import get_current_user
from ..config.database import db
from bson import ObjectId

router = APIRouter(prefix="/admin", tags=["admin"])

# --- CERROJO DE SEGURIDAD ---
async def get_current_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para acceder a esta ruta"
        )
    return current_user

# --- RUTAS DE ADMINISTRADOR ---
@router.get("/users")
async def get_all_users(admin: UserInDB = Depends(get_current_admin)):
    """Devuelve todos los usuarios, ocultando la contraseña"""
    users_cursor = db["users"].find({}, {"password": 0})
    users = []
    async for user in users_cursor:
        user["_id"] = str(user["_id"])
        users.append(user)
    return users

@router.get("/stats")
async def get_system_stats(admin: UserInDB = Depends(get_current_admin)):
    """Devuelve métricas generales de la aplicación"""
    total_users = await db["users"].count_documents({})
    total_groups = await db["groups"].count_documents({})
    total_products = await db["products"].count_documents({})
    
    return {
        "total_users": total_users,
        "total_groups": total_groups,
        "total_products": total_products
    }
    
@router.get("/users/{username}/details")
async def get_user_details(username: str, current_admin: UserInDB = Depends(get_current_admin)):
    # 1. Primero, buscar el ID del usuario a partir de su username
    user = await db["users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    user_id = str(user["_id"])
    
    # 2. Buscar grupos donde el ID de este usuario está en la lista de 'members'
    groups_cursor = db["groups"].find({"members": user_id})
    groups = await groups_cursor.to_list(length=100)

    result = []
    for group in groups:
        group_id = str(group["_id"])
        
        # 3. Buscar productos que pertenecen a este grupo
        products_cursor = db["products"].find({"owner_id": group_id})
        products = await products_cursor.to_list(length=1000)
        
        # Formatear la info de los productos
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

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    # 1. Evitar que el admin se borre a sí mismo
    if str(current_admin.id) == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")

    # 2. Buscar el usuario a eliminar
    user_to_delete = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 3. Evitar eliminar a otros administradores
    if user_to_delete.get("rol") == "admin":
        raise HTTPException(status_code=403, detail="No puedes eliminar a otro administrador")

    # 4. Eliminar el usuario de la base de datos
    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Error al eliminar el usuario")

    return {"message": "Usuario eliminado exitosamente"}