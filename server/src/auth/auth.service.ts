import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user
    return result
  }

  login(user: { id: string; email: string; name?: string | null }) {
    const payload = { sub: user.id, email: user.email }
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    }
  }
}
