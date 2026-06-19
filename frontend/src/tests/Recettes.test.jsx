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
    ingredients: [
      { produit_ingredient_nom: 'Pain tacos', quantite: 1, unite_nom: 'unite' },
      { produit_ingredient_nom: 'Poulet', quantite: 150, unite_nom: 'g' }
    ]
  },
  {
    id: 2,
    nom: 'Tacos boeuf',
    ingredients: []
  }
]

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
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Recettes')).toBeInTheDocument()
    })
  })

  it('affiche les liens Créer et Saisir', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('+ Créer une recette')).toBeInTheDocument()
      expect(screen.getByText('+ Saisir des ventes')).toBeInTheDocument()
    })
  })

  it('affiche le message si aucune recette', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Aucune recette créée pour le moment.')).toBeInTheDocument()
    })
  })

  it('affiche les recettes chargées', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_RECETTES })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Tacos poulet')).toBeInTheDocument()
      expect(screen.getByText('Tacos boeuf')).toBeInTheDocument()
    })
  })

  it('affiche les ingrédients d\'une recette', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_RECETTES })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText(/Pain tacos/)).toBeInTheDocument()
      expect(screen.getByText(/Poulet/)).toBeInTheDocument()
    })
  })

  it('affiche "Aucun ingrédient" pour une recette sans ingrédients', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_RECETTES })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Aucun ingrédient renseigné.')).toBeInTheDocument()
    })
  })

  it('affiche les boutons modifier et supprimer par recette', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => FAKE_RECETTES })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getAllByText('📝')).toHaveLength(2)
      expect(screen.getAllByText('🗑️')).toHaveLength(2)
    })
  })

  it('le lien modifier pointe vers /modifier-recette/{id}', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [FAKE_RECETTES[0]] })
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('📝').closest('a')
      expect(lien).toHaveAttribute('href', '/modifier-recette/1')
    })
  })

  // ── Suppression ───────────────────────────────────────────────────────────

  it('ne supprime pas si l\'utilisateur annule la confirmation', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [FAKE_RECETTES[0]] })
    global.confirm.mockReturnValue(false)

    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('🗑️')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('🗑️'))
    expect(mockFetch).toHaveBeenCalledTimes(1) // seulement le GET initial
  })

  it('supprime la recette si l\'utilisateur confirme', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [FAKE_RECETTES[0]] }) // GET initial
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // DELETE
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // GET après suppression

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
    mockFetch.mockResolvedValue({ ok: false })
    renderRecettes()
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des recettes')).toBeInTheDocument()
    })
  })

  // ── Navigation ────────────────────────────────────────────────────────────

  it('le lien Créer pointe vers /ajout-recette', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('+ Créer une recette').closest('a')
      expect(lien).toHaveAttribute('href', '/ajout-recette')
    })
  })

  it('le lien Saisir pointe vers /saisir-ventes', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderRecettes()
    await waitFor(() => {
      const lien = screen.getByText('+ Saisir des ventes').closest('a')
      expect(lien).toHaveAttribute('href', '/saisir-ventes')
    })
  })
})
