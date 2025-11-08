// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { Lock, Mail, AlertCircle } from 'lucide-react';

// const Login: React.FC = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const { login } = useAuth();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       const success = await login(email, password);
//       if (!success) {
//         setError('Invalid credentials. Please try again.');
//       }
//     } catch (err) {
//       setError('An error occurred. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="max-w-md w-full space-y-8">
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <div className="text-center">
//             <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
//               <Lock className="h-6 w-6 text-blue-600" />
//             </div>
//             <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
//               Welcome to SCM Pro
//             </h2>
//             <p className="mt-2 text-sm text-gray-600">
//               Sign in to your supply chain management dashboard
//             </p>
//           </div>

//           <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                   Email address
//                 </label>
//                 <div className="mt-1 relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
//                     <Mail className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     id="email"
//                     name="email"
//                     type="email"
//                     autoComplete="email"
//                     required
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="Enter your email"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                   Password
//                 </label>
//                 <div className="mt-1 relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
//                     <Lock className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <input
//                     id="password"
//                     name="password"
//                     type="password"
//                     autoComplete="current-password"
//                     required
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="appearance-none rounded-lg relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//                     placeholder="Enter your password"
//                   />
//                 </div>
//               </div>
//             </div>

//             {error && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-700">
//                 <AlertCircle className="h-5 w-5 mr-2" />
//                 <span className="text-sm">{error}</span>
//               </div>
//             )}

//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//               <p className="text-sm text-blue-700">
//                 <strong>Demo Credentials:</strong><br />
//                 Email: ritik@example.com<br />
//                 Password: 1234
//               </p>
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 {isLoading ? 'Signing in...' : 'Sign in'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;