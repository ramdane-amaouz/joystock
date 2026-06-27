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


class TestDesactiverEmploye:
    """Tests pour PATCH /profiles/{user_id}/desactiver"""

    def test_desactiver_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la désactivation est refusée."""
        response = client_non_authentifie.patch("/profiles/employe-uuid-5678/desactiver")
        assert response.status_code == 422

    def test_desactiver_employe_refuse(self, client_employe):
        """Un employé ne peut pas désactiver un compte."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "employe"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_employe.patch("/profiles/employe-uuid-5678/desactiver")
            assert response.status_code == 403
            assert response.json()["detail"] == "Accès réservé aux admins"

    def test_desactiver_soi_meme_refuse(self, client_admin):
        """Un admin ne peut pas se désactiver lui-même."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "admin"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            # admin-uuid-1234 est l'id du client_admin dans conftest
            response = client_admin.patch("/profiles/admin-uuid-1234/desactiver")
            assert response.status_code == 400
            assert response.json()["detail"] == "Impossible de se désactiver soi-même"

    def test_desactiver_employe_succes(self, client_admin):
        """Un admin peut désactiver un employé."""
        with patch("routers.profiles.supabase") as mock_supabase:
            # Premier appel : vérifier que c'est un admin
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            # Deuxième appel : soft delete
            mock_update_response = MagicMock()
            mock_update_response.data = [{"id": "employe-uuid-5678", "deleted_at": "2026-06-27T10:00:00+00:00"}]

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
                mock_admin_response,
            ]
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/employe-uuid-5678/desactiver")
            assert response.status_code == 200
            assert response.json()["message"] == "Employé désactivé avec succès"

    def test_desactiver_profil_inexistant_retourne_404(self, client_admin):
        """Désactiver un user_id inexistant retourne 404."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            mock_update_response = MagicMock()
            mock_update_response.data = []

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_admin_response
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/uuid-inexistant/desactiver")
            assert response.status_code == 404
            assert response.json()["detail"] == "Profil introuvable"

class TestReactiverEmploye:
    """Tests pour PATCH /profiles/{user_id}/reactiver"""

    def test_reactiver_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, la réactivation est refusée."""
        response = client_non_authentifie.patch("/profiles/employe-uuid-5678/reactiver")
        assert response.status_code == 422

    def test_reactiver_employe_refuse(self, client_employe):
        """Un employé ne peut pas réactiver un compte."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "employe"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_employe.patch("/profiles/employe-uuid-5678/reactiver")
            assert response.status_code == 403
            assert response.json()["detail"] == "Accès réservé aux admins"

    def test_reactiver_succes(self, client_admin):
        """Un admin peut réactiver un compte désactivé."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            mock_update_response = MagicMock()
            mock_update_response.data = [{"id": "employe-uuid-5678", "deleted_at": None}]

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_admin_response
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/employe-uuid-5678/reactiver")
            assert response.status_code == 200
            assert response.json()["message"] == "Employé réactivé avec succès"

    def test_reactiver_profil_inexistant_retourne_404(self, client_admin):
        """Réactiver un user_id inexistant retourne 404."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            mock_update_response = MagicMock()
            mock_update_response.data = []

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_admin_response
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/uuid-inexistant/reactiver")
            assert response.status_code == 404
            assert response.json()["detail"] == "Profil introuvable"


class TestChangerRole:
    """Tests pour PATCH /profiles/{user_id}/role"""

    def test_changer_role_sans_auth_refuse(self, client_non_authentifie):
        """Sans token, le changement de rôle est refusé."""
        response = client_non_authentifie.patch("/profiles/employe-uuid-5678/role", json={"role": "admin"})
        assert response.status_code == 422

    def test_changer_role_employe_refuse(self, client_employe):
        """Un employé ne peut pas changer les rôles."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "employe"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_employe.patch("/profiles/employe-uuid-5678/role", json={"role": "admin"})
            assert response.status_code == 403
            assert response.json()["detail"] == "Accès réservé aux admins"

    def test_changer_role_soi_meme_refuse(self, client_admin):
        """Un admin ne peut pas modifier son propre rôle."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "admin"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.patch("/profiles/admin-uuid-1234/role", json={"role": "employe"})
            assert response.status_code == 400
            assert response.json()["detail"] == "Impossible de modifier son propre rôle"

    def test_changer_role_invalide(self, client_admin):
        """Un rôle invalide retourne 400."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_response = MagicMock()
            mock_response.data = [{"role": "admin"}]
            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

            response = client_admin.patch("/profiles/employe-uuid-5678/role", json={"role": "superuser"})
            assert response.status_code == 400
            assert response.json()["detail"] == "Rôle invalide"

    def test_changer_role_succes(self, client_admin):
        """Un admin peut changer le rôle d'un autre utilisateur."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            mock_update_response = MagicMock()
            mock_update_response.data = [{"id": "employe-uuid-5678", "role": "admin"}]

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_admin_response
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/employe-uuid-5678/role", json={"role": "admin"})
            assert response.status_code == 200
            assert response.json()["message"] == "Rôle mis à jour : admin"

    def test_changer_role_profil_inexistant_retourne_404(self, client_admin):
        """Changer le rôle d'un user_id inexistant retourne 404."""
        with patch("routers.profiles.supabase") as mock_supabase:
            mock_admin_response = MagicMock()
            mock_admin_response.data = [{"role": "admin"}]

            mock_update_response = MagicMock()
            mock_update_response.data = []

            mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_admin_response
            mock_supabase.schema.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response

            response = client_admin.patch("/profiles/uuid-inexistant/role", json={"role": "employe"})
            assert response.status_code == 404
            assert response.json()["detail"] == "Profil introuvable"