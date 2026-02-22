import { create } from 'zustand';
import { tenantApi } from '../services/api';

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
}));
