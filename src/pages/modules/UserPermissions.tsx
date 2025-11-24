import React, { useState, useMemo } from 'react';
import { 
  Shield, Users, Plus, Save, Settings, ChevronDown, ChevronRight,
  // Icons from Layout
  Home, Package, Factory, ShoppingCart, GitBranch, Wrench, ScanLine, 
  UserRound, FactoryIcon, LayoutDashboard, CircleDollarSign, FolderKanban, 
  Network, TrendingUp, AlertTriangle, HandCoins, FileText, 
  ReceiptIndianRupee, CircuitBoard, PlaneTakeoff, CassetteTape, PenTool, 
  FolderClosed, BarChart3, Warehouse, MapPin
} from 'lucide-react';

// --- 1. Data Structure Reconstruction (Matching Layout.tsx) ---

// Sub-module definitions (copied from Layout logic)
const productionLinks = [
    { name: "Production Dashboard", icon: LayoutDashboard },
    { name: "PPC", icon: Factory },
    { name: "Item Master", icon: Package },
    { name: "BOM Management", icon: FactoryIcon },
    { name: "Product Orders", icon: ShoppingCart },
    { name: "Work Center Mgt", icon: Factory },
    { name: "Production Execution", icon: Factory },
    { name: "Quality Inspection ", icon: Factory },
    { name: "Material Issue & Consumption", icon: Factory },
    { name: "Production Reporting & Analytics", icon: Factory },
    { name: "Costing & Performance", icon: Factory },
    { name: "Receipt", icon: Factory },
    { name: "Reports", icon: FileText },
];

const inventoryLinks = [
    { name: "Inventory Dashboard", icon: Package },
    { name: "Overview", icon: BarChart3 },
    { name: "Products", icon: Package },
    { name: "Raw Materials", icon: Warehouse },
    { name: "Warehouses", icon: MapPin },
    { name: "Stores", icon: Package },
    { name: "Operations", icon: Warehouse },
    { name: "Reporting", icon: TrendingUp },
    { name: "Settings", icon: Settings },
];

const purchaseLinks = [
    { name: "Purchase Overview", icon: LayoutDashboard },
    { name: "RFQ", icon: FileText },
    { name: "Purchase Orders", icon: ShoppingCart },
    { name: "Agreements", icon: FileText },
    { name: "Vendors", icon: Users },
    { name: "Reporting", icon: TrendingUp },
    { name: "Settings", icon: Settings },
];

const projectLinks = [
    { name: "Project Dashboard", icon: FolderKanban },
    { name: "Projects", icon: FolderKanban },
    { name: "WBS Management", icon: Network },
    { name: "Resources", icon: UserRound }, // Changed User to UserRound to match import availability
    { name: "Budget & Cost", icon: CircleDollarSign },
    { name: "Procurement & Material Tracking", icon: GitBranch },
    { name: "Progress Updates", icon: GitBranch },
    { name: "Billings", icon: ReceiptIndianRupee },
    { name: "Projects Reports", icon: FileText },
    { name: "Scheduling & Planning", icon: PenTool },
    { name: "Project Closure", icon: FolderClosed },
];

const plantLinks = [
    { name: "P&M Dashboard", icon: FactoryIcon },
    { name: "Equipment Mgt", icon: Settings },
    { name: "Preventive Maint.", icon: Wrench },
    { name: "Breakdown Mgt", icon: AlertTriangle },
    { name: "Spare Parts", icon: Package },
    { name: "Calibration & Safety", icon: Shield },
    { name: "Equipment Allocation", icon: HandCoins },
    { name: "Equipment Costing", icon: CircleDollarSign },
    { name: "Assets Disposal Transafer", icon: CassetteTape },
    { name: "P&M Reports", icon: TrendingUp },
    { name: "Preventive Planning", icon: PlaneTakeoff },
    { name: "Teams and Technicians", icon: Users },
    { name: "Kanban board", icon: CircuitBoard },
];

