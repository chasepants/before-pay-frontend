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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchSavingsGoal = async () => {
      try {
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);

        // Check if it's a Shopify goal using discriminator
        if (res.data && res.data.__t !== 'ShopifySavingsGoal') {
          navigate(`/home`);
        }

        setSavingsGoal(res.data);
      } catch (err) {
        setError('Savings goal not found');
      }

      setIsLoading(false);
    };

    // Always fetch fresh data to ensure checkoutCartId is populated
    fetchSavingsGoal();
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

  // Check if all payments are completed
  const isAllPaymentsCompleted = () => {
    if (!savingsGoal || savingsGoal.__t !== 'ShopifySavingsGoal') return false;
    if (!savingsGoal.transfers || savingsGoal.transfers.length === 0) return false;
    
    // Check if all non-refund transfers are completed
    const paymentTransfers = savingsGoal.transfers.filter(t => t.type !== 'credit');
    if (paymentTransfers.length === 0) return false;
    
    return paymentTransfers.every(transfer => transfer.status === 'completed');
  };

  // Check if refund is available
  const canRefund = () => {
    if (!savingsGoal || savingsGoal.__t !== 'ShopifySavingsGoal') return false;
    if (!savingsGoal.currentAmount || savingsGoal.currentAmount <= 0) return false;
    if (savingsGoal.isPaused) return false;
    
    // Check if there are any pending transfers
    const hasPending = savingsGoal.transfers && savingsGoal.transfers.some(
      transfer => transfer.status === 'pending'
    );
    
    return !hasPending && savingsGoal.currentAmount > 0;
  };

  const handleRefund = async () => {
    setIsProcessingRefund(true);
    setRefundError('');
    
    try {
      const response = await api.post(`/api/savings-goal/${savingsGoalId}/refund`);
      
      if (response.data.success) {
        // Refresh the savings goal
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);
        setSavingsGoal(res.data);
        setShowRefundModal(false);
        alert(response.data.message || 'Refund initiated successfully! The savings plan has been paused.');
      }
    } catch (err) {
      setRefundError(err.response?.data?.error || 'Failed to process refund. Please try again.');
      console.error('Refund error:', err);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  if (isLoading || !savingsGoal) {
    return <LoadingAnimation />;
  }

  return (
    <>
      <Navbar user={user} />
      {/* shopify installment display */}
      {savingsGoal.__t === 'ShopifySavingsGoal' && savingsGoal.checkoutCartId && typeof savingsGoal.checkoutCartId === 'object' && savingsGoal.checkoutCartId.lineItems && (
        <div className="mb-4 col-sm-8 offset-sm-2">
          {/* Installment Plan Header */}
          <div className="text-center mb-4 p-4 bg-light rounded-3 border">
            <div className="d-flex align-items-center justify-content-center mb-2">
              <i className="bi bi-calendar-check me-2 text-primary fs-4"></i>
              <h5 className="mb-0 text-dark">Installment Plan</h5>
            </div>
            <div className="small text-muted">
              Plan #{savingsGoal._id} • {savingsGoal.shopDomain || savingsGoal.checkoutCartId.shopDomain}
            </div>
          </div>

          {/* Line Items - Receipt Style */}
          <div className="mb-4">
            {savingsGoal.checkoutCartId.lineItems.map((item, index) => (
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
                    <span>${savingsGoal.checkoutCartId.totalPrice}</span>
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
                      <span className="fw-bold text-success fs-5">${savingsGoal.checkoutCartId.totalPrice}</span>
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
                  {canRefund() && (
                    <div className="mt-3">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setShowRefundModal(true)}
                        data-testid="refund-button"
                      >
                        <i className="bi bi-arrow-counterclockwise me-2"></i>
                        Refund All Savings (${savingsGoal.currentAmount?.toFixed(2) || '0.00'})
                      </button>
                    </div>
                  )}
                  {isAllPaymentsCompleted() && savingsGoal.checkoutCartId?.orderId && (
                    <div className="alert alert-success mt-3 mb-0 py-2">
                      <i className="bi bi-check-circle me-2"></i>
                      <small>Order completed! Order ID: {savingsGoal.checkoutCartId.orderId}</small>
                    </div>
                  )}
                  {savingsGoal.isPaused && !(isAllPaymentsCompleted() && savingsGoal.checkoutCartId?.orderId) && (
                    <div className="alert alert-warning mt-3 mb-0 py-2">
                      <i className="bi bi-pause-circle me-2"></i>
                      <small>This savings plan is paused.</small>
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <h6 className="mb-3">Payment Schedule</h6>
                  {savingsGoal.transfers.map((transfer, index) => {
                    console.log(transfer)
                    const paymentDate = new Date(transfer.date);
                    const isCompleted = 'completed' === transfer.status;
                    const isPending = 'pending' === transfer.status;
                    const isRefund = transfer.type === 'credit';
                    return (
                      <div 
                        key={transfer.transferId} 
                        data-testid={`payment-item-${index}`}
                        data-payment-status={transfer.status}
                        data-payment-type={transfer.type}
                        className={`d-flex justify-content-between align-items-center mb-2 ${isRefund ? 'border-start border-danger border-3 ps-2' : ''}`}
                      >
                        <span className="small">
                          {isRefund ? (
                            <i className="bi bi-arrow-counterclockwise me-1 text-danger"></i>
                          ) : (
                            <span>#{transfer.transferId.slice(-8)}. </span>
                          )}
                          {paymentDate.toDateString()}
                          {isRefund && <span className="text-danger ms-1">(Refund)</span>}
                        </span>
                        <div className="d-flex align-items-center">
                          <span className={`me-2 ${isRefund ? 'text-danger fw-bold' : ''}`}>
                            {isRefund ? `($${transfer.amount.toFixed(2)})` : `$${transfer.amount.toFixed(2)}`}
                          </span>
                          <i 
                            className={`bi ${
                              isCompleted ? 'bi-check-circle-fill text-success' : 
                              isPending ? 'bi-clock-fill text-warning' : 
                              'bi-x-circle-fill text-danger'
                            }`}
                            data-testid={`payment-status-icon-${index}`}
                          ></i>
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
      
      {/* Refund Confirmation Modal */}
      {showRefundModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Refund</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundError('');
                  }}
                  disabled={isProcessingRefund}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important:</strong> This will refund all your savings and pause the installment plan.
                </div>
                <p>You are about to refund:</p>
                <h4 className="text-center mb-3">${savingsGoal.currentAmount?.toFixed(2) || '0.00'}</h4>
                <p className="text-muted small">
                  The refund will be sent to your linked bank account: {savingsGoal.bank?.bankName} ••••{savingsGoal.bank?.bankLastFour || '****'}
                </p>
                <p className="text-muted small mb-0">
                  Your savings plan will be paused and no future installments will be processed.
                </p>
                {refundError && (
                  <div className="alert alert-danger mt-3">
                    {refundError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundError('');
                  }}
                  disabled={isProcessingRefund}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleRefund}
                  disabled={isProcessingRefund}
                >
                  {isProcessingRefund ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Confirm Refund
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewOrder;