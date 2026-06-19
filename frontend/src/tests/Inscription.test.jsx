import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Inscription from '../pages/Inscription'

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      getSession: vi.fn()
    }
  }
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch

import { supabase } from '../supabaseClient'

function renderInscription(token = 'valid-token') {
  return render(
    <MemoryRouter initialEntries={[`/inscription?token=${token}`]}>
      <Routes>
        <Route path="/inscription" element={<Inscription />} />
      </Routes>
    </MemoryRouter>
  )
}

function renderInscriptionSansToken() {
  return render(
    <MemoryRouter initialEntries={['/inscription']}>
      <Routes>
        <Route path="/inscription" element={<Inscription />} />
      </Routes>
    </MemoryRouter>
  )
}

// Les labels ne sont pas liés aux inputs avec htmlFor/id
// On utilise getAllByRole pour accéder aux inputs par ordre
function getInputs() {
  const textInputs = screen.getAllByRole('textbox')
  const passwordInput = document.querySelector('input[type="password"]')
  return {
    nom: textInputs[0],
    prenom: textInputs[1],
    mdp: passwordInput
  }
}

function remplirFormulaire() {
  const { nom, prenom, mdp } = getInputs()
  fireEvent.change(nom, { target: { value: 'Dupont' } })
  fireEvent.change(prenom, { target: { value: 'Jean' } })
  fireEvent.change(mdp, { target: { value: 'monmdp123' } })
}

describe('Inscription', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Affichage ─────────────────────────────────────────────────────────────

  it('affiche le formulaire de création de compte', () => {
    renderInscription()
    expect(screen.getByText('Création du compte')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(2) // Nom + Prénom
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer mon compte' })).toBeInTheDocument()
  })

  it('affiche les labels Nom, Prénom, Mot de passe', () => {
    renderInscription()
    expect(screen.getByText('Nom')).toBeInTheDocument()
    expect(screen.getByText('Prénom')).toBeInTheDocument()
    expect(screen.getByText('Mot de passe')).toBeInTheDocument()
  })

  // ── Validation ────────────────────────────────────────────────────────────

  it("affiche une erreur si pas de token dans l'URL", async () => {
    renderInscriptionSansToken()
    // Soumettre le form directement sans passer par la validation HTML
    fireEvent.submit(screen.getByRole('button', { name: 'Créer mon compte' }).closest('form'))
    await waitFor(() => {
      expect(screen.getByText(/Lien d'invitation invalide/)).toBeInTheDocument()
    })
  })

  it("affiche une erreur si l'invitation est invalide", async () => {
    mockFetch.mockResolvedValue({ ok: false })
    renderInscription()
    remplirFormulaire()
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))
    await waitFor(() => {
      expect(screen.getByText('Invitation invalide ou expirée.')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si supabase signUp échoue', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@test.com', role: 'employe', token: 'valid-token' })
    })
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Email already registered' }
    })

    renderInscription()
    remplirFormulaire()
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si session introuvable après signUp', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@test.com', role: 'employe', token: 'valid-token' })
    })
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null })
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

    renderInscription()
    remplirFormulaire()
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => {
      expect(screen.getByText('Session introuvable après inscription.')).toBeInTheDocument()
    })
  })

  // ── Succès ────────────────────────────────────────────────────────────────

  it('affiche un message de succès et redirige vers /login', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true }) // 👈

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@test.com', role: 'employe', token: 'valid-token' })
    })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null })
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'fake-token' } }
    })

    renderInscription()
    remplirFormulaire()
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => {
      expect(screen.getByText('Compte créé avec succès. Vous pouvez maintenant vous connecter.')).toBeInTheDocument()
    })

    vi.advanceTimersByTime(1500)
    expect(mockNavigate).toHaveBeenCalledWith('/login')

    vi.useRealTimers()
  })

  // ── Saisie ────────────────────────────────────────────────────────────────

  it('permet de saisir nom, prénom et mot de passe', () => {
    renderInscription()
    const { nom, prenom, mdp } = getInputs()

    fireEvent.change(nom, { target: { value: 'Dupont' } })
    fireEvent.change(prenom, { target: { value: 'Jean' } })
    fireEvent.change(mdp, { target: { value: 'monmdp123' } })

    expect(nom.value).toBe('Dupont')
    expect(prenom.value).toBe('Jean')
    expect(mdp.value).toBe('monmdp123')
  })
})
