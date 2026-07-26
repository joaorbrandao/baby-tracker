import { Controller, Delete, Request, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  async remove(@Request() req: { user: { userId: string } }) {
    await this.usersService.deleteUser(req.user.userId)
  }
}
