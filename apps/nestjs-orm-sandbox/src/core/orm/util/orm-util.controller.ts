import { Controller, Delete, Get } from '@nestjs/common';
import { OrmUtilsService } from './orm-utils.service';

@Controller('orm')
export class OrmUtilController {
  constructor(private ormService: OrmUtilsService) {}

  @Get('em')
  async dumpEm(): Promise<void> {
    this.ormService.dumpEm();
  }

  @Delete('em')
  emClear() {
    this.ormService.emClear();
  }
}
