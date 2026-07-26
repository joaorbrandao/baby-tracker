import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EventsService } from './events.service'
import { CreateEventDto } from './dto/create-event.dto'

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Request() req: { user: { userId: string } }) {
    return this.eventsService.findAll(req.user.userId)
  }

  @Post()
  create(@Request() req: { user: { userId: string } }, @Body() dto: CreateEventDto) {
    return this.eventsService.create(req.user.userId, dto)
  }

  @Delete(':id')
  remove(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.eventsService.remove(req.user.userId, id)
  }
}
