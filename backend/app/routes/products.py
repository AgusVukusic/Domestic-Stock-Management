from fastapi import APIRouter, HTTPException, Query, status, Depends, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
from ..models.product import ProductInDB
from ..models.user import UserInDB
from ..utils.auth_middleware import get_current_user
from ..config.dependencies import get_product_service, get_receipt_service, get_group_service
from ..services.product_service import ProductService
from ..services.receipt_service import ReceiptService
from ..services.group_service import GroupService

router = APIRouter(prefix="/products", tags=["products"])

class ProductCreate(BaseModel):
    nombre: str
    cantidad: int
    categoria: str
    notas: Optional[str] = None
    stock_min: int
    owner_type: Optional[str] = "user"
    owner_id: Optional[str] = None
    codigo_barras: Optional[str] = None

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    categoria: Optional[str] = None
    notas: Optional[str] = None
    stock_min: Optional[int] = None
    ultimo_precio: Optional[float] = None
    codigo_barras: Optional[str] = None

@router.post("/", response_model=ProductInDB)
async def create_new_product(
    product: ProductCreate,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service),
    group_service: GroupService = Depends(get_group_service)
):
    owner_type = product.owner_type
    owner_id = product.owner_id if product.owner_id else current_user.id

    if owner_type == "group":
        user_groups = await group_service.get_user_groups(current_user.id)
        group_ids = [g.id for g in user_groups]
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
        "en_lista_compras": False,
        "codigo_barras": product.codigo_barras
    }
    
    new_product = await product_service.create_product(product_data)
    if not new_product:
        raise HTTPException(status_code=500, detail="Error al crear el producto")
    return new_product

@router.get("/", response_model=List[ProductInDB])
async def list_products(
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    return await product_service.get_user_products(current_user.id)

@router.get("/{product_id}", response_model=ProductInDB)
async def get_single_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    product = await product_service.get_product(product_id, current_user.id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permiso")
    return product

@router.put("/{product_id}", response_model=ProductInDB)
async def update_existing_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    update_data = product_update.model_dump(exclude_unset=True)
    updated_product = await product_service.update_product(product_id, update_data, current_user.id)
    
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

@router.delete("/{product_id}")
async def delete_existing_product(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    success = await product_service.delete_product(product_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return {"message": "Producto eliminado correctamente"}

@router.put("/{product_id}/decrease")
async def decrease_product_stock(
    product_id: str,
    cantidad: int = 1,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    updated_product = await product_service.decrease_stock(product_id, cantidad, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

@router.put("/{product_id}/increase")
async def increase_product_stock(
    product_id: str,
    cantidad: int = Query(1, ge=1),
    precio: float = Query(0.0, ge=0.0),
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    result = await product_service.increase_stock(product_id, cantidad, current_user.id, precio)
    if result:
        return {"message": "Stock incrementado", "product": result}
    raise HTTPException(status_code=404, detail="Producto no encontrado")

@router.put("/{product_id}/add-to-shopping-list")
async def add_product_to_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    updated_product = await product_service.add_to_shopping_list(product_id, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

@router.delete("/{product_id}/remove-from-shopping-list")
async def remove_product_from_shopping_list(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    updated_product = await product_service.remove_from_shopping_list(product_id, current_user.id)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

@router.put("/{product_id}/shopping-quantity")
async def update_product_shopping_quantity(
    product_id: str,
    cantidad: int = 1,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    updated_product = await product_service.update_shopping_quantity(product_id, current_user.id, cantidad)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

@router.get("/shopping-list/view", response_model=List[ProductInDB])
async def view_shopping_list(
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    return await product_service.get_shopping_list(current_user.id)

@router.get("/barcode/{barcode}", response_model=ProductInDB)
async def get_by_barcode(
    barcode: str,
    current_user: UserInDB = Depends(get_current_user),
    product_service: ProductService = Depends(get_product_service)
):
    product = await product_service.get_product_by_barcode(barcode, current_user.id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/receipt-scan")
async def scan_receipt(
    file: UploadFile = File(...),
    owner_id: Optional[str] = Form(None),
    current_user: UserInDB = Depends(get_current_user),
    receipt_service: ReceiptService = Depends(get_receipt_service)
):
    return await receipt_service.scan_receipt(file, current_user.id, owner_id)