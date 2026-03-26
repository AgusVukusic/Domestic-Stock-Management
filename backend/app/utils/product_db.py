from bson import ObjectId
from ..config.database import db
from .group_db import get_user_groups  # Importamos para obtener los grupos del usuario

def get_products_collection():
    """Obtener la colección de productos"""
    return db["products"]

def product_helper(product) -> dict:
    """Convertir documento de MongoDB a dict"""
    return {
        "_id": str(product["_id"]),
        "nombre": product["nombre"],
        "cantidad": product["cantidad"],
        "categoria": product["categoria"],
        "notas": product.get("notas", ""),
        "stock_min": product["stock_min"],
        "owner_type": product["owner_type"],
        "owner_id": product["owner_id"],
        "en_lista_compras": product.get("en_lista_compras", False),
        "ultimo_precio": product.get("ultimo_precio", 0.0)
    }

async def get_access_query(user_id: str, product_id: str = None):
    """Genera la query para buscar productos del usuario o de sus grupos compartidos"""
    user_groups = await get_user_groups(user_id)
    group_ids = [g["_id"] for g in user_groups]
    
    query = {
        "$or": [
            {"owner_type": "user", "owner_id": user_id},
            {"owner_type": "group", "owner_id": {"$in": group_ids}}
        ]
    }
    
    if product_id:
        try:
            query["_id"] = ObjectId(product_id)
        except:
            query["_id"] = None # ID inválido para que no rompa
            
    return query

async def create_product(product_data: dict):
    """Crear un nuevo producto"""
    products_collection = get_products_collection()
    result = await products_collection.insert_one(product_data)
    
    if result.inserted_id:
        new_product = await products_collection.find_one({"_id": result.inserted_id})
        return product_helper(new_product)
    return None

async def get_user_products(user_id: str):
    """Obtener todos los productos de un usuario y sus grupos"""
    products_collection = get_products_collection()
    products = []
    
    query = await get_access_query(user_id)
    
    async for product in products_collection.find(query):
        products.append(product_helper(product))
    
    return products

async def get_product(product_id: str, user_id: str):
    """Obtener un producto específico verificando permisos"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    product = await products_collection.find_one(query)
    if product:
        return product_helper(product)
    return None

async def update_product(product_id: str, product_data: dict, user_id: str):
    """Actualizar un producto"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    # Primero verificamos si existe y si el usuario tiene permiso de verlo/editarlo
    product = await products_collection.find_one(query)
    if not product:
        return None
        
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_data}
    )
    
    if result.modified_count > 0 or result.matched_count > 0:
        updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        return product_helper(updated_product)
    
    return None

async def delete_product(product_id: str, user_id: str):
    """Eliminar un producto"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    result = await products_collection.delete_one(query)
    return result.deleted_count > 0

async def decrease_stock(product_id: str, cantidad: int, user_id: str):
    """Decrementar el stock de un producto"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    product = await products_collection.find_one(query)
    if not product:
        return None
        
    nueva_cantidad = max(0, product.get("cantidad", 0) - cantidad)
    
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"cantidad": nueva_cantidad}}
    )
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return product_helper(updated_product)

async def increase_stock(product_id: str, cantidad: int, user_id: str, precio: float = 0.0):
    """Incrementar el stock de un producto y actualizar su precio"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    product = await products_collection.find_one(query)
    if not product:
        return None
        
    # Preparamos todos los datos a actualizar en un solo diccionario
    update_data = {"cantidad": product.get("cantidad", 0) + cantidad}
    
    # Si hay un precio nuevo, lo sumamos al diccionario
    if precio > 0.0:
        update_data["ultimo_precio"] = precio
        
    # Hacemos una única llamada a la base de datos con todos los cambios
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return product_helper(updated_product)

async def add_to_shopping_list(product_id: str, user_id: str):
    """Agregar producto a la lista de compras"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    product = await products_collection.find_one(query)
    if not product:
        return None
        
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"en_lista_compras": True}}
    )
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return product_helper(updated_product)

async def remove_from_shopping_list(product_id: str, user_id: str):
    """Quitar producto de la lista de compras"""
    products_collection = get_products_collection()
    query = await get_access_query(user_id, product_id)
    
    product = await products_collection.find_one(query)
    if not product:
        return None
        
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"en_lista_compras": False}}
    )
    
    updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
    return product_helper(updated_product)

async def get_shopping_list(user_id: str):
    """Obtener productos en lista de compras (propios y de grupos)"""
    products_collection = get_products_collection()
    products = []
    
    query = await get_access_query(user_id)
    query["en_lista_compras"] = True
    
    async for product in products_collection.find(query):
        products.append(product_helper(product))
    
    return products