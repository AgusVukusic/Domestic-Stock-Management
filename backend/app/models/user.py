from pydantic import BaseModel #Clase base de Pydantic
from typing import Optional

#Campos que va a tener el usuario
class User(BaseModel):
    username: str
    password: str

#Version del usuario cuando se guarda en la BDD (Incluye el id)
class UserInDB(User):
    id: Optional[str] = None