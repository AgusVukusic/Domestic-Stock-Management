from pydantic import BaseModel, Field
from typing import Optional

class Product(BaseModel):
    nombre: str                     #nombre del producto
    precio: float                   #precio del producto
    cantidad: int                   #stock actual disponible
    categoria: str                  #categoria del producto (limpieza, comida, etc)
    notas: Optional[str] = None     #Opcional, puede ser None
    stock_min: int                  #stock minimo para alertas
    owner_type: str                 #indica si pertenece a un usuario o grupo
    owner_id: str                   #ID del dueño (user o group)

class ProductInDB(Product):
    id: Optional[str] = Field(None, alias="_id")