import { create } from 'zustand';
import { db, LabNoteRecord } from '../db/database';
import { auth as firebaseAuth } from '../services/firebaseAuthClient';

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

    if (firebaseAuth.currentUser) {
      try {
        const { saveUserTrial } = await import('../services/firebaseClient');
        await saveUserTrial(firebaseAuth.currentUser.uid, {
          id,
          title: record.title,
          observations: record.text,
          formulaId: record.formulaId,
          updatedAt: now,
          createdAt: now,
        });
      } catch (e) {
        console.warn('Failed to sync lab note to Firestore:', e);
      }
    }

    await get().loadNotes();
    return record;
  },

  updateNote: async (id, updated) => {
    await db.labNotes.update(id, {
      ...updated,
      updatedAt: new Date().toISOString()
    });

    if (firebaseAuth.currentUser) {
      try {
        const { saveUserTrial } = await import('../services/firebaseClient');
        const note = await db.labNotes.get(id);
        if (note) {
          await saveUserTrial(firebaseAuth.currentUser.uid, {
            id,
            title: note.title,
            observations: note.text,
            formulaId: note.formulaId,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Failed to sync updated lab note to Firestore:', e);
      }
    }

    await get().loadNotes();
  },

  deleteNote: async (id) => {
    await db.labNotes.delete(id);
    await get().loadNotes();
  }
}));
