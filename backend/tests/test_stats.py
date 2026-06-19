import pytest
from unittest.mock import patch, MagicMock


class TestStats:
    """Tests pour les routes /stats"""

    # ── Auth ──────────────────────────────────────────────────────────────────

    def test_stats_sans_auth_refuse(self, client_non_authentifie):
        """Les stats sont protégées — sans token c'est refusé."""
        routes = [
            "/stats/alertes-stock",
            "/stats/stock-theorique",
            "/stats/consommation",
            "/stats/derniere-consommation",
            "/stats/ventes/total-recettes",
            "/stats/ventes/par-jour",
            "/stats/ventes/par-semaine",
        ]
        for route in routes:
            response = client_non_authentifie.get(route)
            assert response.status_code == 422, f"{route} devrait retourner 422 sans token"

    def test_stats_employe_refuse(self, client_employe):
        """Un employé n'a pas accès aux stats."""
        routes = [
            "/stats/alertes-stock",
            "/stats/stock-theorique",
            "/stats/consommation",
            "/stats/derniere-consommation",
            "/stats/ventes/total-recettes",
            "/stats/ventes/par-jour",
            "/stats/ventes/par-semaine",
        ]
        for route in routes:
            response = client_employe.get(route)
            assert response.status_code == 403, f"{route} devrait retourner 403 pour un employé"

    # ── Alertes stock ─────────────────────────────────────────────────────────

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
            assert response.json()[0]["produit_nom"] == "Bol"

    def test_alertes_stock_liste_vide(self, client_admin):
        """Retourne une liste vide s'il n'y a pas d'alertes."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/alertes-stock")
            assert response.status_code == 200
            assert response.json() == []

    # ── Stock théorique ───────────────────────────────────────────────────────

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
            assert response.json()[0]["stock_theorique"] == 150

    # ── Consommation ──────────────────────────────────────────────────────────

    def test_consommation_admin_succes(self, client_admin):
        """Un admin peut consulter la consommation par période."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {
                    "produit_nom": "Pain tacos",
                    "date_stock_actuel": "2026-05-01",
                    "consommation_estimee": 305,
                    "unite": "unite"
                }
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/consommation")
            assert response.status_code == 200
            assert response.json()[0]["produit_nom"] == "Pain tacos"

    def test_consommation_employe_refuse(self, client_employe):
        """Un employé n'a pas accès à la consommation."""
        response = client_employe.get("/stats/consommation")
        assert response.status_code == 403

    # ── Dernière consommation ─────────────────────────────────────────────────

    def test_derniere_consommation_admin_succes(self, client_admin):
        """Un admin peut consulter la dernière consommation par produit."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"produit_nom": "Pain tacos", "consommation_estimee": 305},
                {"produit_nom": "Coca cola", "consommation_estimee": 120}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/derniere-consommation")
            assert response.status_code == 200
            assert len(response.json()) == 2

    # ── Ventes total par recette ──────────────────────────────────────────────

    def test_total_ventes_recettes_admin_succes(self, client_admin):
        """Un admin peut consulter le total des ventes par recette."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"recette_nom": "Tacos poulet", "total_vendu": 15},
                {"recette_nom": "Tacos boeuf", "total_vendu": 8}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/ventes/total-recettes")
            assert response.status_code == 200
            assert response.json()[0]["recette_nom"] == "Tacos poulet"
            assert response.json()[0]["total_vendu"] == 15

    # ── Ventes par jour ───────────────────────────────────────────────────────

    def test_ventes_par_jour_admin_succes(self, client_admin):
        """Un admin peut consulter les ventes par jour."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"recette_nom": "Tacos poulet", "jour": "2026-06-15", "quantite_vendue": 3}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/ventes/par-jour")
            assert response.status_code == 200
            assert response.json()[0]["quantite_vendue"] == 3

    # ── Ventes par semaine ────────────────────────────────────────────────────

    def test_ventes_par_semaine_admin_succes(self, client_admin):
        """Un admin peut consulter les ventes par semaine."""
        with patch("routers.stats.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [
                {"recette_nom": "Tacos poulet", "semaine": "2026-06-09", "quantite_vendue": 12}
            ]
            mock_supabase.schema.return_value.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response

            response = client_admin.get("/stats/ventes/par-semaine")
            assert response.status_code == 200
            assert response.json()[0]["quantite_vendue"] == 12