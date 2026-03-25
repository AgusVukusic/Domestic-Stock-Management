from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Nuevo modelo para los detalles del miembro
class MemberDetail(BaseModel):
    id: str
    username: str

class Group(BaseModel):
    nombre: str                             #nombre del grupo
    created_by: str                         #ID del usuario que creó el grupo
    members: List[str] = []                 #Lista de IDs de usuarios miembros
    created_at: Optional[datetime] = None   #fecha de creacion

class GroupInDB(Group):
    id: Optional[str] = Field(None, alias="_id")
    members_detail: Optional[List[MemberDetail]] = []