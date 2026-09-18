import React from 'react';

// Official @solar-icons/react LINEAR style icons (clean outline, non-bold)
import { Widget2Icon } from '@solar-icons/react/linear/widget-2';
import { Grid2x2Icon } from '@solar-icons/react/linear/grid-2x2';
import { UsersGroupRoundedIcon } from '@solar-icons/react/linear/users-group-rounded';
import { UserIcon } from '@solar-icons/react/linear/user';
import { ShopIcon } from '@solar-icons/react/linear/shop';
import { BoxIcon } from '@solar-icons/react/linear/box';
import { ChartIcon } from '@solar-icons/react/linear/chart';
import { WalletIcon } from '@solar-icons/react/linear/wallet';
import { CalendarMinimalisticIcon } from '@solar-icons/react/linear/calendar-minimalistic';
import { SettingsIcon } from '@solar-icons/react/linear/settings';
import { BellIcon } from '@solar-icons/react/linear/bell';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { FilterIcon } from '@solar-icons/react/linear/filter';
import { ShieldCheckIcon } from '@solar-icons/react/linear/shield-check';
import { DocumentTextIcon } from '@solar-icons/react/linear/document-text';
import { DatabaseIcon } from '@solar-icons/react/linear/database';
import { ClockCircleIcon } from '@solar-icons/react/linear/clock-circle';
import { CheckCircleIcon } from '@solar-icons/react/linear/check-circle';
import { CloseCircleIcon } from '@solar-icons/react/linear/close-circle';
import { HeartIcon } from '@solar-icons/react/linear/heart';
import { ScaleIcon } from '@solar-icons/react/linear/scale';
import { TagPriceIcon } from '@solar-icons/react/linear/tag-price';
import { EyeIcon } from '@solar-icons/react/linear/eye';
import { AddCircleIcon } from '@solar-icons/react/linear/add-circle';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import { StarsIcon } from '@solar-icons/react/linear/stars';
import { LogoutIcon } from '@solar-icons/react/linear/logout';
import { DangerTriangleIcon } from '@solar-icons/react/linear/danger-triangle';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { Pen2Icon } from '@solar-icons/react/linear/pen-2';
import { LockKeyholeIcon } from '@solar-icons/react/linear/lock-keyhole';
import { HamburgerMenuIcon } from '@solar-icons/react/linear/hamburger-menu';

/**
 * SolarIcon Component
 * Official @solar-icons/react LINEAR style icon renderer.
 * Clean, modern outline stroke aesthetic with zero emoji.
 */
export const SolarIcon = ({ name, size = 20, className = '', color, ...props }) => {
  const norm = name?.toLowerCase()?.replace(/[-_\s]/g, '') || '';

  const commonProps = {
    size,
    className: `inline-block shrink-0 ${className}`.trim(),
    ...(color ? { color } : {}),
    ...props
  };

  switch (norm) {
    case 'dashboard':
    case 'overview':
    case 'terminal':
      return <Widget2Icon {...commonProps} />;

    case 'grid':
    case 'category':
    case 'categories':
      return <Grid2x2Icon {...commonProps} />;

    case 'users':
    case 'usersgroup':
    case 'buyers':
      return <UsersGroupRoundedIcon {...commonProps} />;

    case 'user':
    case 'profile':
      return <UserIcon {...commonProps} />;

    case 'store':
    case 'shop':
    case 'sellers':
      return <ShopIcon {...commonProps} />;

    case 'box':
    case 'products':
    case 'catalog':
      return <BoxIcon {...commonProps} />;

    case 'chart':
    case 'graph':
    case 'graphup':
    case 'analytics':
      return <ChartIcon {...commonProps} />;

    case 'wallet':
    case 'revenue':
    case 'payments':
      return <WalletIcon {...commonProps} />;

    case 'calendar':
      return <CalendarMinimalisticIcon {...commonProps} />;

    case 'settings':
      return <SettingsIcon {...commonProps} />;

    case 'bell':
    case 'notification':
    case 'notifications':
    case 'alerts':
      return <BellIcon {...commonProps} />;

    case 'search':
    case 'magnifier':
    case 'magnifer':
      return <MagnifierIcon {...commonProps} />;

    case 'filter':
    case 'filters':
      return <FilterIcon {...commonProps} />;

    case 'shield':
    case 'security':
      return <ShieldCheckIcon {...commonProps} />;

    case 'document':
    case 'report':
    case 'audit':
      return <DocumentTextIcon {...commonProps} />;

    case 'database':
    case 'datasources':
      return <DatabaseIcon {...commonProps} />;

    case 'clock':
    case 'history':
      return <ClockCircleIcon {...commonProps} />;

    case 'checkcircle':
    case 'check':
    case 'success':
      return <CheckCircleIcon {...commonProps} />;

    case 'closecircle':
    case 'close':
    case 'x':
    case 'remove':
      return <CloseCircleIcon {...commonProps} />;

    case 'heart':
    case 'favorite':
    case 'favorites':
      return <HeartIcon {...commonProps} />;

    case 'compare':
    case 'scale':
      return <ScaleIcon {...commonProps} />;

    case 'tag':
    case 'price':
      return <TagPriceIcon {...commonProps} />;

    case 'eye':
      return <EyeIcon {...commonProps} />;

    case 'plus':
    case 'add':
      return <AddCircleIcon {...commonProps} />;

    case 'arrowright':
    case 'arrow':
    case 'chevronright':
    case 'right':
      return <AltArrowRightIcon {...commonProps} />;

    case 'arrowleft':
    case 'chevronleft':
    case 'left':
      return <AltArrowLeftIcon {...commonProps} />;

    case 'chevrondown':
    case 'down':
      return <AltArrowDownIcon {...commonProps} />;

    case 'chevronup':
    case 'up':
      return <AltArrowUpIcon {...commonProps} />;

    case 'sparkles':
    case 'ai':
    case 'star':
    case 'stars':
      return <StarsIcon {...commonProps} />;

    case 'logout':
      return <LogoutIcon {...commonProps} />;

    case 'warning':
    case 'danger':
    case 'alert':
      return <DangerTriangleIcon {...commonProps} />;

    case 'trash':
    case 'trashbin':
    case 'trashbintrash':
    case 'delete':
    case 'bin':
      return <TrashBinTrashIcon {...commonProps} />;

    case 'pen':
    case 'edit':
      return <Pen2Icon {...commonProps} />;

    case 'lock':
      return <LockKeyholeIcon {...commonProps} />;

    case 'menu':
    case 'hamburgermenu':
      return <HamburgerMenuIcon {...commonProps} />;

    case 'copy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={commonProps.className} {...props}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      );

    case 'chat':
    case 'message':
    case 'dialog':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={commonProps.className} {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );

    case 'sidebar':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={commonProps.className} {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      );

    case 'sun':
    case 'light':
    case 'lightmode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={commonProps.className} {...props}>
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      );

    case 'moon':
    case 'dark':
    case 'darkmode':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={commonProps.className} {...props}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      );

    default:
      return <BoxIcon {...commonProps} />;
  }
};

export default SolarIcon;
