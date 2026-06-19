/* ─── SevaSetu API Client ────────────────────────────────────────
   All typed functions for the backend at http://localhost:8000
──────────────────────────────────────────────────────────────── */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const FETCH_TIMEOUT_MS = 8_000; // fail fast if backend is slow

/* Token cache — valid for 55 min (Firebase tokens last 60 min) */
let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const now = Date.now();
    if (_cachedToken && now < _tokenExpiry) {
      return { Authorization: `Bearer ${_cachedToken}` };
    }
    const { getIdToken } = await import('./firebase');
    const token = await getIdToken();
    if (token) {
      _cachedToken = token;
      _tokenExpiry = now + 55 * 60 * 1000; // 55 minutes
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // Firebase not configured — skip auth (dev mode)
  }
  return {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...authHeader, ...init?.headers },
      ...init,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `API error ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out — backend may be slow or unreachable');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ─── Types ──────────────────────────────────────────────────── */
export interface NeedResponse {
  id: string;
  title: string;
  description: string;
  need_type: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  urgency_base: number;
  urgency_current: number;
  affected_count: number | null;
  required_skills: string[];
  status: string;
  source_channel: string | null;
  reported_by: Record<string, string> | null;
  language: string | null;
  media_urls: string[];
  cluster_id: number | null;
  created_at: string;
  matched_at: string | null;
  resolved_at: string | null;
}

export interface NeedListResponse {
  needs: NeedResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface NeedCreate {
  title: string;
  description: string;
  need_type?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  urgency_base?: number;
  affected_count?: number;
  required_skills?: string[];
  source_channel?: string;
  reported_by?: Record<string, string>;
  language?: string;
  media_urls?: string[];
}

export interface VolunteerResponse {
  id: string;
  firebase_uid: string | null;
  name: string;
  phone: string | null;
  skills: string[];
  languages: string[];
  latitude: number | null;
  longitude: number | null;
  availability: Record<string, number[]> | null;
  has_vehicle: boolean;
  vehicle_type: string | null;
  experience_text: string | null;
  reliability: number;
  total_tasks: number;
  completed_tasks: number;
  status: string;
  created_at: string;
}

export interface VolunteerRegister {
  name: string;
  phone?: string;
  firebase_uid?: string;
  skills: string[];
  languages: string[];
  latitude?: number;
  longitude?: number;
  availability?: Record<string, number[]>;
  has_vehicle: boolean;
  vehicle_type?: string;
  experience_text?: string;
}

export interface ImpactResponse {
  volunteer_id: string;
  name: string;
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  reliability: number;
  avg_rating: number | null;
  skills: string[];
  languages: string[];
}

export interface ScoreBreakdown {
  skill_embedding: number;
  skill_tags: number;
  geo_proximity: number;
  urgency: number;
  availability: number;
  reliability: number;
  total: number;
  weights_used: Record<string, number>;
}

export interface LLMAnalysis {
  validation: 'Valid' | 'Weak' | 'Poor';
  confidence: number;
  signal_explanations: Record<string, string>;
  overall_rationale: string;
}

export interface MatchResult {
  volunteer: VolunteerResponse;
  score: ScoreBreakdown;          // backend field name is 'score' (not 'score_breakdown')
  score_breakdown?: ScoreBreakdown; // alias kept for backwards compat
  total_score?: number;             // alias — use score.total instead
  llm_analysis: LLMAnalysis | null;
  dispatch_brief: string | null;
  llm_validated?: boolean;          // true if LLM has validated this match
}

export interface LLMExplanationResponse {
  llm_analysis: LLMAnalysis;
  dispatch_brief: string | null;
  score: ScoreBreakdown;
  llm_validated: boolean;
}

export interface MatchResponse {
  need_id: string;
  matches: MatchResult[];
  total_candidates: number;
}

export interface AssignmentResponse {
  id: string;
  need_id: string;
  volunteer_id: string;
  match_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  dispatch_brief: string | null;
  status: string;
  proposed_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  rating: number | null;
  feedback: string | null;
}

export interface AssignmentCreate {
  need_id: string;
  volunteer_id: string;
  match_score?: number;
  score_breakdown?: Record<string, any>;
  dispatch_brief?: string;
}

export interface DashboardStats {
  total_needs: number;
  active_needs: number;
  critical_needs: number;
  matched_needs: number;
  unmatched_needs: number;
  active_volunteers: number;
  completed_assignments: number;
  needs_by_type: Record<string, number>;
  needs_by_status: Record<string, number>;
}

export interface HeatmapPoint {
  need_id: string;
  title: string;
  description?: string;
  need_type: string;
  latitude: number;
  longitude: number;
  urgency: number;
  affected_count: number | null;
  status: string;
}

export interface DesertZone {
  latitude: number;
  longitude: number;
  area_name: string;
  population_estimate?: number;
  report_count: number;
  radius_km: number;
}

export interface ActivityItem {
  type: string;
  title: string;
  need_type?: string | null;
  urgency?: number;
  location?: string | null;
  status: string;
  score?: number | null;
  timestamp: string;
}

export interface VolunteerLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  skills: string[];
  status: string;
  has_vehicle: boolean;
}

/* ─── Needs ──────────────────────────────────────────────────── */
export async function fetchNeeds(params?: {
  type?: string; need_type?: string; status?: string; urgency?: string;
  min_urgency?: number; max_urgency?: number;
  search?: string; page?: number; page_size?: number;
}): Promise<NeedListResponse> {
  const q = new URLSearchParams();
  const needType = params?.need_type ?? params?.type;
  if (needType)            q.set('need_type', needType);
  if (params?.status)      q.set('status', params.status);
  if (params?.urgency)     q.set('urgency', params.urgency);
  if (params?.min_urgency != null) q.set('min_urgency', String(params.min_urgency));
  if (params?.max_urgency != null) q.set('max_urgency', String(params.max_urgency));
  if (params?.search)      q.set('search', params.search);
  if (params?.page)        q.set('page', String(params.page));
  if (params?.page_size)   q.set('page_size', String(params.page_size));
  const qs = q.toString();
  return apiFetch(`/api/needs${qs ? `?${qs}` : ''}`);
}

export async function fetchNeed(id: string): Promise<NeedResponse> {
  return apiFetch(`/api/needs/${id}`);
}

export async function createNeed(data: NeedCreate): Promise<NeedResponse> {
  return apiFetch('/api/needs', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateNeedStatus(id: string, status: string): Promise<NeedResponse> {
  return apiFetch(`/api/needs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchNeedStats(): Promise<{ total: number; active: number; critical: number; by_type: Record<string, number>; by_status: Record<string, number> }> {
  return apiFetch('/api/needs/stats/summary');
}

