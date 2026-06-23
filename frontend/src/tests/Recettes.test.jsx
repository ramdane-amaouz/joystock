import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Recettes from '../pages/Recettes'

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
global.confirm = vi.fn()

import { supabase } from '../supabaseClient'

const FAKE_RECETTES = [
  {
    id: 1,
    nom: 'Tacos poulet',
    prix_vente: 8.50,
    ingredients: [
      { produit_ingredient_nom: 'Pain tacos', quantite: 1, unite_nom: 'unite' },
      { produit_ingredient_nom: 'Poulet', quantite: 150, unite_nom: 'g' }
    ]
  },
  {
    id: 2,
    nom: 'Tacos boeuf',
    prix_vente: null,
    ingredients: []
  }
]

// Helper — mock les deux appels parallèles (recettes + couts-matieres)
function mockFetchRecettes(recettes = FAKE_RECETTES, couts = []) {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/stats/couts-matieres'))
      return Promise.resolve({ ok: true, json: async () => couts })
    return Promise.resolve({ ok: true, json: async () => recettes })
  })
}

function renderRecettes() {
  return render(
    <MemoryRouter>
      <Recettes />
    </MemoryRouter>
  )
}

describe('Recettes', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn()
  })

  // ── Affichage ─────────────────────────────────────────────────────────────

  it('affiche le titre', async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Recettes')).toBeInTheDocument()
    })
  })

  it('affiche les liens Créer et Saisir', async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('+ Créer une recette')).toBeInTheDocument()
      expect(screen.getByText('+ Saisir des ventes')).toBeInTheDocument()
    })
  })

  it('affiche le message si aucune recette', async () => {
    mockFetchRecettes([])
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Aucune recette créée pour le moment.')).toBeInTheDocument()
    })
  })

  it('affiche les recettes chargées', async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Tacos poulet')).toBeInTheDocument()
      expect(screen.getByText('Tacos boeuf')).toBeInTheDocument()
    })
  })

  it("affiche les ingrédients d'une recette", async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText(/Pain tacos/)).toBeInTheDocument()
      expect(screen.getByText(/Poulet/)).toBeInTheDocument()
    })
  })

  it('affiche "Aucun ingrédient" pour une recette sans ingrédients', async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Aucun ingrédient renseigné.')).toBeInTheDocument()
    })
  })

  it('affiche les boutons modifier et supprimer par recette', async () => {
    mockFetchRecettes()
    renderRecettes()
    await waitFor(() => {
      expect(screen.getAllByText('📝')).toHaveLength(2)
      expect(screen.getAllByText('🗑️')).toHaveLength(2)
    })
  })

  it('le lien modifier pointe vers /modifier-recette/{id}', async () => {
    mockFetchRecettes([FAKE_RECETTES[0]])
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('📝').closest('a')
      expect(lien).toHaveAttribute('href', '/modifier-recette/1')
    })
  })

  // ── Prix de vente ─────────────────────────────────────────────────────────

  it('affiche le prix de vente si renseigné', async () => {
    mockFetchRecettes([FAKE_RECETTES[0]])
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('8.5 €')).toBeInTheDocument()
    })
  })

  it('affiche "Prix non renseigné" si pas de prix', async () => {
    mockFetchRecettes([FAKE_RECETTES[1]])
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Prix non renseigné')).toBeInTheDocument()
    })
  })

  // ── Suppression ───────────────────────────────────────────────────────────

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    mockFetchRecettes([FAKE_RECETTES[0]])
    global.confirm.mockReturnValue(false)

    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('🗑️')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('🗑️'))
    // 2 appels initiaux (recettes + couts-matieres), pas de DELETE
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("supprime la recette si l'utilisateur confirme", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [FAKE_RECETTES[0]] }) // GET /recettes
      .mockResolvedValueOnce({ ok: true, json: async () => [] })                  // GET /stats/couts-matieres
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })                // DELETE
      .mockResolvedValueOnce({ ok: true, json: async () => [] })                  // GET /recettes reload
      .mockResolvedValueOnce({ ok: true, json: async () => [] })                  // GET /stats/couts-matieres reload

    global.confirm.mockReturnValue(true)

    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('🗑️')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('🗑️'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/recettes/delete/1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  // ── Erreurs ───────────────────────────────────────────────────────────────

  it('affiche une erreur si la session est absente', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Utilisateur non connecté')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/stats/couts-matieres'))
        return Promise.resolve({ ok: true, json: async () => [] })
      return Promise.resolve({ ok: false })
    })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des recettes')).toBeInTheDocument()
    })
  })

  // ── Navigation ────────────────────────────────────────────────────────────

  it('le lien Créer pointe vers /ajout-recette', async () => {
    mockFetchRecettes([])
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('+ Créer une recette').closest('a')
      expect(lien).toHaveAttribute('href', '/ajout-recette')
    })
  })

  it('le lien Saisir pointe vers /saisir-ventes', async () => {
    mockFetchRecettes([])
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('+ Saisir des ventes').closest('a')
      expect(lien).toHaveAttribute('href', '/saisir-ventes')
    })
  })
})