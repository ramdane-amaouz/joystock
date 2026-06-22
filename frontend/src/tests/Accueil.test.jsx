import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Accueil from '../pages/Accueil'

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

function mockFetchPourEmploye() {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/produits/count'))
      return Promise.resolve({ ok: true, json: async () => ({ count: 25 }) })
    if (url.includes('/produits/total-unites'))
      return Promise.resolve({ ok: true, json: async () => ({ total_unites: 10105 }) })
    if (url.includes('/produits'))
      return Promise.resolve({ ok: true, json: async () => [
        { produit_id: 1, nom: "Coca cola", categorie: "Boisson", type_produit: "matiere_premiere", quantite: 200, unite: "unite" }
      ]})
    return Promise.resolve({ ok: true, json: async () => [] })
  })
}

function mockFetchPourAdmin() {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/produits/count'))
      return Promise.resolve({ ok: true, json: async () => ({ count: 25 }) })
    if (url.includes('/produits/total-unites'))
      return Promise.resolve({ ok: true, json: async () => ({ total_unites: 10105 }) })
    if (url.includes('/produits'))
      return Promise.resolve({ ok: true, json: async () => [
        { produit_id: 1, nom: "Coca cola", categorie: "Boisson", type_produit: "matiere_premiere", quantite: 200, unite: "unite" }
      ]})
    if (url.includes('/stats/alertes-stock'))
      return Promise.resolve({ ok: true, json: async () => [
        { produit_id: 1, produit_nom: "Bol", stock_theorique: 0, seuil_alerte: 10, unite: "unite" }
      ]})
    if (url.includes('/stats/ventes/par-jour'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/derniere-consommation'))
      return Promise.resolve({ ok: true, json: async () => [
        { produit_nom: "Pain tacos", consommation_estimee: 305, unite: "unite" }
      ]})
    if (url.includes('/stats/ventes/total-recettes'))
      return Promise.resolve({ ok: true, json: async () => [
        { recette_nom: "Tacos poulet", total_vendu: 3 }
      ]})
    if (url.includes('/stats/ecarts-inventaire'))
      return Promise.resolve({ ok: true, json: async () => [] })
    return Promise.resolve({ ok: true, json: async () => [] })
  })
}

function mockFetchAvecEcarts(ecarts) {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/produits/count'))
      return Promise.resolve({ ok: true, json: async () => ({ count: 25 }) })
    if (url.includes('/produits/total-unites'))
      return Promise.resolve({ ok: true, json: async () => ({ total_unites: 10105 }) })
    if (url.includes('/produits'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/alertes-stock'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/ventes/par-jour'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/derniere-consommation'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/ventes/total-recettes'))
      return Promise.resolve({ ok: true, json: async () => [] })
    if (url.includes('/stats/ecarts-inventaire'))
      return Promise.resolve({ ok: true, json: async () => ecarts })
    return Promise.resolve({ ok: true, json: async () => [] })
  })
}

function renderAccueil(admin = false) {
  return render(
    <MemoryRouter>
      <Accueil admin={admin} />
    </MemoryRouter>
  )
}

// ─── Tests Accueil général ────────────────────────────────────────────────────

describe('Accueil', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le chargement puis le tableau de bord', async () => {
    mockFetchPourEmploye()
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    })
  })

  it('affiche les cartes communes pour un employé', async () => {
    mockFetchPourEmploye()
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.getByText('Produits référencés')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('Stock total')).toBeInTheDocument()
      expect(screen.getByText('10105')).toBeInTheDocument()
    })
  })

  it("n'affiche pas les cartes admin pour un employé", async () => {
    mockFetchPourEmploye()
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.queryByText('Alertes stock')).not.toBeInTheDocument()
      expect(screen.queryByText("Ventes aujourd'hui")).not.toBeInTheDocument()
    })
  })

  it("affiche l'aperçu des produits pour un employé", async () => {
    mockFetchPourEmploye()
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.getByText("Aperçu des produits")).toBeInTheDocument()
      expect(screen.getByText("Coca cola")).toBeInTheDocument()
    })
  })

  it('affiche le lien vers tous les produits', async () => {
    mockFetchPourEmploye()
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.getByText('Voir tous les produits →')).toBeInTheDocument()
    })
  })

  it('affiche les cartes admin pour un admin', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.getByText('Alertes stock')).toBeInTheDocument()
      expect(screen.getByText("Ventes aujourd'hui")).toBeInTheDocument()
    })
  })

  it('affiche le nombre d\'alertes stock', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.getByText('Alertes stock')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('affiche le lien vers les alertes si alertes > 0', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.getAllByText(/Voir les alertes/)[0]).toBeInTheDocument()
    })
  })

  it('n\'affiche plus le bloc produits en rupture imminente sur le dashboard', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.queryByText('⚠️ Produits en rupture imminente')).not.toBeInTheDocument()
    })
  })

  it('affiche la recette la plus vendue', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.getByText('Recette la plus vendue')).toBeInTheDocument()
      expect(screen.getByText('Tacos poulet')).toBeInTheDocument()
      expect(screen.getByText('3 vendues')).toBeInTheDocument()
    })
  })

  it('affiche le produit le plus consommé', async () => {
    mockFetchPourAdmin()
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.getByText('Produit le plus consommé')).toBeInTheDocument()
      expect(screen.getByText('Pain tacos')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))
    renderAccueil(false)
    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })
  })

  it('n\'affiche pas le bloc rupture si pas d\'alertes', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/produits/count'))
        return Promise.resolve({ ok: true, json: async () => ({ count: 25 }) })
      if (url.includes('/produits/total-unites'))
        return Promise.resolve({ ok: true, json: async () => ({ total_unites: 10105 }) })
      if (url.includes('/produits'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: true, json: async () => [] })
    })
    renderAccueil(true)
    await waitFor(() => {
      expect(screen.queryByText('⚠️ Produits en rupture imminente')).not.toBeInTheDocument()
    })
  })
})