export async function fetchNeedMatches(id: string, max_results = 5): Promise<MatchResponse> {
  return apiFetch(`/api/needs/${id}/matches?max_results=${max_results}`);
}
// Alias used by needs/[id] page
export const fetchMatches = fetchNeedMatches;

// ── On-demand LLM explanation (Phase 2) with client-side cache ──
const _explainCache = new Map<string, LLMExplanationResponse>();

export async function fetchMatchExplanation(
  needId: string, volunteerId: string
): Promise<LLMExplanationResponse> {
  const cacheKey = `${needId}:${volunteerId}`;
  const cached = _explainCache.get(cacheKey);
  if (cached) return cached;

  const result = await apiFetch<LLMExplanationResponse>(
    `/api/needs/${needId}/matches/${volunteerId}/explain`
  );
  _explainCache.set(cacheKey, result);
  return result;
}

/* ─── Volunteers ─────────────────────────────────────────────── */
export async function fetchVolunteers(params?: {
  status?: string; skill?: string; page?: number; page_size?: number;
}): Promise<VolunteerResponse[]> {
  const q = new URLSearchParams();
  if (params?.status)    q.set('status', params.status);
  if (params?.skill)     q.set('skill', params.skill);
  if (params?.page)      q.set('page', String(params.page));
  if (params?.page_size) q.set('page_size', String(params.page_size));
  const qs = q.toString();
  return apiFetch(`/api/volunteers${qs ? `?${qs}` : ''}`);
}

export async function fetchVolunteer(id: string): Promise<VolunteerResponse> {
  return apiFetch(`/api/volunteers/${id}`);
}

