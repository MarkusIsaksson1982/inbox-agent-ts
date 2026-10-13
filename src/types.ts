/** Shared contract for inbox-agent-ts (fixed; model-written modules must satisfy it under `strict`). */
export type EventKind = 'email_received' | 'email_sent' | 'crm_stage_changed' | 'meeting_booked';
export interface InboxEvent {
  id: string; kind: EventKind; at: string;          // ISO timestamp of the event
  person: string;                                   // counterpart email address
  name?: string; company?: string; subject?: string; stage?: string; meetingAt?: string;
}
export type NodeType = 'person' | 'company' | 'stage';
export interface GraphNode { id: string; type: NodeType; label: string; }
export interface GraphEdge { from: string; to: string; rel: string; at: string; }
export type Priority = 'high' | 'medium' | 'low';
export const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
export type FollowUpAction = 'reply' | 'nudge' | 'prep_meeting';
export interface FollowUp { personId: string; action: FollowUpAction; dueAt: string; priority: Priority; reason: string; sources: string[]; }
export interface AgentOptions { now: string; nudgeAfterDays?: number; }
