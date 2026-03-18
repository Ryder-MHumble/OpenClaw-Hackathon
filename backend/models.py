from typing import Optional, List
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    fullName: str
    email: str
    organization: str
    phone: Optional[str] = None
    track: Optional[str] = None  # academic | productivity | life
    projectTitle: str
    projectDescription: str
    demoUrl: Optional[str] = None
    repoUrl: Optional[str] = None
    pdfUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    posterUrl: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str
    comments: Optional[str] = None
    materials_complete: Optional[bool] = None


class JudgeVoterLoginRequest(BaseModel):
    email: str
    password: str


class AudienceVoterLoginRequest(BaseModel):
    access_code: str
    full_name: Optional[str] = None


class VoteSubmission(BaseModel):
    participant_id: int
    star_rating: int  # 3, 4, or 5
    comment: Optional[str] = None


class BatchVoteSubmission(BaseModel):
    votes: List[VoteSubmission]
    device_fingerprint: Optional[str] = None
    track: Optional[str] = None  # academic | productivity | life


class TrackControlRequest(BaseModel):
    track: str


class BlockDeviceRequest(BaseModel):
    session_id: int
    device_fingerprint: str
    reason: str


class BlockIpRequest(BaseModel):
    session_id: int
    ip_address: str
    reason: str
