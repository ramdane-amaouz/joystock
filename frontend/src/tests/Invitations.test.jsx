import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Invitations from '../pages/Invitations'

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

function renderInvitations() {
  return render(
    <MemoryRouter>
      <Invitations />
    </MemoryRouter>
  )
}

describe('Invitations', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Affichage ─────────────────────────────────────────────────────────────

  it('affiche le titre', () => {
    renderInvitations()
    expect(screen.getByText('Inviter un employé')).toBeInTheDocument()
  })

  it('affiche le formulaire', () => {
    renderInvitations()
    expect(screen.getByPlaceholderText("Email de l'employé")).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    screen.getByText(/Créer l.invitation/)
  })

  it('affiche les options de rôle', () => {
    renderInvitations()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Employé')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('le rôle par défaut est employé', () => {
    renderInvitations()
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('employe')
  })

  // ── Saisie ────────────────────────────────────────────────────────────────

  it('permet de saisir un email', () => {
    renderInvitations()
    const input = screen.getByPlaceholderText("Email de l'employé")
    fireEvent.change(input, { target: { value: 'employe@test.com' } })
    expect(input.value).toBe('employe@test.com')
  })

  it('permet de changer le rôle', () => {
    renderInvitations()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'admin' } })
    expect(select.value).toBe('admin')
  })

  // ── Succès ────────────────────────────────────────────────────────────────

  it('affiche un message de succès et le lien après envoi', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Invitation créée avec succès",
        lien: "http://localhost:5173/inscription?token=fake-token-uuid"
      })
    })

    renderInvitations()
    fireEvent.change(screen.getByPlaceholderText("Email de l'employé"), {
      target: { value: 'employe@test.com' }
    })
    fireEvent.click(screen.getByText(/Créer l.invitation/))

    await waitFor(() => {
      expect(screen.getByText("Invitation créée avec succès. L'email a été envoyé !")).toBeInTheDocument()
    })

    expect(screen.getByText(/Lien d.invitation/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('http://localhost:5173/inscription?token=fake-token-uuid')).toBeInTheDocument()
  })

  it('remet le formulaire à zéro après succès', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Invitation créée",
        lien: "http://localhost:5173/inscription?token=abc"
      })
    })

    renderInvitations()
    const input = screen.getByPlaceholderText("Email de l'employé")
    fireEvent.change(input, { target: { value: 'employe@test.com' } })
    fireEvent.click(screen.getByText(/Créer l.invitation/))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  // ── Erreurs ───────────────────────────────────────────────────────────────

  it('affiche une erreur si pas de session', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } })

    renderInvitations()
    fireEvent.change(screen.getByPlaceholderText("Email de l'employé"), {
      target: { value: 'employe@test.com' }
    })
    fireEvent.click(screen.getByText(/Créer l.invitation/))

    await waitFor(() => {
      expect(screen.getByText('Non connecté')).toBeInTheDocument()
    })
  })

  it('affiche une erreur si la réponse n\'est pas ok', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    renderInvitations()
    fireEvent.change(screen.getByPlaceholderText("Email de l'employé"), {
      target: { value: 'employe@test.com' }
    })
    fireEvent.click(screen.getByText(/Créer l.invitation/))

    await waitFor(() => {
      expect(screen.getByText("Erreur lors de la création de l'invitation")).toBeInTheDocument()
    })
  })

  it('affiche une erreur si le réseau échoue', async () => {
    mockFetch.mockRejectedValue(new Error('Erreur réseau'))

    renderInvitations()
    fireEvent.change(screen.getByPlaceholderText("Email de l'employé"), {
      target: { value: 'employe@test.com' }
    })
    fireEvent.click(screen.getByText(/Créer l.invitation/))

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeInTheDocument()
    })
  })

  it('n\'affiche pas le lien si pas encore envoyé', () => {
    renderInvitations()
    expect(screen.queryByText("Lien d'invitation :")).not.toBeInTheDocument()
  })
})
