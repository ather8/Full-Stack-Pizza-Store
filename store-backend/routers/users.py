from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from sqlalchemy.orm import Session

import model
import schema
from schema import Roles
from database import get_db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    get_admin_or_allow_bootstrap,
)

router = APIRouter(tags=["users"])


@router.post("/users/", response_model=schema.User)
def create_user(
    user: schema.UserCreate,
    db: Session = Depends(get_db),
    acting_admin=Depends(get_admin_or_allow_bootstrap),
):
    is_bootstrap = acting_admin is None
    # First user ever created must be an Admin, regardless of what was
    # submitted — otherwise nobody could ever pass the require_role checks
    # on any other admin-only endpoint.
    role = Roles.ADMIN if is_bootstrap else user.role

    hashed_password = hash_password(user.password)
    db_user = model.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/", response_model=List[schema.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN)),
):
    return db.query(model.User).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=schema.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user = db.query(model.User).filter(model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=schema.User)
def update_user(
    user_id: int,
    user: schema.UserBase,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN)),
):
    db_user = db.query(model.User).filter(model.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user.model_dump().items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/users/{user_id}", response_model=schema.User)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN)),
):
    user = db.query(model.User).filter(model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return user


@router.post("/login")
def login(
    credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    db_user = db.query(model.User).filter(model.User.email == credentials.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(credentials.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token({"sub": credentials.username}),
        "token_type": "bearer",
    }


@router.get("/me", response_model=schema.User)
def get_current_user_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_user = db.query(model.User).filter(model.User.email == current_user).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user