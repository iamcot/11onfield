import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';

// The player's own media on the profile page (PlayerMediaController): full-body photo, highlights and achievements
// added one by one. Items are never edited: hide or delete, then add a new one that waits for review again.

// Every method is async, so a missing token (just logged out) rejects the promise the caller already catches
// instead of throwing while the page renders.
const auth = () => {
  const token = storage.getToken();
  if (!token) throw new Error('Vui lòng đăng nhập');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface MediaConfig {
  videoUpload: boolean;
  maxVideoBytes: number;
}

export interface VideoUploadInfo {
  endpoint: string;
  videoId: string;
  libraryId: string;
  authorizationSignature: string;
  authorizationExpire: number;
}

export type AchievementType = 'INDIVIDUAL' | 'TEAM' | 'PARTICIPANT';

export const mediaService = {
  config: async () => apiClient.get<MediaConfig>('/users/me/media-config', auth()),

  uploadFullBody(file: File) {
    const form = new FormData();
    form.append('file', file);
    form.append('removeBackground', 'true');
    return apiClient.postMultipart<{ fullBodyPhoto: string }>('/users/me/full-body', form, auth());
  },

  addLinkHighlight: async (url: string, title?: string) => apiClient.post<{ id: number }>('/users/me/highlights', { url, title }, auth()),

  startVideoUpload: async (title: string, size: number) =>
    apiClient.post<VideoUploadInfo>('/users/me/highlights/video-upload', { title, size }, auth()),

  addVideoHighlight: async (videoId: string, title?: string) => apiClient.post<{ id: number }>('/users/me/highlights/video', { videoId, title }, auth()),

  hideHighlight: async (id: number, hidden: boolean) => apiClient.put<void>(`/users/me/highlights/${id}/hidden`, { hidden }, auth()),
  deleteHighlight: async (id: number) => apiClient.delete<void>(`/users/me/highlights/${id}`, auth()),

  addAchievement: async (type: AchievementType, title: string, description?: string, date?: string) =>
    apiClient.post<{ id: number }>('/users/me/achievements', { type, title, description, date: date || null }, auth()),
  hideAchievement: async (id: number, hidden: boolean) => apiClient.put<void>(`/users/me/achievements/${id}/hidden`, { hidden }, auth()),
  deleteAchievement: async (id: number) => apiClient.delete<void>(`/users/me/achievements/${id}`, auth()),

  /**
   * Sends a video straight from the browser to Bunny Stream with TUS (the server only signs the upload, same scheme as
   * anylearn), then saves it as a highlight waiting for review.
   */
  async uploadVideoHighlight(file: File, title: string, onProgress: (percent: number) => void): Promise<void> {
    const info = await mediaService.startVideoUpload(title || file.name, file.size);
    const tus = await import('tus-js-client');
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: info.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: info.authorizationSignature,
          AuthorizationExpire: String(info.authorizationExpire),
          VideoId: info.videoId,
          LibraryId: String(info.libraryId),
        },
        metadata: { filetype: file.type, title: title || file.name },
        onError: (err) => reject(err),
        onProgress: (sent, total) => onProgress(Math.min(99, Math.round((sent / total) * 100))),
        onSuccess: () => resolve(),
      });
      upload.start();
    });
    await mediaService.addVideoHighlight(info.videoId, title);
    onProgress(100);
  },
};
