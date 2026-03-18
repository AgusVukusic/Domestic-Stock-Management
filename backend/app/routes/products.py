from fastapi import APIRouter, HTTPException, Query, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..models.product import ProductInDB
from ..models.user import UserInDB
from ..utils.product_db import (
    create_product,
    get_products_by_owner,
    get_product_by_id,
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

# Modelos de request
class ProductCreate(BaseModel):
    nombre: str
    cantidad: int
    categoria: str
    notas: Optional[str] = None
    stock_min: int

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    categoria: Optional[str] = None
    notas: Optional[str] = None
    stock_min: Optional[int] = None

# Crear producto
@router.post("/", response_model=ProductInDB)
def create_new_product(
    product: ProductCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    new_product = create_product(
        nombre=product.nombre,
        cantidad=product.cantidad,
        categoria=product.categoria,
        stock_min=product.stock_min,
        owner_type="user",
        owner_id=current_user.id,
        notas=product.notas
    )
    return new_product

# Listar productos del usuario
@router.get("/", response_model=List[ProductInDB])
def list_products(current_user: UserInDB = Depends(get_current_user)):
    products = get_products_by_owner("user", current_user.id)
    return products

# Obtener un producto específico
@router.get("/{product_id}", response_model=ProductInDB)
def get_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Verificar que el producto pertenece al usuario
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este producto"
        )
    
    return product

# Actualizar producto
@router.put("/{product_id}", response_model=ProductInDB)
def update_existing_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    # Verificar que existe y pertenece al usuario
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar este producto"
        )
    
    # Actualizar solo los campos que se enviaron
    update_data = product_update.model_dump(exclude_unset=True)
    updated_product = update_product(product_id, update_data)
    return updated_product

# Eliminar producto
@router.delete("/{product_id}")
def delete_existing_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este producto"
        )
    
    delete_product(product_id)
    return {"message": "Producto eliminado correctamente"}

# Decrementar stock (usar un producto)
@router.put("/{product_id}/decrease")
def decrease_product_stock(
    product_id: str,
    cantidad: int = 1,
    current_user: UserInDB = Depends(get_current_user)
):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso"
        )
    
    updated_product = decrease_stock(product_id, cantidad)
    return updated_product

@router.put("/{product_id}/increase")
async def increase_product_stock(
    product_id: str,
    cantidad: int = Query(1, ge=1),
    current_user: dict = Depends(get_current_user)
):
    """Incrementar stock de un producto"""
    try:
        result = await increase_stock(product_id, cantidad, current_user["user_id"])
        if result:
            return {"message": "Stock incrementado exitosamente", "product": result}
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Agregar a lista de compras
@router.put("/{product_id}/add-to-shopping-list")
def add_to_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso"
        )
    
    updated_product = update_product(product_id, {"en_lista_compras": True})
    return updated_product

# Quitar de lista de compras
@router.delete("/{product_id}/remove-from-shopping-list")
def remove_from_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    if product.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso"
        )
    
    updated_product = update_product(product_id, {"en_lista_compras": False})
    return updated_product

# Ver lista de compras
@router.get("/shopping-list/view", response_model=List[ProductInDB])
def view_shopping_list(current_user: UserInDB = Depends(get_current_user)):
    # Obtener todos los productos del usuario que están en la lista
    all_products = get_products_by_owner("user", current_user.id)
    shopping_list = [p for p in all_products if p.en_lista_compras]
    return shopping_list