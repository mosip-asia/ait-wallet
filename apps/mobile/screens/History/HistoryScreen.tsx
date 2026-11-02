import React from 'react';
import {useHistoryTab} from './HistoryScreenController';
import {ActivityLogText} from '../../components/ActivityLogText';
import {MainRouteProps} from '../../routes/routeTypes';
import {BannerNotificationContainer} from '../../components/BannerNotificationContainer';
import {AitTransactionHistory} from '../../ait/features/history/AitTransactionHistory';

export const HistoryScreen: React.FC<MainRouteProps> = () => {
  const controller = useHistoryTab();
  return (
    <>
      <BannerNotificationContainer />
      <AitTransactionHistory
        activities={controller.activities}
        refreshing={controller.isRefreshing}
        onRefresh={controller.REFRESH}
        renderActivity={activity => (
          <ActivityLogText
            activity={activity as (typeof controller.activities)[number]}
          />
        )}
      />
    </>
  );
};
