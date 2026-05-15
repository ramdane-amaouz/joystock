"""ici on s'occupera de l'authentification des utilisateurs, de la gestion des sessions, et de la sécurisation des routes pour que seules les personnes autorisées puissent accéder à certaines fonctionnalités de l'API"""


from fastapi import APIRouter, HTTPException
from database import supabase
router = APIRouter(prefix="/auth", tags=["auth"] )

