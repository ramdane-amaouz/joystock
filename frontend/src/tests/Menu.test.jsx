import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Menu from '../components/Menu'

// Mock supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: vi.fn()
    }
  }
}))

function renderMenu(props = {}) {
  const defaultProps = {
    admin: false,
    reduit: false,
    setReduit: vi.fn(),
    ...props
  }
  return render(
    <MemoryRouter>
      <Menu {...defaultProps} />
    </MemoryRouter>
  )
}

describe('Menu', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les liens communs pour un employé', () => {
    renderMenu({ admin: false })
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.getByText('Produits')).toBeInTheDocument()
    expect(screen.getByText('Inventaire')).toBeInTheDocument()
    expect(screen.getByText('Mon Profil')).toBeInTheDocument()
  })

  it('cache les liens admin pour un employé', () => {
    renderMenu({ admin: false })
    expect(screen.queryByText('Statistiques')).not.toBeInTheDocument()
    expect(screen.queryByText('Recettes')).not.toBeInTheDocument()
    expect(screen.queryByText('Alertes')).not.toBeInTheDocument()
    expect(screen.queryByText('Invitations')).not.toBeInTheDocument()
  })

  it('affiche les liens admin pour un admin', () => {
    renderMenu({ admin: true })
    expect(screen.getByText('Statistiques')).toBeInTheDocument()
    expect(screen.getByText('Recettes')).toBeInTheDocument()
    expect(screen.getByText('Alertes')).toBeInTheDocument()
    expect(screen.getByText('Invitations')).toBeInTheDocument()
  })

  it('affiche le bouton réduire quand le menu est ouvert', () => {
    renderMenu({ reduit: false })
    expect(screen.getByText('◀ Réduire')).toBeInTheDocument()
  })

  it('affiche le bouton agrandir quand le menu est réduit', () => {
    renderMenu({ reduit: true })
    expect(screen.getByText('▶')).toBeInTheDocument()
  })

  it('cache les labels en mode réduit', () => {
    renderMenu({ reduit: true })
    expect(screen.queryByText('Tableau de bord')).not.toBeInTheDocument()
    expect(screen.queryByText('Produits')).not.toBeInTheDocument()
  })

  it('appelle setReduit au clic sur le bouton réduire', () => {
    const setReduit = vi.fn()
    renderMenu({ reduit: false, setReduit })
    fireEvent.click(screen.getByText('◀ Réduire'))
    expect(setReduit).toHaveBeenCalledWith(true)
  })

  it('affiche le bouton déconnexion', () => {
    renderMenu()
    expect(screen.getByText('Déconnexion')).toBeInTheDocument()
  //  expect(screen.getByTitle('Déconnexion') || screen.queryByText('Déconnexion')).toBeTruthy()
  })
})
