from fastapi import APIRouter, HTTPException, Query, status, Depends, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import io
from PIL import Image
import google.generativeai as genai
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
    get_shopping_list,
    get_product_by_barcode,
    update_shopping_quantity
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
    codigo_barras: Optional[str] = None

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    cantidad: Optional[int] = None
    categoria: Optional[str] = None
    notas: Optional[str] = None
    stock_min: Optional[int] = None
    ultimo_precio: Optional[float] = None
    codigo_barras: Optional[str] = None

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
        "en_lista_compras": False,
        "codigo_barras": product.codigo_barras
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
    precio: float = Query(0.0, ge=0.0), # Recibimos el parámetro del precio
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        # Ahora le pasamos también el precio a nuestra función de base de datos
        result = await increase_stock(product_id, cantidad, current_user.id, precio)
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

# Actualizar cantidad a comprar
@router.put("/{product_id}/shopping-quantity")
async def update_product_shopping_quantity(
    product_id: str,
    cantidad: int = 1,
    current_user: UserInDB = Depends(get_current_user)
):
    updated_product = await update_shopping_quantity(product_id, current_user.id, cantidad)
    if not updated_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin permisos")
    return updated_product

# Ver lista de compras
@router.get("/shopping-list/view", response_model=List[ProductInDB])
async def view_shopping_list(current_user: UserInDB = Depends(get_current_user)):
    shopping_list = await get_shopping_list(current_user.id)
    return shopping_list

# Obtener producto por código de barras
@router.get("/barcode/{barcode}", response_model=ProductInDB)
async def get_by_barcode(
    barcode: str,
    current_user: UserInDB = Depends(get_current_user)
):
    product = await get_product_by_barcode(barcode, current_user.id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

# Escanear ticket con Gemini
@router.post("/receipt-scan")
async def scan_receipt(
    file: UploadFile = File(...),
    owner_id: Optional[str] = Form(None),
    current_user: UserInDB = Depends(get_current_user)
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="La API Key de Gemini no está configurada en el servidor (.env).")
    
    genai.configure(api_key=api_key)
    
    try:
        # Obtener los productos actuales del owner_id para hacer fuzzy match
        existing_products_json = "[]"
        existing_categories_str = "[]"
        if owner_id:
            user_products = await get_user_products(current_user.id)
            # Filtrar solo los productos del grupo actual
            filtered_products = [p for p in user_products if p.get("owner_id") == owner_id]
            # Extraer solo id y nombre para que no se sature el prompt
            simplified_products = [{"id": p["_id"], "nombre": p["nombre"]} for p in filtered_products]
            existing_products_json = json.dumps(simplified_products, ensure_ascii=False)
            
            # Extraer las categorías únicas
            categorias = list(set([p.get("categoria", "General") for p in filtered_products if p.get("categoria")]))
            existing_categories_str = ", ".join(categorias) if categorias else "General"

        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Reducir tamaño de la imagen para evitar problemas de memoria (OOM) y acelerar el escaneo
        image.thumbnail((1024, 1024))
        
        prompt = f"""
        Eres un asistente experto en contabilidad. Extrae los productos de este ticket de compra.
        Además, actúa como un motor de búsqueda difusa. Aquí tienes una lista de los productos que ya existen en nuestra base de datos (con su ID y nombre):
        {existing_products_json}

        Y aquí tienes la lista de las categorías que ya utiliza el usuario: [{existing_categories_str}].

        Para cada producto en el ticket de compra, intenta encontrar una coincidencia lógica (incluso si tiene abreviaturas, plurales o palabras de más/menos) en la lista de productos existentes.
        Si encuentras una coincidencia, devuelve el ID del producto existente en el campo 'producto_id'. Si es un producto nuevo que no está en la base de datos, devuelve 'producto_id': null.

        IMPORTANTE PARA PRODUCTOS NUEVOS:
        1. Asigna un 'nombre' que sea natural, cotidiano, corto y fácil de leer. Por ejemplo, en lugar de "Agua de Mesa Sin TACC Bulnez Bidón x 6.5", usa simplemente "Agua Mineral" o "Agua Bidón".
        2. Analiza el producto y asígnale la mejor 'categoria' de la lista proporcionada. Si ninguna de las categorías existentes encaja bien, inventa una categoría nueva que sea corta (1 o 2 palabras) y general (ej. Lácteos, Limpieza, Verdulería).

        Devuelve un JSON estrictamente con la siguiente estructura de arreglo, sin texto adicional ni bloques de markdown (ni ```json):
        [
          {{
            "nombre": "Nombre natural y corto del producto",
            "cantidad": 1,
            "precio_unitario": 100.50,
            "producto_id": "ID del producto coincidente o null",
            "categoria": "Categoría existente o nueva"
          }}
        ]
        Si el ticket indica una cantidad mayor a 1 para un producto, divídelo para dar el precio unitario, o extrae la cantidad y el precio unitario que suele estar debajo. Asegúrate de que 'cantidad' sea entero y 'precio_unitario' flotante.
        Si no detectas productos, devuelve [].
        """
        
        try:
            model = genai.GenerativeModel('gemini-3.5-flash')
            response = model.generate_content([prompt, image])
        except Exception as e:
            if "404" in str(e):
                try:
                    model = genai.GenerativeModel('gemini-flash-latest')
                    response = model.generate_content([prompt, image])
                except Exception:
                    model = genai.GenerativeModel('gemini-2.5-flash')
                    response = model.generate_content([prompt, image])
            else:
                raise e
        
        text = response.text.strip()
        
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        try:
            items = json.loads(text)
        except json.JSONDecodeError:
            print(f"Error parseando JSON de Gemini. Texto crudo: {text}")
            raise HTTPException(status_code=500, detail="La IA devolvió un formato inválido. Intenta con otra foto más clara.")
            
        # PROCESAR ITEMS
        actualizados = 0
        creados = 0
        
        # Validar el owner_type
        owner_type = "group" if owner_id and owner_id != current_user.id else "user"
        target_owner_id = owner_id if owner_id else current_user.id
        
        for item in items:
            producto_id = item.get("producto_id")
            cantidad = item.get("cantidad", 1)
            precio = item.get("precio_unitario", 0.0)
            nombre = item.get("nombre", "Producto Desconocido")
            categoria = item.get("categoria", "General")
            
            if producto_id:
                # Actualizar existente
                await increase_stock(producto_id, cantidad, current_user.id, precio)
                await remove_from_shopping_list(producto_id, current_user.id)
                actualizados += 1
            else:
                # Crear nuevo
                product_data = {
                    "nombre": nombre,
                    "cantidad": cantidad,
                    "categoria": categoria,
                    "stock_min": 1,
                    "owner_type": owner_type,
                    "owner_id": target_owner_id,
                    "notas": "",
                    "en_lista_compras": False,
                    "ultimo_precio": precio
                }
                await create_product(product_data)
                creados += 1
            
        return {"items": items, "actualizados": actualizados, "creados": creados}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")