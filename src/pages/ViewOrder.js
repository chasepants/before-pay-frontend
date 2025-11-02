import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';

const ViewOrder = () => {
  const { savingsGoalId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchSavingsGoal = async () => {
      try {
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);

        if (res.data && res.data.product && "Shopify" !== res.data.product.type) {
          navigate(`/home`);
        }

        setSavingsGoal(res.data);
      } catch (err) {
        setError('Savings goal not found');
      }

      setIsLoading(false);
    };

    let goal = savingsGoals.find((goal) => goal._id === savingsGoalId);
    console.log(goal);

    if (!goal) {
      fetchSavingsGoal();
    } else {
      setSavingsGoal(goal);
      setIsLoading(false);
    }
  }, [savingsGoalId, savingsGoals, user, navigate]);

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (isLoading || !savingsGoal) {
    return <LoadingAnimation />;
  }

  return (
    <>
      <Navbar user={user} />
      {/* shopify installment display */}
      {savingsGoal.product?.type === 'Shopify' && savingsGoal.product?.lineItems && (
        <div className="mb-4 col-sm-8 offset-sm-2">
          {/* Installment Plan Header */}
          <div className="text-center mb-4 p-4 bg-light rounded-3 border">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <i className="bi bi-calendar-check me-2 text-primary fs-4"></i>
              <h5 className="mb-0 text-dark">Installment Plan</h5>
            </div>
            <div className="small text-muted">
              Plan #{savingsGoal._id} • {savingsGoal.product.shopDomain}
            </div>
          </div>

          {/* Line Items - Receipt Style */}
          <div className="mb-4">
            {savingsGoal.product.lineItems.map((item, index) => (
              <div key={index} className="card mb-3 border-0 shadow-sm">
                <div className="card-body p-3">
                  <div className="row align-items-center">
                    {/* Product Image Placeholder */}
                    {/** TODO: Grab product image from the Shopify API. See process-installments -> createOrder() for example for hitting the Shopify API*/}
                    <div className="col-2 col-md-1">
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '60px', width: '60px' }}>
                        <i className="bi bi-image text-muted fs-4"></i>
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="col-6 col-md-7">
                      <h6 className="card-title mb-1 text-dark">{item.presentmentTitle}</h6>
                      <div className="small text-muted mb-1">
                        {item.vendor && (
                          <span className="me-3">
                            <i className="bi bi-shop me-1"></i>
                            {item.vendor}
                          </span>
                        )}
                        {item.variantId && (
                          <span>
                            <i className="bi bi-tag me-1"></i>
                            SKU: {item.variantId.slice(-6)}
                          </span>
                        )}
                      </div>
                      <div className="small text-muted">
                        Premium quality product with excellent customer satisfaction.
                        {/* TODO: Add product description from checkout payload */}
                      </div>
                    </div>
                    
                    {/* Quantity */}
                    <div className="col-2 col-md-1 text-center">
                      <div className="fw-bold text-primary fs-6">{item.quantity}</div>
                      <div className="small text-muted">Qty</div>
                    </div>
                    
                    {/* Price */}
                    <div className="col-2 col-md-3 text-end">
                      <div className="fw-bold text-success fs-6">${item.price * item.quantity}</div>
                      {item.quantity > 1 && (
                        <div className="small text-muted">
                          ${(parseFloat(item.price))} each
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          
          </div>

          {/* Order Totals */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-8">
                  <h6 className="mb-3">Order Summary</h6>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Subtotal:</span>
                    <span>${savingsGoal.product.totalPrice}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Tax:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Shipping:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-top pt-2 mt-2">
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Total:</span>
                      <span className="fw-bold text-success fs-5">${savingsGoal.product.totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installment Plan Details */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-8">
                  <div className="small text-muted mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    This is your savings plan for the items above | <button 
                        className="btn btn-sm btn-dark"
                        onClick={() => navigate(`/edit-order/${savingsGoalId}`)}
                    >
                     <i className="bi bi-pencil-square"></i>
                    </button>
                  </div>
                  <div className="small text-muted mb-3">
                    <i className="bi bi-calendar me-1"></i>
                    Payment schedule: Monthly over 4 months
                  </div>
                  {savingsGoal.bank && (
                    <div className="small text-muted mb-3">
                      <i className="bi bi-bank me-1"></i>
                      Bank: {savingsGoal.bank.bankName} ••••{savingsGoal.bank.lastFour}
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <h6 className="mb-3">Payment Schedule</h6>
                  {savingsGoal.transfers.map((transfer) => {
                    console.log(transfer)
                    const paymentDate = new Date(transfer.date);
                    const isCompleted = 'completed' === transfer.status;
                    const isPending = 'pending' === transfer.status;
                    return (
                      <div key={transfer.transferId} className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small">
                          #{transfer.transferId}. {paymentDate.toDateString()}
                        </span>
                        <div className="d-flex align-items-center">
                          <span className="me-2">${transfer.amount}</span>
                          <i className={`bi ${
                            isCompleted ? 'bi-check-circle-fill text-success' : 
                            isPending ? 'bi-clock-fill text-warning' : 
                            'bi-x-circle-fill text-danger'
                          }`}></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewOrder;