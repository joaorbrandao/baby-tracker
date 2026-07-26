import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator'
import { VALID_EVENT_TYPES, VALID_PUMP_SIDES } from '../constants'

export class CreateEventDto {
  @IsString()
  @IsIn(VALID_EVENT_TYPES)
  type!: string

  @IsOptional()
  @IsISO8601({ strict: true })
  datetime?: string

  @IsOptional()
  @IsString()
  @IsIn(VALID_PUMP_SIDES)
  sides?: string
}
