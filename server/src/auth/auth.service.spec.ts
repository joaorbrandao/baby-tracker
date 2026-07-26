import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { hash } from 'bcryptjs'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'

describe('AuthService', () => {
  let authService: AuthService
  let usersService: { findByEmail: jest.Mock }
  let jwtService: { sign: jest.Mock }

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn() }
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') }

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile()

    authService = module.get(AuthService)
  })

  it('returns user without password hash on valid credentials', async () => {
    const password = 'secret123'
    const user = {
      id: 'user-1',
      email: 'parent@example.com',
      passwordHash: await hash(password, 10),
      name: 'Parent',
      createdAt: new Date(),
    }
    usersService.findByEmail.mockResolvedValue(user)

    const result = await authService.validateUser(user.email, password)
    expect(result).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    })
  })

  it('throws on unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null)
    await expect(authService.validateUser('nope@example.com', 'x')).rejects.toThrow('Invalid credentials')
  })

  it('throws on wrong password', async () => {
    const user = { passwordHash: await hash('other', 10) }
    usersService.findByEmail.mockResolvedValue(user)
    await expect(authService.validateUser('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('issues a token on login', () => {
    const user = { id: 'user-1', email: 'parent@example.com', name: 'Parent' }
    const result = authService.login(user)
    expect(result.accessToken).toBe('signed-token')
    expect(result.user).toEqual(user)
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email })
  })
})
