import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.users.find();
  }

  create(dto: CreateUserDto) {
    const user = this.users.create(dto);
    return this.users.save(user);
  }
}