// Master structure combining main links with their children
interface ModuleNode {
  name: string;
  icon: React.ElementType;
  children?: { name: string; icon: React.ElementType }[];
}

const APP_STRUCTURE: ModuleNode[] = [
    { name: "Dashboard", icon: Home },
    { name: "Project", icon: FolderKanban, children: projectLinks },
    { name: "Inventory", icon: Package, children: inventoryLinks },
    { name: "Purchase", icon: ShoppingCart, children: purchaseLinks },
    { name: "Production", icon: Factory, children: productionLinks },
    { name: "Quality Control", icon: Shield },
    { name: "Plant & Machinery", icon: FactoryIcon, children: plantLinks },
    { name: "Product Lifecycle", icon: GitBranch },
    { name: "Repair", icon: Wrench },
    { name: "Barcode", icon: ScanLine },
    { name: "Permissions", icon: UserRound },
];

// --- 2. State & Logic ---

const INITIAL_ROLES = ['Admin', 'Manager', 'Site Engineer', 'View-Only'];
const PERMISSION_TYPES = ['view', 'create', 'edit', 'delete'];

// Flatten structure just for initial state generation to ensure every page has a key
const generateInitialPermissions = () => {
  const perms: Record<string, Record<string, Record<string, boolean>>> = {};
  
  INITIAL_ROLES.forEach(role => {
    perms[role] = {};
    
    const processNode = (node: ModuleNode) => {
      // Default state
      perms[role][node.name] = {
        view: role === 'Admin',
        create: role === 'Admin',
        edit: role === 'Admin',
        delete: role === 'Admin',
      };
      if(node.children) {
        node.children.forEach(child => {
            // Note: Names must be unique across the app or this overwrites. 
            // For a real app, use IDs. For this UI demo, names work fine.
            perms[role][child.name] = {
                view: role === 'Admin',
                create: role === 'Admin',
                edit: role === 'Admin',
                delete: role === 'Admin',
            };
        });
      }
    };

    APP_STRUCTURE.forEach(processNode);
  });

  return perms;
};

