from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# Password hashing - bcrypt is fast, secure, and works well on low-CPU hosts like Render free tier
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token bearer
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash using argon2."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract and verify current user token."""
    return verify_token(credentials.credentials)

class RoleChecker:
    """Role-based access control decorator."""
    
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles
    
    def __call__(self, token_data: dict = Depends(get_current_user_token)):
        user_role = token_data.get("role")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return token_data

# Role checkers for different access levels
admin_required = RoleChecker(["admin"])
manager_or_admin = RoleChecker(["manager", "admin"])
recruiter_or_admin = RoleChecker(["recruiter", "admin"])
any_authenticated = RoleChecker(["admin", "manager", "recruiter", "employee"])

# Specialized role checkers for specific use cases
def require_roles(allowed_roles: list):
    """Dynamic role checker function."""
    return RoleChecker(allowed_roles)