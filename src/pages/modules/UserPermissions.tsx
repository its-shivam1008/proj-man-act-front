import React, { useState, useMemo } from 'react';
import { Shield, Users, Plus, Save, X, Settings } from 'lucide-react';

// --- Mock Data ---

// List of pages/modules, inspired by your App.tsx
const PAGES_AND_MODULES = [
  'Dashboard',
  'Inventory',
  'Manufacturing',
  'Purchase',
  'Maintenance',
  'Quality',
  'Plant & Machinery',
  'Projects',
  'Budget',
  'Reports',
  'User Permissions', // Can even manage permissions for this page
];

// Default roles
const INITIAL_ROLES = ['Admin', 'Manager', 'Site Engineer', 'View-Only'];

// Function to generate initial permissions
const generateInitialPermissions = () => {
  const perms: Record<string, Record<string, Record<string, boolean>>> = {};

  INITIAL_ROLES.forEach(role => {
    perms[role] = {};
    PAGES_AND_MODULES.forEach(page => {
      // Admin gets all permissions
      if (role === 'Admin') {
        perms[role][page] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
        };
      }
      // Manager gets most, but can't delete or manage permissions
      else if (role === 'Manager') {
        const canDelete = page !== 'User Permissions';
        const canManageUsers = page === 'User Permissions' ? false : true;
        perms[role][page] = {
          view: true,
          create: canManageUsers,
          edit: canManageUsers,
          delete: canDelete && page !== 'Projects',
        };
      }
      // Site Engineer gets specific permissions
      else if (role === 'Site Engineer') {
        const viewOnly = ['Dashboard', 'Reports', 'Budget'];
        const canEdit = ['Plant & Machinery', 'Maintenance'];
        perms[role][page] = {
          view: true,
          create: canEdit.includes(page),
          edit: canEdit.includes(page),
          delete: false,
        };
        if (viewOnly.includes(page)) {
          perms[role][page] = { view: true, create: false, edit: false, delete: false };
        }
        if (page === 'User Permissions' || page === 'Purchase') {
          perms[role][page] = { view: false, create: false, edit: false, delete: false };
        }
      }
      // View-Only gets... view only
      else if (role === 'View-Only') {
        const canView = ['Dashboard', 'Reports', 'Projects'];
        perms[role][page] = {
          view: canView.includes(page),
          create: false,
          edit: false,
          delete: false,
        };
      }
    });
  });

  return perms;
};

const PERMISSION_TYPES = ['view', 'create', 'edit', 'delete'];


/**
 * The main page component for managing user roles and permissions.
 */
