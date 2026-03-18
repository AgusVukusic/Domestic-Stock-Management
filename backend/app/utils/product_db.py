from ..config.database import db
from ..models.product import ProductInDB
from bson import ObjectId
from typing import List, Optional

products_collection = db["products"]

# Crear producto
def create_product(
    nombre: str,
    cantidad: int,
    categoria: str,
    stock_min: int,
    owner_type: str,
    owner_id: str,
    notas: Optional[str] = None,
    en_lista_compras: bool = False
) -> ProductInDB:
    product_doc = {
        "nombre": nombre,
        "cantidad": cantidad,
        "categoria": categoria,
        "notas": notas,
        "stock_min": stock_min,
        "owner_type": owner_type,
        "owner_id": owner_id,
        "en_lista_compras": en_lista_compras
    }
    result = products_collection.insert_one(product_doc)
    product_doc["_id"] = str(result.inserted_id)
    return ProductInDB(**product_doc)

# Obtener productos por owner
def get_products_by_owner(owner_type: str, owner_id: str) -> List[ProductInDB]:
    products = products_collection.find({
        "owner_type": owner_type,
        "owner_id": owner_id
    })
    result = []
    for product in products:
        product["_id"] = str(product["_id"])
        result.append(ProductInDB(**product))
    return result

# Obtener producto por ID
def get_product_by_id(product_id: str) -> Optional[ProductInDB]:
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if product:
        product["_id"] = str(product["_id"])
        return ProductInDB(**product)
    return None

# Actualizar producto
def update_product(product_id: str, update_data: dict) -> Optional[ProductInDB]:
    products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    return get_product_by_id(product_id)

# Eliminar producto
def delete_product(product_id: str) -> bool:
    result = products_collection.delete_one({"_id": ObjectId(product_id)})
    return result.deleted_count > 0

# Decrementar stock
def decrease_stock(product_id: str, cantidad: int = 1) -> Optional[ProductInDB]:
    products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$inc": {"cantidad": -cantidad}}
    )
    return get_product_by_id(product_id)