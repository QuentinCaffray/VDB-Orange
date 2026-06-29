import { setAccessToken, getAccessToken, clearAccessToken } from '../lib/axios'

describe('Token management (lib/axios)', () => {
  afterEach(() => {
    clearAccessToken()
  })

  it('getAccessToken retourne null avant toute initialisation', () => {
    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  it('setAccessToken stocke le token en mémoire', () => {
    setAccessToken('mon-token-jwt')
    expect(getAccessToken()).toBe('mon-token-jwt')
  })

  it('clearAccessToken efface le token stocké', () => {
    setAccessToken('un-token')
    clearAccessToken()
    expect(getAccessToken()).toBeNull()
  })

  it('setAccessToken écrase un token précédent', () => {
    setAccessToken('token-initial')
    setAccessToken('token-nouveau')
    expect(getAccessToken()).toBe('token-nouveau')
  })
})
