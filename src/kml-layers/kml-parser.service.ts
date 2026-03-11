import { Injectable, BadRequestException } from '@nestjs/common';
import type { KmlFileType, KmlPlacemark } from './entities/kml-file.entity';

/**
 * Парсить KML файли всіх 4 типів:
 *  - contour  (Polygon)
 *  - track    (LineString)
 *  - point    (Point — точки забурювання)
 *  - centroid (Point — назви зон)
 */
@Injectable()
export class KmlParserService {
  /**
   * Визначає тип KML файлу за назвою або вмістом.
   * Пріоритет: ім'я файлу → вміст.
   */
  detectType(filename: string, content: string): KmlFileType {
    const lower = filename.toLowerCase();

    if (lower.includes('contour') || lower.includes('zone') || lower.includes('polygon')) {
      return 'contour';
    }
    if (lower.includes('track') || lower.includes('line')) {
      return 'track';
    }
    if (lower.includes('centroid')) {
      return 'centroid';
    }
    if (lower.includes('point') || lower.includes('punct')) {
      return 'point';
    }

    // Fallback: дивимось на вміст
    if (content.includes('<Polygon>')) return 'contour';
    if (content.includes('<LineString>')) return 'track';
    if (content.includes('<Point>')) {
      // Якщо є назва типу "Zone_N" — це центроїд, інакше point
      return content.includes('Zone_') ? 'centroid' : 'point';
    }

    throw new BadRequestException(
      `Не вдалось визначити тип KML файлу: "${filename}". ` +
        `Назва файлу має містити: contour/track/point/centroid`,
    );
  }

  /**
   * Головна функція парсингу — повертає масив Placemark об'єктів
   */
  parse(content: string, type: KmlFileType): KmlPlacemark[] {
    // Базова валідація
    if (!content.includes('<kml') && !content.includes('<KML')) {
      throw new BadRequestException('Файл не є валідним KML (відсутній тег <kml>)');
    }

    switch (type) {
      case 'contour':
        return this.parseContours(content);
      case 'track':
        return this.parseTracks(content);
      case 'point':
        return this.parsePoints(content);
      case 'centroid':
        return this.parseCentroids(content);
      default:
        throw new BadRequestException(`Невідомий тип KML: "${type as string}"`);
    }
  }

  // ─────────────────────────────────────────────
  // CONTOUR: Polygon зони
  // ─────────────────────────────────────────────
  private parseContours(content: string): KmlPlacemark[] {
    const placemarks = this.extractPlacemarks(content);
    const result: KmlPlacemark[] = [];

    for (const pm of placemarks) {
      const polygonMatch = pm.body.match(/<Polygon[\s\S]*?<\/Polygon>/);
      if (!polygonMatch) continue;

      const rings = this.extractLinearRings(polygonMatch[0]);
      if (!rings.length) continue;

      result.push({
        id: pm.id,
        name: pm.name,
        polygon: rings,
        attributes: this.extractAttributes(pm.body),
      });
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // TRACK: LineString треки відбору
  // ─────────────────────────────────────────────
  private parseTracks(content: string): KmlPlacemark[] {
    const placemarks = this.extractPlacemarks(content);
    const result: KmlPlacemark[] = [];

    for (const pm of placemarks) {
      const lineMatches = [...pm.body.matchAll(/<LineString[\s\S]*?<\/LineString>/g)];
      if (!lineMatches.length) continue;

      const lines: number[][][] = [];
      for (const match of lineMatches) {
        const coords = this.extractCoordinates(match[0]);
        if (coords.length >= 2) lines.push(coords);
      }

      if (!lines.length) continue;

      result.push({
        id: pm.id,
        name: pm.name,
        lines,
        attributes: this.extractAttributes(pm.body),
      });
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // POINT: Точки забурювання
  // ─────────────────────────────────────────────
  private parsePoints(content: string): KmlPlacemark[] {
    return this.parsePointPlacemarks(content);
  }

  // ─────────────────────────────────────────────
  // CENTROID: Центроїди зон з назвами
  // ─────────────────────────────────────────────
  private parseCentroids(content: string): KmlPlacemark[] {
    return this.parsePointPlacemarks(content);
  }

  private parsePointPlacemarks(content: string): KmlPlacemark[] {
    const placemarks = this.extractPlacemarks(content);
    const result: KmlPlacemark[] = [];

    for (const pm of placemarks) {
      const pointMatch = pm.body.match(/<Point[\s\S]*?<\/Point>/);
      if (!pointMatch) continue;

      const coords = this.extractCoordinates(pointMatch[0]);
      if (!coords.length) continue;

      const [lng, lat] = coords[0];

      result.push({
        id: pm.id,
        name: pm.name,
        point: [lng, lat],
        attributes: this.extractAttributes(pm.body),
      });
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // Допоміжні методи
  // ─────────────────────────────────────────────

  /** Витягує всі <Placemark> з KML */
  private extractPlacemarks(content: string): Array<{ id: string; name: string; body: string }> {
    const matches = [...content.matchAll(/<Placemark([^>]*)>([\s\S]*?)<\/Placemark>/g)];
    return matches.map((m, idx) => {
      const attrs = m[1] ?? '';
      const body = m[2] ?? '';

      // id з атрибуту або генеруємо
      const idMatch = attrs.match(/id="([^"]+)"/);
      const id = idMatch ? idMatch[1] : `placemark_${idx + 1}`;

      // name: <name>, <n>, або порожньо
      const nameMatch = body.match(/<(?:name|n)>([\s\S]*?)<\/(?:name|n)>/);
      const name = nameMatch ? nameMatch[1].trim() : '';

      return { id, name, body };
    });
  }

  /** Витягує LinearRing координати (зовнішній + внутрішні кільця) */
  private extractLinearRings(polygonXml: string): number[][][] {
    const rings: number[][][] = [];
    const ringMatches = [...polygonXml.matchAll(/<LinearRing[\s\S]*?<\/LinearRing>/g)];
    for (const match of ringMatches) {
      const coords = this.extractCoordinates(match[0]);
      if (coords.length >= 3) rings.push(coords);
    }
    return rings;
  }

  /** Парсить координати з тегу <coordinates> */
  private extractCoordinates(xml: string): number[][] {
    const match = xml.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (!match) return [];

    return match[1]
      .trim()
      .split(/\s+/)
      .map((triplet) => {
        const parts = triplet.split(',').map(Number);
        if (parts.length < 2 || parts.some(isNaN)) return null;
        const [lng, lat] = parts; // KML: lng,lat,alt
        return [lng, lat];
      })
      .filter((c): c is number[] => c !== null);
  }

  /** Витягує атрибути з <ExtendedData><SchemaData> */
  private extractAttributes(body: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const matches = [...body.matchAll(/<SimpleData name="([^"]+)">([\s\S]*?)<\/SimpleData>/g)];
    for (const m of matches) {
      attrs[m[1]] = m[2].trim();
    }
    return attrs;
  }
}
