import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { calculateGeoDistanceKm } from '../routeOptimizer.js';

let ioInstance: SocketIOServer | null = null;

export interface AmbulanceLocationPayload {
  ambulanceId: number;
  emergencyId?: number | null;
  driverId?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number; // km/h
  heading?: number;
  timestamp?: string;
  source?: 'device_gps' | 'simulated';
}

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client registers role (patient, driver, admin)
    socket.on('join_role', (role: 'patient' | 'driver' | 'admin') => {
      socket.join(`role_${role}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined role room: role_${role}`);
    });

    // Client joins specific emergency room for targeted live updates
    socket.on('join_emergency', (emergencyId: string | number) => {
      const room = `emergency_${emergencyId}`;
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} joined ${room}`);
    });

    socket.on('leave_emergency', (emergencyId: string | number) => {
      const room = `emergency_${emergencyId}`;
      socket.leave(room);
      console.log(`[Socket.IO] Socket ${socket.id} left ${room}`);
    });

    // Real-time GPS stream from driver's device (navigator.geolocation.watchPosition)
    socket.on('ambulance_location_update', async (data: AmbulanceLocationPayload) => {
      try {
        const enrichedPayload = {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        // Broadcast to specific emergency room if on active mission
        if (data.emergencyId) {
          io.to(`emergency_${data.emergencyId}`).emit('ambulance_location_update', enrichedPayload);
        }

        // Broadcast to all admins and drivers
        io.to('role_admin').emit('ambulance_location_update', enrichedPayload);
        io.emit('fleet_ambulance_location', enrichedPayload);
      } catch (err) {
        console.error('[Socket.IO] Error handling ambulance_location_update:', err);
      }
    });

    // Driver mission status progression
    socket.on('ambulance_status_update', (data: {
      emergencyId: number;
      ambulanceId: number;
      status: string;
      driverName?: string;
      updatedAt?: string;
    }) => {
      console.log(`[Socket.IO] Status update for emergency #${data.emergencyId}: ${data.status}`);
      io.to(`emergency_${data.emergencyId}`).emit('ambulance_status_update', data);
      io.to('role_admin').emit('ambulance_status_update', data);
      io.to('role_driver').emit('ambulance_status_update', data);
    });

    // Route calculation update (dynamic rerouting, traffic avoidance)
    socket.on('route_updated', (data: {
      emergencyId: number;
      routeId: string;
      distanceKm: number;
      etaMinutes: number;
      traffic: string;
      coordinates: [number, number][];
      waypoints: string[];
    }) => {
      io.to(`emergency_${data.emergencyId}`).emit('route_updated', data);
      io.to('role_admin').emit('route_updated', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('✅ Arogyavahini Socket.IO real-time engine initialized.');
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

// Global broadcasting helpers for backend controllers
export function broadcastAmbulanceLocation(data: AmbulanceLocationPayload) {
  if (!ioInstance) return;
  const enrichedPayload = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  };

  // Broadcast to specific emergency room if on active mission
  if (data.emergencyId) {
    ioInstance.to(`emergency_${data.emergencyId}`).emit('ambulance_location_update', enrichedPayload);
  }

  // Broadcast to all admins and drivers and global fleet listeners
  ioInstance.to('role_admin').emit('ambulance_location_update', enrichedPayload);
  ioInstance.to('role_driver').emit('ambulance_location_update', enrichedPayload);
  ioInstance.emit('fleet_ambulance_location', enrichedPayload);
}

export function broadcastEmergencyCreated(emergency: any) {
  if (!ioInstance) return;
  ioInstance.emit('emergency_created', emergency);
  ioInstance.to('role_driver').emit('emergency_created', emergency);
  ioInstance.to('role_admin').emit('emergency_created', emergency);
}

export function broadcastEmergencyAssigned(emergency: any, ambulance: any) {
  if (!ioInstance) return;
  const payload = { emergency, ambulance, timestamp: new Date().toISOString() };
  ioInstance.to(`emergency_${emergency.id}`).emit('emergency_assigned', payload);
  ioInstance.to('role_driver').emit('emergency_assigned', payload);
  ioInstance.to('role_admin').emit('emergency_assigned', payload);
}

export function broadcastAmbulanceStatus(
  arg1: any,
  ambulanceId?: number,
  status?: string,
  updatedBy?: string
) {
  if (!ioInstance) return;
  const payload =
    typeof arg1 === 'object' && arg1 !== null
      ? arg1
      : {
          emergencyId: Number(arg1),
          ambulanceId: ambulanceId || 0,
          status: status || '',
          updatedBy,
          timestamp: new Date().toISOString(),
        };
  if (payload.emergencyId) {
    ioInstance.to(`emergency_${payload.emergencyId}`).emit('ambulance_status_update', payload);
  }
  ioInstance.emit('ambulance_status_update', payload);
  ioInstance.to('role_admin').emit('ambulance_status_update', payload);
  ioInstance.to('role_driver').emit('ambulance_status_update', payload);
}

export function broadcastRouteUpdated(
  emergencyId: number,
  routeIdOrData: any,
  distanceKm?: number,
  estimatedMinutes?: number,
  traffic?: string,
  coordinates?: [number, number][],
  waypoints?: string[]
) {
  if (!ioInstance) return;
  const payload =
    typeof routeIdOrData === 'object' && routeIdOrData !== null
      ? { ...routeIdOrData, emergencyId, timestamp: new Date().toISOString() }
      : {
          emergencyId,
          routeId: routeIdOrData,
          distanceKm,
          estimatedMinutes,
          traffic,
          coordinates,
          waypoints,
          timestamp: new Date().toISOString(),
        };
  ioInstance.to(`emergency_${emergencyId}`).emit('route_updated', payload);
  ioInstance.to('role_admin').emit('route_updated', payload);
}

export function broadcastTrafficPriorityActivated(data: any) {
  if (!ioInstance) return;
  ioInstance.emit('traffic_priority_activated', data);
}

export function broadcastTrafficPriorityCompleted(data: any) {
  if (!ioInstance) return;
  ioInstance.emit('traffic_priority_completed', data);
}

export function broadcastPatientVitalsUpdated(emergencyId: number, data: any) {
  if (!ioInstance) return;
  const payload = {
    emergencyId,
    ...data,
    timestamp: new Date().toISOString(),
  };
  ioInstance.to(`emergency_${emergencyId}`).emit('patient_vitals_updated', payload);
  ioInstance.to('role_admin').emit('patient_vitals_updated', payload);
  ioInstance.emit('patient_vitals_updated', payload);
}

