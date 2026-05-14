from fastapi import FastAPI, HTTPException
from database import supabase

app = FastAPI(title="JoyStock API")

@app.get("/")
def root():
    return {"message": "JoyStock API running"}

@app.get("/test-produits")
def test_produits():
    try:
        response = supabase.schema("joystock").table("produits").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))