export async function registerVolunteer(data: VolunteerRegister): Promise<VolunteerResponse> {
  return apiFetch('/api/volunteers/register', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchVolunteerImpact(id: string): Promise<ImpactResponse> {
  return apiFetch(`/api/volunteers/${id}/impact`);
}

/* ─── Assignments ─────────────────────────────────────────────── */
export async function createAssignment(data: AssignmentCreate): Promise<AssignmentResponse> {
  return apiFetch('/api/assignments', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchAssignments(params?: {
  status?: string; need_id?: string; volunteer_id?: string; page?: number;
}): Promise<AssignmentResponse[]> {
  const q = new URLSearchParams();
  if (params?.status)       q.set('status', params.status);
  if (params?.need_id)      q.set('need_id', params.need_id);
  if (params?.volunteer_id) q.set('volunteer_id', params.volunteer_id);
  if (params?.page)         q.set('page', String(params.page));
  const qs = q.toString();
  return apiFetch(`/api/assignments${qs ? `?${qs}` : ''}`);
}

export async function updateAssignmentStatus(
  id: string,
  status: string,
  rating?: number,
  feedback?: string,
): Promise<AssignmentResponse> {
  return apiFetch(`/api/assignments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rating, feedback }),
  });
}

/* ─── Dashboard ──────────────────────────────────────────────── */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/api/dashboard/stats');
}

export async function fetchHeatmap(params?: {
  need_type?: string; min_urgency?: number;
}): Promise<HeatmapPoint[]> {
  const q = new URLSearchParams();
  if (params?.need_type)   q.set('need_type', params.need_type);
  if (params?.min_urgency) q.set('min_urgency', String(params.min_urgency));
  const qs = q.toString();
  return apiFetch(`/api/dashboard/heatmap${qs ? `?${qs}` : ''}`);
}

export async function fetchActivity(limit = 20): Promise<ActivityItem[]> {
  return apiFetch(`/api/dashboard/activity?limit=${limit}`);
}

export async function fetchVolunteerLocations(): Promise<VolunteerLocation[]> {
  return apiFetch('/api/dashboard/volunteer-locations');
}

export async function fetchDeserts(minPopulation = 50000): Promise<DesertZone[]> {
  return apiFetch(`/api/dashboard/deserts?min_population=${minPopulation}`);
}

/* ─── System ─────────────────────────────────────────────────── */
export async function fetchHealth(): Promise<{ status: string; version: string; checks: Record<string, string> }> {
  return apiFetch('/health');
}

export async function fetchRegionalBriefing(): Promise<{ briefing: string; area: string; stats: Record<string, unknown> }> {
  return apiFetch('/api/system/regional-briefing', { method: 'POST', body: JSON.stringify({}) });
}

/* ─── Ingestion ──────────────────────────────────────────────── */
export interface IngestWhatsAppPayload {
  phone: string;
  message_type: 'text' | 'audio' | 'image';
  text?: string;
  audio_url?: string;
  image_url?: string;
  location?: { lat: number; lng: number };
}

export interface BulkIngestResult {
  total_rows: number;
  processed: number;
  duplicates: number;
  errors: number;
  need_ids: string[];
}

export async function ingestWhatsApp(data: IngestWhatsAppPayload): Promise<NeedResponse> {
  return apiFetch('/api/ingest/whatsapp', { method: 'POST', body: JSON.stringify(data) });
}

export async function ingestRawText(text: string, language = 'auto', source = 'dashboard'): Promise<NeedResponse> {
  return apiFetch('/api/ingest/raw-text', {
    method: 'POST',
    body: JSON.stringify({ text, language, source }),
  });
}

export async function ingestCSV(file: File): Promise<BulkIngestResult> {
  const { getIdToken } = await import('./firebase');
  const token = await getIdToken().catch(() => null);
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/api/ingest/csv`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

/* ─── System / Admin ─────────────────────────────────────────── */
export interface DisasterCheckResponse {
  disaster_active: boolean;
  active_zones: string[];
  critical_needs_count: number;
  trigger_threshold: number;
}

export interface ServiceStatusResponse {
  gemini_ai: { available: boolean; mode: string; health: Record<string, unknown> };
  embeddings: { available: boolean; mode: string };
  geocoding: { available: boolean; mode: string };
  notifications: { available: boolean; mode: string };
  disaster_mode: { available: boolean; active: boolean; active_zones: string[] };
  translation: { available: boolean; mode: string };
  sheets_sync: { available: boolean; mode: string };
  llm_cache: Record<string, unknown>;
}

export interface LLMCacheStatsResponse {
  cache_stats: Record<string, unknown>;
  ttl_config: Record<string, string | number>;
}

export interface OfflineQueueResponse {
  queue_depth: number;
  stats: Record<string, unknown>;
  pending_reports: unknown[];
}

export async function fetchDisasterCheck(): Promise<DisasterCheckResponse> {
  return apiFetch('/api/system/disaster-check');
}

export async function fetchServiceStatus(): Promise<ServiceStatusResponse> {
  return apiFetch('/api/system/service-status');
}

export async function fetchLLMCacheStats(): Promise<LLMCacheStatsResponse> {
  return apiFetch('/api/system/llm-cache-stats');
}

export async function invalidateLLMCache(taskType: string): Promise<{ task_type: string; entries_removed: number }> {
  return apiFetch(`/api/system/llm-cache/${taskType}`, { method: 'DELETE' });
}

export async function triggerUrgencyDecay(): Promise<Record<string, unknown>> {
  return apiFetch('/api/system/urgency-decay', { method: 'POST', body: JSON.stringify({}) });
}

export async function triggerClusterNeeds(): Promise<Record<string, unknown>> {
  return apiFetch('/api/system/cluster-needs', { method: 'POST', body: JSON.stringify({}) });
}

export async function fetchWeightCalibration(): Promise<Record<string, unknown>> {
  return apiFetch('/api/system/weight-calibration-state');
}

export async function fetchOfflineQueue(limit = 50): Promise<OfflineQueueResponse> {
  return apiFetch(`/api/ingest/offline/pending?limit=${limit}`);
}

export async function triggerOfflineSync(): Promise<{ synced: number; remaining: number; stats: Record<string, unknown> }> {
  return apiFetch('/api/ingest/offline/sync', { method: 'POST', body: JSON.stringify({}) });
}

/* ─── Chat WebSocket ─────────────────────────────────────────── */
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000';

export function createChatWebSocket(): WebSocket {
  return new WebSocket(`${WS_BASE}/ws/chat`);
}

export async function fetchNeedResponders(id: string): Promise<{
  disaster_coords: { latitude: number; longitude: number } | null;
  volunteers: any[];
  facilities: any[];
}> {
  return apiFetch(`/api/needs/${id}/responders`);
}

