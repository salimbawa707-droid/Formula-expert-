import { create } from 'zustand';
import { db, LabNoteRecord } from '../db/database';

interface LabNotebookStore {
  notes: LabNoteRecord[];
  isLoading: boolean;

  loadNotes: () => Promise<void>;
  addNote: (title: string, text: string, tags?: string[], formulaId?: string, batchNumber?: string) => Promise<LabNoteRecord>;
  updateNote: (id: string, updated: Partial<LabNoteRecord>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useLabNotebookStore = create<LabNotebookStore>((set, get) => ({
  notes: [],
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await db.labNotes.orderBy('createdAt').reverse().toArray();
      set({ notes, isLoading: false });
    } catch (err) {
      console.error('Failed to load lab notes from DB:', err);
      set({ isLoading: false });
    }
  },

  addNote: async (title, text, tags = [], formulaId, batchNumber) => {
    const now = new Date().toISOString();
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const record: LabNoteRecord = {
      id,
      title: title.trim(),
      text: text.trim(),
      date: now.split('T')[0],
      tags,
      formulaId,
      batchNumber,
      createdAt: now,
      updatedAt: now
    };

    await db.labNotes.put(record);
    await get().loadNotes();
    return record;
  },

  updateNote: async (id, updated) => {
    await db.labNotes.update(id, {
      ...updated,
      updatedAt: new Date().toISOString()
    });
    await get().loadNotes();
  },

  deleteNote: async (id) => {
    await db.labNotes.delete(id);
    await get().loadNotes();
  }
}));
