import os
import json
import io
from PIL import Image
import google.generativeai as genai
from fastapi import UploadFile, HTTPException
from typing import Optional, Dict, Any, List
from .product_service import ProductService

class ReceiptService:
    def __init__(self, product_service: ProductService):
        self.product_service = product_service

    async def scan_receipt(self, file: UploadFile, current_user_id: str, owner_id: Optional[str] = None) -> Dict[str, Any]:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="La API Key de Gemini no está configurada en el servidor (.env).")
        
        genai.configure(api_key=api_key)
        
        try:
            existing_products_json = "[]"
            existing_categories_str = "[]"
            
            target_owner_id = owner_id if owner_id else current_user_id
            owner_type = "group" if owner_id and owner_id != current_user_id else "user"
            
            if owner_id:
                user_products = await self.product_service.get_user_products(current_user_id)
                filtered_products = [p for p in user_products if p.owner_id == owner_id]
                simplified_products = [{"id": str(p.id), "nombre": p.nombre} for p in filtered_products]
                existing_products_json = json.dumps(simplified_products, ensure_ascii=False)
                
                categorias = list(set([p.categoria for p in filtered_products if p.categoria]))
                existing_categories_str = ", ".join(categorias) if categorias else "General"

            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
            
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image.thumbnail((800, 800))
            
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
            
            model_names = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-pro-vision']
            response = None
            errors = []
            for model_name in model_names:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = await model.generate_content_async([prompt, image])
                    break
                except Exception as e:
                    error_msg = str(e)
                    if "429" in error_msg or "quota" in error_msg.lower():
                        raise HTTPException(status_code=429, detail="Límite de usos de la Inteligencia Artificial alcanzado. Por favor, espera 1 minuto antes de escanear otro ticket.")
                    errors.append(f"{model_name}: {error_msg}")
                    
            if not response:
                raise Exception(f"No se encontró un modelo válido. Errores: {' | '.join(errors)}")
            
            text = response.text.strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            try:
                items = json.loads(text)
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="La IA devolvió un formato inválido. Intenta tomar la foto más de cerca o con mejor iluminación.")
                
            import gc
            gc.collect()
                
            actualizados = 0
            creados = 0
            
            for item in items:
                producto_id = item.get("producto_id")
                nombre = item.get("nombre", "Producto Desconocido")
                categoria = item.get("categoria", "General")
                
                try:
                    cantidad = int(item.get("cantidad", 1))
                except (ValueError, TypeError):
                    cantidad = 1
                    
                try:
                    precio = float(item.get("precio_unitario", 0.0))
                except (ValueError, TypeError):
                    precio = 0.0
                
                if producto_id:
                    await self.product_service.increase_stock(producto_id, cantidad, current_user_id, precio)
                    await self.product_service.remove_from_shopping_list(producto_id, current_user_id)
                    actualizados += 1
                else:
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
                    await self.product_service.create_product(product_data)
                    creados += 1
                
            return {"items": items, "actualizados": actualizados, "creados": creados}
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {str(e)}")
