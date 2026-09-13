import React from 'react';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { Activity } from '@/types';
import { Card } from '@/components/shared/Card';

interface RecentActivityFeedProps {
  activities: Activity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((activity) => {
          const isClickable = Boolean(activity.certificateId);

          const content = (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-bold leading-tight truncate ${
                  isClickable ? 'text-slate-900 group-hover:text-[#0e2a47]' : 'text-slate-900'
                }`}>
                  {activity.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.clientName}</p>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{activity.action}</p>
                <p className="text-[11px] text-slate-400 mt-1">{activity.date}</p>
              </div>

              {isClickable && (
                <div className="shrink-0 flex items-center text-xs font-semibold text-teal-600 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span className="hidden sm:inline mr-1">View</span>
                  <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </div>
          );

          if (isClickable) {
            return (
              <Link
                key={activity.id}
                href={`/admin/certificates/${activity.certificateId}`}
                className="block px-6 py-3.5 hover:bg-slate-50/90 transition-colors group cursor-pointer"
                title={`View details for ${activity.title}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={activity.id} className="px-6 py-3.5 bg-white">
              {content}
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-400 text-xs">
            No recent activity recorded yet.
          </div>
        )}
      </div>
    </Card>
  );
};

