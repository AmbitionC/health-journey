import { get, post } from './client';

// ---------- 类型（与后端 service 返回对齐） ----------

export interface BodyRecord {
  date: string;
  weightKg: number;
  bmi: number | null;
  bodyFatPct: number | null;
  bodyFatMassKg: number | null;
  muscleMassKg: number | null;
  skeletalMuscleMassKg: number | null;
  visceralFatLevel: number | null;
  subcutaneousFatPct: number | null;
  proteinPct: number | null;
  waterPct: number | null;
  notes: string | null;
}

export interface MealItem {
  name: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealRecord {
  id: number;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealTime: string | null;
  source: 'manual' | 'photo';
  items: MealItem[];
  totalKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes: string | null;
}

export interface DaySummary {
  date: string;
  totalKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  budgetKcal: number;
  deltaKcal: number;
  mealsLogged: number;
}

export interface DailyBudget {
  intakeKcal: number;
  proteinG: number;
  proteinRange: [number, number];
  carbsG: number;
  fatG: number;
  basis: {
    bmr: number;
    bmrMifflin: number;
    bmrKatch: number | null;
    tdee: number;
    tdeeSource: 'measured' | 'estimated';
    tdeeMeasuredDays: number;
    deficitKcal: number;
    weightKg: number | null;
    bodyFatPct: number | null;
    activityFactor: number;
  };
}

export interface ActivityRecord {
  date: string;
  steps: number | null;
  activeKcal: number | null;
  restingKcal: number | null;
  exerciseMinutes: number | null;
  standHours: number | null;
  workouts: Array<{ type: string; minutes: number; kcal?: number }>;
  sleepHours: number | null;
  weightKg: number | null;
  source: string;
  updatedAt: string | null;
}

export interface HealthGoal {
  horizon: string;
  target: string;
  metric?: string;
  value?: number;
}

export interface HealthProfile {
  heightCm: number;
  birthYear: number;
  sex: 'male' | 'female';
  activityFactor: number;
  deficitKcal: number;
  proteinPerKg: number;
  goalWeightKg: number | null;
  goals: HealthGoal[];
  preferences: string | null;
  updatedAt: string | null;
}

export interface Overview {
  date: string;
  latestBody: BodyRecord | null;
  bodyTrend: BodyRecord[];
  today: { date: string; meals: MealRecord[]; summary: DaySummary };
  budget: DailyBudget;
  activity: ActivityRecord | null;
  goals: HealthGoal[];
  nextGoal: HealthGoal | null;
  nextGoalRemainingKg: number | null;
}

export interface RecognizeResult {
  available: boolean;
  items: MealItem[];
  totalKcal: number;
  confidence?: string;
  notes?: string;
}

// ---------- 接口 ----------

export const api = {
  ping: () => get<{ pong: boolean; today: string }>('/health/ping'),
  overview: (date?: string) =>
    get<Overview>(`/health/overview${date ? `?date=${date}` : ''}`),

  bodyList: (limit = 100) => get<BodyRecord[]>(`/health/body/list?limit=${limit}`),
  bodyTrend: (days = 365) => get<BodyRecord[]>(`/health/body/trend?days=${days}`),
  bodyUpsert: (rec: Partial<BodyRecord> & { date: string; weightKg: number }) =>
    post<BodyRecord>('/health/body', rec),
  bodyDelete: (date: string) => post('/health/body/delete', { date }),

  mealDay: (date: string) =>
    get<{ date: string; meals: MealRecord[]; summary: DaySummary }>(
      `/health/meal/day?date=${date}`
    ),
  mealRange: (start: string, end: string) =>
    get<DaySummary[]>(`/health/meal/range?start=${start}&end=${end}`),
  mealAdd: (rec: Partial<MealRecord> & { date: string; mealType: string }) =>
    post<MealRecord>('/health/meal', rec),
  mealUpdate: (id: number, patch: Partial<MealRecord>) =>
    post<MealRecord>('/health/meal/update', { id, ...patch }),
  mealDelete: (id: number) => post('/health/meal/delete', { id }),
  mealRecognize: (imageBase64: string, hint?: string) =>
    post<RecognizeResult>('/health/meal/recognize', { imageBase64, hint }),

  activityList: (days = 30) =>
    get<ActivityRecord[]>(`/health/activity/list?days=${days}`),

  budget: () => get<DailyBudget>('/health/budget'),
  profile: () => get<HealthProfile>('/health/profile'),
  profileUpdate: (patch: Partial<HealthProfile>) =>
    post<HealthProfile>('/health/profile/update', patch),
  adviceToday: (date?: string) =>
    get<{ source: 'ai' | 'rule'; advice: string }>(
      `/health/advice/today${date ? `?date=${date}` : ''}`
    ),
};
