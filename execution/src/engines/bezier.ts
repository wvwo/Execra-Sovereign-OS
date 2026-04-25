import { Point } from '../types/workflow';

export class BezierEngine {
  static cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  static generateControlPoints(start: Point, end: Point): [Point, Point] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return [{ ...start }, { ...end }];

    const perpX = -dy / distance;
    const perpY = dx / distance;
    const offset1 = distance * (0.1 + Math.random() * 0.2);
    const offset2 = distance * (0.1 + Math.random() * 0.2);
    const dir1 = Math.random() > 0.5 ? 1 : -1;
    const dir2 = Math.random() > 0.5 ? 1 : -1;

    const cp1: Point = {
      x: start.x + dx * 0.3 + perpX * offset1 * dir1,
      y: start.y + dy * 0.3 + perpY * offset1 * dir1
    };
    const cp2: Point = {
      x: start.x + dx * 0.7 + perpX * offset2 * dir2,
      y: start.y + dy * 0.7 + perpY * offset2 * dir2
    };
    return [cp1, cp2];
  }

  static calculateDuration(distance: number, targetSize: number = 50): number {
    const a = 100;
    const b = 150;
    const id = Math.log2(distance / targetSize + 1);
    const duration = a + b * id;
    const jitter = duration * (0.85 + Math.random() * 0.3);
    return Math.max(200, Math.min(2000, jitter));
  }

  static generatePath(start: Point, end: Point, targetSize: number = 50): Point[] {
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const duration = this.calculateDuration(distance, targetSize);
    const steps = Math.max(20, Math.floor(duration / 10));
    const [cp1, cp2] = this.generateControlPoints(start, end);

    let actualEnd = { ...end };
    if (distance > 500 && Math.random() > 0.3) {
      const ratio = 0.02 + Math.random() * 0.03;
      actualEnd = {
        x: end.x + (end.x - start.x) * ratio,
        y: end.y + (end.y - start.y) * ratio
      };
    }

    const path: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = this.cubicBezier(easedT, start.x, cp1.x, cp2.x, actualEnd.x);
      const y = this.cubicBezier(easedT, start.y, cp1.y, cp2.y, actualEnd.y);
      const jitterX = (Math.random() - 0.5) * 4;
      const jitterY = (Math.random() - 0.5) * 4;
      path.push({ x: x + jitterX, y: y + jitterY });
    }

    if (actualEnd.x !== end.x || actualEnd.y !== end.y) {
      const correctionSteps = 5 + Math.floor(Math.random() * 5);
      for (let i = 1; i <= correctionSteps; i++) {
        const t = i / correctionSteps;
        path.push({
          x: actualEnd.x + (end.x - actualEnd.x) * t + (Math.random() - 0.5) * 2,
          y: actualEnd.y + (end.y - actualEnd.y) * t + (Math.random() - 0.5) * 2
        });
      }
    }

    return path;
  }
}
