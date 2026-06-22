from fastapi import Header, HTTPException
import jwt
from jwt import PyJWKClient
import os
from database import supabase

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# URL du endpoint JWKS de Supabase
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

def get_current_user(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Token manquant")

        token = authorization.split(" ")[1]

        # Lire le header du token pour savoir quel algo est utilisé
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            # Nouvelle clé ECC — vérification via JWKS
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                options={"verify_aud": False}
            )
        else:
            # Legacy HS256 — vérification via secret partagé
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )

        return payload

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