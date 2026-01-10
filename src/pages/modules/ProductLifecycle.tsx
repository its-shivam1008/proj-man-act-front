import { useState } from "react";
import {
  BarChart3,
  FileText,
  Folder,
  CheckCircle,
  Users,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

/* ================= IMPORT TABS ================= */

import OverviewTab from "../../pages/modules/ProductLifecycleManagement/OverviewTab";
import EcosTab from "../../pages/modules/ProductLifecycleManagement/EcosTab";
import DocumentsTab from "../../pages/modules/ProductLifecycleManagement/DocumentsTab";
import TeamsTab from "../../pages/modules/ProductLifecycleManagement/TemsTab";
import ReportsTab from "../../pages/modules/ProductLifecycleManagement/ReportsTab";
import CollaborationTab from "./ProductLifecycleManagement/CollaborationTab";

/* ================= MOCK DATA (REPLACE WITH API) ================= */

const mockEcos: any[] = [];
const mockDocuments: any[] = [];
const mockTeams: any[] = [];

/* ================= MAIN PAGE ================= */

const ProductLifecycle = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-xl font-semibold">Product Lifecycle Management</h1>
        <p className="text-sm text-gray-500">
          Manage engineering changes, BoM versions, documents, and approval workflows
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white rounded-xl shadow">
        <div className="flex flex-wrap gap-6 px-6 pt-4 border-b text-sm font-medium">
          <TabButton
            icon={BarChart3}
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            icon={FileText}
            label="Engineering Change Orders"
            active={activeTab === "ecos"}
            onClick={() => setActiveTab("ecos")}
          />
          <TabButton
            icon={Folder}
            label="Document Management"
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
          />
          <TabButton
            icon={CheckCircle}
            label="Approval Workflow"
            active={activeTab === "approval"}
            onClick={() => setActiveTab("approval")}
          />
          <TabButton
            icon={Users}
            label="Engineering Teams"
            active={activeTab === "teams"}
            onClick={() => setActiveTab("teams")}
          />
          <TabButton
            icon={MessageSquare}
            label="Collaboration"
            active={activeTab === "collaboration"}
            onClick={() => setActiveTab("collaboration")}
          />
          <TabButton
            icon={TrendingUp}
            label="Reports & Analytics"
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
          />
        </div>

        {/* TAB CONTENT */}
        <div className="p-6">
          {activeTab === "overview" && <OverviewTab ecos={mockEcos} />}

          {activeTab === "ecos" && <EcosTab ecos={mockEcos} />}

          {activeTab === "documents" && (
            <DocumentsTab documents={mockDocuments} />
          )}

          {activeTab === "approval" && (
            <Placeholder title="Approval Workflow" />
          )}

          {activeTab === "teams" && <TeamsTab teams={mockTeams} />}

         {activeTab === "collaboration" && <CollaborationTab />}

          {activeTab === "reports" && <ReportsTab />}
        </div>
      </div>
    </div>
  );
};

/* ================= TAB BUTTON ================= */

const TabButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 border-b-2 transition ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-800"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

/* ================= PLACEHOLDER ================= */

const Placeholder = ({ title }: { title: string }) => (
  <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
    {title} module coming soon
  </div>
);

export default ProductLifecycle;



// import React, { useState, useEffect } from 'react';
// import { storage, STORAGE_KEYS } from '@/lib/storage';
// // import Layout from '../../components/Layout';
// import { GitBranch, Plus, FileText, Clock, CheckCircle, AlertTriangle, Search, Filter, Eye, Edit, Trash2, Download, Upload, MessageSquare, Users, Calendar, Package, Settings, BarChart3, XCircle, User, Paperclip, Send, ArrowRight, ArrowLeft, GitCompare as Compare, Archive, FileImage, File as FilePdf, FileCode, Layers, Target, TrendingUp, DollarSign, ShieldAlert } from 'lucide-react';
// import { usePermission } from '@/hooks/userPermission';

// const ProductLifecycle: React.FC = () => {
//   const [engineeringChangeOrders, setEngineeringChangeOrders] = useState<any[]>([]);
//   const [bomVersions, setBomVersions] = useState<any[]>([]);
//   const [productDocuments, setProductDocuments] = useState<any[]>([]);
//   const [engineeringTeams, setEngineeringTeams] = useState<any[]>([]);
//   const [ecoComments, setEcoComments] = useState<any[]>([]);
//   const [inventory, setInventory] = useState<any[]>([]);
//   const [activeTab, setActiveTab] = useState('overview');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [typeFilter, setTypeFilter] = useState('all');
//   const [priorityFilter, setPriorityFilter] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showCreateEcoForm, setShowCreateEcoForm] = useState(false);
//   const [showBomVersionForm, setShowBomVersionForm] = useState(false);
//   const [showDocumentForm, setShowDocumentForm] = useState(false);
//   const [showTeamForm, setShowTeamForm] = useState(false);
//   const [showUpdateEcoForm, setShowUpdateEcoForm] = useState(false);
//   const [showViewEcoModal, setShowViewEcoModal] = useState(false);
//   const [showViewDocumentModal, setShowViewDocumentModal] = useState(false);
//   // const [showViewBomModal, setShowViewBomModal] = useState(false);
//   const [selectedEco, setSelectedEco] = useState<string | null>(null);
//   // const [selectedBomVersions, setSelectedBomVersions] = useState<string[]>([]);
//   const [newComment, setNewComment] = useState('');
//   const [editingEco, setEditingEco] = useState<any>(null);
//   const [viewingEco, setViewingEco] = useState<any>(null);
//   const [viewingDocument, setViewingDocument] = useState<any>(null);
//   // const [viewingBom, setViewingBom] = useState<any>(null);
//   // New states for advanced reports
//   const [reportDateRange, setReportDateRange] = useState('last30days');
//   const [selectedReport, setSelectedReport] = useState('eco-summary');

//   const canView = usePermission('productLifecycle', 'view');

//   useEffect(() => {
//     setEngineeringChangeOrders(storage.get(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, []));
//     setBomVersions(storage.get(STORAGE_KEYS.BOM_VERSIONS, []));
//     setProductDocuments(storage.get(STORAGE_KEYS.PRODUCT_DOCUMENTS, []));
//     setEngineeringTeams(storage.get(STORAGE_KEYS.ENGINEERING_TEAMS, []));
//     setEcoComments(storage.get(STORAGE_KEYS.ECO_COMMENTS, []));
//     setInventory(storage.get(STORAGE_KEYS.INVENTORY, []));
//   }, []);

//   // CRUD Functions
//   const addEngineeringChangeOrder = (eco: any) => {
//     storage.push(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, eco);
//     setEngineeringChangeOrders(storage.get(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, []));
//   };

//   const updateEngineeringChangeOrder = (id: string, updated: Partial<any>) => {
//     storage.updateById(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, id, updated);
//     setEngineeringChangeOrders(storage.get(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, []));
//   };

//   const deleteEngineeringChangeOrder = (id: string) => {
//     storage.deleteById(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, id);
//     setEngineeringChangeOrders(storage.get(STORAGE_KEYS.ENGINEERING_CHANGE_ORDERS, []));
//   };

//   const addProductDocument = (doc: any) => {
//     storage.push(STORAGE_KEYS.PRODUCT_DOCUMENTS, doc);
//     setProductDocuments(storage.get(STORAGE_KEYS.PRODUCT_DOCUMENTS, []));
//   };

//   const deleteProductDocument = (id: string) => {
//     storage.deleteById(STORAGE_KEYS.PRODUCT_DOCUMENTS, id);
//     setProductDocuments(storage.get(STORAGE_KEYS.PRODUCT_DOCUMENTS, []));
//   };

//   const addEngineeringTeam = (team: any) => {
//     storage.push(STORAGE_KEYS.ENGINEERING_TEAMS, team);
//     setEngineeringTeams(storage.get(STORAGE_KEYS.ENGINEERING_TEAMS, []));
//   };

