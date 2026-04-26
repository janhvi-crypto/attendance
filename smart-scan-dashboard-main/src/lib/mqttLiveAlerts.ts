import mqtt, { type MqttClient } from "mqtt";

export type LiveAlert = {
  id: string;
  reason: string | null;
  timestamp: string | null;
  card_id?: string | null;
};

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function normalizeString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  return v.length ? v : null;
}

function normalizeTimestamp(raw: unknown): string | null {
  const v = normalizeString(raw);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalizeCardId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return null;
}

export function connectLiveAlerts(params: {
  url: string;
  username: string;
  password: string;
  topic: string;
  onAlert: (alert: LiveAlert) => void;
  onStatus?: (status: { connected: boolean; error?: string }) => void;
}): { client: MqttClient; disconnect: () => void } {
  const { url, username, password, topic, onAlert, onStatus } = params;

  const clientId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `smartscan-dashboard-${crypto.randomUUID()}`
      : `smartscan-dashboard-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const client = mqtt.connect(url, {
    username,
    password,
    clientId,
    protocolVersion: 5,
    reconnectPeriod: 2000,
    connectTimeout: 10_000,
    clean: true,
  });

  const handleStatus = (connected: boolean, error?: unknown) => {
    const msg = error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
    onStatus?.({ connected, error: msg });
  };

  client.on("connect", () => {
    handleStatus(true);
    client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) handleStatus(false, err);
    });
  });

  client.on("reconnect", () => handleStatus(false));
  client.on("close", () => handleStatus(false));
  client.on("offline", () => handleStatus(false));
  client.on("error", (err) => handleStatus(false, err));

  client.on("message", (receivedTopic, payload) => {
    if (receivedTopic !== topic) return;

    const raw = payload.toString("utf-8");
    const parsed = safeJsonParse(raw);

    let reason: string | null = null;
    let timestamp: string | null = null;
    let card_id: string | null = null;

    if (typeof parsed === "string") {
      reason = normalizeString(parsed);
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      reason = normalizeString(obj.reason) ?? normalizeString(obj.type) ?? normalizeString(obj.event);
      timestamp = normalizeTimestamp(obj.timestamp) ?? normalizeTimestamp(obj.time) ?? normalizeTimestamp(obj.ts);
      card_id = normalizeCardId(obj.card_id) ?? normalizeCardId(obj.cardId) ?? normalizeCardId(obj.card);
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    onAlert({
      id,
      reason,
      timestamp: timestamp ?? new Date().toISOString(),
      card_id: card_id ?? null,
    });
  });

  const disconnect = () => {
    try {
      client.end(true);
    } catch {
      // ignore
    }
  };

  return { client, disconnect };
}

