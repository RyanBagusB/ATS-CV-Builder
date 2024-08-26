import { storageService } from '../core/storageService.js';

const CV_KEY = 'userCV';

export const cvService = {
  saveCV(cvData) {
    storageService.save(CV_KEY, cvData);
  },

  getCV() {
    return storageService.load(CV_KEY);
  },
};