export const UserPermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<string[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<string>(INITIAL_ROLES[0]);
  const [permissions, setPermissions] = useState(generateInitialPermissions());
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const currentRolePermissions = useMemo(() => {
    return permissions[selectedRole] || {};
  }, [permissions, selectedRole]);

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handlePermissionChange = (pageName: string, type: string, value: boolean) => {
    if (selectedRole === 'Admin' && pageName === 'Permissions' && type === 'view') {
        return; // Prevent lockout
    }

    setPermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [pageName]: {
          ...prev[selectedRole]?.[pageName],
          [type]: value,
        },
      },
    }));
  };

  const handleAddNewRole = () => {
    if (newRoleName && !roles.includes(newRoleName)) {
      const newRole = newRoleName.trim();
      setRoles([...roles, newRole]);
      
      // Init empty perms
      const defaultPerms: Record<string, Record<string, boolean>> = {};
      APP_STRUCTURE.forEach(node => {
        defaultPerms[node.name] = { view: false, create: false, edit: false, delete: false };
        if(node.children) {
            node.children.forEach(c => {
                defaultPerms[c.name] = { view: false, create: false, edit: false, delete: false };
            });
        }
      });

      setPermissions(prev => ({ ...prev, [newRole]: defaultPerms }));
      setSelectedRole(newRole);
      setNewRoleName('');
      setIsModalOpen(false);
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving:', JSON.stringify(permissions, null, 2));
    setStatusMessage({ type: 'success', text: 'Permissions saved successfully!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            User Permissions
          </h1>
          <p className="text-gray-500 mt-1">
            Configure role-based access control matching your sidebar structure.
          </p>
        </div>
        <Button onClick={handleSaveChanges} className="w-full md:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-lg text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Role Selector */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-gray-700" />
              Roles
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Role</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        placeholder="Role Name (e.g. Auditor)" 
                        value={newRoleName} 
                        onChange={e => setNewRoleName(e.target.value)} 
                    />
                </div>
                <DialogFooter>
                   <Button onClick={handleAddNewRole}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-100">
              {roles.map(role => (
                <li key={role}>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-all border-l-4 ${
                      selectedRole === role 
                        ? 'bg-blue-50 border-blue-600 text-blue-700' 
                        : 'border-transparent hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {role}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Right Column: Permissions Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-700" />
                Access Control
                </CardTitle>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                    {selectedRole}
                </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[40%] pl-6">Module / Page</TableHead>
                  {PERMISSION_TYPES.map(t => (
                    <TableHead key={t} className="text-center capitalize w-[15%]">{t}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {APP_STRUCTURE.map((node) => (
                    <React.Fragment key={node.name}>
                        {/* Parent Row */}
                        <TableRow 
                            className={`
                                transition-colors hover:bg-gray-50 
                                ${node.children ? 'cursor-pointer' : ''}
                                ${expandedModules[node.name] ? 'bg-gray-50' : ''}
                            `}
                        >
                            <TableCell className="p-3 pl-4">
                                <div 
                                    className="flex items-center gap-3 font-medium text-gray-900 select-none"
                                    onClick={() => node.children && toggleModule(node.name)}
                                >
                                    {/* Icon & Chevron */}
                                    <div className="flex items-center justify-center w-6">
                                        {node.children ? (
                                            expandedModules[node.name] 
                                                ? <ChevronDown className="w-4 h-4 text-gray-400" /> 
                                                : <ChevronRight className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <span className="w-4" /> // Spacer
                                        )}
                                    </div>
                                    
                                    {/* Module Icon */}
                                    <node.icon className={`w-5 h-5 ${expandedModules[node.name] ? 'text-blue-600' : 'text-gray-500'}`} />
                                    
                                    {/* Name */}
                                    <span>{node.name}</span>
                                </div>
                            </TableCell>
                            
                            {/* Parent Permissions Checkboxes */}
                            {PERMISSION_TYPES.map(type => (
                                <TableCell key={type} className="text-center p-2">
                                    <Checkbox 
                                        checked={currentRolePermissions[node.name]?.[type] || false}
                                        onCheckedChange={(checked) => handlePermissionChange(node.name, type, !!checked)}
                                        // disabled={selectedRole === 'Admin'}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>

                        {/* Children Rows (Accordion Content) */}
                        {node.children && expandedModules[node.name] && node.children.map(child => (
                            <TableRow key={child.name} className="bg-gray-50/30 hover:bg-gray-50 border-b-0">
                                <TableCell className="p-2 pl-16">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-[1px] h-full bg-gray-200 absolute left-10 top-0" /> {/* Vertical Guide Line */}
                                        <child.icon className="w-4 h-4 text-gray-400" />
                                        {child.name}
                                    </div>
                                </TableCell>
                                {PERMISSION_TYPES.map(type => (
                                    <TableCell key={type} className="text-center p-2">
                                        <Checkbox 
                                            checked={currentRolePermissions[child.name]?.[type] || false}
                                            onCheckedChange={(checked) => handlePermissionChange(child.name, type, !!checked)}
                                            // disabled={selectedRole === 'Admin'}
                                            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Shared Components (Tailwind styled) ---

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
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
  };
  const sizes = { default: 'h-10 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs' };
  return <button className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50', variants[variant], sizes[size], className)} ref={ref} {...props} />;
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

// Simplified Dialog Implementation
const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({ open: false, onOpenChange: () => {} });
const Dialog: React.FC<{ children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }> = ({ children, open, onOpenChange }) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
);
const DialogTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean }> = ({ children }) => {
  const { onOpenChange } = React.useContext(DialogContext);
  return React.cloneElement(children, { onClick: () => onOpenChange(true) });
};
const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open, onOpenChange } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg">{children}</div>
    </div>
  );
};
const DialogHeader = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
const DialogFooter = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">{children}</div>;