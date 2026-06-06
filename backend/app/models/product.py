from pydantic import BaseModel, Field
from typing import Optional

class Product(BaseModel):
    nombre: str                     #nombre del producto
    cantidad: int                   #stock actual disponible
    categoria: str                  #categoria del producto (limpieza, comida, etc)
    notas: Optional[str] = None     #Opcional, puede ser None
    stock_min: int                  #stock minimo para alertas
    owner_type: str                 #indica si pertenece a un usuario o grupo
    owner_id: str                   #ID del dueño (user o group)
    en_lista_compras: bool = False  #indica si el producto se encuentra en la lista de compras
    ultimo_precio: float = 0.0      #precio del producto en la ultima compra
    codigo_barras: Optional[str] = None #Codigo de barras del producto
    historial_compras: list[int] = [] #Registro de las cantidades compradas históricamente
    cantidad_a_comprar: int = 1     #Cantidad a comprar actualmente en la lista de compras

class ProductInDB(Product):
    id: Optional[str] = Field(None, alias="_id")