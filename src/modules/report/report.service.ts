import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ReportStatus } from '../../common/enums/report-status.enum';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
    // Check if user already reported this content
    const existingReport = await this.reportRepository.findOne({
      where: {
        reporter_id: reporterId,
        target_id: createReportDto.target_id,
        target_type: createReportDto.target_type,
      },
    });

    if (existingReport) {
      throw new ConflictException('You have already reported this content');
    }

    const report = this.reportRepository.create({
      ...createReportDto,
      reporter_id: reporterId,
    });

    return this.reportRepository.save(report);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Report>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [reports, total] = await this.reportRepository.findAndCount({
      relations: ['reporter', 'reviewer'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reviewer'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto, reviewerId: string): Promise<Report> {
    const report = await this.findOne(id);

    Object.assign(report, {
      ...updateReportDto,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
    });

    return this.reportRepository.save(report);
  }

  async getReportsByStatus(status: ReportStatus): Promise<Report[]> {
    return this.reportRepository.find({
      where: { status },
      relations: ['reporter'],
      order: { created_at: 'DESC' },
    });
  }
}