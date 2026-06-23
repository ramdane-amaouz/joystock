import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Statistiques from '../pages/Statistiques'

// Mock recharts pour éviter les erreurs dans jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}))

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

import { supabase } from '../supabaseClient'

const FAKE_STOCK = [
  {
    produit_id: 1,
    produit_nom: "Coca cola",
    categorie: "Boisson",
    stock_dernier_inventaire: 200,
    total_recu_depuis_inventaire: 50,
    total_consomme_depuis_inventaire: 30,
    stock_theorique: 220,
    seuil_alerte: 20,
    unite: "unite"
  },
  {
    produit_id: 2,
    produit_nom: "Bol",
    categorie: "Cuisine",
    stock_dernier_inventaire: 100,
    total_recu_depuis_inventaire: 0,
    total_consomme_depuis_inventaire: 100,
    stock_theorique: 0,
    seuil_alerte: 10,
    unite: "unite"
  }
]

const FAKE_CONSOMMATION = [
  { produit_nom: "Coca cola", date_stock_actuel: "2026-05-01", consommation_estimee: 30, unite: "unite" }
]

const FAKE_DERNIERE_CONSO = [
  { produit_nom: "Pain tacos", consommation_estimee: 305 }
]

const FAKE_TOTAL_VENTES = [
  { recette_nom: "Tacos poulet", total_vendu: 15 }
]

const FAKE_VENTES_JOUR = [
  { recette_nom: "Tacos poulet", jour: "2026-06-15", quantite_vendue: 3 }
]

function mockFetchTout() {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/stats/consommation'))
      return Promise.resolve({ ok: true, json: async () => FAKE_CONSOMMATION })
    if (url.includes('/stats/derniere-consommation'))
      return Promise.resolve({ ok: true, json: async () => FAKE_DERNIERE_CONSO })
    if (url.includes('/stats/ventes/total-recettes'))
      return Promise.resolve({ ok: true, json: async () => FAKE_TOTAL_VENTES })
    if (url.includes('/stats/ventes/par-jour'))
      return Promise.resolve({ ok: true, json: async () => FAKE_VENTES_JOUR })
    if (url.includes('/stats/ventes/par-semaine'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/stock-theorique'))
      return Promise.resolve({ ok: true, json: async () => FAKE_STOCK })
    if (url.includes('/stats/couts-matieres'))  // ← ajouter
      return Promise.resolve({ ok: true, json: async () => [] })
    return Promise.resolve({ ok: true, json: async () => [] })
  })
}

function renderStatistiques() {
  return render(
    <MemoryRouter>
      <Statistiques />
    </MemoryRouter>
  )
}

describe('Statistiques', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  // ── Chargement ────────────────────────────────────────────────────────────

  it('affiche le chargement au départ', () => {
    mockFetchTout()
    renderStatistiques()
    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument()
  })

  // ── Onglets ───────────────────────────────────────────────────────────────

  it('affiche les onglets de navigation', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Stock')).toBeInTheDocument()
      expect(screen.getByText('Consommation')).toBeInTheDocument()
      expect(screen.getByText('Ventes')).toBeInTheDocument()
      expect(screen.getByText('Évolution des ventes')).toBeInTheDocument()
    })
  })

  it('l\'onglet Stock est actif par défaut', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      const boutonStock = screen.getByText('Stock')
      expect(boutonStock).toHaveStyle({ backgroundColor: '#333' })
    })
  })

  it('change l\'onglet actif au clic', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Consommation')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Consommation'))
    expect(screen.getByText('Consommation')).toHaveStyle({ backgroundColor: '#333' })
  })

  // ── Stock théorique ───────────────────────────────────────────────────────

  /*it('affiche le tableau de stock théorique', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Stock théorique par produit')).toBeInTheDocument()
      expect(screen.getByText('Coca cola')).toBeInTheDocument()
      expect(screen.getByText('Bol')).toBeInTheDocument()
    })
  })*/

  it('affiche le tableau de stock théorique', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Stock théorique par produit')).toBeInTheDocument()
      expect(screen.getAllByText('Coca cola')).toHaveLength(2) // td + option
      expect(screen.getByText(/Bol/)).toBeInTheDocument()
    })
  })

  it('affiche le produit critique avec le bon style', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText(/⚠️/)).toBeInTheDocument()
    })
  })

  it('affiche "Aucune donnée" si stock vide', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/stats/stock-theorique'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: true, json: async () => [] })
    })
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Aucune donnée de stock disponible.')).toBeInTheDocument()
    })
  })

  // ── Consommation ──────────────────────────────────────────────────────────

  /*it('affiche le sélecteur de produit', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Produit')).toBeInTheDocument()
      expect(screen.getByText('Coca cola')).toBeInTheDocument()
    })
  })*/

  it('affiche le sélecteur de produit', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getAllByText('Produit')).toHaveLength(2) // th + label
      expect(screen.getAllByText('Coca cola')).toHaveLength(2)
    })
  })

  it('affiche "Aucune donnée" si pas de consommation pour le produit', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/stats/consommation'))
        return Promise.resolve({ ok: true, json: async () => [] })
      if (url.includes('/stats/stock-theorique'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: true, json: async () => [] })
    })
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Aucune donnée disponible pour ce produit.')).toBeInTheDocument()
    })
  })

  // ── Ventes ────────────────────────────────────────────────────────────────

  it('affiche le total des ventes par recette', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Total vendu par recette')).toBeInTheDocument()
    })
  })

  it('affiche "Aucune vente" si pas de ventes', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/stats/ventes/total-recettes'))
        return Promise.resolve({ ok: true, json: async () => [] })
      if (url.includes('/stats/stock-theorique'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: true, json: async () => [] })
    })
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Aucune vente enregistrée.')).toBeInTheDocument()
    })
  })

  it('affiche le sélecteur par jour/semaine', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Par jour')).toBeInTheDocument()
      expect(screen.getByText('Par semaine')).toBeInTheDocument()
    })
  })

  it('change le mode de vente au clic', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Par semaine')).toBeInTheDocument()
    })
    const selects = screen.getAllByRole('combobox')
    const selectMode = selects[selects.length - 1]
    fireEvent.change(selectMode, { target: { value: 'semaine' } })
    expect(selectMode.value).toBe('semaine')
  })

  // ── Erreurs ───────────────────────────────────────────────────────────────

  it('affiche une erreur si la session est absente', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })
  })





  it('affiche l\'onglet Coûts & Marges', async () => {
    mockFetchTout()
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getAllByText('Coûts & Marges')).toHaveLength(2)
    })
  })

  it('affiche le message si pas de données coûts', async () => {
    mockFetchTout() // retourne [] pour couts-matieres
    renderStatistiques()
    await waitFor(() => {
      expect(screen.getByText(/renseignez les prix des produits/)).toBeInTheDocument()
    })
  })



})
