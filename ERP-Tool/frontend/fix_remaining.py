import re

# BANKING MODULE
with open('src/components/BankingModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useBankingAccounts, useCreateBankingAccount, useBankingTransactions, useCreateBankingTransaction } from '../hooks/useBanking';")
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)
content = re.sub(r'  const \[bankingAccounts, setBankingAccounts\] = useState\(\[\]\);\n  const \[bankingTransactions, setBankingTransactions\] = useState\(\[\]\);\n', '', content)
content = re.sub(r'  const loadData = async \(\) => \{.*?\n  \};\n\n  useEffect\(\(\) => \{\n    loadData\(\);\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)

hooks = '''  const { data: bankingAccounts = [] } = useBankingAccounts();
  const { data: bankingTransactions = [] } = useBankingTransactions();
  const createAccount = useCreateBankingAccount();
  const createTransaction = useCreateBankingTransaction();'''
content = re.sub(r'  const \[activeTab, setActiveTab\] = useState\(\'accounts\'\);', hooks + '\n  const [activeTab, setActiveTab] = useState(\'accounts\');', content)

old_acc = r'  const handleCreateAccount = async \(\) => \{.*?\n  \};\n'
new_acc = '''  const handleCreateAccount = () => {
    if (!accountForm.accountName || !accountForm.accountNumber) return addToast('Name and Number required', 'error');
    createAccount.mutate(accountForm, {
      onSuccess: () => {
        addToast('Account created successfully', 'success');
        setAccountForm({ accountName: '', accountNumber: '', bankName: '', balance: 0, currency: 'USD' });
        setAccountModal(false);
      },
      onError: (err) => addToast(err.message, 'error')
    });
  };
'''
content = re.sub(old_acc, new_acc, content, flags=re.DOTALL)

old_tx = r'  const handleCreateTransaction = async \(\) => \{.*?\n  \};\n'
new_tx = '''  const handleCreateTransaction = () => {
    if (!txForm.accountId || !txForm.amount) return addToast('All fields required', 'error');
    createTransaction.mutate({ ...txForm, timestamp: new Date().toISOString() }, {
      onSuccess: () => {
        addToast('Transaction recorded', 'success');
        setTxForm({ accountId: '', description: '', amount: 0, type: 'CREDIT' });
        setTransactionModal(false);
      },
      onError: (err) => addToast(err.message, 'error')
    });
  };
'''
content = re.sub(old_tx, new_tx, content, flags=re.DOTALL)
with open('src/components/BankingModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# ASSET MODULE
with open('src/components/AssetModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useAssets, useCreateAsset } from '../hooks/useAssets';")
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)
old_hook = r'  const \{\n    assets,\n    setAssets,\n    addAsset,\n    addToast\n  \} = useERPStore\(\);'
new_hook = '''  const { addToast } = useERPStore();
  const { data: assets = [] } = useAssets();
  const createAsset = useCreateAsset();'''
content = re.sub(old_hook, new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*assets,\s*setAssets,\s*addAsset,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const loadData = async \(\) => \{.*?\n  \};\n\n  useEffect\(\(\) => \{\n    loadData\(\);\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'addAsset\(', 'createAsset.mutate(', content)
with open('src/components/AssetModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# PROJECT MODULE
with open('src/components/ProjectModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useProjects, useCreateProject, useTasks, useCreateTask } from '../hooks/useProjects';")
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)
old_hook = r'  const \{\n    projects,\n    addProject,\n    tasks,\n    addTaskToProject,\n    addToast\n  \} = useERPStore\(\);'
new_hook = '''  const { addToast } = useERPStore();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const createProject = useCreateProject();
  const createTask = useCreateTask();'''
content = re.sub(old_hook, new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*projects,\s*addProject,\s*tasks,\s*addTaskToProject,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*projects,\s*addProject,\s*addTaskToProject,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'addProject\(', 'createProject.mutate(', content)
content = re.sub(r'addTaskToProject\(', 'createTask.mutate(', content)
with open('src/components/ProjectModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# MARKETING MODULE
with open('src/components/MarketingModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useMarketingCampaigns, useCreateMarketingCampaign } from '../hooks/useMarketing';")
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)
old_hook = r'  const \{\n    marketingCampaigns,\n    setMarketingCampaigns,\n    addMarketingCampaign,\n    addToast\n  \} = useERPStore\(\);'
new_hook = '''  const { addToast } = useERPStore();
  const { data: marketingCampaigns = [] } = useMarketingCampaigns();
  const createCampaign = useCreateMarketingCampaign();'''
content = re.sub(old_hook, new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*marketingCampaigns,\s*setMarketingCampaigns,\s*addMarketingCampaign,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*marketingCampaigns,\s*setMarketingCampaigns,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const loadData = async \(\) => \{.*?\n  \};\n\n  useEffect\(\(\) => \{\n    loadData\(\);\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)
# It used `api.marketing.createCampaign(campaignData)` or similar? The prompt says `const createCampaign = useCreateMarketingCampaign();`
old_submit = r'  const handleCreateCampaign = async \(\) => \{.*?\n  \};\n'
new_submit = '''  const handleCreateCampaign = () => {
    if (!form.name || !form.budget) return addToast('Name and budget required', 'error');
    createCampaign.mutate(form, {
      onSuccess: () => {
        addToast('Campaign created successfully', 'success');
        setModal(false);
        setForm({ name: '', type: 'Email', budget: '', targetAudience: '', status: 'Draft' });
      },
      onError: (err) => addToast(err.message || 'Failed to create campaign', 'error')
    });
  };
'''
content = re.sub(old_submit, new_submit, content, flags=re.DOTALL)
with open('src/components/MarketingModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# SECURITY MODULE
with open('src/components/SecurityModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useSecurityThreats, useCreateSecurityThreat, useSecurityAuditLog } from '../hooks/useSecurity';")
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)
old_hook = r'  const \{\n    securityThreats,\n    setSecurityAlerts,\n    securityAuditLog,\n    setAccessLogs,\n    addToast\n  \} = useERPStore\(\);'
new_hook = '''  const { addToast } = useERPStore();
  const { data: securityThreats = [] } = useSecurityThreats();
  const { data: auditLog = [] } = useSecurityAuditLog();
  const createThreat = useCreateSecurityThreat();'''
content = re.sub(old_hook, new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*securityThreats,\s*setSecurityAlerts,\s*securityAuditLog,\s*setAccessLogs,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const \{\s*securityThreats,\s*setSecurityAlerts,\s*setAccessLogs,\s*addToast\s*\} = useERPStore\(\);', new_hook, content, flags=re.DOTALL)
content = re.sub(r'  const loadData = async \(\) => \{.*?\n  \};\n\n  useEffect\(\(\) => \{\n    loadData\(\);\n  \}, \[\]\);\n', '', content, flags=re.DOTALL)
# It might use `securityAuditLog` inside component, let's replace it with `auditLog` to match the hook
content = content.replace('securityAuditLog', 'auditLog')
# and replace mutation if it exists
old_submit = r'  const handleResolveThreat = async \(id\) => \{.*?\n  \};\n'
new_submit = '''  const handleResolveThreat = (id) => {
    createThreat.mutate({ threatId: id, action: 'RESOLVE' }, {
      onSuccess: () => addToast('Threat marked as resolved', 'success'),
      onError: (err) => addToast(err.message, 'error')
    });
  };
'''
content = re.sub(old_submit, new_submit, content, flags=re.DOTALL)
with open('src/components/SecurityModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
