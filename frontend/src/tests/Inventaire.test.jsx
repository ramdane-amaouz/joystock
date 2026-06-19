import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Inventaire from '../pages/Inventaire'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'fake-token' } }
      })
    }
  }
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL.createObjectURL et URL.revokeObjectURL pour l'export CSV
global.URL.createObjectURL = vi.fn(() => 'blob:fake-url')
global.URL.revokeObjectURL = vi.fn()

const FAKE_INVENTAIRES = [
  {
    id: 22,
    type: "stock",
    date_inventaire: "2026-05-22T13:11:41.643977",
    utilisateur_nom: "testeur",
    utilisateur_prenom: "admin"
  },
  {
    id: 21,
    type: "reception",
    date_inventaire: "2026-05-22T13:08:54.917992",
    utilisateur_nom: "testeur",
    utilisateur_prenom: "admin"
  }
]

function renderInventaire() {
  return render(
    <MemoryRouter>
      <Inventaire />
    </MemoryRouter>
  )
}

describe('Inventaire', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Affichage de base ─────────────────────────────────────────────────────

  it('affiche le titre', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Inventaire')).toBeInTheDocument()
    })
  })

  it('affiche les boutons d\'action', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('📋 Démarrer un inventaire')).toBeInTheDocument()
      expect(screen.getByText('📦 Réceptionner une livraison')).toBeInTheDocument()
    })
  })

  it('affiche le titre de l\'historique', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Historique des inventaires')).toBeInTheDocument()
    })
  })

  // ── États ─────────────────────────────────────────────────────────────────

  it('affiche le message si aucun inventaire', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Aucun inventaire enregistré pour le moment.')).toBeInTheDocument()
    })
  })

  it('affiche les inventaires chargés', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_INVENTAIRES })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getAllByText('Inventaire')).toHaveLength(2) // h2 + badge
      expect(screen.getByText('Réception')).toBeInTheDocument()
      expect(screen.getAllByText(/admin/)).toHaveLength(2)
    })
  })

  it('affiche les colonnes du tableau', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_INVENTAIRES })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Réalisé par')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('affiche les boutons export CSV', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_INVENTAIRES })
    renderInventaire()
    await waitFor(() => {
      const boutons = screen.getAllByText('⬇️ CSV')
      expect(boutons).toHaveLength(2)
    })
  })

  // ── Erreurs ───────────────────────────────────────────────────────────────

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si la réponse n\'est pas ok', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des inventaires')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si pas de session', async () => {
    const { supabase } = await import('../supabaseClient')
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    renderInventaire()
    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })

  // ── Export CSV ────────────────────────────────────────────────────────────

  it('déclenche l\'export CSV au clic', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => FAKE_INVENTAIRES })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { produit_nom: "Coca cola", categorie: "Boisson", unite: "unite", quantite: 200 }
      ]
    })

    renderInventaire()
    await waitFor(() => {
      expect(screen.getAllByText('⬇️ CSV')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByText('⬇️ CSV')[0])

    await waitFor(() => {
      // On vérifie que le fetch des détails a bien été appelé
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/inventaires/22/details'),
        expect.any(Object)
      )
    })
  })

  // ── Navigation ────────────────────────────────────────────────────────────

  it('le lien Démarrer pointe vers /demarrer-inventaire', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      const lien = screen.getByText('📋 Démarrer un inventaire').closest('a')
      expect(lien).toHaveAttribute('href', '/demarrer-inventaire')
    })
  })

  it('le lien Réceptionner pointe vers /reception-livraison', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderInventaire()
    await waitFor(() => {
      const lien = screen.getByText('📦 Réceptionner une livraison').closest('a')
      expect(lien).toHaveAttribute('href', '/reception-livraison')
    })
  })
})
