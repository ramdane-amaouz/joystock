from fastapi import Header, HTTPException
import jwt
from database import supabase

def get_current_user(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token manquant"
            )

        token = authorization.split(" ")[1]

        payload = jwt.decode(
            token,
            options={"verify_signature": False}
        )

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Token invalide"
        )
    

def require_admin(user):
    user_id = user["sub"]

    response = (
        supabase
        .schema("joystock")
        .table("profiles")
        .select("role")
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    role = response.data[0]["role"]

    if role != "admin":
        raise HTTPException(status_code=403, detail="Accès interdit")

    return user