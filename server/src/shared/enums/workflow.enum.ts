export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum NodeType {
  WEBHOOK = 'WEBHOOK',
  CONDITION = 'CONDITION',
  DELAY = 'DELAY',
  EMAIL = 'EMAIL',
  HTTP_REQUEST = 'HTTP_REQUEST',
  SLACK = 'SLACK',
  TRANSFORM = 'TRANSFORM',
  FILTER = 'FILTER',
}

export enum TriggerType {
  WEBHOOK = 'WEBHOOK',
  SCHEDULE = 'SCHEDULE',
  MANUAL = 'MANUAL',
  EVENT = 'EVENT',
}
