import React, { useMemo, useState } from 'react';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';

// Format next run date (same logic as Home.js)
const formatNextRunDate = (dateString) => {
  if (!dateString) return 'Not set';
  
  const date = new Date(dateString);
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  
  if (dateUTC.getTime() === todayUTC.getTime()) {
    return 'Today';
  }
  
  const tomorrow = new Date(todayUTC);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (dateUTC.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Check if goal is completed (same logic as Home.js)
const isGoalCompleted = (goal) => {
  if (goal.__t !== 'ShopifySavingsGoal') return false;
  if (!goal.checkoutCartId || typeof goal.checkoutCartId === 'string') {
    return false;
  }
  const orderId = goal.checkoutCartId.orderId;
  return !!orderId && typeof orderId === 'string' && 
    orderId.trim().length > 0 && 
    goal.currentAmount === goal.targetAmount;
};

const SavingsGoalsTable = ({
  goals = [],
  loading = false,
  userType = 'savings-account', // 'merchant' | 'savings-account' | 'guest'
  onViewGoal,
  onTogglePause,
  onRefundCheck, // Optional: function to check if goal has refund
}) => {
  const [pageSize, setPageSize] = useState(10);

  // Calculate status for a goal
  const getStatus = (goal) => {
    if (!goal) return { label: 'Unknown', color: 'default' };
    
    // Check if completed (has orderId for Shopify, or currentAmount >= targetAmount)
    if (goal.__t === 'ShopifySavingsGoal' && goal.checkoutCartId?.orderId) {
      const orderId = goal.checkoutCartId.orderId;
      if (orderId && typeof orderId === 'string' && orderId.trim().length > 0) {
        return { label: 'Completed', color: 'success' };
      }
    }
    if (goal.currentAmount >= goal.targetAmount) {
      return { label: 'Completed', color: 'success' };
    }
    
    // Check if goal has started (has transfers or currentAmount > 0)
    const hasStarted = (goal.transfers && goal.transfers.length > 0) || (goal.currentAmount > 0);
    
    // Only check for refunds if the goal has started
    // A refunded goal will be paused and have transfers (including refund transfer)
    if (hasStarted && onRefundCheck && onRefundCheck(goal)) {
      return { label: 'Canceled (Refunded)', color: 'error' };
    }
    
    // Check if paused (but not refunded)
    if (goal.isPaused) {
      return { label: 'Paused', color: 'warning' };
    }
    
    // Check if started and in progress
    if (hasStarted) {
      return { label: 'In Progress', color: 'info' };
    }
    
    // Goal hasn't started yet
    return { label: 'Not Started', color: 'default' };
  };

  // Get goal name
  const getGoalName = (goal) => {
    if (!goal) {
      console.warn('getGoalName: goal is null/undefined');
      return 'Untitled Goal';
    }
    
    // Check goalName first (it's required in the schema, but might be empty string)
    if (goal.goalName !== undefined && goal.goalName !== null) {
      const trimmed = String(goal.goalName).trim();
      if (trimmed) {
        console.log('getGoalName: Found goalName:', trimmed);
        return trimmed;
      }
      console.log('getGoalName: goalName exists but is empty/whitespace:', goal.goalName);
    } else {
      console.log('getGoalName: goalName is undefined or null. Goal keys:', Object.keys(goal));
    }
    
    // For ManualSavingsGoal, check googleShoppingData or manualTitle
    if (goal.__t === 'ManualSavingsGoal') {
      const firstItem = goal.googleShoppingData?.[0];
      if (firstItem?.title) return firstItem.title;
      if (goal.manualTitle) {
        const trimmed = String(goal.manualTitle).trim();
        if (trimmed) return trimmed;
      }
    }
    
    // For ShopifySavingsGoal, check checkoutCartId lineItems
    if (goal.__t === 'ShopifySavingsGoal') {
      const firstItem = goal.checkoutCartId?.lineItems?.[0];
      if (firstItem?.presentmentTitle) return firstItem.presentmentTitle;
    }
    
    // Fallback for legacy structure (product.title)
    if (goal.product?.title) return goal.product.title;
    
    // Debug: log the goal structure if we can't find a name
    console.warn('getGoalName: Could not find goal name for goal:', {
      _id: goal._id,
      __t: goal.__t,
      goalName: goal.goalName,
      hasProduct: !!goal.product,
      hasCheckoutCartId: !!goal.checkoutCartId,
      keys: Object.keys(goal),
    });
    
    // Last resort fallback
    return 'Untitled Goal';
  };

  // Merchant columns
  const merchantColumns = useMemo(() => [
    {
      field: 'orderId',
      headerName: 'Order ID',
      width: 120,
      valueGetter: (params) => {
        // Handle case where DataGrid passes value directly
        if (typeof params === 'string') {
          return params;
        }
        if (!params || !params.row) return null;
        const goal = params.row;
        if (goal.__t === 'ShopifySavingsGoal' && goal.checkoutCartId) {
          // checkoutCartId might be an ObjectId string or a populated object
          if (typeof goal.checkoutCartId === 'object') {
            const orderId = goal.checkoutCartId.orderId;
            // Check if orderId exists and is not empty string
            if (orderId && typeof orderId === 'string' && orderId.trim().length > 0) {
              return orderId;
            }
          }
        }
        return null;
      },
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2" color="text.secondary">—</Typography>;
        const goal = params.row;
        
        if (goal.__t === 'ShopifySavingsGoal' && goal.checkoutCartId) {
          // checkoutCartId might be an ObjectId string or a populated object
          if (typeof goal.checkoutCartId === 'object') {
            const orderId = goal.checkoutCartId.orderId;
            // Check if orderId exists and is not empty string
            if (orderId && typeof orderId === 'string' && orderId.trim().length > 0) {
              return (
                <Typography variant="body2" component="code">
                  {orderId}
                </Typography>
              );
            }
          }
        }
        return <Typography variant="body2" color="text.secondary">—</Typography>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) return <Chip label="Unknown" color="default" size="small" />;
        const status = getStatus(params.row);
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
          />
        );
      },
    },
    {
      field: 'goalName',
      headerName: 'Goal Name',
      width: 200,
      flex: 1,
      valueGetter: (params) => {
        // Handle case where DataGrid passes value directly (string) vs params object
        if (typeof params === 'string') {
          return params;
        }
        if (!params || !params.row) {
          return 'Untitled Goal';
        }
        return params.row.goalName || getGoalName(params.row);
      },
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2">Untitled Goal</Typography>;
        console.log('Merchant renderCell - row:', params.row);
        console.log('Merchant renderCell - goalName:', params.row.goalName);
        const name = params.row.goalName || getGoalName(params.row);
        console.log('Merchant renderCell - result:', name);
        return <Typography variant="body2">{name}</Typography>;
      },
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 180,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2" color="text.secondary">—</Typography>;
        const goal = params.row;
        
        // If userId is populated as an object, show name
        if (goal.userId && typeof goal.userId === 'object' && goal.userId._id) {
          const firstName = goal.userId.firstName || '';
          const lastName = goal.userId.lastName || '';
          if (firstName || lastName) {
            return `${firstName} ${lastName}`.trim();
          }
          // Fallback to email if name not available
          if (goal.userId.email) {
            return goal.userId.email;
          }
        }
        
        // For cases where userId is null, a string (ObjectId but user doesn't exist), or not populated
        // Try to get email from checkoutCartId
        if (goal.__t === 'ShopifySavingsGoal' && goal.checkoutCartId) {
          if (typeof goal.checkoutCartId === 'object' && goal.checkoutCartId.email) {
            // If userId exists but is just a string (user was deleted), show as "Guest"
            const isGuest = !goal.userId || typeof goal.userId === 'string';
            return isGuest 
              ? `${goal.checkoutCartId.email} (Guest)`
              : goal.checkoutCartId.email;
          }
        }
        
        return <Typography variant="body2" color="text.secondary">—</Typography>;
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2">$0.00 / $0.00</Typography>;
        const goal = params.row;
        return (
          <Typography variant="body2">
            ${(goal.currentAmount || 0).toFixed(2)} / ${(goal.targetAmount || 0).toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: 'dateStarted',
      headerName: 'Date Started',
      width: 130,
      valueGetter: (params) => {
        if (!params || !params.row || !params.row.createdAt) return '—';
        return new Date(params.row.createdAt).toLocaleDateString();
      },
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 100,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2">0%</Typography>;
        const goal = params.row;
        const percentage = Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100);
        return <Typography variant="body2">{percentage}%</Typography>;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="View"
          onClick={() => onViewGoal && onViewGoal(params.row._id)}
        />,
      ],
    },
  ], [onViewGoal, onRefundCheck]);

  // Savings account / Guest columns
  const userColumns = useMemo(() => [
    {
      field: 'goalName',
      headerName: 'Goal Name',
      width: 200,
      flex: 1,
      valueGetter: (params) => {
        if (!params || !params.row) {
          console.warn('User valueGetter: params or row missing', params);
          return 'Untitled Goal';
        }
        console.log('User valueGetter - row:', params.row);
        console.log('User valueGetter - goalName:', params.row.goalName);
        const name = params.row.goalName || getGoalName(params.row);
        console.log('User valueGetter - result:', name);
        return name;
      },
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2">Untitled Goal</Typography>;
        console.log('User renderCell - row:', params.row);
        console.log('User renderCell - goalName:', params.row.goalName);
        const name = params.row.goalName || getGoalName(params.row);
        console.log('User renderCell - result:', name);
        return <Typography variant="body2">{name}</Typography>;
      },
    },
    {
      field: 'saved',
      headerName: 'Saved',
      width: 120,
      renderCell: (params) => {
        if (!params || !params.row) return '$0.00';
        return `$${(params.row.currentAmount || 0).toFixed(2)}`;
      },
    },
    {
      field: 'goal',
      headerName: 'Goal',
      width: 120,
      renderCell: (params) => {
        if (!params || !params.row) return '$0.00';
        return `$${(params.row.targetAmount || 0).toFixed(2)}`;
      },
    },
    {
      field: 'nextRun',
      headerName: 'Next Run',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2" color="text.secondary">Not set</Typography>;
        const goal = params.row;
        
        // If completed, show COMPLETED
        if (isGoalCompleted(goal)) {
          return <Chip label="COMPLETED" color="success" size="small" />;
        }
        
        // If paused, show PAUSED
        if (goal.isPaused) {
          return <Chip label="PAUSED" color="warning" size="small" />;
        }
        
        // Otherwise show next run date
        if (goal.nextRunDate) {
          return formatNextRunDate(goal.nextRunDate);
        }
        return <Typography variant="body2" color="text.secondary">Not set</Typography>;
      },
    },
    {
      field: 'transferFrom',
      headerName: 'Transfer From',
      width: 180,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2" color="text.secondary">Not set</Typography>;
        const goal = params.row;
        if (goal.bank) {
          const bankName = goal.bank.bankName || 'Unit';
          const lastFour = goal.bank.bankLastFour || '****';
          return (
            <Typography 
              variant="body2" 
              data-testid={`transfer-from-${goal._id || goal.id}`}
            >
              {`${bankName} (****${lastFour})`}
            </Typography>
          );
        }
        return (
          <Typography 
            variant="body2" 
            color="text.secondary"
            data-testid={`transfer-from-${goal._id || goal.id}`}
          >
            Not set
          </Typography>
        );
      },
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 100,
      renderCell: (params) => {
        if (!params || !params.row) return <Typography variant="body2">0%</Typography>;
        const goal = params.row;
        const percentage = Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100);
        return <Typography variant="body2">{percentage}%</Typography>;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="View"
            onClick={() => onViewGoal && onViewGoal(params.row._id)}
          />,
        ];
        
        // Only show pause/resume for non-guest users
        if (userType !== 'guest' && onTogglePause) {
          actions.push(
            <GridActionsCellItem
              icon={params.row.isPaused ? <PlayArrowIcon /> : <PauseIcon />}
              label={params.row.isPaused ? 'Resume' : 'Pause'}
              onClick={() => onTogglePause && onTogglePause(params.row)}
            />
          );
        }
        
        return actions;
      },
    },
  ], [userType, onViewGoal, onTogglePause, onRefundCheck]);

  const columns = userType === 'merchant' ? merchantColumns : userColumns;

  // Prepare rows for DataGrid
  const rows = useMemo(() => {
    if (!goals || !Array.isArray(goals)) return [];
    return goals
      .filter(goal => goal != null) // Filter out null/undefined goals
      .map((goal, index) => {
        const row = {
          id: goal._id || `goal-${index}`,
          ...goal,
        };
        // Ensure goalName is preserved
        if (goal.goalName) {
          row.goalName = goal.goalName;
        }
        // Debug: Log checkoutCartId structure for merchant goals
        if (userType === 'merchant' && goal.__t === 'ShopifySavingsGoal') {
          console.log('Row created for Shopify goal:', {
            id: row.id,
            goalName: row.goalName,
            hasCheckoutCartId: !!row.checkoutCartId,
            checkoutCartIdType: typeof row.checkoutCartId,
            orderId: row.checkoutCartId?.orderId,
            checkoutCartIdKeys: row.checkoutCartId && typeof row.checkoutCartId === 'object' ? Object.keys(row.checkoutCartId) : null,
          });
        }
        return row;
      });
  }, [goals, userType]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (goals.length === 0) {
    return (
      <Alert severity="info">
        {userType === 'merchant'
          ? 'No savings goals found for your shop yet.'
          : 'No savings goals yet. Start saving today!'}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 25, 50, 100]}
        pagination
        disableSelectionOnClick
        components={{ Toolbar: GridToolbar }}
        componentsProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'grey.100',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-row': {
            minHeight: '52px !important',
            '& .MuiDataGrid-cell': {
              minHeight: '52px !important',
            },
          },
        }}
      />
    </Box>
  );
};

export default SavingsGoalsTable;

