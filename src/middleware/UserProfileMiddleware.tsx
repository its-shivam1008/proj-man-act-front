import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import api from '@/utils/axiosApi';

interface UserProfileMiddlewareProps {
  children: React.ReactNode;
}

const UserProfileMiddleware: React.FC<UserProfileMiddlewareProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated, userProfile } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProfile = async () => {
    if (!token || !isAuthenticated) return;

    try {
      setIsLoading(true);
      console.log('🔄 Fetching fresh user profile...');
      
      const response = await api.get('/auth/profile');
      
      if (response.data.user) {
        console.log('✅ Fresh user profile received:', {
          id: response.data.user._id,
          email: response.data.user.email,
          role: response.data.user.role,
          location: response.data.user.location,
          locationDetails: response.data.user.locationDetails,
          organisationId: response.data.user.organisationId
        });
        
        // Update Redux state
        dispatch({
          type: 'auth/updateUserProfile',
          payload: { updatedUser: response.data.user }
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      // Don't throw error, just log it - user can still use cached profile
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user profile on component mount (page load)
    fetchUserProfile();
  }, [token, isAuthenticated]);

  // Show loading state only if we don't have any user profile yet
  if (isAuthenticated && !userProfile && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserProfileMiddleware;