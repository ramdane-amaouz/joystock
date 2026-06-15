import pytest
from unittest.mock import patch, MagicMock


class TestVentes:
    """Tests pour les routes /ventes"""

    def test_add_vente_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, l'ajout de vente est refusé."""
        response = client_non_authentifie.post("/ventes/add", json={
            "recette_id": 1,
            "quantite_vendue": 3
        })
        assert response.status_code == 422

    def test_add_vente_authentifie_succes(self, client_admin):
        """Un utilisateur connecté peut enregistrer une vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 1,
                "recette_id": 1,
                "quantite_vendue": 3,
                "date_vente": "2026-06-15T00:00:00"
            }]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/ventes/add", json={
                "recette_id": 1,
                "quantite_vendue": 3
            })
            assert response.status_code == 200
            assert response.json()["message"] == "Vente enregistrée avec succès"

    def test_add_ventes_batch(self, client_admin):
        """add-batch enregistre plusieurs ventes en une requête."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "recette_id": 1, "quantite_vendue": 2},
                {"id": 2, "recette_id": 2, "quantite_vendue": 5}
            ]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/ventes/add-batch", json={
                "ventes": [
                    {"recette_id": 1, "quantite_vendue": 2},
                    {"recette_id": 2, "quantite_vendue": 5}
                ]
            })
            assert response.status_code == 200
            assert "2 vente(s)" in response.json()["message"]

    def test_get_ventes_employe_refuse(self, client_employe):
        """Un employé ne peut pas consulter la liste des ventes."""
        response = client_employe.get("/ventes/")
        assert response.status_code == 403

    def test_get_ventes_admin_succes(self, client_admin):
        """Un admin peut consulter la liste des ventes."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "recette_id": 1, "quantite_vendue": 3}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/ventes/")
            assert response.status_code == 200

    def test_delete_vente_employe_refuse(self, client_employe):
        """Un employé ne peut pas supprimer une vente."""
        response = client_employe.delete("/ventes/delete/1")
        assert response.status_code == 403