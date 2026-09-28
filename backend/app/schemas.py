"""Pydantic request/response models for the EMD-TS REST API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class ConsentState(BaseModel):
    clinicalScreening: bool = True
    doctorReview: bool = False
    telemedicineSharing: bool = False
    dataStorage: bool = True
    updatedAt: Optional[str] = None


class PatientCreate(BaseModel):
    name: str
    age: int = Field(ge=0, le=120)
    gender: str
    phone: str
    village: str
    symptoms: str
    duration: str = "Not specified"
    knownConditions: str = "None reported"
    medications: str = "None reported"
    allergies: str = "None known"
    userRole: str = "HEALTHCARE_WORKER"


class ConsentUpdate(BaseModel):
    type: str  # clinicalScreening | doctorReview | telemedicineSharing | dataStorage
    value: bool
    userRole: str = "HEALTHCARE_WORKER"


class VitalsIn(BaseModel):
    heartRate: float
    spo2: float
    temperature: float
    activity: str = "Resting"
    mode: str = "NORMAL"


class ScreeningRequest(BaseModel):
    vitals: VitalsIn
    ecgAbnormal: bool = False
    userRole: str = "HEALTHCARE_WORKER"


class ReferralRequest(BaseModel):
    screeningId: str
    note: str = ""
    userRole: str = "HEALTHCARE_WORKER"


class ReviewRequest(BaseModel):
    notes: str
    action: str  # Reviewed | Refer | Monitor | Additional Investigation
    screeningId: Optional[str] = None
    doctorName: str = "Dr. Kavitha Subramaniam"
    userRole: str = "DOCTOR"


class AccessRequest(BaseModel):
    user: str = "Unknown_User"
    action: str = "VIEW_RECORD"


class ViewRecordRequest(BaseModel):
    userRole: str = "DOCTOR"
