import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Mission } from './entities/mission.entity';
import { TrackPoint } from '../tracks/entities/track-point.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateMissionDto } from './dto/create-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,

    @InjectRepository(TrackPoint)
    private readonly trackRepo: Repository<TrackPoint>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  // =========================
  // CRUD
  // =========================

  async create(projectId: number, dto: CreateMissionDto, userId?: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const mission = this.missionRepo.create({
      project,
      projectId: project.id,
      name: dto.name,
      userId: userId ?? null,
      status: 'new',
      isArchived: false,
    });

    return this.missionRepo.save(mission);
  }

  async getByProject(projectId: number, includeArchived = false) {
    const projectExists = await this.projectRepo.exist({ where: { id: projectId } });
    if (!projectExists) throw new NotFoundException('Project not found');

    const qb = this.missionRepo
      .createQueryBuilder('m')
      .select([
        'm.id',
        'm.projectId',
        'm.name',
        'm.status',
        'm.isArchived',
        'm.created_at',
        'm.updated_at',
      ])
      .where('m.project_id = :projectId', { projectId })
      .orderBy('m.id', 'ASC');

    if (!includeArchived) {
      qb.andWhere('m.isArchived = false');
    }

    return qb.getMany();
  }

  async getById(missionId: number) {
    const mission = await this.missionRepo
      .createQueryBuilder('m')
      .select([
        'm.id',
        'm.projectId',
        'm.name',
        'm.status',
        'm.isArchived',
        'm.created_at',
        'm.updated_at',
      ])
      .where('m.id = :missionId', { missionId })
      .getOne();

    if (!mission) throw new NotFoundException('Mission not found');
    return mission;
  }

  async archive(missionId: number) {
    const mission = await this.missionRepo.findOne({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    mission.isArchived = true;
    return this.missionRepo.save(mission);
  }

  async unarchive(missionId: number) {
    const mission = await this.missionRepo.findOne({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    mission.isArchived = false;
    return this.missionRepo.save(mission);
  }

  async delete(missionId: number) {
    const exists = await this.missionRepo.exist({ where: { id: missionId } });
    if (!exists) throw new NotFoundException('Mission not found');

    // TrackPoints мають onDelete: 'CASCADE'
    await this.missionRepo.delete(missionId);
    return { ok: true };
  }

  // =========================
  // Spatial: Mission Summary (ST_Length)
  // =========================

  async getSummary(missionId: number) {
    const missionExists = await this.missionRepo.exist({ where: { id: missionId } });
    if (!missionExists) throw new NotFoundException('Mission not found');

    const stats = await this.trackRepo
      .createQueryBuilder('tp')
      .select('COUNT(tp.id)', 'pointsCount')
      .addSelect('MIN(tp."createdAt")', 'minTime')
      .addSelect('MAX(tp."createdAt")', 'maxTime')
      .addSelect(
        `
        ST_Length(
          ST_MakeLine(tp.geom ORDER BY tp."createdAt")::geography
        )
        `,
        'distanceMeters',
      )
      .where('tp.mission_id = :missionId', { missionId })
      .andWhere('tp.geom IS NOT NULL')
      .getRawOne<{
        pointsCount: string | null;
        minTime: Date | null;
        maxTime: Date | null;
        distanceMeters: string | null;
      }>();

    const pointsCount = Number(stats?.pointsCount ?? 0);

    if (!pointsCount || pointsCount < 2 || !stats?.minTime || !stats?.maxTime) {
      return {
        missionId,
        distanceMeters: 0,
        durationSeconds: 0,
        averageSpeedMps: 0,
        pointsCount: pointsCount || 0,
      };
    }

    const durationSeconds =
      (new Date(stats.maxTime).getTime() - new Date(stats.minTime).getTime()) / 1000;

    const distanceMeters = Number(stats.distanceMeters ?? 0);

    const averageSpeedMps = durationSeconds > 0 ? distanceMeters / durationSeconds : 0;

    return {
      missionId,
      distanceMeters: Number(distanceMeters.toFixed(2)),
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      averageSpeedMps: Number(averageSpeedMps.toFixed(3)),
      pointsCount,
    };
  }

  // =========================
  // Spatial: Route GeoJSON
  // =========================

  async getRouteGeoJson(missionId: number) {
    const missionExists = await this.missionRepo.exist({ where: { id: missionId } });
    if (!missionExists) throw new NotFoundException('Mission not found');

    const result = await this.trackRepo
      .createQueryBuilder('tp')
      .select(
        `
        ST_AsGeoJSON(
          ST_MakeLine(tp.geom ORDER BY tp."createdAt")
        )
        `,
        'geojson',
      )
      .where('tp.mission_id = :missionId', { missionId })
      .andWhere('tp.geom IS NOT NULL')
      .getRawOne<{ geojson: string | null }>();

    if (!result?.geojson) {
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [],
        },
        properties: { missionId },
      };
    }

    const parsed = JSON.parse(result.geojson) as {
      type: 'LineString';
      coordinates: number[][];
    };

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: parsed.coordinates ?? [],
      },
      properties: { missionId },
    };
  }

  // =========================
  // Spatial: ST_DWithin (points in radius)
  // =========================

  async getPointsInRadius(missionId: number, lat: number, lng: number, radiusMeters: number) {
    const missionExists = await this.missionRepo.exist({ where: { id: missionId } });
    if (!missionExists) throw new NotFoundException('Mission not found');

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('lat/lng must be numbers');
    }
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      throw new BadRequestException('radius must be a positive number (meters)');
    }

    const points = await this.trackRepo
      .createQueryBuilder('tp')
      .select(['tp.id', 'tp.lat', 'tp.lng', 'tp.speed', 'tp.heading', 'tp.createdAt'])
      .where('tp.mission_id = :missionId', { missionId })
      .andWhere('tp.geom IS NOT NULL')
      .andWhere(
        `
        ST_DWithin(
          tp.geom::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )
        `,
        { lat, lng, radius: radiusMeters },
      )
      .orderBy('tp.createdAt', 'ASC')
      .getMany();

    return {
      missionId,
      center: { lat, lng },
      radiusMeters,
      pointsFound: points.length,
      points,
    };
  }

  // =========================
  // Spatial: % Coverage of polygon (route buffer ∩ field polygon)
  // =========================
  // fieldId = kml_layers.id (контур зони)
  // widthMeters = ширина захвату/смуги (м). У ST_Buffer беремо radius = width/2
  //
  // Витягуємо перший <Polygon>...</Polygon> з kml_layers.content та парсимо ST_GeomFromKML
  // =========================

  async getCoveragePercent(missionId: number, fieldId: number, widthMeters = 6) {
    const missionExists = await this.missionRepo.exist({ where: { id: missionId } });
    if (!missionExists) throw new NotFoundException('Mission not found');

    if (!Number.isFinite(widthMeters) || widthMeters <= 0) {
      throw new BadRequestException('width must be a positive number (meters)');
    }

    // SQL робить:
    // 1) route line (LineString)
    // 2) route buffer (geography meters -> geometry)
    // 3) field polygon from KML (first <Polygon> fragment)
    // 4) intersection area / field area
    const rows: Array<{ field_area: string | null; covered_area: string | null }> =
      await this.trackRepo.query(
        `
        WITH route AS (
          SELECT
            ST_MakeLine(tp.geom ORDER BY tp."createdAt") AS line
          FROM track_points tp
          WHERE tp.mission_id = $1
            AND tp.geom IS NOT NULL
        ),
        field_kml AS (
          SELECT
            -- беремо перший Polygon фрагмент з KML
            substring(content from '(?s)<Polygon[^>]*>.*?</Polygon>') AS poly_kml
          FROM kml_layers
          WHERE id = $2
            AND isArchived = false
          LIMIT 1
        ),
        field AS (
          SELECT
            ST_CollectionExtract(ST_GeomFromKML(poly_kml), 3) AS geom
          FROM field_kml
        ),
        buffered AS (
          SELECT
            ST_Buffer(route.line::geography, ($3 / 2.0))::geometry AS geom
          FROM route
        ),
        inter AS (
          SELECT
            ST_Intersection(buffered.geom, field.geom) AS geom
          FROM buffered, field
        )
        SELECT
          ST_Area(field.geom::geography) AS field_area,
          ST_Area(inter.geom::geography) AS covered_area
        FROM field, inter;
        `,
        [missionId, fieldId, widthMeters],
      );

    if (!rows?.length) {
      return {
        missionId,
        fieldId,
        widthMeters,
        coveragePercent: 0,
        coveredAreaM2: 0,
        fieldAreaM2: 0,
      };
    }

    const fieldArea = Number(rows[0].field_area ?? 0);
    const coveredArea = Number(rows[0].covered_area ?? 0);

    // Якщо KML не містить Polygon або ST_GeomFromKML не зміг розпарсити
    if (!fieldArea || !Number.isFinite(fieldArea)) {
      return {
        missionId,
        fieldId,
        widthMeters,
        coveragePercent: 0,
        coveredAreaM2: 0,
        fieldAreaM2: 0,
        note: 'Field polygon not found in kml_layers.content (no <Polygon> fragment?)',
      };
    }

    const coveragePercent = fieldArea > 0 ? (coveredArea / fieldArea) * 100 : 0;

    return {
      missionId,
      fieldId,
      widthMeters,
      coveragePercent: Number(coveragePercent.toFixed(2)),
      coveredAreaM2: Number(coveredArea.toFixed(2)),
      fieldAreaM2: Number(fieldArea.toFixed(2)),
    };
  }
}