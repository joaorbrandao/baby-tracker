import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventDto } from './dto/create-event.dto'
import { VALID_EVENT_TYPES, VALID_PUMP_SIDES } from './constants'

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      orderBy: { datetime: 'asc' },
    })
  }

  async create(userId: string, dto: CreateEventDto) {
    if (!VALID_EVENT_TYPES.includes(dto.type as any)) {
      throw new BadRequestException(`Invalid event type: ${dto.type}`)
    }

    if (dto.sides && dto.type !== 'pump-start') {
      throw new BadRequestException('sides is only allowed for pump-start')
    }

    if (dto.sides && !VALID_PUMP_SIDES.includes(dto.sides as any)) {
      throw new BadRequestException(`Invalid sides: ${dto.sides}`)
    }

    return this.prisma.event.create({
      data: {
        type: dto.type,
        datetime: dto.datetime ? new Date(dto.datetime) : new Date(),
        sides: dto.sides,
        userId,
      },
    })
  }

  async remove(userId: string, eventId: string) {
    const result = await this.prisma.event.deleteMany({
      where: { id: eventId, userId },
    })

    if (result.count === 0) {
      throw new NotFoundException('Event not found')
    }
  }
}
