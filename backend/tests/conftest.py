import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import sys
import os

# Ajoute le dossier backend au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock des variables d'environnement avant import
os.environ.setdefault("SUPABASE_URL", "https://fake.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "fake-key")

from main import app
from core.security import get_current_user, require_admin

# ── Payloads JWT fictifs ──────────────────────────────────────────────────────

FAKE_ADMIN = {
    "sub": "admin-uuid-1234",
    "email": "admin@test.com",
    "role": "authenticated"
}

FAKE_EMPLOYE = {
    "sub": "employe-uuid-5678",
    "email": "employe@test.com",
    "role": "authenticated"
}

# ── Override des dépendances ──────────────────────────────────────────────────

def override_get_current_user_admin():
    return FAKE_ADMIN

def override_get_current_user_employe():
    return FAKE_EMPLOYE

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client_admin():
    """Client authentifié en tant qu'admin."""
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    with patch("core.security.supabase") as mock_supabase:
        mock_response = MagicMock()
        mock_response.data = [{"role": "admin"}]
        mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        client = TestClient(app)
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def client_employe():
    """Client authentifié en tant qu'employé."""
    app.dependency_overrides[get_current_user] = override_get_current_user_employe
    with patch("core.security.supabase") as mock_supabase:
        mock_response = MagicMock()
        mock_response.data = [{"role": "employe"}]
        mock_supabase.schema.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        client = TestClient(app)
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def client_non_authentifie():
    """Client sans token."""
    client = TestClient(app)
    yield client