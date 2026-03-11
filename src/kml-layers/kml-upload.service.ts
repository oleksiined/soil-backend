import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KmlFileEntity, KmlFileType } from './entities/kml-file.entity';
import { KmlLayerEntity } from './entities/kml-layer.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { KmlParserService } from './kml-parser.service';

@Injectable()
export class KmlUploadService {
  constructor(
    @InjectRepository(KmlFileEntity)
    private readonly kmlFileRepo: Repository<KmlFileEntity>,

    @InjectRepository(KmlLayerEntity)
    private readonly kmlLayerRepo: Repository<KmlLayerEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    private readonly parser: KmlParserService,
  ) {}

  /**
   * Завантажує один KML файл:
   * 1) Визначає тип (contour / track / point / centroid)
   * 2) Парсить плейсмарки
   * 3) Для contour — записує PostGIS геометрію в kml_layers
   * 4) Зберігає в kml_files
   */
  async uploadOne(
    projectId: number,
    originalName: string,
    content: string,
    typeOverride?: KmlFileType,
  ): Promise<KmlFileEntity> {
    // Перевіряємо проєкт
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    // Визначаємо тип
    const type = typeOverride ?? this.parser.detectType(originalName, content);

    // Парсимо
    let placemarks: KmlFileEntity['placemarks'];
    try {
      placemarks = this.parser.parse(content, type);
    } catch (err: any) {
      throw new BadRequestException(`Помилка парсингу KML: ${err.message}`);
    }

    if (!placemarks.length) {
      throw new BadRequestException(
        `KML файл "${originalName}" не містить жодного об'єкту типу "${type}"`,
      );
    }

    // Зберігаємо kml_file
    const kmlFile = await this.kmlFileRepo.save(
      this.kmlFileRepo.create({
        projectId,
        project,
        originalName,
        type,
        rawContent: content,
        placemarks,
        featureCount: placemarks.length,
        isArchived: false,
      }),
    );

    // Для контурів — синхронізуємо в kml_layers з PostGIS геометрією
    if (type === 'contour') {
      await this.syncContoursToKmlLayers(projectId, project, placemarks, content);
    }

    return kmlFile;
  }

  /**
   * Завантажує кілька KML файлів одночасно (batch upload).
   * Повертає результат по кожному файлу.
   */
  async uploadBatch(
    projectId: number,
    files: Array<{ originalName: string; content: string }>,
  ): Promise<{
    uploaded: KmlFileEntity[];
    errors: Array<{ filename: string; error: string }>;
  }> {
    const uploaded: KmlFileEntity[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const result = await this.uploadOne(projectId, file.originalName, file.content);
        uploaded.push(result);
      } catch (err: any) {
        errors.push({ filename: file.originalName, error: err.message });
      }
    }

    return { uploaded, errors };
  }

  /**
   * Повертає всі KML файли проєкту з можливою фільтрацією по типу
   */
  async getByProject(
    projectId: number,
    type?: KmlFileType,
  ): Promise<KmlFileEntity[]> {
    const where: any = { projectId, isArchived: false };
    if (type) where.type = type;

    return this.kmlFileRepo.find({
      where,
      order: { id: 'ASC' },
      // не повертаємо rawContent та placemarks в списку — тільки метадані
      select: ['id', 'projectId', 'originalName', 'type', 'featureCount', 'isArchived', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Повертає один KML файл повністю (з placemarks)
   */
  async getOne(id: number): Promise<KmlFileEntity> {
    const file = await this.kmlFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('KML file not found');
    return file;
  }

  /**
   * Повертає сирий KML контент (для скачування)
   */
  async getRawContent(id: number): Promise<{ filename: string; content: string }> {
    const file = await this.kmlFileRepo.findOne({
      where: { id },
      select: ['id', 'originalName', 'rawContent'],
    });
    if (!file) throw new NotFoundException('KML file not found');
    return { filename: file.originalName, content: file.rawContent };
  }

  /**
   * Архівує KML файл
   */
  async archive(id: number): Promise<{ ok: true }> {
    const file = await this.kmlFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('KML file not found');
    await this.kmlFileRepo.update(id, { isArchived: true });
    return { ok: true };
  }

  /**
   * Видаляє KML файл
   */
  async delete(id: number): Promise<{ ok: true }> {
    const file = await this.kmlFileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('KML file not found');
    await this.kmlFileRepo.remove(file);
    return { ok: true };
  }

  // ─────────────────────────────────────────────
  // Приватні методи
  // ─────────────────────────────────────────────

  /**
   * Синхронізує контури в таблицю kml_layers з PostGIS геометрією.
   * Використовує ST_GeomFromKML для точного парсингу геометрії на рівні БД.
   */
  private async syncContoursToKmlLayers(
    projectId: number,
    project: ProjectEntity,
    placemarks: KmlFileEntity['placemarks'],
    rawContent: string,
  ): Promise<void> {
    for (const pm of placemarks) {
      if (!pm.polygon?.length) continue;

      // Витягуємо KML фрагмент конкретного Polygon для ST_GeomFromKML
      const polygonKml = this.extractPolygonKml(rawContent, pm.id);

      // Перевіряємо чи вже є такий шар (за назвою і проєктом)
      const existing = await this.kmlLayerRepo.findOne({
        where: { project: { id: projectId }, name: pm.name || pm.id },
      });

      if (existing) {
        // Оновлюємо геометрію
        if (polygonKml) {
          await this.kmlLayerRepo.query(
            `UPDATE kml_layers
             SET geom = ST_GeomFromKML($1), "isArchived" = false, content = $2, "updatedAt" = NOW()
             WHERE id = $3`,
            [polygonKml, rawContent, existing.id],
          );
        }
      } else {
        // Створюємо новий
        if (polygonKml) {
          await this.kmlLayerRepo.query(
            `INSERT INTO kml_layers (name, content, "isArchived", project_id, geom, "createdAt", "updatedAt")
             VALUES ($1, $2, false, $3, ST_GeomFromKML($4), NOW(), NOW())`,
            [pm.name || pm.id, rawContent, projectId, polygonKml],
          );
        } else {
          // Якщо не вдалось витягти KML фрагмент — вставляємо без геометрії
          const layer = this.kmlLayerRepo.create({
            name: pm.name || pm.id,
            content: rawContent,
            isArchived: false,
            project,
          });
          await this.kmlLayerRepo.save(layer);
        }
      }
    }
  }

  /**
   * Витягує KML фрагмент <Polygon>...</Polygon> для конкретного Placemark
   */
  private extractPolygonKml(content: string, placemarkId: string): string | null {
    // Знаходимо Placemark по id
    const pmRegex = new RegExp(
      `<Placemark[^>]*id="${this.escapeRegex(placemarkId)}"[^>]*>[\\s\\S]*?</Placemark>`,
    );
    const pmMatch = content.match(pmRegex);
    if (!pmMatch) return null;

    const polygonMatch = pmMatch[0].match(/<Polygon>[\s\S]*?<\/Polygon>/);
    return polygonMatch ? polygonMatch[0] : null;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
