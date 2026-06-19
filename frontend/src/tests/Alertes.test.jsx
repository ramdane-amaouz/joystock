import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Alertes from '../pages/Alertes'

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

function renderAlertes() {
  return render(
    <MemoryRouter>
      <Alertes />
    </MemoryRouter>
  )
}

const FAKE_ALERTES = [
  {
    produit_id: 1,
    produit_nom: "Bol",
    categorie: "Cuisine",
    stock_theorique: 0,
    seuil_alerte: 10,
    ecart: -10,
    unite: "unite"
  },
  {
    produit_id: 2,
    produit_nom: "Coca cola",
    categorie: "Boisson",
    stock_theorique: 5,
    seuil_alerte: 20,
    ecart: -15,
    unite: "unite"
  }
]

describe('Alertes', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le titre', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Alertes de stock')).toBeInTheDocument()
    })
  })

  it('affiche le message aucune alerte si liste vide', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText(/Aucune alerte/)).toBeInTheDocument()
    })
  })

  it('affiche les alertes quand il y en a', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_ALERTES })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Bol')).toBeInTheDocument()
      expect(screen.getByText('Coca cola')).toBeInTheDocument()
    })
  })

  it('affiche le bon nombre de produits en alerte', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_ALERTES })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText(/2 produits en dessous du seuil/)).toBeInTheDocument()
    })
  })

  it('affiche le singulier pour 1 produit', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [FAKE_ALERTES[0]] })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText(/1 produit en dessous du seuil/)).toBeInTheDocument()
    })
  })

  it('affiche les colonnes du tableau', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_ALERTES })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Produit')).toBeInTheDocument()
      expect(screen.getByText('Catégorie')).toBeInTheDocument()
      expect(screen.getByText('Stock théorique')).toBeInTheDocument()
      expect(screen.getByText("Seuil d'alerte")).toBeInTheDocument()
      expect(screen.getByText('Écart')).toBeInTheDocument()
      expect(screen.getByText('Unité')).toBeInTheDocument()
    })
  })

  it('affiche les bonnes valeurs pour chaque alerte', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [FAKE_ALERTES[0]] })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Bol')).toBeInTheDocument()
      expect(screen.getByText('Cuisine')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('-10')).toBeInTheDocument()
      expect(screen.getByText('unite')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si la session est absente', async () => {
    const { supabase } = await import('../supabaseClient')
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    renderAlertes()
    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })
})
