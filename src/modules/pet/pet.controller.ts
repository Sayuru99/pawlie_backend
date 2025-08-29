import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { PetService } from './pet.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { Pet } from './entities/pet.entity';

@ApiTags('Pets')
@Controller('pets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pet' })
  @ApiResponse({ status: 201, description: 'Pet created successfully', type: Pet })
  async create(@Body() createPetDto: CreatePetDto, @CurrentUser() user: User): Promise<Pet> {
    return this.petService.create(createPetDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pets of the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user pets', type: [Pet] })
  async findAll(@CurrentUser() user: User): Promise<Pet[]> {
    return this.petService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific pet by ID' })
  @ApiResponse({ status: 200, description: 'Pet found', type: Pet })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  async findOne(@Param('id') id: string): Promise<Pet> {
    return this.petService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pet' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully', type: Pet })
  async update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @CurrentUser() user: User,
  ): Promise<Pet> {
    const pet = await this.petService.findOne(id);
    if (pet.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own pets');
    }
    return this.petService.update(id, updatePetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pet' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<{ message: string }> {
    const pet = await this.petService.findOne(id);
    if (pet.user_id !== user.id) {
      throw new ForbiddenException('You can only delete your own pets');
    }
    await this.petService.remove(id);
    return { message: 'Pet deleted successfully' };
  }

  @Post(':id/picture')
  @ApiOperation({ summary: 'Upload pet profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<Pet> {
    const pet = await this.petService.findOne(id);
    if (pet.user_id !== user.id) {
      throw new ForbiddenException('You can only update your own pets');
    }
    return this.petService.uploadPicture(id, file);
  }
}