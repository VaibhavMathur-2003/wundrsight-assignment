
class APIClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Something went wrong')
    }

    return data
  }

  private getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async getSlots(from: string, to: string) {
    return this.request(`/slots?from=${from}&to=${to}`)
  }

  async bookSlot(slotId: string, token: string) {
    return this.request('/book', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ slotId }),
    })
  }

  async getMyBookings(token: string) {
    return this.request('/my-bookings', {
      headers: this.getAuthHeaders(token),
    })
  }

  async getAllBookings(token: string) {
    return this.request('/all-bookings', {
      headers: this.getAuthHeaders(token),
    })
  }
}

export const api = new APIClient()