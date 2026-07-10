import { create } from 'zustand';
import { tenantApi } from '../services/api';

// Keep in sync with backend core/models.py Tenant.FEATURE_CHOICES.
// Features default to enabled so nothing is hidden before config loads or when
// a key is missing from the tenant response.
export const FEATURE_KEYS = [
    'courses',
    'study',
    'quiz',
    'mock_tests',
    'pyq',
    'community',
    'analytics',
    'leaderboard',
    'ai',
];

export const useTenantStore = create((set, get) => ({
    tenant: null,
    isLoading: true,
    error: null,

    fetchTenantConfig: async () => {
        const tenantId = import.meta.env.VITE_TENANT_ID;
        if (!tenantId) {
            set({ error: 'Tenant ID not configured', isLoading: false });
            return;
        }

        try {
            set({ isLoading: true, error: null });
            const response = await tenantApi.get(`/tenant/${tenantId}/`);
            set({ tenant: response.data, isLoading: false });

            // Optionally update document title
            if (response.data.name) {
                document.title = response.data.name;
            }
        } catch (error) {
            console.error('Failed to fetch tenant configuration', error);
            set({ error: 'Failed to load tenant configuration', isLoading: false });
        }
    },

    // A feature is enabled unless the tenant config explicitly disables it.
    isFeatureEnabled: (key) => {
        const features = get().tenant?.features;
        if (!features || !(key in features)) return true;
        return Boolean(features[key]);
    },
}));
