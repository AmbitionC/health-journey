/**
 * API 客户端：连接 fe-journey-faas 的 /health/* 接口。
 *
 * 配置优先级：localStorage（设置页可改，方便换环境）→ 构建期环境变量 UMI_APP_API_BASE。
 * 鉴权：所有请求带 X-Health-Token（与 iOS 快捷指令共用同一 token）。
 */

const LS_BASE = 'health.apiBase';
const LS_TOKEN = 'health.apiToken';

export function getApiBase(): string {
  return (
    localStorage.getItem(LS_BASE) ||
    (process.env.UMI_APP_API_BASE as string) ||
    ''
  );
}

export function getToken(): string {
  return localStorage.getItem(LS_TOKEN) || '';
}

export function saveConfig(base: string, token: string) {
  localStorage.setItem(LS_BASE, base.trim().replace(/\/+$/, ''));
  localStorage.setItem(LS_TOKEN, token.trim());
}

export function isConfigured(): boolean {
  return Boolean(getApiBase() && getToken());
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: any } = {}
): Promise<T> {
  const base = getApiBase();
  if (!base) throw new ApiError('未配置 API 地址，请到「设置」页填写', 0);
  const res = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Health-Token': getToken(),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* 非 JSON 响应 */
  }
  if (!res.ok || !data || data.success !== true) {
    const msg =
      data?.message || data?.msg || `请求失败（HTTP ${res.status}）`;
    throw new ApiError(msg, res.status);
  }
  return data.data as T;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: any) =>
  request<T>(path, { method: 'POST', body });
