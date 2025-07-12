'use client';

import React from 'react';
import { CheckCircle, MessageSquare, BarChart2, Star } from 'lucide-react';
import BusinessNotificationCategory from './BusinessNotificationCategory';

const BusinessNotifications: React.FC = () => {
  return (
    <div className="space-y-6">
      <BusinessNotificationCategory
        title="Verification Updates"
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        type="business_verification"
        emptyMessage="No verification notifications at this time."
      />
      
      <BusinessNotificationCategory
        title="Customer Reviews"
        icon={<Star className="h-5 w-5 text-yellow-500" />}
        type="review"
        emptyMessage="No new reviews at this time."
      />
      
      <BusinessNotificationCategory
        title="Customer Inquiries"
        icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
        type="inquiry"
        emptyMessage="No new inquiries at this time."
      />
      
      <BusinessNotificationCategory
        title="Analytics Alerts"
        icon={<BarChart2 className="h-5 w-5 text-purple-600" />}
        type="analytics_alert"
        emptyMessage="No analytics alerts at this time."
      />
    </div>
  );
};

export default BusinessNotifications; 