//   const deleteEngineeringTeam = (id: string) => {
//     storage.deleteById(STORAGE_KEYS.ENGINEERING_TEAMS, id);
//     setEngineeringTeams(storage.get(STORAGE_KEYS.ENGINEERING_TEAMS, []));
//   };

//   const addEcoComment = (comment: any) => {
//     storage.push(STORAGE_KEYS.ECO_COMMENTS, comment);
//     setEcoComments(storage.get(STORAGE_KEYS.ECO_COMMENTS, []));
//   };

//   const deleteEcoComment = (id: string) => {
//     storage.deleteById(STORAGE_KEYS.ECO_COMMENTS, id);
//     setEcoComments(storage.get(STORAGE_KEYS.ECO_COMMENTS, []));
//   };

//   const tabs = [
//     { id: 'overview', name: 'Overview', icon: BarChart3 },
//     { id: 'ecos', name: 'Engineering Change Orders', icon: FileText },
//     // { id: 'bom-versions', name: 'BoM Versioning', icon: Layers },
//     { id: 'documents', name: 'Document Management', icon: FileImage },
//     { id: 'approval-workflow', name: 'Approval Workflow', icon: CheckCircle },
//     { id: 'teams', name: 'Engineering Teams', icon: Users },
//     { id: 'collaboration', name: 'Collaboration', icon: MessageSquare },
//     { id: 'reports', name: 'Reports & Analytics', icon: TrendingUp },
//     // { id: 'settings', name: 'Settings', icon: Settings }
//   ];

//   const filteredEcos = engineeringChangeOrders.filter(eco => {
//     const matchesSearch = eco.ecoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          eco.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          eco.description.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = statusFilter === 'all' || eco.stage === statusFilter;
//     const matchesType = typeFilter === 'all' || eco.type === typeFilter;
//     const matchesPriority = priorityFilter === 'all' || eco.priority === priorityFilter;
//     return matchesSearch && matchesStatus && matchesType && matchesPriority;
//   });

//   const getStageColor = (stage: string) => {
//     switch (stage) {
//       case 'new':
//         return 'bg-blue-100 text-blue-800';
//       case 'under-review':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'approved':
//         return 'bg-green-100 text-green-800';
//       case 'applied':
//         return 'bg-purple-100 text-purple-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getTypeColor = (type: string) => {
//     switch (type) {
//       case 'bom':
//         return 'bg-blue-100 text-blue-800';
//       case 'document':
//         return 'bg-green-100 text-green-800';
//       case 'product-variant':
//         return 'bg-purple-100 text-purple-800';
//       case 'routing':
//         return 'bg-orange-100 text-orange-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'low':
//         return 'bg-green-100 text-green-800';
//       case 'medium':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'high':
//         return 'bg-orange-100 text-orange-800';
//       case 'critical':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStageIcon = (stage: string) => {
//     switch (stage) {
//       case 'new':
//         return <FileText className="h-5 w-5 text-blue-500" />;
//       case 'under-review':
//         return <Clock className="h-5 w-5 text-yellow-500" />;
//       case 'approved':
//         return <CheckCircle className="h-5 w-5 text-green-500" />;
//       case 'applied':
//         return <CheckCircle className="h-5 w-5 text-purple-500" />;
//       case 'cancelled':
//         return <XCircle className="h-5 w-5 text-red-500" />;
//       default:
//         return null;
//     }
//   };

//   const getFileTypeIcon = (fileType: string) => {
//     if (fileType.includes('pdf')) return <FilePdf className="h-5 w-5 text-red-500" />;
//     if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-blue-500" />;
//     if (fileType.includes('cad') || fileType.includes('dwg')) return <FileCode className="h-5 w-5 text-green-500" />;
//     return <FileText className="h-5 w-5 text-gray-500" />;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'bg-green-100 text-green-800';
//       case 'draft':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'archived':
//         return 'bg-gray-100 text-gray-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   // Helper for date filtering in reports
//   const getFilteredEcosByDate = (ecos: any[], range: string) => {
//     const now = new Date();
//     let startDate: Date;
//     switch (range) {
//       case 'last7days':
//         startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//         break;
//       case 'last30days':
//         startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//         break;
//       case 'last90days':
//         startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
//         break;
//       case 'all':
//         return ecos;
//       default:
//         startDate = new Date(0);
//     }
//     return ecos.filter(eco => new Date(eco.effectiveDate) >= startDate);
//   };

//   // Advanced report data processors
//   const getEcosByStage = (ecos: any[]) => {
//     const counts = { new: 0, 'under-review': 0, approved: 0, applied: 0, cancelled: 0 };
//     ecos.forEach(eco => counts[eco.stage as keyof typeof counts]++);
//     return counts;
//   };

//   const getEcosByType = (ecos: any[]) => {
//     const counts = { bom: 0, document: 0, 'product-variant': 0, routing: 0 };
//     ecos.forEach(eco => counts[eco.type as keyof typeof counts]++);
//     return counts;
//   };

//   const getEcosByPriority = (ecos: any[]) => {
//     const counts = { low: 0, medium: 0, high: 0, critical: 0 };
//     ecos.forEach(eco => counts[eco.priority as keyof typeof counts]++);
//     return counts;
//   };

//   const getApprovalTimes = (ecos: any[]) => {
//     const times: number[] = [];
//     ecos.forEach(eco => {
//       if (eco.approvers) {
//         const approvedDate = eco.approvers.find((a: any) => a.status === 'approved')?.date;
//         if (approvedDate) {
//           const createdDate = new Date(eco.effectiveDate);
//           times.push((new Date(approvedDate).getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
//         }
//       }
//     });
//     const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
//     const max = Math.max(...times, 0);
//     return { average: avg.toFixed(1), max, count: times.length };
//   };

//   const getCostImpact = (ecos: any[]) => {
//     const totalCost = ecos.reduce((sum, eco) => sum + (eco.estimatedCost || 0), 0);
//     const highImpact = ecos.filter(eco => (eco.estimatedCost || 0) > 10000).length;
//     return { total: totalCost, highImpact, average: totalCost / (ecos.length || 1) };
//   };

//   const getBomChanges = (versions: any[]) => {
//     const changesByProduct: { [key: string]: number } = {};
//     versions.forEach(version => {
//       changesByProduct[version.product] = (changesByProduct[version.product] || 0) + 1;
//     });
//     return changesByProduct;
//   };

//   const getDocumentStats = (docs: any[]) => {
//     const byType = { drawing: 0, specification: 0, cad: 0, other: 0 };
//     const totalSize = docs.reduce((sum, doc) => sum + doc.fileSize, 0);
//     docs.forEach(doc => byType[doc.type as keyof typeof byType]++);
//     return { byType, totalSize: (totalSize / 1024 / 1024).toFixed(2), totalCount: docs.length };
//   };

//   const filteredEcosForReports = getFilteredEcosByDate(engineeringChangeOrders, reportDateRange);
//   const ecosByStage = getEcosByStage(filteredEcosForReports);
//   const ecosByType = getEcosByType(filteredEcosForReports);
//   const ecosByPriority = getEcosByPriority(filteredEcosForReports);
//   const approvalTimes = getApprovalTimes(filteredEcosForReports);
//   const costImpact = getCostImpact(filteredEcosForReports);
//   const bomChanges = getBomChanges(bomVersions);
//   const documentStats = getDocumentStats(productDocuments);

