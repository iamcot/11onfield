import { apiClient } from '@/lib/api-client';

export interface Province {
  id: number;
  name: string;
}

export const provinceService = {
  async getAllProvinces(): Promise<Province[]> {
    return apiClient.get<Province[]>('/provinces');
  },
};
