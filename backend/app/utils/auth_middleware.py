from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from .security import SECRET_KEY, ALGORITHM
from .db_utils import get_user_by_id

#Espera un Token en el HEADER
security = HTTPBearer()

# Función para obtener el usuario actual desde el token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)): # <-- AÑADE async AQUÍ
    token = credentials.credentials
    
    try:
        # Decodificamos el token y extramos el ID del usuario
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    # Verifica que el usuario exista
    user = await get_user_by_id(user_id) # <-- AÑADE await AQUÍ
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    return user #Si todo esta bien, devuelve el usuario