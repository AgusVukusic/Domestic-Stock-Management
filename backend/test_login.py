import asyncio
from app.utils.db_utils import get_user_by_username

async def test():
    try:
        user = await get_user_by_username("Agus")
        print("Success:", user)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
