from ..repositories.group_repository import GroupRepository
from ..services.user_service import UserService
from ..models.group import GroupInDB
from datetime import datetime
from typing import List, Tuple, Optional
from bson import ObjectId

class GroupService:
    def __init__(self, group_repo: GroupRepository, user_service: UserService):
        self.group_repo = group_repo
        self.user_service = user_service

    async def _enrich_group(self, group_dict: dict) -> dict:
        """Helper para agregar detalles de miembros al grupo"""
        member_ids = group_dict.get("members", [])
        members_detail = []
        for m_id in member_ids:
            user = await self.user_service.get_user_by_id(m_id)
            if user:
                members_detail.append({"id": user.id, "username": user.username})
        
        group_dict["members_detail"] = members_detail
        return group_dict

    async def create_group(self, nombre: str, user_id: str) -> Optional[GroupInDB]:
        group_data = {
            "nombre": nombre,
            "created_by": user_id,
            "members": [user_id],
            "created_at": datetime.utcnow()
        }
        group_id = await self.group_repo.insert_one(group_data)
        group = await self.group_repo.get_by_id(group_id)
        if group:
            enriched = await self._enrich_group(group)
            return GroupInDB(**enriched)
        return None

    async def get_user_groups(self, user_id: str) -> List[GroupInDB]:
        groups = await self.group_repo.get_groups_by_user(user_id)
        result = []
        for group in groups:
            enriched = await self._enrich_group(group)
            result.append(GroupInDB(**enriched))
        return result

    async def add_member_by_username(self, group_id: str, username_to_add: str, current_user_id: str) -> Tuple[Optional[GroupInDB], Optional[str]]:
        try:
            ObjectId(group_id)
        except Exception:
            return None, "ID de grupo inválido"

        user_to_add = await self.user_service.get_user_by_username(username_to_add)
        if not user_to_add:
            return None, "El usuario no existe"

        group = await self.group_repo.get_by_id(group_id)
        if not group:
            return None, "Grupo no encontrado"
            
        if current_user_id not in group.get("members", []):
            return None, "No tienes permiso para agregar miembros a este grupo"
            
        if user_to_add.id in group.get("members", []):
            return None, "El usuario ya es miembro del grupo"

        success = await self.group_repo.add_member(group_id, user_to_add.id)
        if not success:
            return None, "Error al agregar miembro"

        updated_group = await self.group_repo.get_by_id(group_id)
        enriched = await self._enrich_group(updated_group)
        return GroupInDB(**enriched), None
