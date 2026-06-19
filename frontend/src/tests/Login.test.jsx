import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn()
    }
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

import { supabase } from '../supabaseClient'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire de connexion', () => {
    renderLogin()
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('affiche le lien mot de passe oublié', () => {
    renderLogin()
    expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument()
  })

  it('affiche le header avec le logo JoyStock', () => {
    renderLogin()
    expect(screen.getByAltText('Logo JoyStock')).toBeInTheDocument()
    expect(screen.getByText(/JoyStock/)).toBeInTheDocument()
  })

  it('permet de saisir email et mot de passe', () => {
    renderLogin()
    const inputEmail = screen.getByPlaceholderText('Email')
    const inputMdp = screen.getByPlaceholderText('Mot de passe')

    fireEvent.change(inputEmail, { target: { value: 'test@test.com' } })
    fireEvent.change(inputMdp, { target: { value: 'monmotdepasse' } })

    expect(inputEmail.value).toBe('test@test.com')
    expect(inputMdp.value).toBe('monmotdepasse')
  })

  it('affiche le mot de passe quand on clique sur Voir', () => {
    renderLogin()
    const inputMdp = screen.getByPlaceholderText('Mot de passe')
    const boutonVoir = screen.getByRole('button', { name: 'Voir' })

    expect(inputMdp.type).toBe('password')
    fireEvent.click(boutonVoir)
    expect(inputMdp.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Cacher' })).toBeInTheDocument()
  })

  it('affiche une erreur si la connexion échoue', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' }
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'mauvaismdp' } })
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })

  it('redirige vers / si connexion réussie', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'bonmdp' } })
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
