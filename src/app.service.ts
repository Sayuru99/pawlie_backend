import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getVersion(): object {
    return {
      version: '1.0.0',
      name: 'Pawlie API',
      description: 'Pet Social Media Platform',
    };
  }
}