import pytest
from unittest.mock import patch, MagicMock


class TestGetProduits:
    """Tests pour GET /produits"""

    def test_get_produits_sans_auth_retourne_donnees(self, client_non_authentifie):
        """La route /produits est publique — pas besoin de token."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"produit_id": 1, "nom": "Coca cola", "quantite": 200, "unite": "unite"},
                {"produit_id": 2, "nom": "Frites", "quantite": 30, "unite": "kg"}
            ]
            mock_supabase.schema.return_value.rpc.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    def test_get_produits_count(self, client_non_authentifie):
        """GET /produits/count retourne un entier."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.count = 25
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/produits/count")
            assert response.status_code == 200
            assert "count" in response.json()

    def test_add_produit_admin_succes(self, client_admin):
        """Un admin peut ajouter un produit."""
        with patch("routers.produits.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 1, "nom": "Nouveau produit"}]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/produits/add", json={
                "nom": "Nouveau produit",
                "categorie_id": 1,
                "unite_id": 1
            })
            assert response.status_code == 200

    def test_add_produit_employe_refuse(self, client_employe):
        """Un employé ne peut pas ajouter un produit."""
        response = client_employe.post("/produits/add", json={
            "nom": "Produit interdit",
            "categorie_id": 1,
            "unite_id": 1
        })
        assert response.status_code == 403