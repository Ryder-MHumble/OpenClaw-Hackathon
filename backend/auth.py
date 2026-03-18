from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_voter(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> dict:
    """Dependency to get current voter from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        voter_id = payload.get("sub")
        voter_type = payload.get("voter_type")
        if not voter_id or not voter_type:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": int(voter_id), "type": voter_type}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