// ─── Tests Écarts inventaire ──────────────────────────────────────────────────

describe('Accueil - Écarts inventaire', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche la carte écarts d\'inventaire pour un admin', async () => {
    mockFetchAvecEcarts([])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Écarts d\'inventaire')).toBeInTheDocument()
    })
  })

  it('affiche 0 si pas d\'écart significatif', async () => {
    mockFetchAvecEcarts([{
      inventaire_id: 27,
      date_inventaire: "2026-06-16T07:31:32",
      produit_id: 1,
      produit_nom: "Coca cola",
      categorie: "Boisson",
      unite: "unite",
      quantite_reelle: 95.0,
      stock_theorique_attendu: 100.0,
      ecart: -5.0
    }])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Écarts d\'inventaire')).toBeInTheDocument()
      //expect(screen.getByText('0')).toBeInTheDocument()
      const carteEcarts = screen.getByText("Écarts d'inventaire").closest('div')
      expect(carteEcarts).toHaveTextContent('0')
    })
  })

  it('affiche le bon nombre d\'écarts significatifs', async () => {
    mockFetchAvecEcarts([
      {
        inventaire_id: 27,
        date_inventaire: "2026-06-16T07:31:32",
        produit_id: 1,
        produit_nom: "Pain tacos",
        categorie: "Pain",
        unite: "unite",
        quantite_reelle: 0.0,
        stock_theorique_attendu: 172.0,
        ecart: -172.0
      },
      {
        inventaire_id: 27,
        date_inventaire: "2026-06-16T07:31:32",
        produit_id: 2,
        produit_nom: "Coca cola",
        categorie: "Boisson",
        unite: "unite",
        quantite_reelle: 10.0,
        stock_theorique_attendu: 200.0,
        ecart: -190.0
      }
    ])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  /*it('affiche le bloc détail si écarts significatifs', async () => {
    mockFetchAvecEcarts([{
      inventaire_id: 27,
      date_inventaire: "2026-06-16T07:31:32",
      produit_id: 1,
      produit_nom: "Pain tacos",
      categorie: "Pain",
      unite: "unite",
      quantite_reelle: 0.0,
      stock_theorique_attendu: 172.0,
      ecart: -172.0
    }])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Écarts détectés lors du dernier inventaire/)).toBeInTheDocument()
      expect(screen.getByText('Pain tacos')).toBeInTheDocument()
    })
  })*/

  it('n\'affiche plus le bloc détail écarts sur le dashboard', async () => {
    mockFetchAvecEcarts([{
      inventaire_id: 27,
      date_inventaire: "2026-06-16T07:31:32",
      produit_id: 1,
      produit_nom: "Pain tacos",
      categorie: "Pain",
      unite: "unite",
      quantite_reelle: 0.0,
      stock_theorique_attendu: 172.0,
      ecart: -172.0
    }])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText(/Écarts détectés lors du dernier inventaire/)).not.toBeInTheDocument()
    })
  })

  it('n\'affiche pas le bloc détail si aucun écart significatif', async () => {
    mockFetchAvecEcarts([])
    render(<MemoryRouter><Accueil admin={true} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText(/Écarts détectés/)).not.toBeInTheDocument()
    })
  })

  it('n\'affiche pas la carte écarts pour un employé', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/produits/count'))
        return Promise.resolve({ ok: true, json: async () => ({ count: 25 }) })
      if (url.includes('/produits/total-unites'))
        return Promise.resolve({ ok: true, json: async () => ({ total_unites: 10105 }) })
      if (url.includes('/produits'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: true, json: async () => [] })
    })
    render(<MemoryRouter><Accueil admin={false} /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText('Écarts d\'inventaire')).not.toBeInTheDocument()
    })
  })
})