from fastapi import APIRouter, Depends, HTTPException, status
from ..models.user import UserInDB
from ..utils.auth_middleware import get_current_user
from ..config.dependencies import get_admin_service
from ..services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])

async def get_current_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para acceder a esta ruta"
        )
    return current_user

@router.get("/users")
async def get_all_users(
    admin: UserInDB = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    return await admin_service.get_all_users()

@router.get("/stats")
async def get_system_stats(
    admin: UserInDB = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    return await admin_service.get_system_stats()
    
@router.get("/users/{username}/details")
async def get_user_details(
    username: str, 
    current_admin: UserInDB = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    result = await admin_service.get_user_details(username)
    if result is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return result

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str, 
    current_admin: UserInDB = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service)
):
    success, error = await admin_service.delete_user(user_id, current_admin.id)
    if error:
        raise HTTPException(
            status_code=400 if "propia cuenta" in error else (403 if "administrador" in error else 404), 
            detail=error
        )

    return {"message": "Usuario eliminado exitosamente"}