export const UserPermissionsPage: React.FC = () => {
  const [roles, setRoles] = useState<string[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<string>(INITIAL_ROLES[0]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>(
    generateInitialPermissions()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Memoized permissions for the selected role to optimize rendering
  const currentRolePermissions = useMemo(() => {
    return permissions[selectedRole] || {};
  }, [permissions, selectedRole]);

  // Handler for toggling a permission checkbox
  const handlePermissionChange = (page: string, permissionType: string, value: boolean) => {
    if (selectedRole === 'Admin' && page === 'User Permissions' && permissionType === 'view') {
        // Prevent Admin from locking themselves out
        setStatusMessage({ type: 'error', text: 'Admin must always have view access to User Permissions.' });
        setTimeout(() => setStatusMessage(null), 3000);
        return;
    }

    setPermissions(prevPerms => ({
      ...prevPerms,
      [selectedRole]: {
        ...prevPerms[selectedRole],
        [page]: {
          ...prevPerms[selectedRole][page],
          [permissionType]: value,
        },
      },
    }));
  };

  // Handler for adding a new role
  const handleAddNewRole = () => {
    if (newRoleName && !roles.includes(newRoleName)) {
      const newRole = newRoleName.trim();
      setRoles([...roles, newRole]);
      
      // Initialize default (no) permissions for the new role
      const defaultPerms: Record<string, Record<string, boolean>> = {};
      PAGES_AND_MODULES.forEach(page => {
        defaultPerms[page] = { view: false, create: false, edit: false, delete: false };
      });

      setPermissions(prevPerms => ({
        ...prevPerms,
        [newRole]: defaultPerms,
      }));
      
      setSelectedRole(newRole);
      setNewRoleName('');
      setIsModalOpen(false);
      setStatusMessage({ type: 'success', text: `Role "${newRole}" added successfully.` });
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (roles.includes(newRoleName)) {
      setStatusMessage({ type: 'error', text: 'This role name already exists.' });
    } else {
      setStatusMessage({ type: 'error', text: 'Please enter a valid role name.' });
    }
  };

  // Handler for "Save Changes" button
  const handleSaveChanges = () => {
    // In a real app, this is where you'd send the `permissions` object to your API
    console.log('Saving permissions:', JSON.stringify(permissions, null, 2));
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
            Configure roles and module access for all users.
          </p>
        </div>
        <Button onClick={handleSaveChanges} className="w-full md:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-lg text-sm ${
          statusMessage.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Role Management */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-700" />
              Roles
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a New Role</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new role. You can configure its permissions after adding it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <label htmlFor="newRoleName" className="text-sm font-medium text-gray-700">Role Name</label>
                    <Input
                        id="newRoleName"
                        placeholder="e.g., 'Quality Inspector'"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                    />
                    {statusMessage && statusMessage.type === 'error' && (
                        <p className="text-sm text-red-600">{statusMessage.text}</p>
                    )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setIsModalOpen(false); setStatusMessage(null); }}>Cancel</Button>
                  <Button onClick={handleAddNewRole}>Create Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {roles.map(role => (
                <li key={role}>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedRole === role ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                    }`}
                  >
                    {role}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Right Column: Permissions Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-700" />
              Permissions for: 
              <Badge variant="secondary" className="text-base ml-2">{selectedRole}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Module / Page</TableHead>
                    <TableHead className="text-center">View</TableHead>
                    <TableHead className="text-center">Create</TableHead>
                    <TableHead className="text-center">Edit</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PAGES_AND_MODULES.map(page => (
                    <TableRow key={page}>
                      <TableCell className="font-medium">{page}</TableCell>
                      {PERMISSION_TYPES.map(type => (
                        <TableCell key={type} className="text-center">
                          <Checkbox
                            checked={currentRolePermissions[page]?.[type] || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(page, type, !!checked)
                            }
                            // Disable checkbox for Admin on User Permissions page to prevent lockout
                            disabled={selectedRole === 'Admin' && page === 'User Permissions'}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// --- Minimalist shadcn/ui Component Mocks ---
// These are minimal, self-contained components styled with Tailwind
// to mimic the look and feel from your Dashboard.tsx

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Card
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn('rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm', className)}
    {...props}
  />
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

const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      outline: 'border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      ghost: 'hover:bg-gray-100 hover:text-gray-900',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

// Badge
const Badge: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' }> =
  ({ className, variant = 'default', ...props }) => {
    const variants = {
      default: 'bg-blue-600 text-white',
      secondary: 'bg-gray-100 text-gray-900',
      destructive: 'bg-red-600 text-white',
    };
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  };

// Checkbox
const Checkbox: React.FC<Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { onCheckedChange?: (checked: boolean) => void }> = 
  ({ className, checked, onCheckedChange, ...props }) => {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
            className={cn(
                'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
            {...props}
        />
    );
};

// Table Components
const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
);
const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);
const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);
const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('border-b border-gray-200 transition-colors hover:bg-gray-50', className)} {...props} />
);
const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('h-12 px-4 text-left align-middle font-medium text-gray-500', className)} {...props} />
);
const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('p-4 align-middle', className)} {...props} />
);

// Input
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input
        className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
            className
        )}
        {...props}
    />
);

// Dialog Components
const Dialog: React.FC<{ children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }> = ({ children, open, onOpenChange }) => {
    if (!open) {
        return <>{React.Children.toArray(children).find(child => (child as React.ReactElement).type === DialogTrigger)}</>;
    }
    return (
        <>
            {React.Children.toArray(children).find(child => (child as React.ReactElement).type === DialogTrigger)}
            <div 
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" 
              onClick={() => onOpenChange(false)}
            />
            {React.Children.toArray(children).find(child => (child as React.ReactElement).type === DialogContent)}
        </>
    );
};

const DialogTrigger: React.FC<{ children: React.ReactElement, asChild?: boolean }> = ({ children, asChild }) => {
    const child = React.Children.only(children);
    return React.cloneElement(child, {
        ...child.props,
        onClick: () => {
            // This is a simplified trigger. In the real component, it would call onOpenChange(true) from context.
            // Here, the parent Dialog's onOpenChange handles the click on the trigger.
            // This is a bit of a hack to make it work in this structure.
            const parent = child.props.onClick;
            if(parent) parent();
        }
    });
};

const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
    <div
        className={cn(
            'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-white p-6 shadow-lg rounded-xl',
            className
        )}
        {...props}
    >
        {children}
        <button 
          onClick={() => {
            // This is a simplified close. In a real app, this would be handled by context.
            // We assume the parent Dialog's onOpenChange is available somehow.
            // This implementation is incomplete without context.
          }} 
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
        >
            {/* The Dialog's onOpenChange handles the backdrop click, this is just visual */}
            {/* <X className="h-4 w-4" /> */}
        </button>
    </div>
);

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
    <p className={cn('text-sm text-gray-500', className)} {...props} />
);

const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);