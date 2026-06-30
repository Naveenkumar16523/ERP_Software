import re

with open('src/components/CRMModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = re.sub(
    r"import \{ useERPStore \} from '\.\./store/useERPStore';",
    "import { useERPStore } from '../store/useERPStore';\nimport { useLeads, useAddLead, useUpdateLead } from '../hooks/useCRM';\nimport { useSupportTickets, useCreateSupportTicket } from '../hooks/useSupport';\nimport { useQueryClient, useMutation } from '@tanstack/react-query';\nimport { apiClient } from '../api/client';",
    content
)

# Remove the useState and loadData useEffect
content = re.sub(r'  const \[leads, setLeads\] = useState\(\[\]\);\n  const \[tickets, setTickets\] = useState\(\[\]\);\n', '', content)

load_data_block = re.compile(r'  useEffect\(\(\) => \{\n    const loadData = async \(\) => \{.*?\n    loadData\(\);\n  \}, \[\]\);\n', re.DOTALL)
content = load_data_block.sub('', content)

# Add hooks inside component
hooks_block = '''  const { data: leads = [] } = useLeads();
  const addLeadMutation = useAddLead();
  const updateLeadMutation = useUpdateLead();
  const { data: tickets = [] } = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const qc = useQueryClient();
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/crm/tickets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support', 'supportTickets'] })
  });'''
  
content = re.sub(r'  const \[activeTab, setActiveTab\] = useState\(\'pipeline\'\);', hooks_block + '\n  const [activeTab, setActiveTab] = useState(\'pipeline\');', content)

# Remove `api.crm.createLead` block
handle_add_lead_old = re.compile(r'  const handleAddLead = async \(\) => \{.*?\n  \};\n', re.DOTALL)
handle_add_lead_new = '''  const handleAddLead = () => {
    if (!newLead.name || !newLead.company) return addToast('Name and Company required', 'error');
    addLeadMutation.mutate(newLead, {
      onSuccess: () => {
        addToast('Lead added successfully', 'success');
        setNewLead({ name: '', company: '', email: '', phone: '', expectedRevenue: 0 });
        setLeadModal(false);
      },
      onError: (err) => {
        addToast(err.message || 'Failed to add lead', 'error');
      }
    });
  };
'''
content = handle_add_lead_old.sub(handle_add_lead_new, content)

# Update lead status
handle_update_lead_old = re.compile(r'  const handleUpdateLeadStatus = async \(id, stage\) => \{.*?\n  \};\n', re.DOTALL)
handle_update_lead_new = '''  const handleUpdateLeadStatus = (id, stage) => {
    updateLeadMutation.mutate({ id, stage }, {
      onSuccess: () => addToast('Lead stage updated', 'success'),
      onError: (err) => addToast(err.message || 'Failed to update lead', 'error')
    });
  };
'''
content = handle_update_lead_old.sub(handle_update_lead_new, content)

# Add ticket
handle_add_ticket_old = re.compile(r'  const handleAddTicket = async \(\) => \{.*?\n  \};\n', re.DOTALL)
handle_add_ticket_new = '''  const handleAddTicket = () => {
    if (!newTicket.title) return addToast('Title required', 'error');
    createTicket.mutate({
      title: newTicket.title,
      description: newTicket.description,
      leadId: newTicket.leadId || null,
      priority: newTicket.priority
    }, {
      onSuccess: () => {
        addToast('Support ticket created', 'success');
        setNewTicket({ title: '', description: '', leadId: '', priority: 'Medium' });
        setTicketModal(false);
      },
      onError: (err) => addToast(err.message || 'Failed to create ticket', 'error')
    });
  };
'''
content = handle_add_ticket_old.sub(handle_add_ticket_new, content)

# Update ticket status
handle_update_ticket_old = re.compile(r'  const handleUpdateTicketStatus = async \(id, status\) => \{.*?\n  \};\n', re.DOTALL)
handle_update_ticket_new = '''  const handleUpdateTicketStatus = (id, status) => {
    updateTicketMutation.mutate({ id, status }, {
      onSuccess: () => addToast('Ticket status updated', 'success'),
      onError: (err) => addToast(err.message || 'Failed to update ticket status', 'error')
    });
  };
'''
content = handle_update_ticket_old.sub(handle_update_ticket_new, content)

with open('src/components/CRMModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
