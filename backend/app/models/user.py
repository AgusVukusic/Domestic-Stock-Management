from pydantic import BaseModel, Field
from typing import Optional

#Campos que va a tener el usuario
class User(BaseModel):
    username: str
    password: str

#Version del usuario cuando se guarda en la BDD (Incluye el id)
class UserInDB(User):
    id: Optional[str] = Field(None, alias="_id")  # MongoDB usa _id, nosotros lo mapeamos a id
    rol: str = "user"
