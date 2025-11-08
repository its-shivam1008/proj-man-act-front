import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import Layout from '../../../components/Layout';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  ShoppingCart,
  Factory,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';

const Forecasting: React.FC = () => {
  const { forecastItems, inventory } = useData();
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ruleFilter, setRuleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredForecastItems = forecastItems.filter(forecast => {
    const product = inventory.find(item => item.id === forecast.productId);
    const matchesSearch = product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         forecast.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || forecast.priority === priorityFilter;
    const matchesRule = ruleFilter === 'all' || forecast.replenishmentRule === ruleFilter;
    return matchesSearch && matchesPriority && matchesRule;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getRuleColor = (rule: string) => {
    switch (rule) {
      case 'automatic':
        return 'bg-blue-100 text-blue-800';
      case 'manual':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStockStatus = (currentStock: number, demandForecast: number) => {
    const ratio = currentStock / demandForecast;
    if (ratio >= 1.5) return { status: 'overstocked', color: 'text-blue-600' };
    if (ratio >= 1) return { status: 'adequate', color: 'text-green-600' };
    if (ratio >= 0.5) return { status: 'low', color: 'text-orange-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Forecasting</h1>
            <p className="mt-1 text-sm text-gray-600">
              Smart inventory forecasting and automated replenishment suggestions
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Forecast Rule
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Forecasts</p>
                  <p className="text-2xl font-semibold text-gray-900">{forecastItems.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Critical Priority</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {forecastItems.filter(item => item.priority === 'critical').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Auto Rules</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {forecastItems.filter(item => item.replenishmentRule === 'automatic').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Avg Lead Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(forecastItems.reduce((sum, item) => sum + item.leadTime, 0) / forecastItems.length || 0)} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Forecast Summary</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">Immediate Action Required</span>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {forecastItems.filter(item => item.priority === 'critical').length}
              </p>
              <p className="text-xs text-red-600">Items need urgent replenishment</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Plan Ahead</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {forecastItems.filter(item => item.priority === 'high' || item.priority === 'medium').length}
              </p>
              <p className="text-xs text-yellow-600">Items to monitor closely</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-800">Well Stocked</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {forecastItems.filter(item => item.priority === 'low').length}
              </p>
              <p className="text-xs text-green-600">Items with adequate stock</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forecasts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Rules</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Forecasting Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demand Forecast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Replenishment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredForecastItems.map((forecast) => {
                const product = inventory.find(item => item.id === forecast.productId);
                const stockStatus = calculateStockStatus(forecast.currentStock, forecast.demandForecast);
                return (
                  <tr key={forecast.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{product?.name || 'Unknown Product'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium">{forecast.currentStock}</span> units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium">{forecast.demandForecast}</span> units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-medium text-blue-600">{forecast.suggestedReplenishment}</span> units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {forecast.leadTime} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getPriorityIcon(forecast.priority)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(forecast.priority)}`}>
                          {forecast.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRuleColor(forecast.replenishmentRule)}`}>
                        {forecast.replenishmentRule}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Create PO
                        </button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center">
                          <Factory className="h-3 w-3 mr-1" />
                          Create MO
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Replenishment Recommendations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Replenishment Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {forecastItems
                .filter(item => item.priority === 'critical' || item.priority === 'high')
                .map((forecast) => {
                  const product = inventory.find(item => item.id === forecast.productId);
                  return (
                    <div key={forecast.id} className={`border rounded-lg p-4 ${
                      forecast.priority === 'critical' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getPriorityIcon(forecast.priority)}
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">{product?.name}</h4>
                            <p className="text-sm text-gray-600">
                              Current: {forecast.currentStock} units • Demand: {forecast.demandForecast} units
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            forecast.priority === 'critical' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            Order {forecast.suggestedReplenishment} units
                          </span>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                            Quick Order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Forecasting;