//   // Missing Form: Create ECO Form (with state)
//   const CreateEcoForm = () => {
//     const [formData, setFormData] = useState({
//       type: '',
//       product: '',
//       currentBomVersion: '',
//       proposedBomVersion: '',
//       description: '',
//       changeReason: '',
//       priority: '',
//       effectiveDate: '',
//       estimatedCost: '',
//       notes: '',
//       documents: [] as File[],
//       approvers: [] as string[]
//     });
//     const handleSubmit = (e: React.FormEvent) => {
//       e.preventDefault();
//       addEngineeringChangeOrder({
//         ...formData,
//         id: Date.now().toString(),
//         ecoNumber: `ECO-${Date.now()}`,
//         stage: 'new',
//         requestedBy: 'Current User',
//         approvers: engineeringTeams.flatMap(team => team.members).slice(0, 3).map(m => ({ userId: m.userId, name: m.name, status: 'pending', date: '' }))
//       });
//       setShowCreateEcoForm(false);
//       setFormData({
//         type: '',
//         product: '',
//         currentBomVersion: '',
//         proposedBomVersion: '',
//         description: '',
//         changeReason: '',
//         priority: '',
//         effectiveDate: '',
//         estimatedCost: '',
//         notes: '',
//         documents: [],
//         approvers: []
//       });
//     };


//     if (!canView) {
//     return (
//       <div className="text-center py-12 px-4">
//         <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
//         <p className="text-gray-600">You do not have the necessary permissions to view this page.</p>
//       </div>
//     );
//   }

