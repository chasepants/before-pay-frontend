import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar'
import Placeholder from 'react-bootstrap/Placeholder';
import { Box, Typography, Paper } from '@mui/material';
import SavingsGoalsTable from '../components/SavingsGoalsTable';
import api from '../api';

function MerchantDashboard() {
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customerToken, setCustomerToken] = useState(null);
    const [unitComponentsLoaded, setUnitComponentsLoaded] = useState(false);
    const unitComponentsRendered = useRef(false);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [savingsGoalsLoading, setSavingsGoalsLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        if (user.userType !== 'merchant') {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchMerchantData = async () => {
            try {
                const response = await api.get('/api/shopify-merchant/');
                console.log('Merchant data response:', response.data);
                setMerchant(response.data.merchant);
            } catch (error) {
                console.error('Error fetching merchant data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMerchantData();
    }, []);

    const fetchSavingsGoals = async (shopDomain) => {
        if (!shopDomain) {
            console.log('No shopDomain provided, skipping savings goals fetch');
            return;
        }
        
        console.log('Fetching savings goals for shopDomain:', shopDomain);
        setSavingsGoalsLoading(true);
        try {
            const response = await api.get(`/api/savings-goal/merchant/${shopDomain}`);
            console.log('Savings goals response:', response.data);
            
            // Debug: Log each goal's checkoutCartId structure
            response.data.forEach((goal, index) => {
                console.log(`Goal ${index + 1}:`, {
                    _id: goal._id,
                    __t: goal.__t,
                    goalName: goal.goalName,
                    hasCheckoutCartId: !!goal.checkoutCartId,
                    checkoutCartIdType: typeof goal.checkoutCartId,
                    checkoutCartIdValue: goal.checkoutCartId,
                    orderId: goal.checkoutCartId?.orderId,
                    checkoutCartIdKeys: goal.checkoutCartId && typeof goal.checkoutCartId === 'object' ? Object.keys(goal.checkoutCartId) : null,
                });
            });
            
            setSavingsGoals(response.data);
        } catch (error) {
            console.error('Error fetching savings goals:', error);
            console.error('Error response:', error.response?.data);
        } finally {
            setSavingsGoalsLoading(false);
        }
    };

    useEffect(() => {
        if (merchant?.shopDomain) {
            fetchSavingsGoals(merchant.shopDomain);
        }
    }, [merchant?.shopDomain]);

    const handleViewGoal = (goalId) => {
        // For merchant, we might want to view order details
        // For now, navigate to view-order page
        navigate(`/view-order/${goalId}`);
    };

    const handleRefundCheck = async (goal) => {
        // Check if goal has a refund payment
        // For now, return false - we can optimize this later by adding a hasRefund flag to goals
        // or creating a batch endpoint to check refunds for multiple goals
        return false;
    };

    const fetchCustomerToken = async () => {
        try {
            const response = await api.get('/api/shopify-merchant/customer-token');
            console.log('Customer token:', response.data.token);
            setCustomerToken(response.data.token);
        } catch (err) {
            console.error('Customer token fetch failed:', err.response?.data || err.message);
            if (err.response?.status === 401) {
                localStorage.removeItem('authToken');
                navigate('/');
            }
        }
    };

    useEffect(() => {
        if (merchant?.unitAccountId && customerToken && !unitComponentsRendered.current) {
            setUnitComponentsLoaded(true);
            unitComponentsRendered.current = true;
        }
    }, [merchant?.unitAccountId, customerToken]);

    useEffect(() => {
        if (merchant?.unitAccountId) {
            fetchCustomerToken();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [merchant?.unitAccountId]);

    if (!user || user.userType !== 'merchant') {
        return (
            <div className="container mt-3">
                <div className="row mb-3">
                    <div className="col-sm-6 offset-sm-3">
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mt-3">
                <div className="row mb-3">
                    <div className="col-sm-6 offset-sm-3">
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasUnitAccount = merchant?.unitAccountId && merchant?.unitCustomerId;
    const needsOnboarding = !hasUnitAccount;

    return <>
        <Navbar user={user} />
        <div className="container mt-3">
            <div className="row mb-3">
                <div className="col-12">
                    <h2>Merchant Dashboard</h2>
                    <p>Welcome, {user.firstName} {user.lastName}!</p>
                    
                    {needsOnboarding && (
                        <div className="alert alert-warning mt-3" role="alert">
                            <h5 className="alert-heading">Onboarding Required</h5>
                            <p>Please complete your merchant onboarding in the Shopify admin portal to start accepting StashPay payments.</p>
                            <hr />
                            <p className="mb-0">Once completed, you'll be able to view transaction history and manage your funds here.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Unit Widgets - Only show if merchant has completed onboarding */}
            {hasUnitAccount && (
                <div className="row">
                    <div className="col-12 col-md-6 col-lg-4 mb-3">
                        {merchant?.unitAccountId && customerToken ? (
                            <div data-testid="account-details-section">
                                <h6 className="bg-primary text-white p-2 rounded mb-2">Account Details</h6>
                                {unitComponentsLoaded && (
                                    <div key="account-wrapper">
                                        <unit-elements-account
                                            customer-token={customerToken}
                                            theme=""
                                            hide-actions-menu-button="false"
                                            hide-selection-menu-button="false"
                                            menu-items="details,statements,bankVerification"
                                            hide-account-cta-banner="true"
                                        ></unit-elements-account>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4" data-testid="account-details-placeholder">
                                <Placeholder animation="glow">
                                    <Placeholder xs={12} style={{ height: '200px' }} />
                                </Placeholder>
                            </div>
                        )}
                    </div>
                    <div className="col-12 col-md-6 col-lg-4 mb-3">
                        {merchant?.unitAccountId && customerToken ? (
                            <div data-testid="account-activity-section">
                                <h6 className="bg-info text-white p-2 rounded mb-2">Account Activity</h6>
                                {unitComponentsLoaded && (
                                    <div key="activity-wrapper">
                                        <unit-elements-activity
                                            customer-token={customerToken}
                                            account-id={merchant?.unitAccountId}
                                            theme=""
                                            hide-actions-menu-button="false"
                                            hide-selection-menu-button="false"
                                            hide-title="true"
                                            hide-filter-button="true"
                                            transactions-per-page="5"
                                            pagination-type="pagination"
                                            menu-items="details,statements,bankVerification"
                                            hide-account-cta-banner="true"
                                        ></unit-elements-activity>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4" data-testid="account-activity-placeholder">
                                <Placeholder animation="glow">
                                    <Placeholder xs={12} style={{ height: '200px' }} />
                                </Placeholder>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Savings Goals Section */}
            <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Customer Savings Goals
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                        Track all savings goals created by your customers
                    </Typography>
                    <SavingsGoalsTable
                        goals={savingsGoals}
                        loading={savingsGoalsLoading}
                        userType="merchant"
                        onViewGoal={handleViewGoal}
                        onRefundCheck={handleRefundCheck}
                    />
                </Paper>
            </Box>
        </div>
    </>
}

export default MerchantDashboard;