import pytest
from unittest.mock import patch, MagicMock


class TestStats:
    """Tests pour les routes /stats"""

    def test_stats_sans_auth_refuse(self, client_non_authentifie):
        """Les stats sont protégées — sans token c'est refusé."""
        response = client_non_authentifie.get("/stats/alertes-stock")
        assert response.status_code == 422

    def test_stats_employe_refuse(self, client_employe):
        """Un employé n'a pas accès aux stats."""
        response = client_employe.get("/stats/alertes-stock")
        assert response.status_code == 403

    def test_alertes_stock_admin_succes(self, client_admin):
        """Un admin peut consulter les alertes stock."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "produit_id": 1,
                    "produit_nom": "Bol",
                    "stock_theorique": 0,
                    "seuil_alerte": 10,
                    "ecart": -10,
                    "unite": "unite"
                }
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/alertes-stock")
            assert response.status_code == 200
            assert isinstance(response.json(), list)

    def test_stock_theorique_admin_succes(self, client_admin):
        """Un admin peut consulter le stock théorique."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "produit_id": 1,
                    "produit_nom": "Coca cola",
                    "stock_theorique": 150,
                    "seuil_alerte": 20,
                    "unite": "unite"
                }
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/stock-theorique")
            assert response.status_code == 200

    def test_consommation_employe_refuse(self, client_employe):
        """Un employé n'a pas accès à la consommation."""
        response = client_employe.get("/stats/consommation")
        assert response.status_code == 403