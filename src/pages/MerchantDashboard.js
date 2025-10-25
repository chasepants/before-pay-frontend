import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar'
import Placeholder from 'react-bootstrap/Placeholder';
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
        if (!shopDomain) return;
        
        setSavingsGoalsLoading(true);
        try {
            const response = await api.get(`/api/savings-goal/merchant/${shopDomain}`);
            setSavingsGoals(response.data);
        } catch (error) {
            console.error('Error fetching savings goals:', error);
        } finally {
            setSavingsGoalsLoading(false);
        }
    };

    useEffect(() => {
        if (merchant?.shopDomain) {
            fetchSavingsGoals(merchant.shopDomain);
        }
    }, [merchant?.shopDomain]);

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
                <div className="col-sm-6 offset-sm-3">
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
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Customer Savings Goals</h5>
                            <small className="text-muted">Track all savings goals created by your customers</small>
                        </div>
                        <div className="card-body">
                            {savingsGoalsLoading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading savings goals...</p>
                                </div>
                            ) : savingsGoals.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No savings goals found for your shop yet.</p>
                                    <small className="text-muted">Savings goals will appear here when customers create them for your products.</small>
                                </div>
                            ) : (
                                <div className="row">
                                    {savingsGoals.map((goal) => (
                                        <div key={goal._id} className="col-md-6 col-lg-4 mb-3">
                                            <div className="card h-100">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="card-title mb-0">{goal.goalName}</h6>
                                                        <span className={`badge ${
                                                            goal.status === 'completed' ? 'bg-success' : 
                                                            goal.status === 'ongoing' ? 'bg-warning' : 
                                                            'bg-secondary'
                                                        }`}>
                                                            {goal.status === 'completed' ? 'Completed' : 
                                                             goal.status === 'ongoing' ? 'Ongoing' : 
                                                             'Not Started'}
                                                        </span>
                                                    </div>
                                                    
                                                    {goal.userId && (
                                                        <p className="card-text small text-muted mb-2">
                                                            Customer: {goal.userId.firstName} {goal.userId.lastName}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between small text-muted mb-1">
                                                            <span>Progress</span>
                                                            <span>${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '8px' }}>
                                                            <div 
                                                                className={`progress-bar ${
                                                                    goal.status === 'completed' ? 'bg-success' : 
                                                                    goal.status === 'ongoing' ? 'bg-warning' : 
                                                                    'bg-secondary'
                                                                }`}
                                                                role="progressbar" 
                                                                style={{ width: `${goal.progressPercentage}%` }}
                                                                aria-valuenow={goal.progressPercentage}
                                                                aria-valuemin="0" 
                                                                aria-valuemax="100"
                                                            ></div>
                                                        </div>
                                                        <div className="text-center small text-muted mt-1">
                                                            {goal.progressPercentage}% complete
                                                        </div>
                                                    </div>
                                                    
                                                    {goal.product && (
                                                        <div className="mb-2">
                                                            <strong>Product:</strong>
                                                            <div className="small text-muted">
                                                                {goal.product.title || goal.product.presentmentTitle || 'Unknown Product'}
                                                            </div>
                                                            {goal.product.price && (
                                                                <div className="small text-muted">
                                                                    Price: ${parseFloat(goal.product.price).toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {goal.schedule && goal.schedule.installments && (
                                                        <div className="small text-muted">
                                                            <strong>Payment Plan:</strong> {goal.schedule.installments} installments
                                                            {goal.schedule.amountPerInstallment && (
                                                                <span> of ${goal.schedule.amountPerInstallment.toFixed(2)} each</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="small text-muted mt-2">
                                                        Created: {new Date(goal.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default MerchantDashboard;