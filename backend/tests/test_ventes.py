import pytest
from unittest.mock import patch, MagicMock


class TestVentes:
    """Tests pour les routes /ventes"""

    # ── POST /ventes/add ──────────────────────────────────────────────────────

    def test_add_vente_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, l'ajout de vente est refusé."""
        response = client_non_authentifie.post("/ventes/add", json={
            "recette_id": 1,
            "quantite_vendue": 3
        })
        assert response.status_code == 422

    def test_add_vente_employe_succes(self, client_employe):
        """Un employé peut aussi enregistrer une vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 2,
                "recette_id": 1,
                "quantite_vendue": 2,
                "date_vente": "2026-06-15T00:00:00"
            }]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_employe.post("/ventes/add", json={
                "recette_id": 1,
                "quantite_vendue": 2
            })
            assert response.status_code == 200
            assert response.json()["message"] == "Vente enregistrée avec succès"

    def test_add_vente_admin_succes(self, client_admin):
        """Un admin peut enregistrer une vente."""
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
            assert response.json()["vente"]["quantite_vendue"] == 3

    def test_add_vente_avec_date(self, client_admin):
        """On peut spécifier une date de vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": 3,
                "recette_id": 2,
                "quantite_vendue": 1,
                "date_vente": "2026-06-01T12:00:00"
            }]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/ventes/add", json={
                "recette_id": 2,
                "quantite_vendue": 1,
                "date_vente": "2026-06-01T12:00:00"
            })
            assert response.status_code == 200
            assert response.json()["vente"]["date_vente"] == "2026-06-01T12:00:00"

    # ── POST /ventes/add-batch ────────────────────────────────────────────────

    def test_add_ventes_batch_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, add-batch est refusé."""
        response = client_non_authentifie.post("/ventes/add-batch", json={
            "ventes": [{"recette_id": 1, "quantite_vendue": 2}]
        })
        assert response.status_code == 422

    def test_add_ventes_batch_succes(self, client_admin):
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
            assert len(response.json()["ventes"]) == 2

    def test_add_ventes_batch_une_vente(self, client_admin):
        """add-batch fonctionne aussi avec une seule vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 1, "recette_id": 1, "quantite_vendue": 3}]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/ventes/add-batch", json={
                "ventes": [{"recette_id": 1, "quantite_vendue": 3}]
            })
            assert response.status_code == 200
            assert "1 vente(s)" in response.json()["message"]

    def test_add_ventes_batch_avec_dates(self, client_admin):
        """add-batch accepte des dates optionnelles par vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "recette_id": 1, "quantite_vendue": 2, "date_vente": "2026-06-01T12:00:00"},
                {"id": 2, "recette_id": 2, "quantite_vendue": 1}
            ]
            mock_supabase.schema.return_value.table.return_value.insert.return_value.execute.return_value = mock_response

            response = client_admin.post("/ventes/add-batch", json={
                "ventes": [
                    {"recette_id": 1, "quantite_vendue": 2, "date_vente": "2026-06-01T12:00:00"},
                    {"recette_id": 2, "quantite_vendue": 1}
                ]
            })
            assert response.status_code == 200

    # ── GET /ventes/ ──────────────────────────────────────────────────────────

    def test_get_ventes_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la liste des ventes est refusée."""
        response = client_non_authentifie.get("/ventes/")
        assert response.status_code == 422

    def test_get_ventes_employe_refuse(self, client_employe):
        """Un employé ne peut pas consulter la liste des ventes."""
        response = client_employe.get("/ventes/")
        assert response.status_code == 403

    def test_get_ventes_admin_succes(self, client_admin):
        """Un admin peut consulter la liste des ventes."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"id": 1, "recette_id": 1, "quantite_vendue": 3, "recettes": {"nom": "Tacos poulet"}},
                {"id": 2, "recette_id": 2, "quantite_vendue": 2, "recettes": {"nom": "Tacos boeuf"}}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .order.return_value.execute.return_value = mock_response

            response = client_admin.get("/ventes/")
            assert response.status_code == 200
            assert len(response.json()) == 2

    def test_get_ventes_liste_vide(self, client_admin):
        """Retourne une liste vide s'il n'y a pas de ventes."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value \
                .order.return_value.execute.return_value = mock_response

            response = client_admin.get("/ventes/")
            assert response.status_code == 200
            assert response.json() == []

    # ── DELETE /ventes/delete/{vente_id} ──────────────────────────────────────

    def test_delete_vente_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, suppression refusée."""
        response = client_non_authentifie.delete("/ventes/delete/1")
        assert response.status_code == 422

    def test_delete_vente_employe_refuse(self, client_employe):
        """Un employé ne peut pas supprimer une vente."""
        response = client_employe.delete("/ventes/delete/1")
        assert response.status_code == 403

    def test_delete_vente_admin_succes(self, client_admin):
        """Un admin peut supprimer une vente."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"id": 1}]
            mock_supabase.schema.return_value.table.return_value.delete.return_value \
                .eq.return_value.execute.return_value = mock_response

            response = client_admin.delete("/ventes/delete/1")
            assert response.status_code == 200
            assert response.json()["message"] == "Vente supprimée avec succès"

    def test_delete_vente_inexistante_retourne_404(self, client_admin):
        """Retourne 404 si la vente n'existe pas."""
        with patch("routers.ventes.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.delete.return_value \
                .eq.return_value.execute.return_value = mock_response

            response = client_admin.delete("/ventes/delete/9999")
            assert response.status_code == 404
            assert response.json()["detail"] == "Vente introuvable"