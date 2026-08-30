import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getBrandName(): string {
    return 'AshesStudio';
  }

  getSlogan(): string {
    return 'Creating Digital Wonders';
  }
}
