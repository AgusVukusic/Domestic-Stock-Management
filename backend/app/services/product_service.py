from ..repositories.product_repository import ProductRepository
from ..services.group_service import GroupService
from ..models.product import ProductInDB
from typing import List, Dict, Any, Optional

class ProductService:
    def __init__(self, product_repo: ProductRepository, group_service: GroupService):
        self.product_repo = product_repo
        self.group_service = group_service

    def _product_helper(self, product: dict) -> dict:
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
            "ultimo_precio": product.get("ultimo_precio", 0.0),
            "codigo_barras": product.get("codigo_barras", None),
            "historial_compras": product.get("historial_compras", []),
            "cantidad_a_comprar": product.get("cantidad_a_comprar", 1)
        }

    async def _get_access_query(self, user_id: str) -> Dict[str, Any]:
        user_groups = await self.group_service.get_user_groups(user_id)
        group_ids = [g.id for g in user_groups]
        
        return {
            "$or": [
                {"owner_type": "user", "owner_id": user_id},
                {"owner_type": "group", "owner_id": {"$in": group_ids}}
            ]
        }

    async def create_product(self, product_data: dict) -> Optional[ProductInDB]:
        product_id = await self.product_repo.insert_one(product_data)
        new_product = await self.product_repo.get_by_id(product_id)
        if new_product:
            return ProductInDB(**self._product_helper(new_product))
        return None

    async def get_user_products(self, user_id: str) -> List[ProductInDB]:
        query = await self._get_access_query(user_id)
        products = await self.product_repo.get_by_access_query(query)
        return [ProductInDB(**self._product_helper(p)) for p in products]

    async def get_product(self, product_id: str, user_id: str) -> Optional[ProductInDB]:
        query = await self._get_access_query(user_id)
        product = await self.product_repo.get_single_by_access_query(query, product_id)
        if product:
            return ProductInDB(**self._product_helper(product))
        return None

    async def get_product_by_barcode(self, barcode: str, user_id: str) -> Optional[ProductInDB]:
        query = await self._get_access_query(user_id)
        query["codigo_barras"] = barcode
        products = await self.product_repo.get_by_access_query(query)
        if products:
            return ProductInDB(**self._product_helper(products[0]))
        return None

    async def update_product(self, product_id: str, product_data: dict, user_id: str) -> Optional[ProductInDB]:
        query = await self._get_access_query(user_id)
        success = await self.product_repo.update_by_access_query(query, product_id, product_data)
        if success:
            updated_product = await self.product_repo.get_by_id(product_id)
            return ProductInDB(**self._product_helper(updated_product))
        return None

    async def delete_product(self, product_id: str, user_id: str) -> bool:
        query = await self._get_access_query(user_id)
        return await self.product_repo.delete_by_access_query(query, product_id)

    async def decrease_stock(self, product_id: str, cantidad: int, user_id: str) -> Optional[ProductInDB]:
        product = await self.get_product(product_id, user_id)
        if not product:
            return None
            
        nueva_cantidad = max(0, product.cantidad - cantidad)
        success = await self.update_product(product_id, {"cantidad": nueva_cantidad}, user_id)
        return success

    async def increase_stock(self, product_id: str, cantidad: int, user_id: str, precio: float = 0.0) -> Optional[ProductInDB]:
        product = await self.get_product(product_id, user_id)
        if not product:
            return None
            
        update_data = {"cantidad": product.cantidad + cantidad}
        
        if precio > 0.0:
            update_data["ultimo_precio"] = precio
            
        historial = product.historial_compras or []
        if cantidad > 0:
            historial.append(cantidad)
            if len(historial) > 10:
                historial = historial[-10:]
            update_data["historial_compras"] = historial
            
        return await self.update_product(product_id, update_data, user_id)

    async def add_to_shopping_list(self, product_id: str, user_id: str) -> Optional[ProductInDB]:
        product = await self.get_product(product_id, user_id)
        if not product:
            return None
            
        historial = product.historial_compras or []
        if len(historial) > 0:
            cantidad_predicha = max(1, round(sum(historial) / len(historial)))
        else:
            cantidad_predicha = max(1, product.stock_min - product.cantidad)

        update_data = {
            "en_lista_compras": True,
            "cantidad_a_comprar": cantidad_predicha
        }
        return await self.update_product(product_id, update_data, user_id)

    async def update_shopping_quantity(self, product_id: str, user_id: str, cantidad: int) -> Optional[ProductInDB]:
        return await self.update_product(product_id, {"cantidad_a_comprar": max(1, cantidad)}, user_id)

    async def remove_from_shopping_list(self, product_id: str, user_id: str) -> Optional[ProductInDB]:
        return await self.update_product(product_id, {"en_lista_compras": False}, user_id)

    async def get_shopping_list(self, user_id: str) -> List[ProductInDB]:
        query = await self._get_access_query(user_id)
        query["en_lista_compras"] = True
        products = await self.product_repo.get_by_access_query(query)
        return [ProductInDB(**self._product_helper(p)) for p in products]
