from fastapi import Header, HTTPException
import jwt
from jwt import PyJWKClient
import os
from database import supabase

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

def get_current_user(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Token manquant")

        token = authorization.split(" ")[1]

        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                options={"verify_aud": False}
            )
        else:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )

        # Vérifier que le compte n'est pas désactivé
        user_id = payload["sub"]
        profil_response = (
            supabase
            .schema("joystock")
            .table("profiles")
            .select("deleted_at")
            .eq("id", user_id)
            .execute()
        )
        if profil_response.data and profil_response.data[0].get("deleted_at") is not None:
            raise HTTPException(status_code=403, detail="Compte désactivé")

        return payload

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Erreur d'authentification")

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