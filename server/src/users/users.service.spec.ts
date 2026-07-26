import { Test } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

describe('UsersService', () => {
  let service: UsersService
  let prisma: {
    user: {
      findUnique: jest.Mock
      create: jest.Mock
      delete: jest.Mock
    }
  }

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    }

    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(UsersService)
  })

  it('finds a user by email', async () => {
    const user = { id: 'u1', email: 'a@b.com' }
    prisma.user.findUnique.mockResolvedValue(user)

    const result = await service.findByEmail('a@b.com')

    expect(result).toEqual(user)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } })
  })

  it('creates a user', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'Test' })

    const result = await service.createUser('a@b.com', 'hashed', 'Test')

    expect(result).toEqual({ id: 'u1', email: 'a@b.com', name: 'Test' })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'a@b.com', passwordHash: 'hashed', name: 'Test' },
      select: { id: true, email: true, name: true, createdAt: true },
    })
  })

  it('deletes a user by id', async () => {
    prisma.user.delete.mockResolvedValue({ id: 'u1' })

    await service.deleteUser('u1')

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } })
  })
})