//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Create Engineering Change Order</h3>
//               <button
//                 onClick={() => setShowCreateEcoForm(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     ECO Type *
//                   </label>
//                   <select
//                     value={formData.type}
//                     onChange={(e) => setFormData({...formData, type: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="">Select Type</option>
//                     <option value="bom">BoM Change</option>
//                     <option value="document">Document Update</option>
//                     <option value="product-variant">Product Variant</option>
//                     <option value="routing">Routing Change</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Product *
//                   </label>
//                   <select
//                     value={formData.product}
//                     onChange={(e) => setFormData({...formData, product: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="">Select Product</option>
//                     {inventory.map(item => (
//                       <option key={item.id} value={item.name}>{item.name}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Current BoM Version
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.currentBomVersion}
//                     onChange={(e) => setFormData({...formData, currentBomVersion: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., v2.0"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Proposed BoM Version
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.proposedBomVersion}
//                     onChange={(e) => setFormData({...formData, proposedBomVersion: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="e.g., v2.1"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Description *
//                 </label>
//                 <textarea
//                   rows={3}
//                   value={formData.description}
//                   onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Detailed description of the change..."
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Change Reason *
//                   </label>
//                   <select
//                     value={formData.changeReason}
//                     onChange={(e) => setFormData({...formData, changeReason: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="">Select Reason</option>
//                     <option value="design-improvement">Design Improvement</option>
//                     <option value="compliance">Compliance</option>
//                     <option value="defect">Defect Fix</option>
//                     <option value="cost-reduction">Cost Reduction</option>
//                     <option value="customer-request">Customer Request</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Priority *
//                   </label>
//                   <select
//                     value={formData.priority}
//                     onChange={(e) => setFormData({...formData, priority: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="">Select Priority</option>
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                     <option value="critical">Critical</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Effective Date *
//                   </label>
//                   <input
//                     type="date"
//                     value={formData.effectiveDate}
//                     onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Estimated Cost
//                   </label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={formData.estimatedCost}
//                     onChange={(e) => setFormData({...formData, estimatedCost: parseFloat(e.target.value) || 0})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     placeholder="0.00"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Approval Required From
//                 </label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {engineeringTeams.flatMap(team => team.members).map(member => (
//                     <label key={member.userId} className="flex items-center">
//                       <input
//                         type="checkbox"
//                         checked={formData.approvers.includes(member.userId)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             setFormData({...formData, approvers: [...formData.approvers, member.userId]});
//                           } else {
//                             setFormData({...formData, approvers: formData.approvers.filter(id => id !== member.userId)});
//                           }
//                         }}
//                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span className="ml-2 text-sm text-gray-700">{member.name}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Documents
//                 </label>
//                 <input
//                   type="file"
//                   multiple
//                   onChange={(e) => setFormData({...formData, documents: Array.from(e.target.files || [])})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">Upload technical drawings, specifications, or related documents</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Notes
//                 </label>
//                 <textarea
//                   rows={3}
//                   value={formData.notes}
//                   onChange={(e) => setFormData({...formData, notes: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Additional notes or comments..."
//                 />
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateEcoForm(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Create ECO
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Update ECO Form
//   const UpdateEcoForm = () => {
//     const [formData, setFormData] = useState(editingEco || {});
//     const handleSubmit = (e: React.FormEvent) => {
//       e.preventDefault();
//       updateEngineeringChangeOrder(editingEco.id, formData);
//       setShowUpdateEcoForm(false);
//       setEditingEco(null);
//     };
//     if (!editingEco) return null;
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Update Engineering Change Order</h3>
//               <button
//                 onClick={() => {
//                   setShowUpdateEcoForm(false);
//                   setEditingEco(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                 <textarea
//                   rows={3}
//                   value={formData.description || ''}
//                   onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
//                   <select
//                     value={formData.priority || ''}
//                     onChange={(e) => setFormData({...formData, priority: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                     <option value="critical">Critical</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
//                   <select
//                     value={formData.stage || ''}
//                     onChange={(e) => setFormData({...formData, stage: e.target.value})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     required
//                   >
//                     <option value="new">New</option>
//                     <option value="under-review">Under Review</option>
//                     <option value="approved">Approved</option>
//                     <option value="applied">Applied</option>
//                     <option value="cancelled">Cancelled</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowUpdateEcoForm(false);
//                     setEditingEco(null);
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                 >
//                   Update ECO
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // View ECO Modal
//   const ViewEcoModal = () => {
//     if (!viewingEco) return null;
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">View ECO: {viewingEco.ecoNumber}</h3>
//               <button
//                 onClick={() => {
//                   setShowViewEcoModal(false);
//                   setViewingEco(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
//                 <p className="text-sm text-gray-900">{viewingEco.product}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(viewingEco.type)}`}>
//                   {viewingEco.type.replace('-', ' ')}
//                 </span>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                 <p className="text-sm text-gray-900">{viewingEco.description}</p>
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
//                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(viewingEco.priority)}`}>
//                     {viewingEco.priority}
//                   </span>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
//                   <div className="flex items-center">
//                     {getStageIcon(viewingEco.stage)}
//                     <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(viewingEco.stage)}`}>
//                       {viewingEco.stage.replace('-', ' ')}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
//                 <p className="text-sm text-gray-900">{viewingEco.effectiveDate}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
//                 <p className="text-sm text-gray-900">{viewingEco.requestedBy}</p>
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => {
//                     setShowViewEcoModal(false);
//                     setViewingEco(null);
//                     setEditingEco(viewingEco);
//                     setShowUpdateEcoForm(true);
//                   }}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowViewEcoModal(false);
//                     setViewingEco(null);
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // View BoM Version Modal
//   // const ViewBomModal = () => {
//   //   if (!viewingBom) return null;
//   //   return (
//   //     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//   //       <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//   //         <div className="mt-3">
//   //           <div className="flex items-center justify-between mb-4">
//   //             <h3 className="text-lg font-medium text-gray-900">View BoM Version: {viewingBom.bomNumber} - {viewingBom.version}</h3>
//   //             <button
//   //               onClick={() => {
//   //                 setShowViewBomModal(false);
//   //                 setViewingBom(null);
//   //               }}
//   //               className="text-gray-400 hover:text-gray-600"
//   //             >
//   //               <XCircle className="h-6 w-6" />
//   //             </button>
//   //           </div>
//   //           <div className="space-y-4">
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
//   //               <p className="text-sm text-gray-900">{viewingBom.product}</p>
//   //             </div>
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
//   //               <p className="text-sm font-medium text-blue-600">{viewingBom.version}</p>
//   //             </div>
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//   //               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingBom.status)}`}>
//   //                 {viewingBom.status}
//   //               </span>
//   //             </div>
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
//   //               <p className="text-sm text-gray-900">{viewingBom.createdBy}</p>
//   //             </div>
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
//   //               <p className="text-sm text-gray-900">{viewingBom.createdDate}</p>
//   //             </div>
//   //             <div>
//   //               <label className="block text-sm font-medium text-gray-700 mb-1">Components</label>
//   //               <div className="bg-gray-50 p-3 rounded-lg">
//   //                 {viewingBom.components.length > 0 ? (
//   //                   <ul className="space-y-1 text-sm text-gray-900">
//   //                     {viewingBom.components.map((component: string, index: number) => (
//   //                       <li key={index} className="flex items-center">
//   //                         <Layers className="h-3 w-3 mr-2 text-gray-400" />
//   //                         {component}
//   //                       </li>
//   //                     ))}
//   //                   </ul>
//   //                 ) : (
//   //                   <p className="text-sm text-gray-500">No components defined</p>
//   //                 )}
//   //               </div>
//   //             </div>
//   //             <div className="flex justify-end space-x-3 pt-4">
//   //               <button
//   //                 onClick={() => {
//   //                   setShowViewBomModal(false);
//   //                   setViewingBom(null);
//   //                 }}
//   //                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//   //               >
//   //                 Close
//   //               </button>
//   //             </div>
//   //           </div>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   );
//   // };

//   // New: View Document Modal (Read)
//   const ViewDocumentModal = () => {
//     if (!viewingDocument) return null;
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">View Document: {viewingDocument.documentName}</h3>
//               <button
//                 onClick={() => {
//                   setShowViewDocumentModal(false);
//                   setViewingDocument(null);
//                 }}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                   viewingDocument.type === 'drawing' ? 'bg-blue-100 text-blue-800' :
//                   viewingDocument.type === 'specification' ? 'bg-green-100 text-green-800' :
//                   viewingDocument.type === 'cad' ? 'bg-purple-100 text-purple-800' :
//                   'bg-gray-100 text-gray-800'
//                 }`}>
//                   {viewingDocument.type}
//                 </span>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                 <p className="text-sm text-gray-900">{viewingDocument.description || 'No description'}</p>
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Linked To</label>
//                   <p className="text-sm text-gray-900">{viewingDocument.linkedTo.type}: {viewingDocument.linkedTo.id}</p>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
//                   <p className="text-sm font-medium text-blue-600">{viewingDocument.version || 'N/A'}</p>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded By</label>
//                 <p className="text-sm text-gray-900">{viewingDocument.uploadedBy}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
//                 <p className="text-sm text-gray-900">{viewingDocument.uploadDate}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
//                 <p className="text-sm text-gray-900">{(viewingDocument.fileSize / 1024 / 1024).toFixed(2)} MB</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
//                 <div className="flex items-center">
//                   {getFileTypeIcon(viewingDocument.fileType)}
//                   <span className="ml-2 text-sm text-gray-900">{viewingDocument.fileType}</span>
//                 </div>
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => window.open(viewingDocument.fileUrl || '#', '_blank')} // Assume fileUrl is available or handle preview
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   Download
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowViewDocumentModal(false);
//                     setViewingDocument(null);
//                   }}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Create BoM Version Form
//   const CreateBomVersionForm = () => {
//     const [formData, setFormData] = useState({
//       bomNumber: '',
//       product: '',
//       version: '',
//       components: [] as string[],
//       status: 'draft'
//     });
//     const handleSubmit = (e: React.FormEvent) => {
//       e.preventDefault();
//       addBomVersion({
//         ...formData,
//         id: Date.now().toString(),
//         createdBy: 'Current User',
//         createdDate: new Date().toISOString().split('T')[0]
//       });
//       setShowBomVersionForm(false);
//       setFormData({
//         bomNumber: '',
//         product: '',
//         version: '',
//         components: [],
//         status: 'draft'
//       });
//     };
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Create BoM Version</h3>
//               <button
//                 onClick={() => setShowBomVersionForm(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">BoM Number *</label>
//                 <input
//                   type="text"
//                   value={formData.bomNumber}
//                   onChange={(e) => setFormData({...formData, bomNumber: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
//                 <select
//                   value={formData.product}
//                   onChange={(e) => setFormData({...formData, product: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 >
//                   <option value="">Select Product</option>
//                   {inventory.map(item => (
//                     <option key={item.id} value={item.name}>{item.name}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
//                 <input
//                   type="text"
//                   value={formData.version}
//                   onChange={(e) => setFormData({...formData, version: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="e.g., v2.1"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Components (comma-separated)</label>
//                 <textarea
//                   rows={3}
//                   value={formData.components.join(', ')}
//                   onChange={(e) => setFormData({...formData, components: e.target.value.split(', ').map(c => c.trim()).filter(c => c)})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Component1, Component2, ..."
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                 <select
//                   value={formData.status}
//                   onChange={(e) => setFormData({...formData, status: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   <option value="draft">Draft</option>
//                   <option value="active">Active</option>
//                   <option value="archived">Archived</option>
//                 </select>
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowBomVersionForm(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Create Version
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Create Document Form
//   const CreateDocumentForm = () => {
//     const [formData, setFormData] = useState({
//       documentName: '',
//       type: '',
//       description: '',
//       linkedTo: { type: '', id: '' },
//       version: '',
//       file: null as File | null
//     });
//     const handleSubmit = (e: React.FormEvent) => {
//       e.preventDefault();
//       if (!formData.file) return;
//       addProductDocument({
//         ...formData,
//         id: Date.now().toString(),
//         uploadedBy: 'Current User',
//         uploadDate: new Date().toISOString().split('T')[0],
//         fileType: formData.file.name.split('.').pop() || '',
//         fileSize: formData.file.size,
//         fileUrl: URL.createObjectURL(formData.file) // For preview/download
//       });
//       setShowDocumentForm(false);
//       setFormData({
//         documentName: '',
//         type: '',
//         description: '',
//         linkedTo: { type: '', id: '' },
//         version: '',
//         file: null
//       });
//     };
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
//               <button
//                 onClick={() => setShowDocumentForm(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
//                 <input
//                   type="text"
//                   value={formData.documentName}
//                   onChange={(e) => setFormData({...formData, documentName: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
//                 <select
//                   value={formData.type}
//                   onChange={(e) => setFormData({...formData, type: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 >
//                   <option value="">Select Type</option>
//                   <option value="drawing">Technical Drawing</option>
//                   <option value="specification">Specification</option>
//                   <option value="cad">CAD File</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                 <textarea
//                   rows={2}
//                   value={formData.description}
//                   onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Linked To Type</label>
//                   <select
//                     value={formData.linkedTo.type}
//                     onChange={(e) => setFormData({...formData, linkedTo: {...formData.linkedTo, type: e.target.value}})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     <option value="">None</option>
//                     <option value="eco">ECO</option>
//                     <option value="bom">BoM</option>
//                     <option value="product">Product</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Linked To ID</label>
//                   <input
//                     type="text"
//                     value={formData.linkedTo.id}
//                     onChange={(e) => setFormData({...formData, linkedTo: {...formData.linkedTo, id: e.target.value}})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
//                 <input
//                   type="text"
//                   value={formData.version}
//                   onChange={(e) => setFormData({...formData, version: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="e.g., v1.0"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
//                 <input
//                   type="file"
//                   onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                   accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx"
//                 />
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowDocumentForm(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Upload Document
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Create Team Form
//   const CreateTeamForm = () => {
//     const [formData, setFormData] = useState({
//       teamName: '',
//       teamLead: '',
//       productCategories: [] as string[],
//       contactInfo: { email: '', phone: '' },
//       members: [] as { userId: string; name: string; availability: string }[]
//     });
//     const handleSubmit = (e: React.FormEvent) => {
//       e.preventDefault();
//       addEngineeringTeam({
//         ...formData,
//         id: Date.now().toString(),
//         members: formData.members.length > 0 ? formData.members : [{ userId: 'default', name: 'Default Member', availability: 'available' }]
//       });
//       setShowTeamForm(false);
//       setFormData({
//         teamName: '',
//         teamLead: '',
//         productCategories: [],
//         contactInfo: { email: '', phone: '' },
//         members: []
//       });
//     };
//     return (
//       <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
//         <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
//           <div className="mt-3">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">Add Engineering Team</h3>
//               <button
//                 onClick={() => setShowTeamForm(false)}
//                 className="text-gray-400 hover:text-gray-600"
//               >
//                 <XCircle className="h-6 w-6" />
//               </button>
//             </div>
          
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
//                 <input
//                   type="text"
//                   value={formData.teamName}
//                   onChange={(e) => setFormData({...formData, teamName: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead *</label>
//                 <input
//                   type="text"
//                   value={formData.teamLead}
//                   onChange={(e) => setFormData({...formData, teamLead: e.target.value})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Product Categories (comma-separated)</label>
//                 <input
//                   type="text"
//                   value={formData.productCategories.join(', ')}
//                   onChange={(e) => setFormData({...formData, productCategories: e.target.value.split(', ').map(c => c.trim()).filter(c => c)})}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Electronics, Mechanical, ..."
//                 />
//               </div>
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
//                   <input
//                     type="email"
//                     value={formData.contactInfo.email}
//                     onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, email: e.target.value}})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
//                   <input
//                     type="tel"
//                     value={formData.contactInfo.phone}
//                     onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, phone: e.target.value}})}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Team Members (format: Name (availability), one per line)</label>
//                 <textarea
//                   rows={3}
//                   value={formData.members.map(m => `${m.name} (${m.availability})`).join('\n')}
//                   onChange={(e) => {
//                     const lines = e.target.value.split('\n').map(line => {
//                       const match = line.match(/^(.+)\s*\((available|busy|unavailable)\)$/);
//                       if (match) {
//                         return { userId: Date.now().toString() + Math.random(), name: match[1].trim(), availability: match[2] };
//                       }
//                       return null;
//                     }).filter((m): m is any => m !== null);
//                     setFormData({...formData, members: lines});
//                   }}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="John Doe (available)\nJane Smith (busy)"
//                 />
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowTeamForm(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 >
//                   Add Team
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderOverview = () => (
//     <div className="space-y-6">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <FileText className="h-6 w-6 text-blue-500" />
//               </div>
//               <div className="ml-5">
//                 <p className="text-sm font-medium text-gray-500">Total ECOs</p>
//                 <p className="text-2xl font-semibold text-gray-900">{engineeringChangeOrders.length}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <Clock className="h-6 w-6 text-yellow-500" />
//               </div>
//               <div className="ml-5">
//                 <p className="text-sm font-medium text-gray-500">Under Review</p>
//                 <p className="text-2xl font-semibold text-gray-900">
//                   {engineeringChangeOrders.filter(eco => eco.stage === 'under-review').length}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <CheckCircle className="h-6 w-6 text-green-500" />
//               </div>
//               <div className="ml-5">
//                 <p className="text-sm font-medium text-gray-500">Approved</p>
//                 <p className="text-2xl font-semibold text-gray-900">
//                   {engineeringChangeOrders.filter(eco => eco.stage === 'approved').length}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//         {/* <div className="bg-white overflow-hidden shadow rounded-lg">
//           <div className="p-5">
//             <div className="flex items-center">
//               <div className="flex-shrink-0">
//                 <Layers className="h-6 w-6 text-purple-500" />
//               </div>
//               <div className="ml-5">
//                 <p className="text-sm font-medium text-gray-500">BoM Versions</p>
//                 <p className="text-2xl font-semibold text-gray-900">{bomVersions.length}</p>
//               </div>
//             </div>
//           </div>
//         </div> */}
//       </div>
//       {/* Quick Actions */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//           <button
//             onClick={() => setShowCreateEcoForm(true)}
//             className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             <Plus className="h-5 w-5 text-gray-400 mr-2" />
//             <span className="text-sm font-medium text-gray-700">New ECO</span>
//           </button>
//           {/* <button
//             onClick={() => setShowBomVersionForm(true)}
//             className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             <Layers className="h-5 w-5 text-gray-400 mr-2" />
//             <span className="text-sm font-medium text-gray-700">Create BoM Version</span>
//           </button> */}
//           <button
//             onClick={() => setShowDocumentForm(true)}
//             className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             <Upload className="h-5 w-5 text-gray-400 mr-2" />
//             <span className="text-sm font-medium text-gray-700">Upload Document</span>
//           </button>
//           <button
//             onClick={() => setActiveTab('reports')}
//             className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
//             <span className="text-sm font-medium text-gray-700">View Reports</span>
//           </button>
//         </div>
//       </div>
//       {/* Recent Activity */}
//       <div className="bg-white shadow rounded-lg">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-medium text-gray-900">Recent ECO Activity</h3>
//         </div>
//         <div className="divide-y divide-gray-200">
//           {engineeringChangeOrders.slice(0, 5).map((eco) => (
//             <div key={eco.id} className="px-6 py-4 flex items-center justify-between">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
//                     eco.stage === 'approved' ? 'bg-green-100' :
//                     eco.stage === 'under-review' ? 'bg-yellow-100' : 'bg-blue-100'
//                   }`}>
//                     {getStageIcon(eco.stage)}
//                   </div>
//                 </div>
//                 <div className="ml-4">
//                   <p className="text-sm font-medium text-gray-900">{eco.ecoNumber}</p>
//                   <p className="text-sm text-gray-500">{eco.product} • {eco.description.substring(0, 50)}...</p>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(eco.priority)}`}>
//                   {eco.priority}
//                 </span>
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(eco.stage)}`}>
//                   {eco.stage.replace('-', ' ')}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   const renderEcos = () => (
//     <div className="space-y-6">
//       {/* Filters */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
//           <div className="relative">
//             <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search ECOs..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="all">All Stages</option>
//             <option value="new">New</option>
//             <option value="under-review">Under Review</option>
//             <option value="approved">Approved</option>
//             <option value="applied">Applied</option>
//             <option value="cancelled">Cancelled</option>
//           </select>
//           <select
//             value={typeFilter}
//             onChange={(e) => setTypeFilter(e.target.value)}
//             className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="all">All Types</option>
//             <option value="bom">BoM</option>
//             <option value="document">Document</option>
//             <option value="product-variant">Product Variant</option>
//             <option value="routing">Routing</option>
//           </select>
//           <select
//             value={priorityFilter}
//             onChange={(e) => setPriorityFilter(e.target.value)}
//             className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           >
//             <option value="all">All Priority</option>
//             <option value="low">Low</option>
//             <option value="medium">Medium</option>
//             <option value="high">High</option>
//             <option value="critical">Critical</option>
//           </select>
//           <button
//             onClick={() => setShowCreateEcoForm(true)}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
//           >
//             <Plus className="h-4 w-4 mr-2" />
//             New ECO
//           </button>
//         </div>
//       </div>
//       {/* ECOs Table */}
//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 ECO Number
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Product
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Type
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Description
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Priority
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Stage
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Requested By
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Effective Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredEcos.map((eco) => (
//               <tr key={eco.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                   {eco.ecoNumber}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <Package className="h-4 w-4 text-gray-400 mr-2" />
//                     <div className="text-sm font-medium text-gray-900">{eco.product}</div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(eco.type)}`}>
//                     {eco.type.replace('-', ' ')}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
//                   {eco.description}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(eco.priority)}`}>
//                     {eco.priority}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     {getStageIcon(eco.stage)}
//                     <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(eco.stage)}`}>
//                       {eco.stage.replace('-', ' ')}
//                     </span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <User className="h-4 w-4 text-gray-400 mr-2" />
//                     <div className="text-sm text-gray-900">{eco.requestedBy}</div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   <div className="flex items-center">
//                     <Calendar className="h-4 w-4 text-gray-400 mr-1" />
//                     {eco.effectiveDate}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => {
//                         setSelectedEco(eco.id);
//                         setViewingEco(eco);
//                         setShowViewEcoModal(true);
//                       }}
//                       className="text-blue-600 hover:text-blue-900"
//                     >
//                       <Eye className="h-4 w-4" />
//                     </button>
//                     <button
//                       onClick={() => {
//                         setEditingEco(eco);
//                         setShowUpdateEcoForm(true);
//                       }}
//                       className="text-green-600 hover:text-green-900"
//                     >
//                       <Edit className="h-4 w-4" />
//                     </button>
//                     <button className="text-purple-600 hover:text-purple-900">
//                       <MessageSquare className="h-4 w-4" />
//                     </button>
//                     <button 
//                       onClick={() => deleteEngineeringChangeOrder(eco.id)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   // const renderBomVersions = () => (
//   //   <div className="space-y-6">
//   //     {/* BoM Version Controls */}
//   //     <div className="bg-white shadow rounded-lg p-6">
//   //       <div className="flex items-center justify-between mb-4">
//   //         <h3 className="text-lg font-medium text-gray-900">BoM Version Management</h3>
//   //         <div className="flex items-center space-x-3">
//   //           <button
//   //             onClick={() => setShowBomVersionForm(true)}
//   //             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
//   //           >
//   //             <Plus className="h-4 w-4 mr-2" />
//   //             Create Version
//   //           </button>
//   //           {selectedBomVersions.length === 2 && (
//   //             <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
//   //               <Compare className="h-4 w-4 mr-2" />
//   //               Compare Versions
//   //             </button>
//   //           )}
//   //         </div>
//   //       </div>
      
//   //       <div className="text-sm text-gray-600 mb-4">
//   //         Select two versions to compare differences. Click on version numbers to select.
//   //       </div>
//   //     </div>
//   //     {/* BoM Versions Table */}
//   //     <div className="bg-white shadow rounded-lg overflow-hidden">
//   //       <table className="min-w-full divide-y divide-gray-200">
//   //         <thead className="bg-gray-50">
//   //           <tr>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Select
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               BoM Number
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Product
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Version
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Components
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Created By
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Created Date
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Status
//   //             </th>
//   //             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   //               Actions
//   //             </th>
//   //           </tr>
//   //         </thead>
//   //         <tbody className="bg-white divide-y divide-gray-200">
//   //           {bomVersions.map((bom) => (
//   //             <tr key={bom.id} className="hover:bg-gray-50">
//   //               <td className="px-6 py-4 whitespace-nowrap">
//   //                 <input
//   //                   type="checkbox"
//   //                   checked={selectedBomVersions.includes(bom.id)}
//   //                   onChange={(e) => {
//   //                     if (e.target.checked) {
//   //                       if (selectedBomVersions.length < 2) {
//   //                         setSelectedBomVersions([...selectedBomVersions, bom.id]);
//   //                       }
//   //                     } else {
//   //                       setSelectedBomVersions(selectedBomVersions.filter(id => id !== bom.id));
//   //                     }
//   //                   }}
//   //                   className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//   //                 />
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//   //                 {bom.bomNumber}
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap">
//   //                 <div className="flex items-center">
//   //                   <Package className="h-4 w-4 text-gray-400 mr-2" />
//   //                   <div className="text-sm font-medium text-gray-900">{bom.product}</div>
//   //                 </div>
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
//   //                 {bom.version}
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//   //                 {bom.components.length} components
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap">
//   //                 <div className="flex items-center">
//   //                   <User className="h-4 w-4 text-gray-400 mr-2" />
//   //                   <div className="text-sm text-gray-900">{bom.createdBy}</div>
//   //                 </div>
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//   //                 <div className="flex items-center">
//   //                   <Calendar className="h-4 w-4 text-gray-400 mr-1" />
//   //                   {bom.createdDate}
//   //                 </div>
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap">
//   //                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//   //                   bom.status === 'active' ? 'bg-green-100 text-green-800' :
//   //                   bom.status === 'archived' ? 'bg-gray-100 text-gray-800' :
//   //                   'bg-yellow-100 text-yellow-800'
//   //                 }`}>
//   //                   {bom.status}
//   //                 </span>
//   //               </td>
//   //               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//   //                 <div className="flex items-center space-x-2">
//   //                   <button
//   //                     onClick={() => {
//   //                       setViewingBom(bom);
//   //                       setShowViewBomModal(true);
//   //                     }}
//   //                     className="text-blue-600 hover:text-blue-900"
//   //                   >
//   //                     <Eye className="h-4 w-4" />
//   //                   </button>
//   //                   <button className="text-green-600 hover:text-green-900">
//   //                     <Edit className="h-4 w-4" />
//   //                   </button>
//   //                   <button className="text-purple-600 hover:text-purple-900">
//   //                     <Archive className="h-4 w-4" />
//   //                   </button>
//   //                   <button 
//   //                     onClick={() => deleteBomVersion(bom.id)}
//   //                     className="text-red-600 hover:text-red-900"
//   //                   >
//   //                     <Trash2 className="h-4 w-4" />
//   //                   </button>
//   //                 </div>
//   //               </td>
//   //             </tr>
//   //           ))}
//   //         </tbody>
//   //       </table>
//   //     </div>
//   //   </div>
//   // );

//   const renderDocuments = () => (
//     <div className="space-y-6">
//       {/* Document Upload */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
//           <button
//             onClick={() => setShowDocumentForm(true)}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
//           >
//             <Upload className="h-4 w-4 mr-2" />
//             Upload Document
//           </button>
//         </div>
      
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
//             <FilePdf className="h-8 w-8 text-blue-500 mx-auto mb-2" />
//             <p className="text-sm font-medium text-blue-800">Technical Drawings</p>
//             <p className="text-xs text-blue-600">{productDocuments.filter(doc => doc.type === 'drawing').length} files</p>
//           </div>
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
//             <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
//             <p className="text-sm font-medium text-green-800">Specifications</p>
//             <p className="text-xs text-green-600">{productDocuments.filter(doc => doc.type === 'specification').length} files</p>
//           </div>
//           <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
//             <FileCode className="h-8 w-8 text-purple-500 mx-auto mb-2" />
//             <p className="text-sm font-medium text-purple-800">CAD Files</p>
//             <p className="text-xs text-purple-600">{productDocuments.filter(doc => doc.type === 'cad').length} files</p>
//           </div>
//           <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
//             <FileImage className="h-8 w-8 text-orange-500 mx-auto mb-2" />
//             <p className="text-sm font-medium text-orange-800">Other Documents</p>
//             <p className="text-xs text-orange-600">{productDocuments.filter(doc => !['drawing', 'specification', 'cad'].includes(doc.type)).length} files</p>
//           </div>
//         </div>
//       </div>
//       {/* Documents Table */}
//       <div className="bg-white shadow rounded-lg overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Document
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Type
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Linked To
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Version
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Uploaded By
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Upload Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Size
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {productDocuments.map((doc) => (
//               <tr key={doc.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     {getFileTypeIcon(doc.fileType)}
//                     <div className="ml-3">
//                       <div className="text-sm font-medium text-gray-900">{doc.documentName}</div>
//                       <div className="text-sm text-gray-500">{doc.description}</div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                     doc.type === 'drawing' ? 'bg-blue-100 text-blue-800' :
//                     doc.type === 'specification' ? 'bg-green-100 text-green-800' :
//                     doc.type === 'cad' ? 'bg-purple-100 text-purple-800' :
//                     'bg-gray-100 text-gray-800'
//                   }`}>
//                     {doc.type}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {doc.linkedTo.type}: {doc.linkedTo.id}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
//                   {doc.version}
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <User className="h-4 w-4 text-gray-400 mr-2" />
//                     <div className="text-sm text-gray-900">{doc.uploadedBy}</div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   <div className="flex items-center">
//                     <Calendar className="h-4 w-4 text-gray-400 mr-1" />
//                     {doc.uploadDate}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                   {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => {
//                         setViewingDocument(doc);
//                         setShowViewDocumentModal(true);
//                       }}
//                       className="text-blue-600 hover:text-blue-900"
//                     >
//                       <Eye className="h-4 w-4" />
//                     </button>
//                     <button className="text-green-600 hover:text-green-900">
//                       <Download className="h-4 w-4" />
//                     </button>
//                     <button 
//                       onClick={() => deleteProductDocument(doc.id)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   const renderApprovalWorkflow = () => (
//     <div className="space-y-6">
//       {/* Approval Pipeline */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-6">Approval Workflow</h3>
      
//         {engineeringChangeOrders.filter(eco => eco.stage === 'under-review' || eco.stage === 'new').map((eco) => (
//           <div key={eco.id} className="border border-gray-200 rounded-lg p-4 mb-4">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h4 className="text-lg font-medium text-gray-900">{eco.ecoNumber}</h4>
//                 <p className="text-sm text-gray-600">{eco.product} - {eco.description}</p>
//               </div>
//               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(eco.priority)}`}>
//                 {eco.priority}
//               </span>
//             </div>
          
//             <div className="space-y-3">
//               {eco.approvers?.map((approver: any, index: number) => (
//                 <div key={approver.userId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center">
//                     <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
//                       approver.status === 'approved' ? 'bg-green-100' :
//                       approver.status === 'rejected' ? 'bg-red-100' :
//                       'bg-yellow-100'
//                     }`}>
//                       {approver.status === 'approved' ? (
//                         <CheckCircle className="h-4 w-4 text-green-600" />
//                       ) : approver.status === 'rejected' ? (
//                         <XCircle className="h-4 w-4 text-red-600" />
//                       ) : (
//                         <Clock className="h-4 w-4 text-yellow-600" />
//                       )}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">{approver.name}</p>
//                       <p className="text-xs text-gray-500">
//                         {approver.status === 'pending' ? 'Approval pending' :
//                          `${approver.status} on ${approver.date}`}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     {approver.status === 'pending' && (
//                       <>
//                         <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
//                           Approve
//                         </button>
//                         <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors">
//                           Reject
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               )) || <p>No approvers assigned</p>}
//             </div>
          
//             {eco.approvers?.every((approver: any) => approver.status !== 'pending') && (
//               <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                 <p className="text-sm text-blue-800">
//                   All approvals completed. ECO ready for implementation.
//                 </p>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   const renderTeams = () => (
//     <div className="space-y-6">
//       {/* Teams Overview */}
//       <div className="bg-white shadow rounded-lg">
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <h3 className="text-lg font-medium text-gray-900">Engineering Teams</h3>
//           <button
//             onClick={() => setShowTeamForm(true)}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
//           >
//             <Plus className="h-4 w-4 mr-2" />
//             Add Team
//           </button>
//         </div>
//         <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
//           {engineeringTeams.map((team) => (
//             <div key={team.id} className="border border-gray-200 rounded-lg p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-lg font-medium text-gray-900">{team.teamName}</h4>
//                 <span className="text-sm text-gray-500">{team.members.length} members</span>
//               </div>
//               <div className="space-y-2">
//                 <div className="flex items-center text-sm text-gray-600">
//                   <User className="h-4 w-4 mr-2" />
//                   Lead: {team.teamLead}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Categories: {team.productCategories.join(', ')}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Contact: {team.contactInfo.email}
//                 </div>
//               </div>
//               <div className="mt-4">
//                 <h5 className="text-sm font-medium text-gray-700 mb-2">Team Members:</h5>
//                 <div className="space-y-1">
//                   {team.members.map((member) => (
//                     <div key={member.userId} className="flex items-center justify-between text-sm">
//                       <span className="text-gray-900">{member.name}</span>
//                       <span className={`px-2 py-1 text-xs rounded-full ${
//                         member.availability === 'available' ? 'bg-green-100 text-green-800' :
//                         member.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
//                         'bg-red-100 text-red-800'
//                       }`}>
//                         {member.availability}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="mt-4 flex justify-end">
//                 <button 
//                   onClick={() => deleteEngineeringTeam(team.id)}
//                   className="text-red-600 hover:text-red-900 flex items-center text-sm"
//                 >
//                   <Trash2 className="h-4 w-4 mr-1" />
//                   Delete Team
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   const renderCollaboration = () => (
//     <div className="space-y-6">
//       {/* ECO Comments */}
//       <div className="bg-white shadow rounded-lg">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-medium text-gray-900">ECO Discussions</h3>
//         </div>
//         <div className="p-6">
//           {engineeringChangeOrders.map((eco) => {
//             const ecoCommentsList = ecoComments.filter(comment => comment.ecoId === eco.id);
//             if (ecoCommentsList.length === 0) return null;
          
//             return (
//               <div key={eco.id} className="mb-8">
//                 <div className="flex items-center justify-between mb-4">
//                   <h4 className="text-lg font-medium text-gray-900">{eco.ecoNumber}</h4>
//                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(eco.stage)}`}>
//                     {eco.stage.replace('-', ' ')}
//                   </span>
//                 </div>
              
//                 <div className="space-y-4">
//                   {ecoCommentsList.map((comment) => (
//                     <div key={comment.id} className="flex space-x-3">
//                       <div className="flex-shrink-0">
//                         <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
//                           <User className="h-4 w-4 text-gray-600" />
//                         </div>
//                       </div>
//                       <div className="flex-1">
//                         <div className="bg-gray-50 rounded-lg p-3">
//                           <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
//                             <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
//                           </div>
//                           <p className="text-sm text-gray-700">{comment.comment}</p>
//                           {comment.attachments.length > 0 && (
//                             <div className="mt-2 flex items-center space-x-2">
//                               <Paperclip className="h-4 w-4 text-gray-400" />
//                               <span className="text-xs text-gray-500">{comment.attachments.length} attachment(s)</span>
//                             </div>
//                           )}
//                           <button 
//                             onClick={() => deleteEcoComment(comment.id)}
//                             className="text-red-500 hover:text-red-700 mt-2 text-xs flex items-center ml-auto"
//                           >
//                             <Trash2 className="h-3 w-3 mr-1" />
//                             Delete
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
              
//                 <div className="mt-4 flex space-x-3">
//                   <div className="flex-shrink-0">
//                     <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
//                       <User className="h-4 w-4 text-blue-600" />
//                     </div>
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex space-x-2">
//                       <input
//                         type="text"
//                         value={newComment}
//                         onChange={(e) => setNewComment(e.target.value)}
//                         placeholder="Add a comment..."
//                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       />
//                       <button
//                         onClick={() => {
//                           if (newComment.trim()) {
//                             addEcoComment({
//                               id: Date.now().toString(),
//                               ecoId: eco.id,
//                               userName: 'Current User',
//                               comment: newComment,
//                               timestamp: new Date().toISOString(),
//                               attachments: []
//                             });
//                             setNewComment('');
//                           }
//                         }}
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
//                       >
//                         <Send className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );

//   // Advanced Reports
//   const renderReports = () => (
//     <div className="space-y-6">
//       {/* Report Controls */}
//       <div className="bg-white shadow rounded-lg p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">Reports & Analytics</h3>
//           <div className="flex items-center space-x-3">
//             <select
//               value={reportDateRange}
//               onChange={(e) => setReportDateRange(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="last7days">Last 7 Days</option>
//               <option value="last30days">Last 30 Days</option>
//               <option value="last90days">Last 90 Days</option>
//               <option value="all">All Time</option>
//             </select>
//             <select
//               value={selectedReport}
//               onChange={(e) => setSelectedReport(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="eco-summary">ECO Summary</option>
//               <option value="approval-times">Approval Times</option>
//               <option value="cost-impact">Cost Impact</option>
//               <option value="bom-changes">BoM Changes</option>
//               <option value="document-stats">Document Stats</option>
//             </select>
//           </div>
//         </div>
//       </div>
//       {/* Dynamic Report Content */}
//       {selectedReport === 'eco-summary' && (
//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//           <div className="bg-white shadow rounded-lg p-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">ECOs by Stage</h4>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">New</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByStage.new}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Under Review</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByStage['under-review']}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Approved</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByStage.approved}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Applied</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByStage.applied}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Cancelled</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByStage.cancelled}</span>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white shadow rounded-lg p-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">ECOs by Type</h4>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">BoM</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByType.bom}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Document</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByType.document}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Product Variant</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByType['product-variant']}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">Routing</span>
//                 <span className="text-sm font-medium text-gray-900">{ecosByType.routing}</span>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">ECOs by Priority</h4>
//             <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
//               <div className="text-center">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor('low')}`}>Low</span>
//                 <p className="text-sm font-medium text-gray-900 mt-1">{ecosByPriority.low}</p>
//               </div>
//               <div className="text-center">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor('medium')}`}>Medium</span>
//                 <p className="text-sm font-medium text-gray-900 mt-1">{ecosByPriority.medium}</p>
//               </div>
//               <div className="text-center">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor('high')}`}>High</span>
//                 <p className="text-sm font-medium text-gray-900 mt-1">{ecosByPriority.high}</p>
//               </div>
//               <div className="text-center">
//                 <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor('critical')}`}>Critical</span>
//                 <p className="text-sm font-medium text-gray-900 mt-1">{ecosByPriority.critical}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedReport === 'approval-times' && (
//         <div className="bg-white shadow rounded-lg p-6">
//           <h4 className="text-sm font-medium text-gray-700 mb-4">Approval Metrics</h4>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">{approvalTimes.average} days</p>
//               <p className="text-sm text-gray-500">Average Approval Time</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">{approvalTimes.max} days</p>
//               <p className="text-sm text-gray-500">Longest Approval Time</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">{approvalTimes.count}</p>
//               <p className="text-sm text-gray-500">Approved ECOs</p>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedReport === 'cost-impact' && (
//         <div className="bg-white shadow rounded-lg p-6">
//           <h4 className="text-sm font-medium text-gray-700 mb-4">Cost Impact Analysis</h4>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">${costImpact.total.toLocaleString()}</p>
//               <p className="text-sm text-gray-500">Total Estimated Cost</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">${costImpact.average.toFixed(0)}</p>
//               <p className="text-sm text-gray-500">Average Cost per ECO</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-semibold text-gray-900">{costImpact.highImpact}</p>
//               <p className="text-sm text-gray-500">High Impact ECOs (`&gt;` $10k)</p>
//             </div>
//           </div>
//         </div>
//       )}
//       {selectedReport === 'bom-changes' && (
//         <div className="bg-white shadow rounded-lg p-6">
//           <h4 className="text-sm font-medium text-gray-700 mb-4">BoM Version Changes by Product</h4>
//           <div className="space-y-3">
//             {Object.entries(bomChanges).map(([product, count]) => (
//               <div key={product} className="flex items-center justify-between">
//                 <span className="text-sm text-gray-600">{product}</span>
//                 <span className="text-sm font-medium text-gray-900">{count} changes</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//       {selectedReport === 'document-stats' && (
//         <div className="bg-white shadow rounded-lg p-6">
//           <h4 className="text-sm font-medium text-gray-700 mb-4">Document Statistics</h4>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//             <div>
//               <h5 className="text-sm font-medium text-gray-700 mb-2">Documents by Type</h5>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Drawings</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.byType.drawing}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Specifications</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.byType.specification}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">CAD Files</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.byType.cad}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Other</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.byType.other}</span>
//                 </div>
//               </div>
//             </div>
//             <div>
//               <h5 className="text-sm font-medium text-gray-700 mb-2">Storage Overview</h5>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Total Documents</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.totalCount}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Total Size</span>
//                   <span className="text-sm font-medium text-gray-900">{documentStats.totalSize} MB</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );

//   // const renderSettings = () => (
//   //   <div className="space-y-6">
//   //     {/* Settings Categories */}
//   //     <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">ECO Configuration</h3>
//   //         <div className="space-y-3">
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Auto-generate ECO numbers</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Require approval for all ECOs</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">Enable digital signatures</span>
//   //           </label>
//   //         </div>
//   //       </div>
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">BoM Versioning</h3>
//   //         <div className="space-y-3">
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Auto-version on ECO approval</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">Archive old versions</span>
//   //           </label>
//   //           <div>
//   //             <label className="block text-sm font-medium text-gray-700 mb-1">Version Format</label>
//   //             <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//   //               <option>v1.0, v1.1, v2.0</option>
//   //               <option>1.0, 1.1, 2.0</option>
//   //               <option>A, B, C</option>
//   //             </select>
//   //           </div>
//   //         </div>
//   //       </div>
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
//   //         <div className="space-y-3">
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Email notifications</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">In-app notifications</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">SMS alerts for critical ECOs</span>
//   //           </label>
//   //         </div>
//   //       </div>
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">Document Storage</h3>
//   //         <div className="space-y-3">
//   //           <div>
//   //             <label className="block text-sm font-medium text-gray-700 mb-1">Storage Provider</label>
//   //             <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//   //               <option>Local Storage</option>
//   //               <option>Google Drive</option>
//   //               <option>Dropbox</option>
//   //               <option>AWS S3</option>
//   //             </select>
//   //           </div>
//   //           <div>
//   //             <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
//   //             <input
//   //               type="number"
//   //               defaultValue="50"
//   //               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//   //             />
//   //           </div>
//   //         </div>
//   //       </div>
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">Access Control</h3>
//   //         <div className="space-y-3">
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Role-based permissions</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">Department restrictions</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">Product-based access</span>
//   //           </label>
//   //         </div>
//   //       </div>
//   //       <div className="bg-white shadow rounded-lg p-6">
//   //         <h3 className="text-lg font-medium text-gray-900 mb-4">Integration</h3>
//   //         <div className="space-y-3">
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//   //             <span className="ml-2 text-sm text-gray-700">CAD software integration</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Manufacturing module sync</span>
//   //           </label>
//   //           <label className="flex items-center">
//   //             <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
//   //             <span className="ml-2 text-sm text-gray-700">Inventory impact tracking</span>
//   //           </label>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   </div>
//   // );

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'overview':
//         return renderOverview();
//       case 'ecos':
//         return renderEcos();
//       // case 'bom-versions':
//       //   return renderBomVersions();
//       case 'documents':
//         return renderDocuments();
//       case 'approval-workflow':
//         return renderApprovalWorkflow();
//       case 'teams':
//         return renderTeams();
//       case 'collaboration':
//         return renderCollaboration();
//       case 'reports':
//         return renderReports();
//       // case 'settings':
//       //   return renderSettings();
//       default:
//         return renderOverview();
//     }
//   };

//   return (
//     // <Layout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Product Lifecycle Management</h1>
//             <p className="mt-1 text-sm text-gray-600">
//               Manage engineering changes, BoM versions, documents, and approval workflows
//             </p>
//           </div>
//         </div>
//         {/* Tab Navigation */}
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8 overflow-x-auto">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
//                     activeTab === tab.id
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   <Icon className={`mr-2 h-5 w-5 transition-colors ${
//                     activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
//                   }`} />
//                   {tab.name}
//                 </button>
//               );
//             })}
//           </nav>
//         </div>
//         {/* Tab Content */}
//         {renderTabContent()}
//         {/* Modals */}
//         {showCreateEcoForm && <CreateEcoForm />}
//         {showUpdateEcoForm && <UpdateEcoForm />}
//         {showViewEcoModal && <ViewEcoModal />}
//         {showViewDocumentModal && <ViewDocumentModal />}
//         {/* {showViewBomModal && <ViewBomModal />} */}
//         {/* {showBomVersionForm && <CreateBomVersionForm />} */}
//         {showDocumentForm && <CreateDocumentForm />}
//         {showTeamForm && <CreateTeamForm />}
//       </div>
//     // </Layout>
//   );
// };

// export default ProductLifecycle;