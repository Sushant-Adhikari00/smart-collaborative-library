import { create } from 'zustand';

export const useDocumentStore = create((set) => ({
  documents: [],
  isLoading: false,
  error: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockDocs = [
        { id: 1, title: 'Introduction to Machine Learning', uploadedAt: '2026-06-15T10:00:00Z', size: '2.4 MB', type: 'PDF' },
        { id: 2, title: 'Advanced Data Structures', uploadedAt: '2026-06-14T14:30:00Z', size: '1.8 MB', type: 'PDF' },
        { id: 3, title: 'Operating Systems Chapter 4', uploadedAt: '2026-06-12T09:15:00Z', size: '3.2 MB', type: 'PDF' },
      ];
      
      set({ documents: mockDocs, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch documents', isLoading: false });
    }
  },

  uploadDocument: async (file) => {
    // In a real app, use FormData and track progress
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newDoc = {
        id: Date.now(),
        title: file.name,
        uploadedAt: new Date().toISOString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: 'PDF'
      };
      set((state) => ({ 
        documents: [newDoc, ...state.documents],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Upload failed', isLoading: false });
    }
  }
}));
