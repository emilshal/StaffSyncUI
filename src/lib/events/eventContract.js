export const EVENT_VERSION = 1;

export const ACTION_TYPES = Object.freeze({
  GUIDE_REQUEST: "GUIDE.REQUEST",
  SOP_ISSUE_REPORT: "SOP.ISSUE_REPORT",
  PROBLEM_REPORT: "PROBLEM.REPORT",
  SOP_CREATE: "SOP.CREATE",
  USER_ROLE_SET: "USER.ROLE_SET",
});

const createRequestId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createEventEnvelope = ({
  actionType,
  actor,
  organizationId,
  payload = {},
  meta,
  requestId = createRequestId(),
  timestamp = new Date().toISOString(),
  version = EVENT_VERSION,
} = {}) => ({
  version,
  requestId,
  actionType,
  actor,
  organizationId,
  timestamp,
  payload,
  ...(meta ? { meta } : {}),
});

export const validateEventEnvelope = (event) => {
  const errors = [];

  if (!event || typeof event !== "object") {
    return { ok: false, errors: ["Event must be an object"] };
  }

  if (event.version !== EVENT_VERSION)
    errors.push(`Unsupported version: ${event.version}`);
  if (!event.requestId || typeof event.requestId !== "string")
    errors.push("requestId is required");
  if (!event.actionType || typeof event.actionType !== "string")
    errors.push("actionType is required");
  if (!event.organizationId || typeof event.organizationId !== "string")
    errors.push("organizationId is required");
  if (!event.timestamp || typeof event.timestamp !== "string")
    errors.push("timestamp is required");

  if (!event.actor || typeof event.actor !== "object") {
    errors.push("actor is required");
  } else {
    if (!event.actor.userId || typeof event.actor.userId !== "string")
      errors.push("actor.userId is required");
    if (event.actor.role != null && typeof event.actor.role !== "string")
      errors.push("actor.role must be a string");
  }

  if (
    event.payload == null ||
    typeof event.payload !== "object" ||
    Array.isArray(event.payload)
  ) {
    errors.push("payload must be an object");
  }

  return { ok: errors.length === 0, errors };
};
