import re

file_path = r"c:\Users\user\Documents\ERP_Software-master\ERP-Tool\frontend\src\components\FinanceModule.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the useEffect that fetches everything
use_effect_pattern = re.compile(r"useEffect\(\(\) => \{\n\s*let active = true;.*?fetchFinanceData\(\);.*?\}, \[.*?\]\);\n", re.DOTALL)
content = use_effect_pattern.sub("", content)

# Replace the store destructing
store_pattern = re.compile(r"const \{\s*accounts,.*?addToast\s*\} = useERPStore\(\);", re.DOTALL)

new_store = """const { addNotification, addToast } = useERPStore();
  
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: journalEntries = [], isLoading: loadingJournals } = useJournalEntries();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: budgets = [] } = useBudgets();
  const { data: expenses = [] } = useExpenses();
  const { data: taxCompliance = [] } = useTaxDeadlines();
  const { data: statements = [] } = useStatements();
  
  const createAccountMutation = useCreateAccount();
  const createJournalEntryMutation = useCreateJournalEntry();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
"""

content = store_pattern.sub(new_store, content)

# Import the hooks at the top
import_hooks = """import { useERPStore } from '../store/useERPStore';
import { 
  useAccounts, useCreateAccount, 
  useJournalEntries, useCreateJournalEntry,
  useInvoices, useUpdateInvoiceStatus,
  useBudgets, useExpenses, useTaxDeadlines, useStatements
} from '../hooks/useFinance';
"""
content = content.replace("import { useERPStore } from '../store/useERPStore';", import_hooks)

# Update handleAddAccount
handle_account_pattern = re.compile(r"const savedAcc = await api\.finance\.createAccount\(payload\);\s*const exists = accounts\.some\(a => a\.code === savedAcc\.code\);\s*if \(\!exists\) \{\s*addAccount\(savedAcc\);\s*\}")
new_handle_account = "const savedAcc = await createAccountMutation.mutateAsync(payload);"
content = handle_account_pattern.sub(new_handle_account, content)

# Update handleAddJournal
handle_journal_pattern = re.compile(r"const savedJE = await api\.finance\.createJournalEntry\(payload\);\s*const exists = journalEntries\.some\(j => j\.voucherNo === savedJE\.voucherNo\);\s*if \(\!exists\) \{\s*addJournalEntry\(savedJE\);\s*\}\s*// Refetch accounts to reflect ledger double-entry balances\s*const accts = await api\.finance\.getAccounts\(\);\s*if \(Array\.isArray\(accts\)\) setAccounts\(accts\);")
new_handle_journal = "const savedJE = await createJournalEntryMutation.mutateAsync(payload);"
content = handle_journal_pattern.sub(new_handle_journal, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Refactored FinanceModule.jsx successfully!")
