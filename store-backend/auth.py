from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from database import get_db
from schema import Roles
import model
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)


secret_key = os.getenv("SECRET_KEY")


def create_access_token(data: dict, expires_minutes: int = 30):
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload.update({"exp": expire})
    return jwt.encode(payload, secret_key, algorithm="HS256")


def decode_access_token(token: str):
    try:
        return jwt.decode(token, secret_key, algorithms=["HS256"])
    except JWTError:
        return None
    

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    cred_excep = HTTPException(status_code=401, detail="Could not validate credentials")

    payload = decode_access_token(token)

    if payload is None:
        raise cred_excep
        
    email = payload.get("sub")

    if email is None:
        raise cred_excep
    
    return email


def require_role(*allowed_roles: Roles):
    def checker(current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
        # get user from db by email
        db_user = db.query(model.User).filter(model.User.email == current_user_email).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        # check if their role is in allowed_roles
        # raise 403 if not        
        if db_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access is not allowed")
        # return user if yes
        return db_user
    return checker


# Optional scheme — does NOT auto-raise 401 if no token is provided.
# Needed so the bootstrap case (zero users in the DB) can be evaluated
# before deciding whether a token is actually required.
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def get_admin_or_allow_bootstrap(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """
    Guards user creation.

    - If no users exist yet in the database, allow the request through with
      no token — this is the one-time bootstrap that creates the first admin.
    - If users already exist, a valid Admin token is required, same as any
      other admin-only action.

    Returns the acting admin's User row, or None if this is the bootstrap case.
    """
    user_count = db.query(model.User).count()

    if user_count == 0:
        return None

    if token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    email = payload.get("sub")
    db_user = db.query(model.User).filter(model.User.email == email).first()
    if not db_user or db_user.role != Roles.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create users")

    return db_user