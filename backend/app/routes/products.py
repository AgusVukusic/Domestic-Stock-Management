from fastapi import APIRouter, HTTPException, Query, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..models.product import ProductInDB
from ..models.user import UserInDB
from ..utils.product_db import (
    create_product,
    get_user_products, 
    get_product,       
    update_product,
    delete_product,
    decrease_stock,
    increase_stock,
    add_to_shopping_list,
    remove_from_shopping_list,
    get_shopping_list
)
from ..utils.auth_middleware import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

# Modelos de request actualizados para soportar grupos
class ProductCreate(BaseModel):
    nombre: str
    cantidad: int
    categoria: str
    notas: Optional[str] = None
    stock_min: int
    owner_type: Optional[str] = "user"  # Por defecto es personal
    owner_id: Optional[str] = None      # Si es group, acá viene el ID del grupo

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    categoria: Optional[str] = None
    notas: Optional[str] = None
    stock_min: Optional[int] = None

# Crear producto
@router.post("/", response_model=ProductInDB)
async def create_new_product(
    product: ProductCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    owner_type = product.owner_type
    owner_id = product.owner_id if product.owner_id else current_user.id

    # Si intenta crear un producto para un grupo, verificamos por seguridad que pertenezca a él
    if owner_type == "group":
        from ..utils.group_db import get_user_groups
        user_groups = await get_user_groups(current_user.id)
        group_ids = [g["_id"] for g in user_groups]
        if owner_id not in group_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes crear productos en un grupo al que no perteneces"
            )

    product_data = {
        "nombre": product.nombre,
        "cantidad": product.cantidad,
        "categoria": product.categoria,
        "stock_min": product.stock_min,
        "owner_type": owner_type,
        "owner_id": owner_id,
        "notas": product.notas,
        "en_lista_compras": False
    }
    
    new_product = await create_product(product_data)
    return new_product

# Listar productos del usuario
@router.get("/", response_model=List[ProductInDB])
async def list_products(current_user: UserInDB = Depends(get_current_user)):
    products = await get_user_products(current_user.id)
    return products

# Obtener un producto específico
@router.get("/{product_id}", response_model=ProductInDB)
async def get_single_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = await get_product(product_id, current_user.id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permiso")
    return product

# Actualizar producto
@router.put("/{product_id}", response_model=ProductInDB)
async def update_existing_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    update_data = product_update.model_dump(exclude_unset=True)
    updated_product = await update_product(product_id, update_data, current_user.id)
    
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

# Eliminar producto
@router.delete("/{product_id}")
async def delete_existing_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    success = await delete_product(product_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return {"message": "Producto eliminado correctamente"}

# Decrementar stock (usar un producto)
@router.put("/{product_id}/decrease")
async def decrease_product_stock(
    product_id: str,
    cantidad: int = 1,
    current_user: UserInDB = Depends(get_current_user)
):
    updated_product = await decrease_stock(product_id, cantidad, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

# Incrementar stock
@router.put("/{product_id}/increase")
async def increase_product_stock(
    product_id: str,
    cantidad: int = Query(1, ge=1),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        result = await increase_stock(product_id, cantidad, current_user.id)
        if result:
            return {"message": "Stock incrementado", "product": result}
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Agregar a lista de compras
@router.put("/{product_id}/add-to-shopping-list")
async def add_product_to_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    updated_product = await add_to_shopping_list(product_id, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

# Quitar de lista de compras
@router.delete("/{product_id}/remove-from-shopping-list")
async def remove_product_from_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    updated_product = await remove_from_shopping_list(product_id, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

# Ver lista de compras
@router.get("/shopping-list/view", response_model=List[ProductInDB])
async def view_shopping_list(current_user: UserInDB = Depends(get_current_user)):
    shopping_list = await get_shopping_list(current_user.id)
    return shopping_list