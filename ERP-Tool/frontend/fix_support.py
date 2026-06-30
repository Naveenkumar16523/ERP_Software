import re
with open('src/components/SupportModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
if 'useMutation' not in content:
    content = content.replace("import { useERPStore } from '../store/useERPStore';", "import { useERPStore } from '../store/useERPStore';\nimport { useSupportTickets, useCreateSupportTicket } from '../hooks/useSupport';\nimport { useMutation, useQueryClient } from '@tanstack/react-query';\nimport { apiClient } from '../api/client';")

# Remove api import
content = re.sub(r"import \{ api \} from '../utils/api';\n", "", content)

# Fix store hooks
old_hook = r"  const \{ supportTickets, addSupportTicket, updateTicketStatus, addToast, currentUser, setSupportTickets \} = useERPStore\(\);"
new_hook = """  const { addToast, currentUser } = useERPStore();
  const { data: supportTickets = [] } = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const qc = useQueryClient();
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/support/tickets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support', 'supportTickets'] })
  });"""
content = re.sub(old_hook, new_hook, content)

# Remove loadData and useEffect
content = re.sub(r"  const loadData = async \(\) => \{.*?\n  \};\n\n  useEffect\(\(\) => \{\n    loadData\(\);\n  \}, \[\]\);\n", "", content, flags=re.DOTALL)

# Fix handleSubmit
old_submit = r"  const handleSubmit = async \(\) => \{.*?\n  \};\n"
new_submit = """  const handleSubmit = () => {
    if (!form.title || !form.description) return addToast('Please fill all fields', 'error');
    createTicket.mutate({
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      status: 'OPEN',
      requesterId: currentUser?.id || 'sys-user'
    }, {
      onSuccess: () => {
        addToast('Support ticket created', 'success');
        setModal(false);
        setForm({ title: '', description: '', priority: 'MEDIUM', category: 'Technical' });
      },
      onError: (err) => addToast(err.message || 'Failed to create ticket', 'error')
    });
  };
"""
content = re.sub(old_submit, new_submit, content, flags=re.DOTALL)

# Fix handleStatusUpdate
old_status = r"  const handleStatusUpdate = async \(id, status\) => \{.*?\n  \};\n"
new_status = """  const handleStatusUpdate = (id, status) => {
    updateTicketMutation.mutate({ id, status }, {
      onSuccess: () => addToast('Ticket status updated', 'success'),
      onError: (err) => addToast(err.message || 'Update failed', 'error')
    });
  };
"""
content = re.sub(old_status, new_status, content, flags=re.DOTALL)

with open('src/components/SupportModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
