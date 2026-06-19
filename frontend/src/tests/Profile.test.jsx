import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Profile from '../pages/Profile'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    }
  }
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { supabase } from '../supabaseClient'

const FAKE_PROFIL = {
  id: 'user-uuid-1234',
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@test.com',
  role: 'admin',
  created_at: '2026-01-01T00:00:00'
}

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  )
}

describe('Profile', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Chargement ────────────────────────────────────────────────────────────

  it('affiche le chargement au départ', () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => FAKE_PROFIL
    })
    renderProfile()
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  // ── Affichage du profil ───────────────────────────────────────────────────

  it('affiche le profil chargé', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => FAKE_PROFIL
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Mon profil')).toBeInTheDocument()
      expect(screen.getByText(/Dupont/)).toBeInTheDocument()
      expect(screen.getByText(/Jean/)).toBeInTheDocument()
      expect(screen.getByText(/jean.dupont@test.com/)).toBeInTheDocument()
      expect(screen.getByText(/admin/)).toBeInTheDocument()
    })
  })

  it('affiche les labels Nom, Prénom, Email, Rôle', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => FAKE_PROFIL
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Nom :')).toBeInTheDocument()
      expect(screen.getByText('Prénom :')).toBeInTheDocument()
      expect(screen.getByText('Email :')).toBeInTheDocument()
      expect(screen.getByText('Rôle :')).toBeInTheDocument()
      expect(screen.getByText('Date de création :')).toBeInTheDocument()
    })
  })

  it('affiche le bouton de test /profiles/me', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => FAKE_PROFIL
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Tester /profiles/me')).toBeInTheDocument()
    })
  })

  // ── Erreurs ───────────────────────────────────────────────────────────────

  it('affiche une erreur si utilisateur non connecté', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si getUser retourne une erreur', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' }
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le profil est introuvable', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockResolvedValue({ ok: false })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement du profil')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le réseau échoue', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-1234' } },
      error: null
    })
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement du profil')).toBeInTheDocument()
    })
  })

  // ── Profil employé ────────────────────────────────────────────────────────

  it('affiche correctement un profil employé', async () => {
    const profilEmploye = { ...FAKE_PROFIL, role: 'employe', nom: 'Martin', prenom: 'Alice' }

    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid-5678' } },
      error: null
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => profilEmploye
    })

    renderProfile()

    await waitFor(() => {
      expect(screen.getByText(/Martin/)).toBeInTheDocument()
      expect(screen.getByText(/Alice/)).toBeInTheDocument()
      expect(screen.getByText(/employe/)).toBeInTheDocument()
    })
  })
})
