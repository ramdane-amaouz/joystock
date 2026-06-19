import pytest
from unittest.mock import patch, MagicMock


class TestGetMe:
    """Tests pour GET /profiles/me"""

    def test_get_me_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, /me est refusé."""
        response = client_non_authentifie.get("/profiles/me")
        assert response.status_code == 422

    def test_get_me_admin_succes(self, client_admin):
        """Un admin peut récupérer son profil."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": "admin-uuid-1234",
                "nom": "testeur",
                "prenom": "admin",
                "role": "admin",
                "email": "admin@test.com"
            }]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.get("/profiles/me")
            assert response.status_code == 200
            assert response.json()["role"] == "admin"

    def test_get_me_employe_succes(self, client_employe):
        """Un employé peut récupérer son profil."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": "employe-uuid-5678",
                "nom": "dupont",
                "prenom": "jean",
                "role": "employe",
                "email": "employe@test.com"
            }]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_employe.get("/profiles/me")
            assert response.status_code == 200
            assert response.json()["role"] == "employe"

    def test_get_me_profil_introuvable(self, client_admin):
        """Retourne 404 si le profil n'existe pas en base."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.get("/profiles/me")
            assert response.status_code == 404
            assert response.json()["detail"] == "Profil introuvable"


class TestGetProfile:
    """Tests pour GET /profiles/{user_id}"""

    def test_get_profile_sans_auth_succes(self, client_non_authentifie):
        """La route /{user_id} est publique — pas de token requis."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": "admin-uuid-1234",
                "nom": "testeur",
                "prenom": "admin",
                "role": "admin"
            }]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/profiles/admin-uuid-1234")
            assert response.status_code == 200
            assert response.json()["id"] == "admin-uuid-1234"

    def test_get_profile_inexistant_retourne_404(self, client_non_authentifie):
        """Un user_id inexistant retourne 404."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = []
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/profiles/uuid-inexistant")
            assert response.status_code == 404
            assert response.json()["detail"] == "Profil introuvable"

    def test_get_profile_retourne_bon_utilisateur(self, client_non_authentifie):
        """Le profil retourné correspond bien à l'user_id demandé."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{
                "id": "employe-uuid-5678",
                "nom": "dupont",
                "prenom": "jean",
                "role": "employe"
            }]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_non_authentifie.get("/profiles/employe-uuid-5678")
            assert response.status_code == 200
            assert response.json()["nom"] == "dupont"
            assert response.json()["prenom"] == "jean"