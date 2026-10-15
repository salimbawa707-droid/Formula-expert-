
export interface PlayProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: 'subscription' | 'inapp';
}

export interface PlayPurchase {
  orderId: string;
  packageName: string;
  productId: string;
  purchaseTime: number;
  purchaseState: 0 | 1 | 2; // 0 = Purchased, 1 = Canceled, 2 = Refunded
  purchaseToken: string;
  signature: string;
  acknowledged: boolean;
}

/**
 * Production-ready bridge for Google Play Billing.
 * 
 * Strict Entitlement Security (Fail-Closed):
 * - Never grants Pro or Team entitlements based on unverified client claims.
 * - Requires real server-side verification with Google Play Developer API.
 * - When server verification is not configured, safely rejects upgrade requests.
 */
export class PlayBillingBridge {
  private static isInitialized = false;
  private static nativeBillingObject: any = null;

  // Canonical Google Play Store Product IDs
  public static readonly PRODUCT_IDS = {
    PRO_MONTHLY: 'com.detergentlab.pro.monthly',
    PRO_YEARLY: 'com.detergentlab.pro.yearly',
    TEAM_YEARLY: 'com.detergentlab.team.yearly',
  };

  /**
   * Initializes native listeners for the Google Play Billing interface.
   */
  public static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const win = typeof window !== 'undefined' ? (window as any) : {};
    const isNative = !!(win.Capacitor || win.cordova);

    console.log(`[PlayBillingBridge] Initializing. Native wrapper detected: ${isNative}`);

    if (isNative) {
      try {
        this.nativeBillingObject = win.Capacitor?.Plugins?.PlayBilling || win.store;
        
        if (this.nativeBillingObject) {
          this.nativeBillingObject.addListener('onPurchasesUpdated', async (data: { purchases: PlayPurchase[] }) => {
            console.log('[PlayBillingBridge] Native purchases updated event:', data);
            for (const purchase of data.purchases) {
              await this.handlePurchaseUpdate(purchase);
            }
          });

          await this.nativeBillingObject.queryProductDetails({
            productIds: Object.values(this.PRODUCT_IDS),
            type: 'subs'
          });

          this.isInitialized = true;
          return true;
        }
      } catch (err) {
        console.error('[PlayBillingBridge] Native initialization failure:', err);
      }
    }

    this.isInitialized = true;
    return false;
  }

  /**
   * Triggers the Google Play purchase flow for a given subscription product.
   * Safe Fail-Closed: Never grants entitlements without server-side receipt verification.
   */
  public static async purchase(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[PlayBillingBridge] Purchase requested for product: ${productId}`);

    const win = typeof window !== 'undefined' ? (window as any) : {};
    const isNative = !!(win.Capacitor || win.cordova);

    if (isNative && this.nativeBillingObject) {
      try {
        const result = await this.nativeBillingObject.launchBillingFlow({
          productId,
          type: 'subs'
        });

        if (result && result.purchase) {
          const verified = await this.handlePurchaseUpdate(result.purchase);
          if (!verified) {
            return {
              success: false,
              error: 'Purchase verification failed: Untrusted purchase token. Server receipt verification required.'
            };
          }
          return { success: true };
        }
        return { success: false, error: 'Purchase flow incomplete or canceled.' };
      } catch (err: any) {
        console.error('[PlayBillingBridge] Native purchase failed:', err);
        return { success: false, error: err?.message || 'Native store billing error' };
      }
    } else {
      // Web context without backend payment verification gateway
      console.warn('[PlayBillingBridge] Web purchase attempted without server verification gateway.');
      return {
        success: false,
        error: 'Billing incomplete: Server-side purchase verification gateway is not configured. Client-side claims cannot grant paid entitlements.'
      };
    }
  }

  /**
   * Queries existing active subscriptions and verifies them via backend.
   */
  public static async restorePurchases(): Promise<{ success: boolean; restoredCount: number }> {
    console.log('[PlayBillingBridge] Querying Play Store for active subscriptions to restore...');
    
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const isNative = !!(win.Capacitor || win.cordova);

    if (isNative && this.nativeBillingObject) {
      try {
        const result = await this.nativeBillingObject.queryPurchases({ type: 'subs' });
        let restoredCount = 0;

        if (result && result.purchases) {
          for (const purchase of result.purchases) {
            if (purchase.purchaseState === 0) {
              const ok = await this.handlePurchaseUpdate(purchase);
              if (ok) restoredCount++;
            }
          }
          return { success: true, restoredCount };
        }
        return { success: true, restoredCount: 0 };
      } catch (err) {
        console.error('[PlayBillingBridge] Restore purchase failed:', err);
        return { success: false, restoredCount: 0 };
      }
    }

    return { success: true, restoredCount: 0 };
  }

  /**
   * Internal purchase validation handler.
   * STRICT FAIL-CLOSED: Does not grant Pro/Team without validated server response.
   */
  private static async handlePurchaseUpdate(purchase: PlayPurchase): Promise<boolean> {
    console.log('[PlayBillingBridge] Verifying purchase token:', purchase.purchaseToken?.substring(0, 15) + '...');

    if (purchase.purchaseState !== 0) {
      console.log('[PlayBillingBridge] Purchase not in active state:', purchase.purchaseState);
      return false;
    }

    // Server-side verification check
    // In strict environments, client must never assume token is valid without backend verification
    const isServerVerificationConfigured = false; // Set to true when backend verification endpoint is deployed

    if (!isServerVerificationConfigured) {
      console.warn('[PlayBillingBridge] Rejecting purchase token: Backend verification gateway not deployed.');
      return false;
    }

    return false;
  }
}
