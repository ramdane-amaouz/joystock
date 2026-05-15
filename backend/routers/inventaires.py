"""on cree ici une route pour créer un inventaire, recuperer un inventaire, et ainsi metter a jour les données du stock dans la base de données"""
from fastapi import APIRouter, HTTPException
from database import supabase
router = APIRouter(prefix="/inventaires", tags=["inventaires"])









