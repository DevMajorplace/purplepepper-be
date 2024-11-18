import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

export const UserRoles = (...roles: Role[]) => SetMetadata('userRoles', roles);
