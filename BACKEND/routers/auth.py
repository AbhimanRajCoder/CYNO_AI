"""
Authentication router for hospital signin/signup
"""
from fastapi import APIRouter, HTTPException, status
from datetime import timedelta

from database import db
from schemas import (
    HospitalSignupRequest,
    HospitalSigninRequest,
    HospitalResponse,
    AuthResponse
)
from utils import hash_password, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth/hospital", tags=["Hospital Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def hospital_signup(request: HospitalSignupRequest):
    """
    Register a new hospital account
    """
    # Check if email already exists
    existing_email = await db.hospital.find_unique(where={"email": request.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hospital with this email already exists"
        )
    
    # Check if registration number already exists
    existing_reg = await db.hospital.find_unique(where={"registrationNumber": request.registrationNumber})
    if existing_reg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hospital with this registration number already exists"
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create hospital
    hospital = await db.hospital.create(
        data={
            "name": request.name,
            "email": request.email,
            "password": hashed_password,
            "registrationNumber": request.registrationNumber,
            "address": request.address,
            "phone": request.phone,
        }
    )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": hospital.id, "email": hospital.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return AuthResponse(
        access_token=access_token,
        hospital=HospitalResponse(
            id=hospital.id,
            name=hospital.name,
            email=hospital.email,
            registrationNumber=hospital.registrationNumber,
            address=hospital.address,
            phone=hospital.phone,
            createdAt=hospital.createdAt,
            updatedAt=hospital.updatedAt
        )
    )


@router.post("/signin", response_model=AuthResponse)
async def hospital_signin(request: HospitalSigninRequest):
    """
    Authenticate a hospital and return access token
    """
    # Find hospital by email
    hospital = await db.hospital.find_unique(where={"email": request.email})
    
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, hospital.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": hospital.id, "email": hospital.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return AuthResponse(
        access_token=access_token,
        hospital=HospitalResponse(
            id=hospital.id,
            name=hospital.name,
            email=hospital.email,
            registrationNumber=hospital.registrationNumber,
            address=hospital.address,
            phone=hospital.phone,
            createdAt=hospital.createdAt,
            updatedAt=hospital.updatedAt
        )
    )
