export type LibreLinkStatusType = 'active' | 'error' | null;

export type LibreLinkTrend =
  | 'rising'
  | 'falling'
  | 'stable'
  | 'rapidly_rising'
  | 'rapidly_falling'
  | string
  | null;

export interface LibreLinkStatus {
  connected: boolean;
  email: string | null;
  patientId: string | null;
  status: LibreLinkStatusType;
  lastError: string | null;
  lastPollAt: string | null;
  sensorActive: boolean;
  sensorExpiresAt: string | null;
  lastReadingValue: number | null;
  lastReadingTrend: LibreLinkTrend;
  lastReadingAt: string | null;
}

export interface LibreLinkConnectResponse {
  connected: boolean;
  email: string;
  patientId: string;
  readingsImported: number;
}

export interface LibreLinkDisconnectResponse {
  disconnected: boolean;
}