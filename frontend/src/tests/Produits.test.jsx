import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Produits from '../pages/Produits'

// Mock supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'fake-token' } }
      })
    }
  }
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Génère N produits fictifs
function genererProduits(n) {
  return Array.from({ length: n }, (_, i) => ({
    produit_id: i + 1,
    nom: `Produit ${i + 1}`,
    categorie: 'Test',
    type_produit: 'matiere_premiere',
    quantite: 100,
    unite: 'kg',
    seuil_alerte: 10,
    prix: null  // ← ajouter
  }))
}

function renderProduits() {
  return render(
    <MemoryRouter>
      <Produits />
    </MemoryRouter>
  )
}

describe('Produits', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le titre Produits', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    })
    renderProduits()
    expect(screen.getByText('Produits')).toBeInTheDocument()
  })

  it('affiche le lien créer un produit', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    renderProduits()
    expect(screen.getByText('+ Créer un produit')).toBeInTheDocument()
  })

  it('affiche les produits chargés', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(3)
    })
    renderProduits()
    await waitFor(() => {
      expect(screen.getByText('Produit 1')).toBeInTheDocument()
      expect(screen.getByText('Produit 2')).toBeInTheDocument()
      expect(screen.getByText('Produit 3')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le chargement échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))
    renderProduits()
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des produits')).toBeInTheDocument()
    })
  })

  it('affiche le sélecteur de lignes par page', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => genererProduits(3) })
    renderProduits()
    const selects = screen.getAllByRole('combobox')
    const selectParPage = selects[0]
    expect(selectParPage.value).toBe('10')
  })

  it('change le nombre de lignes par page', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => genererProduits(3) })
    renderProduits()
    const selects = screen.getAllByRole('combobox')
    const selectParPage = selects[0]
    fireEvent.change(selectParPage, { target: { value: '50' } })
    expect(selectParPage.value).toBe('50')
  })

  it('affiche la pagination si plus de 10 produits', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(15)
    })
    renderProduits()
    await waitFor(() => {
      // Page 1 active, page 2 disponible
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('ne affiche pas la pagination si moins de 10 produits', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(5)
    })
    renderProduits()
    await waitFor(() => {
      expect(screen.queryByText('«')).not.toBeInTheDocument()
    })
  })

  it('affiche seulement 10 produits sur la première page', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(15)
    })
    renderProduits()
    await waitFor(() => {
      expect(screen.getByText('Produit 1')).toBeInTheDocument()
      expect(screen.getByText('Produit 10')).toBeInTheDocument()
      expect(screen.queryByText('Produit 11')).not.toBeInTheDocument()
    })
  })

  it('ouvre le modal au clic sur ⚙️', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(1)
    })
    renderProduits()
    await waitFor(() => {
      expect(screen.getByTitle("Modifier le seuil d'alerte")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTitle("Modifier le seuil d'alerte"))
    expect(screen.getByText("Seuil d'alerte")).toBeInTheDocument()
    // Produit 1 apparaît deux fois (tableau + modal) — on vérifie juste que le modal est ouvert
    expect(screen.getAllByText('Produit 1')).toHaveLength(2)
  })

  it('ferme le modal au clic sur Annuler', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => genererProduits(1)
    })
    renderProduits()
    await waitFor(() => {
      fireEvent.click(screen.getByTitle("Modifier le seuil d'alerte"))
    })
    fireEvent.click(screen.getByText('Annuler'))
    await waitFor(() => {
      expect(screen.queryByText("Seuil d'alerte")).not.toBeInTheDocument()
    })
  })

  it('affiche le bouton 💶 pour modifier le prix', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => genererProduits(1) })
    renderProduits()
    await waitFor(() => {
      expect(screen.getByTitle('Modifier le prix')).toBeInTheDocument()
    })
  })

  it('ouvre le modal prix au clic sur 💶', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => genererProduits(1) })
    renderProduits()
    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Modifier le prix'))
    })
    expect(screen.getAllByText('Prix unitaire')).toHaveLength(2)
  })

  it('ferme le modal prix au clic sur Annuler', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => genererProduits(1) })
    renderProduits()
    await waitFor(() => {
      fireEvent.click(screen.getByTitle('Modifier le prix'))
    })
    fireEvent.click(screen.getAllByText('Annuler')[0])
    await waitFor(() => {
      expect(screen.queryByText(/Laisser vide pour ne pas renseigner/)).not.toBeInTheDocument()
    })
  })

  it('affiche le prix si renseigné', async () => {
    const produits = [{ ...genererProduits(1)[0], prix: 9.00 }]
    mockFetch.mockResolvedValue({ ok: true, json: async () => produits })
    renderProduits()
    await waitFor(() => {
      expect(screen.getByText(/9/)).toBeInTheDocument()
    })
  })
}
)
