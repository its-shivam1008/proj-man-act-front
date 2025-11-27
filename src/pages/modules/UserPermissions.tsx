import React, { useState, useEffect, useMemo } from 'react';
import api from '@/utils/axiosApi'; // Ensure this path matches your project
import { 
  Shield, Users, Plus, Save, Settings, ChevronDown, ChevronRight,
  Home, Package, Factory, ShoppingCart, GitBranch, Wrench, ScanLine, 
  UserRound, FactoryIcon, LayoutDashboard, CircleDollarSign, FolderKanban, 
  Network, TrendingUp, AlertTriangle, HandCoins, FileText, 
  ReceiptIndianRupee, CircuitBoard, PlaneTakeoff, CassetteTape, PenTool, 
  FolderClosed, BarChart3, Warehouse, MapPin, Mail, CheckCircle, Clock, Trash2, Search, UserCog, Loader2,
  ShieldAlert
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { usePermission } from '@/hooks/userPermission';

// --- 1. Navigation Structure with KEYS ---

const productionLinks = [
    { name: "Production Dashboard", icon: LayoutDashboard, key: "productionDashboard" },
    { name: "PPC", icon: Factory, key: "ppc" },
    { name: "Item Master", icon: Package, key: "itemMaster" },
    { name: "BOM Management", icon: FactoryIcon, key: "bomManagement" },
    { name: "Product Orders", icon: ShoppingCart, key: "productOrders" },
    { name: "Work Center Mgt", icon: Factory, key: "workCenterMgt" },
    { name: "Production Execution", icon: Factory, key: "productionExecution" },
    { name: "Quality Inspection ", icon: Factory, key: "qualityInspection" },
    { name: "Material Issue & Consumption", icon: Factory, key: "materialIssueConsumption" },
    { name: "Production Reporting & Analytics", icon: Factory, key: "productionReportingAnalytics" },
    { name: "Costing & Performance", icon: Factory, key: "costingPerformance" },
    { name: "Receipt", icon: Factory, key: "receipt" },
    { name: "Reports", icon: FileText, key: "productionReports" },
];

const inventoryLinks = [
    { name: "Inventory Dashboard", icon: Package, key: "inventoryDashboard" },
    { name: "Overview", icon: BarChart3, key: "inventoryOverview" },
    { name: "Products", icon: Package, key: "products" },
    { name: "Raw Materials", icon: Warehouse, key: "rawMaterials" },
    { name: "Warehouses", icon: MapPin, key: "warehouses" },
    { name: "Stores", icon: Package, key: "stores" },
    { name: "Operations", icon: Warehouse, key: "inventoryOperations" },
    { name: "Reporting", icon: TrendingUp, key: "inventoryReporting" },
    { name: "Settings", icon: Settings, key: "inventorySettings" },
];

const purchaseLinks = [
    { name: "Purchase Overview", icon: LayoutDashboard, key: "purchaseOverview" },
    { name: "RFQ", icon: FileText, key: "rfq" },
    { name: "Purchase Orders", icon: ShoppingCart, key: "purchaseOrders" },
    { name: "Agreements", icon: FileText, key: "agreements" },
    { name: "Vendors", icon: Users, key: "vendors" },
    { name: "Reporting", icon: TrendingUp, key: "purchaseReporting" },
    { name: "Settings", icon: Settings, key: "purchaseSettings" },
];

const projectLinks = [
    { name: "Project Dashboard", icon: FolderKanban, key: "projectDashboard" },
    { name: "Projects", icon: FolderKanban, key: "projects" },
    { name: "WBS Management", icon: Network, key: "wbsManagement" },
    { name: "Resources", icon: UserRound, key: "resources" }, 
    { name: "Budget & Cost", icon: CircleDollarSign, key: "budgetCost" },
    { name: "Procurement & Material Tracking", icon: GitBranch, key: "procurementMaterialTracking" },
    { name: "Progress Updates", icon: GitBranch, key: "progressUpdates" },
    { name: "Billings", icon: ReceiptIndianRupee, key: "billings" },
    { name: "Projects Reports", icon: FileText, key: "projectsReports" },
    { name: "Scheduling & Planning", icon: PenTool, key: "schedulingPlanning" },
    { name: "Project Closure", icon: FolderClosed, key: "projectClosure" },
    { name: "Master Data", icon: FileText, key: "masterData" },
];

const plantLinks = [
    { name: "P&M Dashboard", icon: FactoryIcon, key: "pmDashboard" },
    { name: "Equipment Mgt", icon: Settings, key: "equipmentMaster" },
    { name: "Machinery Mgt", icon: Settings, key: "machineryManagement" },
    { name: "Preventive Maint.", icon: Wrench, key: "preventiveMaint" },
    { name: "Breakdown Mgt", icon: AlertTriangle, key: "breakdownMgt" },
    { name: "Spare Parts", icon: Package, key: "spareParts" },
    { name: "Calibration & Safety", icon: Shield, key: "calibrationSafety" },
    { name: "Equipment Allocation", icon: HandCoins, key: "equipmentAllocation" },
    { name: "Equipment Costing", icon: CircleDollarSign, key: "equipmentCosting" },
    { name: "Assets Disposal Transafer", icon: CassetteTape, key: "assetsDisposalTransfer" },
    { name: "P&M Reports", icon: TrendingUp, key: "pmReports" },
    { name: "Preventive Planning", icon: PlaneTakeoff, key: "preventivePlanning" },
    { name: "Teams and Technicians", icon: Users, key: "teamsTechnicians" },
    { name: "Kanban board", icon: CircuitBoard, key: "kanbanBoard" },
];

interface ModuleNode {
  name: string;
  key: string; // Added key field
  icon: React.ElementType;
  children?: ModuleNode[]; // Updated to be recursive
}

const APP_STRUCTURE: ModuleNode[] = [
    { name: "Dashboard", icon: Home, key: "dashboard" },
    { name: "Project", icon: FolderKanban, key: "project", children: projectLinks as ModuleNode[] },
    { name: "Inventory", icon: Package, key: "inventory", children: inventoryLinks as ModuleNode[] },
    { name: "Purchase", icon: ShoppingCart, key: "purchase", children: purchaseLinks as ModuleNode[] },
    { name: "Production", icon: Factory, key: "production", children: productionLinks as ModuleNode[] },
    { name: "Quality Control", icon: Shield, key: "qualityControl" },
    { name: "Plant & Machinery", icon: FactoryIcon, key: "plantMachinery", children: plantLinks as ModuleNode[] },
    { name: "Product Lifecycle", icon: GitBranch, key: "productLifecycle" },
    { name: "Repair", icon: Wrench, key: "repair" },
    { name: "Barcode", icon: ScanLine, key: "barcode" },
    { name: "Permissions", icon: UserRound, key: "permissions" },
];

// --- 2. Types ---

type UserRole = 'admin' | 'manager' | 'employee' | 'user';

interface User {
  _id: string; 
  fullname: string;
  email: string;
  role: UserRole;
  permissions?: Record<string, any>;
  createdAt?: string;
}

const PERMISSION_TYPES = ['view', 'create', 'edit', 'delete'];

export const UserPermissionsPage: React.FC = () => {
  // --- State ---
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { userProfile: currentUser } = useSelector((state: any) => state.auth);
  const [localPermissions, setLocalPermissions] = useState<Record<string, any>>({}); 
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const canView = usePermission('permissions', 'view');
  const canCreate = usePermission('permissions', 'create');
  const canEdit = usePermission('permissions', 'edit');
  const canDelete = usePermission('permissions', 'delete');
  

  const generateFullPermissions = (nodes: ModuleNode[]) => {
    let fullPerms: any = {};
    nodes.forEach(node => {
      fullPerms[node.key] = { view: true, create: true, edit: true, delete: true };
      if (node.children) {
        fullPerms = { ...fullPerms, ...generateFullPermissions(node.children) };
      }
    });
    return fullPerms;
  };

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // --- Initial Fetch ---
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/list');
      setUsers(res.data);
      if (res.data.length > 0) {
        setSelectedUserId(res.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      setStatusMessage({ type: 'error', text: "Failed to load users." });
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---

  const selectedUser = users.find(u => u._id === selectedUserId);

  // Helper: Generates a complete permission matrix (defaults + existing db values)
  // UPDATED: Now uses node.key instead of node.name
  const getMergedPermissions = (user: User | undefined) => {
    if (!user) return {};

    // 1. ADMIN CHECK: If role is admin, return full permissions immediately
    if (user.role === 'admin') {
      return generateFullPermissions(APP_STRUCTURE);
    }

    // 2. Normal logic for other roles
    const sourcePermissions = localPermissions[user._id] || user.permissions || {};
    
    const merged: any = {};
    const processNode = (node: ModuleNode) => {
      merged[node.key] = { 
        view: sourcePermissions[node.key]?.view || false,
        create: sourcePermissions[node.key]?.create || false,
        edit: sourcePermissions[node.key]?.edit || false,
        delete: sourcePermissions[node.key]?.delete || false
      };
      
      if(node.children) {
        node.children.forEach(child => {
            merged[child.key] = { 
                view: sourcePermissions[child.key]?.view || false,
                create: sourcePermissions[child.key]?.create || false,
                edit: sourcePermissions[child.key]?.edit || false,
                delete: sourcePermissions[child.key]?.delete || false
            };
        });
      }
    };
    APP_STRUCTURE.forEach(processNode);
    return merged;
  };

  const currentPermissions = useMemo(() => {
    return getMergedPermissions(selectedUser);
  }, [selectedUser, localPermissions]);

  // Use Key for toggling expansion as well
  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  };

  // --- Handlers ---

  // UPDATED: Uses pageKey instead of pageName
  const handlePermissionChange = (pageKey: string, type: string, value: boolean) => {
    if (!selectedUserId) return;

    setLocalPermissions(prev => ({
      ...prev,
      [selectedUserId]: {
        ...getMergedPermissions(selectedUser), 
        [pageKey]: {
          ...getMergedPermissions(selectedUser)[pageKey],
          [type]: value,
        },
      },
    }));
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers => prevUsers.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
    ));
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: "Please enter a valid email" });
      return;
    }

    setInviteLoading(true);
    try {
        await api.post('/notifications/invite', { email: inviteEmail });
        
        setStatusMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
        setInviteEmail('');
        setIsInviteModalOpen(false);
    } catch (err: any) {
        console.error(err);
        const errorMsg = err.response?.data?.message || "Failed to send invite. Make sure the user is registered.";
        setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
        setInviteLoading(false);
        setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSavePermissions = async () => {
    if(!selectedUser) return;

    try {
        const updatedPermissions = localPermissions[selectedUserId] || selectedUser.permissions || {};
        const payload = {
            userId: selectedUser._id,
            role: selectedUser.role,
            permissions: updatedPermissions // Now contains keys like "kanbanBoard"
        };

        await api.put('/auth/users/update-permissions', payload);

        setUsers(prev => prev.map(u => 
            u._id === selectedUserId ? { ...u, permissions: updatedPermissions } : u
        ));

        setStatusMessage({ type: 'success', text: 'Permissions & Role saved successfully!' });
    } catch (err: any) {
        console.error(err);
        setStatusMessage({ type: 'error', text: err.response?.data?.message || "Failed to save permissions." });
    } finally {
        setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // --- Render ---

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canView) {
    return (
      <div className="text-center py-12 px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-500 mt-1">
            Invite users and configure their roles and granular access.
          </p>
        </div>
        <div className="flex gap-3">
            {/* Invite Modal */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              {canCreate && <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Invite User
                </Button>
              </DialogTrigger>}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <p className="text-sm text-gray-500">
                        Enter the email address of a registered user. They will receive a notification to join your organization.
                    </p>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="colleague@company.com" 
                                value={inviteEmail} 
                                onChange={e => setInviteEmail(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                   <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                   <Button onClick={handleInviteUser} disabled={inviteLoading}>
                     {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                     {inviteLoading ? 'Sending...' : 'Send Invitation'}
                   </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {canEdit && <Button onClick={handleSavePermissions} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>}
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        
        {/* Left Column: User List */}
        <Card className="lg:col-span-4 h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-900">Team Members</h3>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                    placeholder="Search users..." 
                    className="pl-9 bg-gray-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    Loading...
                </div>
            )}
            
            {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No users found</div>
            )}
            
            {filteredUsers.map(user => {
                const initials = (user.fullname || user.email).substring(0, 2).toUpperCase();
                const isSelected = selectedUserId === user._id;
                
                // CHECK: Is this the logged-in user?
                const isMe = currentUser?._id === user._id;

                return (
                    <div 
                        key={user._id}
                        // CHANGE 1: Prevent click if it's "Me"
                        onClick={() => !isMe && setSelectedUserId(user._id)}
                        className={`
                            group flex items-start gap-3 p-3 rounded-lg transition-all border
                            ${isMe 
                                // CHANGE 2: Grayed out styles for "Me"
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' 
                                : isSelected 
                                    ? 'bg-blue-50 border-blue-200 shadow-sm cursor-pointer' 
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 cursor-pointer'
                            }
                        `}
                    >
                        {/* Avatar */}
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                            ${isMe 
                                ? 'bg-gray-200 text-gray-500' // Gray avatar for "Me"
                                : (isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600')
                            }
                        `}>
                            {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className={`font-medium text-sm truncate flex items-center gap-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {user.fullname || user.email.split('@')[0]}
                                    
                                    {/* CHANGE 3: Add "YOU" Tag */}
                                    {isMe && (
                                        <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded border border-gray-300 font-bold">
                                            YOU
                                        </span>
                                    )}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{user.role}</Badge>
                            </div>
                        </div>
                    </div>
                );
            })}
          </div>
        </Card>

        {/* Right Column: Permissions Matrix */}
        <Card className="lg:col-span-8 h-full flex flex-col overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-4 px-6 bg-gray-50/50">
            {selectedUser ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-gray-200 rounded-md shadow-sm">
                            <UserCog className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Access Control</CardTitle>
                            <p className="text-xs text-gray-500">
                                Configure for <span className="font-medium text-gray-900">{selectedUser.email}</span>
                            </p>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Role:</span>
                        <select 
                            value={selectedUser.role}
                            onChange={(e) => handleRoleChange(selectedUser._id, e.target.value as UserRole)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white py-1.5 px-3"
                        >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="employee">Employee</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500">Select a user to configure permissions</div>
            )}
          </CardHeader>

          <div className="flex-1 overflow-auto">
            {selectedUser && (
                <Table>
                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                    <TableRow>
                    <TableHead className="w-[40%] pl-6">Module Name</TableHead>
                    {PERMISSION_TYPES.map(t => (
                        <TableHead key={t} className="text-center capitalize w-[15%]">
                            <span className={`px-2 py-1 rounded text-xs font-semibold
                                ${t === 'view' ? 'bg-blue-100 text-blue-700' : ''}
                                ${t === 'create' ? 'bg-green-100 text-green-700' : ''}
                                ${t === 'edit' ? 'bg-orange-100 text-orange-700' : ''}
                                ${t === 'delete' ? 'bg-red-100 text-red-700' : ''}
                            `}>
                                {t}
                            </span>
                        </TableHead>
                    ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {APP_STRUCTURE.map((node) => (
                        <React.Fragment key={node.key}> 
                            {/* Parent Row */}
                            <TableRow 
                                className={`
                                    transition-colors hover:bg-gray-50 
                                    ${node.children ? 'cursor-pointer' : ''}
                                    ${expandedModules[node.key] ? 'bg-gray-50' : ''}
                                `}
                            >
                                <TableCell className="p-3 pl-4">
                                    <div 
                                        className="flex items-center gap-3 font-medium text-gray-900 select-none"
                                        onClick={() => node.children && toggleModule(node.key)}
                                    >
                                        <div className="flex items-center justify-center w-6 text-gray-400">
                                            {node.children ? (
                                                expandedModules[node.key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                            ) : <span className="w-4" />}
                                        </div>
                                        
                                        <node.icon className={`w-5 h-5 ${expandedModules[node.key] ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span>{node.name}</span>
                                    </div>
                                </TableCell>
                                
                                {PERMISSION_TYPES.map(type => (
                                    <TableCell key={type} className="text-center p-2">
                                        {!node.children && (
                                            <Checkbox 
                                                checked={currentPermissions[node.key]?.[type] || false}
                                                onCheckedChange={(checked) => handlePermissionChange(node.key, type, !!checked)}
                                            />
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>

                            {/* Children Rows */}
                            {node.children && expandedModules[node.key] && node.children.map(child => (
                                <TableRow key={child.key} className="bg-gray-50/30 hover:bg-gray-50 border-b-0 animate-in fade-in slide-in-from-top-1">
                                    <TableCell className="p-2 pl-16">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 relative">
                                            <div className="w-[1px] h-6 bg-gray-300 absolute -left-4 -top-3" />
                                            <div className="w-3 h-[1px] bg-gray-300 absolute -left-4 top-1/2" />
                                            <child.icon className="w-4 h-4 text-gray-400" />
                                            {child.name}
                                        </div>
                                    </TableCell>
                                    {PERMISSION_TYPES.map(type => (
                                        <TableCell key={type} className="text-center p-2">
                                            <Checkbox 
                                                checked={currentPermissions[child.key]?.[type] || false}
                                                onCheckedChange={(checked) => handlePermissionChange(child.key, type, !!checked)}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </React.Fragment>
                    ))}
                </TableBody>
                </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Shared Shadcn/Tailwind Components ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm', className)} {...props} />
);
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('font-semibold leading-none tracking-tight text-lg', className)} {...props} />
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'outline'; size?: 'default' | 'sm'; }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = { default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm', outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700' };
  const sizes = { default: 'h-10 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs' };
  return <button className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} ref={ref} {...props} />;
});
const Badge: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'secondary' }> = ({ className, variant = 'secondary', ...props }) => (
  <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-gray-100 text-gray-900 hover:bg-gray-100/80', className)} {...props} />
);
const Checkbox: React.FC<Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { onCheckedChange?: (checked: boolean) => void }> = ({ className, checked, onCheckedChange, ...props }) => (
  <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange?.(e.target.checked)} className={cn('h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer', className)} {...props} />
);
const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => <thead className={cn('[&_tr]:border-b', className)} {...props} />;
const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => <tr className={cn('border-b border-gray-200 transition-colors data-[state=selected]:bg-gray-50', className)} {...props} />;
const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => <th className={cn('h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0', className)} {...props} />;
const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => <td className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />;
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => <input className={cn('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2', className)} {...props} />;
const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({ open: false, onOpenChange: () => {} });
const Dialog: React.FC<{ children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }> = ({ children, open, onOpenChange }) => <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
const DialogTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children }) => { const { onOpenChange } = React.useContext(DialogContext); return React.cloneElement(children, { onClick: () => onOpenChange(true) }); };
const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => { const { open, onOpenChange } = React.useContext(DialogContext); if (!open) return null; return (<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => onOpenChange(false)} /><div className="z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg animate-in fade-in zoom-in-95">{children}</div></div>); };
const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
const DialogFooter = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">{children}</div>;