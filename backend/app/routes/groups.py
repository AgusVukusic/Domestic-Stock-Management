from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from ..models.group import GroupInDB
from ..models.user import UserInDB
from ..utils.auth_middleware import get_current_user
from ..utils.group_db import create_group, get_user_groups, add_member_by_username

router = APIRouter(prefix="/groups", tags=["groups"])

# Modelos de peticiones
class GroupCreate(BaseModel):
    nombre: str

class AddMember(BaseModel):
    username: str

# Crear un nuevo grupo
@router.post("/", response_model=GroupInDB)
async def create_new_group(
    group: GroupCreate, 
    current_user: UserInDB = Depends(get_current_user)
):
    new_group = await create_group(group.nombre, current_user.id)
    if not new_group:
        raise HTTPException(status_code=500, detail="Error al crear el grupo")
    return new_group

# Ver los grupos del usuario actual
@router.get("/", response_model=List[GroupInDB])
async def list_groups(current_user: UserInDB = Depends(get_current_user)):
    groups = await get_user_groups(current_user.id)
    return groups

# Agregar un miembro al grupo
@router.post("/{group_id}/members", response_model=GroupInDB)
async def add_member(
    group_id: str, 
    member_data: AddMember, 
    current_user: UserInDB = Depends(get_current_user)
):
    updated_group, error = await add_member_by_username(
        group_id, 
        member_data.username, 
        current_user.id
    )
    
    if error:
        raise HTTPException(status_code=400, detail=error)
        
    return updated_group