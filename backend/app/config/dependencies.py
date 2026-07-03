from fastapi import Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency para inyectar la base de datos.
    Permite fácil sustitución por mocks en pruebas.
    """
    from .database import db
    return db

def get_user_repository(db: AsyncIOMotorDatabase = Depends(get_database)):
    from ..repositories.user_repository import UserRepository
    return UserRepository(db)

def get_user_service(user_repo = Depends(get_user_repository)):
    from ..services.user_service import UserService
    return UserService(user_repo)

def get_auth_service(user_service = Depends(get_user_service)):
    from ..services.auth_service import AuthService
    return AuthService(user_service)

def get_group_repository(db: AsyncIOMotorDatabase = Depends(get_database)):
    from ..repositories.group_repository import GroupRepository
    return GroupRepository(db)

def get_group_service(
    group_repo = Depends(get_group_repository),
    user_service = Depends(get_user_service)
):
    from ..services.group_service import GroupService
    return GroupService(group_repo, user_service)

def get_product_repository(db: AsyncIOMotorDatabase = Depends(get_database)):
    from ..repositories.product_repository import ProductRepository
    return ProductRepository(db)

def get_product_service(
    product_repo = Depends(get_product_repository),
    group_service = Depends(get_group_service)
):
    from ..services.product_service import ProductService
    return ProductService(product_repo, group_service)

def get_receipt_service(product_service = Depends(get_product_service)):
    from ..services.receipt_service import ReceiptService
    return ReceiptService(product_service)

def get_admin_repository(db: AsyncIOMotorDatabase = Depends(get_database)):
    from ..repositories.admin_repository import AdminRepository
    return AdminRepository(db)

def get_admin_service(
    admin_repo = Depends(get_admin_repository),
    user_service = Depends(get_user_service)
):
    from ..services.admin_service import AdminService
    return AdminService(admin_repo, user_service)


