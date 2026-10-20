import { db, FormulaRecord, LabNoteRecord, InventoryRecord, ProductionRunRecord } from '../db/database';
import { isSupabaseConfigured } from './authProviderConfig';

export interface SyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  pendingCount: number;
  isCloudConnected: boolean;
}

const SYNC_TIMESTAMP_KEY = 'detergent_cloud_last_sync_timestamp';

const safeGetItem = (key: string): string | null => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export class CloudSyncService {
  private static status: SyncStatus = {
    lastSyncedAt: safeGetItem(SYNC_TIMESTAMP_KEY),
    isSyncing: false,
    error: null,
    pendingCount: 0,
    isCloudConnected: isSupabaseConfigured(),
  };

  public static getStatus(): SyncStatus {
    return { 
      ...this.status,
      isCloudConnected: isSupabaseConfigured()
    };
  }

  /**
   * Real Supabase Bidirectional Sync with Local Dexie IndexedDB
   * 1. If offline: preserves local Dexie state safely
   * 2. If online + Supabase configured:
   *    - Pushes local formulas, lab notes, inventory, and production runs to Supabase
   *    - Pulls cloud records and updates local Dexie with latest versions
   * 3. If Supabase is not configured: gracefully functions in Local Offline Mode
   */
  public static async syncAll(_userEmail?: string, userId?: string): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      this.status.error = 'Offline: Saved locally in browser storage.';
      this.status.isSyncing = false;
      return { success: false, syncedCount: 0, error: 'Offline mode active' };
    }

    if (!isSupabaseConfigured()) {
      // Local mode fallback
      const formulas = await db.formulas.toArray();
      const labNotes = await db.labNotes.toArray();
      const total = formulas.length + labNotes.length;
      const now = new Date().toISOString();
      safeSetItem(SYNC_TIMESTAMP_KEY, now);
      this.status = {
        lastSyncedAt: now,
        isSyncing: false,
        error: null,
        pendingCount: 0,
        isCloudConnected: false,
      };
      return { success: true, syncedCount: total };
    }

    this.status.isSyncing = true;
    this.status.error = null;

    try {
      const { supabase } = await import('./supabaseClient');
      // Get current authenticated user id from Supabase if not provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id;
      }

      if (!currentUserId) {
        this.status.isSyncing = false;
        this.status.error = 'Sign in to enable real-time cloud sync.';
        return { success: false, syncedCount: 0, error: 'User not authenticated with cloud' };
      }

      let totalSynced = 0;

      // ==========================================
      // 1. SYNC FORMULAS
      // ==========================================
      const localFormulas = await db.formulas.toArray();
      
      // Push local user formulas to Supabase
      if (localFormulas.length > 0) {
        const formulaRows = localFormulas.map(f => ({
          id: f.id,
          user_id: currentUserId,
          name: f.name,
          category: f.category,
          product_type: f.productType || null,
          target_ph: f.targetPH || 7.0,
          batch_size_kg: f.batchSizeKg || 100,
          water_hardness_ppm: f.waterHardnessPpm || 150,
          description: f.description || '',
          ingredients: f.ingredients || [],
          instructions: f.instructions || [],
          notes: f.notes || '',
          version: f.version || 1,
          is_favorite: Boolean(f.isFavorite),
          is_system: Boolean(f.isSystem),
          updated_at: f.updatedAt || new Date().toISOString(),
          created_at: f.createdAt || new Date().toISOString(),
        }));

        const { error: pushFormulasError } = await supabase
          .from('formulas')
          .upsert(formulaRows, { onConflict: 'id' });

        if (pushFormulasError) {
          console.warn('Supabase push formulas warning:', pushFormulasError);
        } else {
          totalSynced += formulaRows.length;
        }
      }

      // Pull cloud formulas from Supabase
      const { data: cloudFormulas, error: pullFormulasError } = await supabase
        .from('formulas')
        .select('*')
        .eq('user_id', currentUserId);

      if (!pullFormulasError && cloudFormulas) {
        for (const cf of cloudFormulas) {
          const localRecord: FormulaRecord = {
            id: cf.id,
            name: cf.name,
            category: cf.category,
            productType: cf.product_type || undefined,
            targetPH: Number(cf.target_ph) || 7.0,
            batchSizeKg: Number(cf.batch_size_kg) || 100,
            waterHardnessPpm: Number(cf.water_hardness_ppm) || 150,
            description: cf.description || undefined,
            ingredients: Array.isArray(cf.ingredients) ? cf.ingredients : [],
            instructions: Array.isArray(cf.instructions) ? cf.instructions : [],
            notes: cf.notes || undefined,
            version: Number(cf.version) || 1,
            isFavorite: Boolean(cf.is_favorite),
            isSystem: Boolean(cf.is_system),
            createdAt: cf.created_at || new Date().toISOString(),
            updatedAt: cf.updated_at || new Date().toISOString(),
          };
          await db.formulas.put(localRecord);
        }
      }

      // ==========================================
      // 2. SYNC LAB NOTES
      // ==========================================
      const localLabNotes = await db.labNotes.toArray();
      if (localLabNotes.length > 0) {
        const noteRows = localLabNotes.map(n => ({
          id: n.id,
          user_id: currentUserId,
          title: n.title,
          text: n.text,
          date: n.date,
          tags: n.tags || [],
          formula_id: n.formulaId || null,
          batch_number: n.batchNumber || null,
          created_at: n.createdAt || new Date().toISOString(),
          updated_at: n.updatedAt || new Date().toISOString(),
        }));

        const { error: pushNotesErr } = await supabase
          .from('lab_notes')
          .upsert(noteRows, { onConflict: 'id' });

        if (!pushNotesErr) {
          totalSynced += noteRows.length;
        }
      }

      // Pull cloud lab notes
      const { data: cloudNotes, error: pullNotesErr } = await supabase
        .from('lab_notes')
        .select('*')
        .eq('user_id', currentUserId);

      if (!pullNotesErr && cloudNotes) {
        for (const cn of cloudNotes) {
          const localNote: LabNoteRecord = {
            id: cn.id,
            title: cn.title,
            text: cn.text,
            date: cn.date,
            tags: Array.isArray(cn.tags) ? cn.tags : [],
            formulaId: cn.formula_id || undefined,
            batchNumber: cn.batch_number || undefined,
            createdAt: cn.created_at || new Date().toISOString(),
            updatedAt: cn.updated_at || new Date().toISOString(),
          };
          await db.labNotes.put(localNote);
        }
      }

      // ==========================================
      // 3. SYNC INVENTORY
      // ==========================================
      const localInventory = await db.inventory.toArray();
      if (localInventory.length > 0) {
        const invRows = localInventory.map(i => ({
          id: i.id,
          user_id: currentUserId,
          name: i.name,
          category: i.category,
          stock_kg: i.stockKg,
          min_stock_kg: i.minStockKg,
          cost_per_kg: i.costPerKg,
          supplier: i.supplier || null,
          cas_number: i.casNumber || null,
          active_concentration: i.activeConcentration || null,
          notes: i.notes || null,
          updated_at: i.updatedAt || new Date().toISOString(),
        }));

        const { error: pushInvErr } = await supabase
          .from('inventory')
          .upsert(invRows, { onConflict: 'id' });

        if (!pushInvErr) {
          totalSynced += invRows.length;
        }
      }

      // Pull cloud inventory
      const { data: cloudInventory, error: pullInvErr } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', currentUserId);

      if (!pullInvErr && cloudInventory) {
        for (const ci of cloudInventory) {
          const localInv: InventoryRecord = {
            id: ci.id,
            name: ci.name,
            category: ci.category,
            stockKg: Number(ci.stock_kg) || 0,
            minStockKg: Number(ci.min_stock_kg) || 0,
            costPerKg: (ci.cost_per_kg !== undefined && ci.cost_per_kg !== null && !isNaN(Number(ci.cost_per_kg)))
              ? Number(ci.cost_per_kg)
              : null,
            supplier: ci.supplier || undefined,
            casNumber: ci.cas_number || undefined,
            activeConcentration: ci.active_concentration ? Number(ci.active_concentration) : undefined,
            notes: ci.notes || undefined,
            updatedAt: ci.updated_at || new Date().toISOString(),
          };
          await db.inventory.put(localInv);
        }
      }

      // ==========================================
      // 4. SYNC PRODUCTION RUNS
      // ==========================================
      const localRuns = await db.productionRuns.toArray();
      if (localRuns.length > 0) {
        const runRows = localRuns.map(r => ({
          id: r.id,
          user_id: currentUserId,
          batch_number: r.batchNumber,
          formula_id: r.formulaId || null,
          formula_name: r.formulaName,
          batch_size_kg: r.batchSizeKg,
          date: r.date,
          operator: r.operator || null,
          status: r.status,
          qc_passed: r.qcPassed ?? true,
          density: r.density || null,
          viscosity: r.viscosity || null,
          ph: r.ph || null,
          notes: r.notes || null,
          created_at: r.createdAt || new Date().toISOString(),
        }));

        const { error: pushRunsErr } = await supabase
          .from('production_runs')
          .upsert(runRows, { onConflict: 'id' });

        if (!pushRunsErr) {
          totalSynced += runRows.length;
        }
      }

      // Pull cloud production runs
      const { data: cloudRuns, error: pullRunsErr } = await supabase
        .from('production_runs')
        .select('*')
        .eq('user_id', currentUserId);

      if (!pullRunsErr && cloudRuns) {
        for (const cr of cloudRuns) {
          const localRun: ProductionRunRecord = {
            id: cr.id,
            batchNumber: cr.batch_number,
            formulaId: cr.formula_id || undefined,
            formulaName: cr.formula_name,
            batchSizeKg: Number(cr.batch_size_kg) || 100,
            date: cr.date,
            operator: cr.operator || undefined,
            status: (cr.status as any) || 'COMPLETED',
            qcPassed: cr.qc_passed ?? true,
            density: cr.density ? Number(cr.density) : undefined,
            viscosity: cr.viscosity ? Number(cr.viscosity) : undefined,
            ph: cr.ph ? Number(cr.ph) : undefined,
            notes: cr.notes || undefined,
            createdAt: cr.created_at || new Date().toISOString(),
          };
          await db.productionRuns.put(localRun);
        }
      }

      const now = new Date().toISOString();
      safeSetItem(SYNC_TIMESTAMP_KEY, now);

      this.status = {
        lastSyncedAt: now,
        isSyncing: false,
        error: null,
        pendingCount: 0,
        isCloudConnected: true,
      };

      return {
        success: true,
        syncedCount: totalSynced,
      };
    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      this.status.isSyncing = false;
      this.status.error = err?.message || 'Sync failed';
      return { success: false, syncedCount: 0, error: this.status.error || 'Sync error' };
    }
  }

  /**
   * Clears cloud user data and local data upon user request (Play Store Requirement).
   */
  public static async purgeUserData(userId?: string): Promise<void> {
    // 1. Purge local Dexie tables
    await db.formulas.clear();
    await db.labNotes.clear();
    await db.productionRuns.clear();
    await db.userSettings.clear();
    await db.inventory.clear();

    // 2. If Supabase is configured and user is signed in, purge user records in cloud tables
    if (isSupabaseConfigured() && userId) {
      try {
        const { supabase } = await import('./supabaseClient');
        await Promise.allSettled([
          supabase.from('formulas').delete().eq('user_id', userId),
          supabase.from('lab_notes').delete().eq('user_id', userId),
          supabase.from('inventory').delete().eq('user_id', userId),
          supabase.from('production_runs').delete().eq('user_id', userId),
          supabase.from('profiles').delete().eq('id', userId),
        ]);
      } catch (e) {
        console.warn('Cloud purge warning:', e);
      }
    }

    safeRemoveItem(SYNC_TIMESTAMP_KEY);
    this.status.lastSyncedAt = null;
  }
}
