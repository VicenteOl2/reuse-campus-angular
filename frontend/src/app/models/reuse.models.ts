export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: 'Usuario' | 'Administrador';
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
}

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: 'DONACIÓN' | 'INTERCAMBIO';
  estado: 'DISPONIBLE' | 'RESERVADA' | 'ENTREGADA' | 'CANCELADA';
  fechaPublicacion: string;
  usuarioId: number;
  nombrePropietario?: string;
  correoPropietario?: string;
}

export interface Solicitud {
  id: number;
  publicacionId: number;
  tituloPublicacion?: string;
  modalidad?: string;
  estadoPublicacion?: string;
  propietarioId?: number;
  nombrePropietario?: string;
  solicitanteId: number;
  nombreSolicitante?: string;
  correoSolicitante?: string;
  mensaje: string;
  fechaSolicitud: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
}

export interface Entrega {
  id: number;
  publicacionId: number;
  tituloPublicacion?: string;
  modalidad?: string;
  estadoPublicacion?: string;
  solicitudId: number;
  propietarioId: number;
  nombrePropietario?: string;
  receptorId: number;
  nombreReceptor?: string;
  fechaAcuerdo: string;
  fechaEntrega: string | null;
  estado: 'PENDIENTE' | 'COMPLETADA';
}