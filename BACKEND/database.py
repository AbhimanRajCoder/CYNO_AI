"""
Database client configuration
"""
from prisma import Prisma

# Singleton Prisma client
db = Prisma()


async def connect_db():
    """Connect to the database"""
    await db.connect()


async def disconnect_db():
    """Disconnect from the database"""
    await db.disconnect()
