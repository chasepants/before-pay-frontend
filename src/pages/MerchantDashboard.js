import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar'

function MerchantDashboard() {
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();

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

    return <>
        <Navbar />
        <div className="container mt-3">
            <div className="row mb-3">
                <div className="col-sm-6 offset-sm-3">
                    <h2>Merchant Dashboard</h2>
                    <p>Welcome, {user.firstName} {user.lastName}!</p>
                    <p>Email: {user.email}</p>
                    <p>User Type: {user.userType}</p>
                    {user.shopifyMerchantId && (
                        <p>Shopify Merchant ID: {user.shopifyMerchantId}</p>
                    )}
                </div>
            </div>
        </div>
    </>
}

export default MerchantDashboard;