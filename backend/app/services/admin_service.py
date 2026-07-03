from ..repositories.admin_repository import AdminRepository
from ..services.user_service import UserService
from typing import List, Dict, Any, Tuple, Optional

class AdminService:
    def __init__(self, admin_repo: AdminRepository, user_service: UserService):
        self.admin_repo = admin_repo
        self.user_service = user_service

    async def get_all_users(self) -> List[Dict[str, Any]]:
        return await self.admin_repo.get_all_users()

    async def get_system_stats(self) -> Dict[str, int]:
        return await self.admin_repo.get_system_stats()

    async def get_user_details(self, username: str) -> Optional[List[Dict[str, Any]]]:
        # Si devuelve lista vacía puede ser porque no tiene grupos o porque no existe.
        # Por simplicidad el repository ya maneja la lógica.
        user = await self.user_service.get_user_by_username(username)
        if not user:
            return None
        return await self.admin_repo.get_user_details(username)

    async def delete_user(self, user_id: str, current_admin_id: str) -> Tuple[bool, Optional[str]]:
        if user_id == current_admin_id:
            return False, "No puedes eliminar tu propia cuenta"

        user_to_delete = await self.user_service.get_user_by_id(user_id)
        if not user_to_delete:
            return False, "Usuario no encontrado"

        if user_to_delete.rol == "admin":
            return False, "No puedes eliminar a otro administrador"

        success = await self.admin_repo.delete_user(user_id)
        if not success:
            return False, "Error al eliminar el usuario"

        return True, None
