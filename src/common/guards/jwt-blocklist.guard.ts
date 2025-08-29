import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtBlocklistGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      const token = authHeader.split(' ')[1];
      const isBlocked = await this.cacheManager.get(`blocklist:${token}`);

      if (isBlocked) {
        throw new UnauthorizedException('Token has been invalidated');
      }
    }

    return true;
  }
}
