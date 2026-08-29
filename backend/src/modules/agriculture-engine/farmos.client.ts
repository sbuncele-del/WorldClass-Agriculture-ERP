export interface FarmOsStatus {
  configured: boolean;
  reachable: boolean;
  baseUrl?: string;
  message: string;
}

export class FarmOsClient {
  private readonly baseUrl?: string;
  private readonly accessToken?: string;

  constructor() {
    this.baseUrl = process.env.FARMOS_BASE_URL?.replace(/\/$/, '');
    this.accessToken = process.env.FARMOS_ACCESS_TOKEN;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.accessToken);
  }

  async status(): Promise<FarmOsStatus> {
    if (!this.baseUrl) {
      return { configured: false, reachable: false, message: 'FARMOS_BASE_URL is not configured' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7_500);
    try {
      const response = await fetch(`${this.baseUrl}/api`, {
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
        signal: controller.signal,
      });
      return {
        configured: this.isConfigured(),
        reachable: response.ok,
        baseUrl: this.baseUrl,
        message: response.ok ? 'farmOS API is reachable' : `farmOS responded with ${response.status}`,
      };
    } catch (error: any) {
      return {
        configured: this.isConfigured(),
        reachable: false,
        baseUrl: this.baseUrl,
        message: error?.name === 'AbortError' ? 'farmOS health check timed out' : 'farmOS API is unreachable',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async listAssets(assetType: string): Promise<unknown> {
    if (!this.isConfigured()) throw new Error('farmOS connection is not configured');
    if (!/^[a-z0-9_]+$/i.test(assetType)) throw new Error('Invalid farmOS asset type');
    const response = await fetch(`${this.baseUrl}/api/asset/${assetType}`, {
      headers: { Authorization: `Bearer ${this.accessToken}`, Accept: 'application/vnd.api+json' },
    });
    if (!response.ok) throw new Error(`farmOS request failed with ${response.status}`);
    return response.json();
  }
}
