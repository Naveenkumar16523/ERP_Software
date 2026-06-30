import os

HOOKS_DIR = r"c:\Users\user\Documents\ERP_Software-master\ERP-Tool\frontend\src\hooks"
if not os.path.exists(HOOKS_DIR):
    os.makedirs(HOOKS_DIR)

modules = {
    "useProcurement": {
        "suppliers": "/procurement/suppliers",
        "purchaseOrders": "/procurement/orders",
        "rfqs": "/procurement/rfqs",
        "vendorEvaluations": "/procurement/evaluations",
        "contracts": "/procurement/contracts"
    },
    "useInventory": {
        "products": "/inventory/products",
        "warehouses": "/inventory/warehouses",
        "stockMovements": "/inventory/movements",
        "inventoryBatches": "/inventory/batches"
    },
    "usePayroll": {
        "payrolls": "/payroll/payrolls",
        "salaryStructures": "/payroll/structures",
        "payslips": "/payroll/payslips"
    },
    "useAssets": {
        "assets": "/assets/assets",
        "depreciationRecords": "/assets/depreciation",
        "maintenanceSchedules": "/assets/maintenance"
    },
    "useProjects": {
        "projects": "/projects/projects",
        "tasks": "/projects/tasks",
        "milestones": "/projects/milestones",
        "resourceAllocations": "/projects/resources"
    },
    "useBanking": {
        "bankingAccounts": "/banking/accounts",
        "bankingTransactions": "/banking/transactions",
        "bankingLoans": "/banking/loans"
    },
    "useSupplyChain": {
        "orders": "/supply-chain/orders",
        "shipments": "/supply-chain/shipments",
        "carriers": "/supply-chain/carriers",
        "routes": "/supply-chain/routes",
        "fieldWorkOrders": "/supply-chain/field-work"
    },
    "useMarketing": {
        "marketingCampaigns": "/marketing/campaigns"
    },
    "useSecurity": {
        "securityThreats": "/security/threats",
        "securityAuditLog": "/security/audit-log"
    },
    "useSupport": {
        "supportTickets": "/support/tickets"
    },
    "useAnalytics": {
        "kpis": "/analytics/kpis",
        "reports": "/analytics/reports",
        "dashboards": "/analytics/dashboards"
    }
}

template = """import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useOptimisticCreate = (queryKey, endpoint) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post(endpoint, payload).then((r) => r.data),
    onMutate: async (newItem) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) => {
        if (!old) return [ { ...newItem, id: `temp-${Date.now()}`, _optimistic: true } ];
        const list = Array.isArray(old) ? old : (old.data || []);
        const updatedList = [...list, { ...newItem, id: `temp-${Date.now()}`, _optimistic: true }];
        return Array.isArray(old) ? updatedList : { ...old, data: updatedList };
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(queryKey, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });
};

"""

for hook_name, endpoints in modules.items():
    file_path = os.path.join(HOOKS_DIR, f"{hook_name}.js")
    content = template
    for key, path in endpoints.items():
        stale_time = "60_000"
        
        content += f"""
export const use{key[0].upper() + key[1:]} = (filters) =>
  useQuery({{
    queryKey: ['{hook_name.replace('use', '').lower()}', '{key}', filters],
    queryFn: async () => {{
      const {{ data }} = await apiClient.get('{path}', {{ params: filters }});
      return data?.data ?? data ?? [];
    }},
    staleTime: {stale_time},
  }});

export const useCreate{key[0].upper() + key[1:-1]} = () => useOptimisticCreate(['{hook_name.replace('use', '').lower()}', '{key}'], '{path}');
"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Generated all React Query hooks successfully!")
