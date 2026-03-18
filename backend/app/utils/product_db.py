from bson import ObjectId
from ..config.database import db

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
        "en_lista_compras": product.get("en_lista_compras", False)
    }

async def create_product(product_data: dict):
    """Crear un nuevo producto"""
    products_collection = get_products_collection()
    result = await products_collection.insert_one(product_data)
    
    if result.inserted_id:
        new_product = await products_collection.find_one({"_id": result.inserted_id})
        return product_helper(new_product)
    return None

async def get_user_products(user_id: str):
    """Obtener todos los productos de un usuario"""
    products_collection = get_products_collection()
    products = []
    
    async for product in products_collection.find({"owner_id": user_id}):
        products.append(product_helper(product))
    
    return products

async def get_product(product_id: str, user_id: str):
    """Obtener un producto específico"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    product = await products_collection.find_one({
        "_id": obj_id,
        "owner_id": user_id
    })
    
    if product:
        return product_helper(product)
    return None

async def update_product(product_id: str, product_data: dict, user_id: str):
    """Actualizar un producto"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    result = await products_collection.update_one(
        {"_id": obj_id, "owner_id": user_id},
        {"$set": product_data}
    )
    
    if result.modified_count > 0:
        updated_product = await products_collection.find_one({"_id": obj_id})
        return product_helper(updated_product)
    
    return None

async def delete_product(product_id: str, user_id: str):
    """Eliminar un producto"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return False
    
    result = await products_collection.delete_one({
        "_id": obj_id,
        "owner_id": user_id
    })
    
    return result.deleted_count > 0

async def decrease_stock(product_id: str, cantidad: int, user_id: str):
    """Decrementar el stock de un producto"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    product = await products_collection.find_one({
        "_id": obj_id,
        "owner_id": user_id
    })
    
    if not product:
        return None
    
    nueva_cantidad = max(0, product.get("cantidad", 0) - cantidad)
    
    result = await products_collection.update_one(
        {"_id": obj_id},
        {"$set": {"cantidad": nueva_cantidad}}
    )
    
    if result.modified_count > 0:
        updated_product = await products_collection.find_one({"_id": obj_id})
        return product_helper(updated_product)
    
    return None

async def increase_stock(product_id: str, cantidad: int, user_id: str):
    """Incrementar el stock de un producto"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    product = await products_collection.find_one({
        "_id": obj_id,
        "owner_id": user_id
    })
    
    if not product:
        return None
    
    nueva_cantidad = product.get("cantidad", 0) + cantidad
    
    result = await products_collection.update_one(
        {"_id": obj_id},
        {"$set": {"cantidad": nueva_cantidad}}
    )
    
    if result.modified_count > 0:
        updated_product = await products_collection.find_one({"_id": obj_id})
        return product_helper(updated_product)
    
    return None

async def add_to_shopping_list(product_id: str, user_id: str):
    """Agregar producto a la lista de compras"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    result = await products_collection.update_one(
        {"_id": obj_id, "owner_id": user_id},
        {"$set": {"en_lista_compras": True}}
    )
    
    if result.modified_count > 0:
        updated_product = await products_collection.find_one({"_id": obj_id})
        return product_helper(updated_product)
    
    return None

async def remove_from_shopping_list(product_id: str, user_id: str):
    """Quitar producto de la lista de compras"""
    products_collection = get_products_collection()
    
    try:
        obj_id = ObjectId(product_id)
    except:
        return None
    
    result = await products_collection.update_one(
        {"_id": obj_id, "owner_id": user_id},
        {"$set": {"en_lista_compras": False}}
    )
    
    if result.modified_count > 0:
        updated_product = await products_collection.find_one({"_id": obj_id})
        return product_helper(updated_product)
    
    return None

async def get_shopping_list(user_id: str):
    """Obtener productos en lista de compras"""
    products_collection = get_products_collection()
    products = []
    
    async for product in products_collection.find({
        "owner_id": user_id,
        "en_lista_compras": True
    }):
        products.append(product_helper(product))
    
    return products