import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { LiveService, DriverState } from './live.service';

// ─── Типи подій ──────────────────────────────

interface LocationPayload {
  missionId?: number;
  projectId?: number;
  lat: number;
  lng: number;
}

interface ZoneSampledPayload {
  missionId: number;
  zoneId: number;
  isSampled: boolean;
  manualOverride?: boolean;
}

interface MissionStatusPayload {
  missionId: number;
  projectId: number;
  status: 'online' | 'offline';
}

// ─────────────────────────────────────────────

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/live',
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map<socketId, userId> — для відстеження хто є хто
  private readonly socketToUser = new Map<string, number>();
  // Map<socketId, 'driver'|'viewer'> — роль підключення
  private readonly socketRole = new Map<string, 'driver' | 'viewer'>();

  constructor(
    private readonly liveService: LiveService,
    private readonly jwtService: JwtService,
  ) {}

  // ─────────────────────────────────────────────
  // Підключення
  // ─────────────────────────────────────────────

  async handleConnection(socket: Socket) {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);

    const shareToken = socket.handshake.query?.shareToken as string;

    // Публічний viewer (стороння особа з посиланням)
    if (shareToken) {
      try {
        const tokenEntity = await this.liveService.validateShareToken(shareToken);
        socket.join(`project:${tokenEntity.projectId}`);
        socket.join('viewers');
        this.socketRole.set(socket.id, 'viewer');

        // Одразу надсилаємо поточний стан водіїв
        const drivers = this.liveService.getDriversByProject(tokenEntity.projectId);
        socket.emit('snapshot', { drivers });

        console.log(`[WS] Public viewer connected: ${socket.id}`);
      } catch {
        socket.emit('error', { message: 'Invalid or expired share token' });
        socket.disconnect();
      }
      return;
    }

    // Авторизований юзер (водій або Admin)
    if (!token) {
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      }) as { sub: number; username: string; role: string };

      this.socketToUser.set(socket.id, payload.sub);

      if (payload.role === 'ADMIN') {
        // Admin — viewer всього
        socket.join('admins');
        this.socketRole.set(socket.id, 'viewer');

        const drivers = this.liveService.getAllDrivers();
        socket.emit('snapshot', { drivers });

        console.log(`[WS] Admin connected: ${payload.username}`);
      } else {
        // User — водій
        socket.join('drivers');
        this.socketRole.set(socket.id, 'driver');

        const state = this.liveService.updateDriver(payload.sub, payload.username, {
          status: 'online',
        });

        // Повідомляємо всіх спостерігачів
        this.broadcastDriverUpdate(state);

        console.log(`[WS] Driver connected: ${payload.username}`);
      }
    } catch {
      socket.emit('error', { message: 'Invalid token' });
      socket.disconnect();
    }
  }

  // ─────────────────────────────────────────────
  // Відключення
  // ─────────────────────────────────────────────

  handleDisconnect(socket: Socket) {
    const userId = this.socketToUser.get(socket.id);

    if (userId && this.socketRole.get(socket.id) === 'driver') {
      const state = this.liveService.setOffline(userId);
      if (state) {
        this.broadcastDriverUpdate(state);
      }
    }

    this.socketToUser.delete(socket.id);
    this.socketRole.delete(socket.id);

    console.log(`[WS] Disconnected: ${socket.id}`);
  }

  // ─────────────────────────────────────────────
  // Водій надсилає свою позицію
  // ─────────────────────────────────────────────

  @SubscribeMessage('location')
  handleLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: LocationPayload,
  ) {
    const userId = this.socketToUser.get(socket.id);
    if (!userId || this.socketRole.get(socket.id) !== 'driver') return;

    const user = this.liveService
      .getAllDrivers()
      .find((d) => d.userId === userId);

    const state = this.liveService.updateDriver(userId, user?.username ?? '', {
      lat: payload.lat,
      lng: payload.lng,
      missionId: payload.missionId,
      projectId: payload.projectId,
      status: 'online',
    });

    this.broadcastDriverUpdate(state);
  }

  // ─────────────────────────────────────────────
  // Зона підсвітилась (авто або вручну)
  // ─────────────────────────────────────────────

  @SubscribeMessage('zone_sampled')
  handleZoneSampled(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ZoneSampledPayload,
  ) {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) return;

    // Розсилаємо всім спостерігачам
    this.server.to('admins').to('viewers').emit('zone_sampled', {
      ...payload,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Якщо є projectId — також в кімнату проєкту
    const driver = this.liveService.getAllDrivers().find((d) => d.userId === userId);
    if (driver?.projectId) {
      this.server
        .to(`project:${driver.projectId}`)
        .emit('zone_sampled', {
          ...payload,
          updatedBy: userId,
          timestamp: new Date().toISOString(),
        });
    }
  }

  // ─────────────────────────────────────────────
  // Статус місії змінився
  // ─────────────────────────────────────────────

  @SubscribeMessage('mission_status')
  handleMissionStatus(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MissionStatusPayload,
  ) {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) return;

    const state = this.liveService.updateDriver(
      userId,
      this.liveService.getAllDrivers().find((d) => d.userId === userId)?.username ?? '',
      {
        missionId: payload.missionId,
        projectId: payload.projectId,
        status: payload.status,
      },
    );

    this.broadcastDriverUpdate(state);
  }

  // ─────────────────────────────────────────────
  // Допоміжний метод — розсилка оновлення водія
  // ─────────────────────────────────────────────

  broadcastDriverUpdate(state: DriverState) {
    const event = 'driver_update';
    const payload = { ...state, timestamp: new Date().toISOString() };

    // Всім адмінам
    this.server.to('admins').emit(event, payload);

    // Глядачам конкретного проєкту
    if (state.projectId) {
      this.server.to(`project:${state.projectId}`).emit(event, payload);
    }
  }

  // ─────────────────────────────────────────────
  // Публічний метод для виклику з інших сервісів
  // (наприклад, коли zone-sampling worker підсвічує зону)
  // ─────────────────────────────────────────────

  emitZoneSampled(projectId: number, payload: ZoneSampledPayload) {
    this.server.to('admins').emit('zone_sampled', payload);
    this.server.to(`project:${projectId}`).emit('zone_sampled', payload);
  }
}
