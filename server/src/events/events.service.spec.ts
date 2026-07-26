import { Test } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { EventsService } from './events.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventDto } from './dto/create-event.dto'

describe('EventsService', () => {
  let service: EventsService
  let prisma: {
    event: {
      findMany: jest.Mock
      create: jest.Mock
      deleteMany: jest.Mock
    }
  }

  beforeEach(async () => {
    prisma = {
      event: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    }

    const module = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get(EventsService)
  })

  it('returns user events ordered by datetime', async () => {
    await service.findAll('user-1')
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { datetime: 'asc' },
    })
  })

  it('creates an event with default now datetime', async () => {
    const dto: CreateEventDto = { type: 'baby-kick' }
    prisma.event.create.mockResolvedValue({ id: 'e1', ...dto })

    await service.create('user-1', dto)
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'baby-kick',
        userId: 'user-1',
        datetime: expect.any(Date),
        sides: undefined,
      }),
    })
  })

  it('creates a pump-start with sides', async () => {
    const dto: CreateEventDto = { type: 'pump-start', sides: 'left', datetime: '2026-04-27T09:00:00.000Z' }
    prisma.event.create.mockResolvedValue({ id: 'e2', ...dto })

    await service.create('user-1', dto)
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'pump-start',
        sides: 'left',
        datetime: new Date('2026-04-27T09:00:00.000Z'),
      }),
    })
  })

  it('rejects invalid event type', async () => {
    await expect(service.create('user-1', { type: 'invalid' } as CreateEventDto)).rejects.toThrow(BadRequestException)
  })

  it('rejects sides on non-pump-start', async () => {
    await expect(service.create('user-1', { type: 'baby-kick', sides: 'left' } as CreateEventDto)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('rejects invalid sides value', async () => {
    await expect(service.create('user-1', { type: 'pump-start', sides: 'nope' } as CreateEventDto)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('throws when deleting a non-existent event', async () => {
    prisma.event.deleteMany.mockResolvedValue({ count: 0 })
    await expect(service.remove('user-1', 'e-missing')).rejects.toThrow(NotFoundException)
  })
})
