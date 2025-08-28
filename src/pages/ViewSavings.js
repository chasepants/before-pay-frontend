import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProgressBar } from 'react-bootstrap'; // Add this import
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';

const ViewSavings = () => {
  const { savingsGoalId } = useParams(); // Renamed from wishlistItemId
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings); // Renamed from wishlist
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editGoalName, setEditGoalName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [aiImage, setAiImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for modal
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Add state for save feedback
  const [saveFeedback, setSaveFeedback] = useState('');

  // Add state for edit modal
  const [showEditModal, setShowEditModal] = useState(false);

  // Add function to open edit modal
  const openEditModal = () => {
    console.log('Opening edit modal with savingsGoal:', savingsGoal); // Debug log
    setEditGoalName(savingsGoal.goalName || '');
    setEditDescription(savingsGoal.description || savingsGoal.product?.description || '');
    setEditTargetAmount(savingsGoal.targetAmount || '');
    setShowEditModal(true);
  };

  // Add function to close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setSaveFeedback('');
  };

  // Add modal close function
  const closeTransferModal = () => {
    setSelectedTransfer(null);
    setShowTransferModal(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchSavingsGoal = async () => {
      try {
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);
        setSavingsGoal(res.data);
      } catch (err) {
        setError('Savings goal not found');
      }
    };

    let goal = savingsGoals.find((goal) => goal._id === savingsGoalId);
    console.log(goal);

    if (!goal) {
      fetchSavingsGoal();
    } else {
      setSavingsGoal(goal);
    }
  }, [savingsGoalId, savingsGoals, user, navigate]);

  // Fix 1: Add back the useEffect to initialize aiImage from saved data
  useEffect(() => {
    if (savingsGoal) {
      // Initialize aiImage from the saved goal data
      if (savingsGoal.aiGeneratedImage) {
        setAiImage(savingsGoal.aiGeneratedImage);
      }
      
      // Initialize other fields
      setEditGoalName(savingsGoal.goalName || '');
      setEditDescription(savingsGoal.product?.description || savingsGoal.description || '');
      setEditTargetAmount(savingsGoal.targetAmount ?? '');
      
      // Prepopulate search query with goal name for product-type goals
      if (savingsGoal.category === 'product') {
        setSearchQuery(savingsGoal.goalName || '');
      }
    }
  }, [savingsGoal]);

  useEffect(() => {
    if (savingsGoal) {
      const fetchTransactions = async () => {
        try {
          const txRes = await api.get(`/api/bank/transaction-history/${savingsGoalId}`);
          setTransactions(txRes.data.transactions);
        } catch (err) {
          setError(
            err.response?.status === 404
              ? 'Transaction history not found'
              : err.response?.data?.error || 'Failed to load savings data'
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [savingsGoal, savingsGoalId]);

  const handlePayout = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/api/bank/payout`,
        { savingsGoalId }
      );
      alert('Savings transferred successfully!');

      const refreshed = await api.get(`/api/savings-goal/${savingsGoalId}`);
      setSavingsGoal(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer savings');
    } finally {
      setIsLoading(false);
    }
  };

  // 3) save handler
  const handleSave = async () => {
    try {
      const response = await api.put(`/api/savings-goal/${savingsGoalId}`, {
        goalName: editGoalName,
        description: editDescription,
        targetAmount: parseFloat(editTargetAmount)
      });
      
      setSavingsGoal(response.data);
      
      // Show success feedback
      setSaveFeedback('Changes saved successfully!');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        closeEditModal();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to update savings goal:', error);
      setError('Failed to save changes');
    }
  };

  // Calculate progress with different states
  const calculateProgress = () => {
    // Add safety check for null savingsGoal
    if (!savingsGoal || !savingsGoal.transfers) {
      return {
        completedAmount: 0,
        pendingAmount: 0,
        totalAmount: savingsGoal?.targetAmount || 0,
        completedPercentage: 0,
        pendingPercentage: 0
      };
    }

    const completedDebitTransfers = savingsGoal.transfers.filter(t => t.status === 'completed' && t.type === 'debit');
    const completedCreditTransfers = savingsGoal.transfers.filter(t => t.status === 'completed' && t.type === 'credit');
    const pendingTransfers = savingsGoal.transfers.filter(t => t.status === 'pending' && t.type === 'debit');
    
    const completedAmount = completedDebitTransfers.reduce((sum, t) => sum + t.amount, 0) - completedCreditTransfers.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pendingTransfers.reduce((sum, t) => sum + t.amount, 0);
    
    const completedPercentage = (completedAmount / savingsGoal.targetAmount) * 100;
    const pendingPercentage = (pendingAmount / savingsGoal.targetAmount) * 100;
    
    return {
      completedAmount,
      pendingAmount,
      totalAmount: savingsGoal.targetAmount,
      completedPercentage: Math.min(completedPercentage, 100),
      pendingPercentage: Math.min(pendingPercentage, 100 - completedPercentage)
    };
  };

  const generateAiImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await api.post(`/api/savings-goal/${savingsGoalId}/generate-image`);
      setAiImage(response.data.imageUrl);
      // Refresh the goal data
      const refreshed = await api.get(`/api/savings-goal/${savingsGoalId}`);
      setSavingsGoal(refreshed.data);
    } catch (error) {
      setError('Failed to generate AI image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getAiInsight = async (insightType) => {
    try {
      const response = await api.post(`/api/savings-goal/${savingsGoalId}/ai-insights`, { insightType });
      const newInsight = {
        type: insightType,
        content: response.data.insight,
        createdAt: new Date()
      };
      setAiInsights(prev => [...prev, newInsight]);
    } catch (error) {
      setError('Failed to get AI insight');
    }
  };

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await api.post(`/api/savings-goal/${savingsGoalId}/web-search`, { 
        searchQuery: searchQuery.trim() 
      });
      console.log(response.data.products);
      setSearchResults(response.data.products);
    } catch (error) {
      setError('Failed to search for products');
    } finally {
      setIsSearching(false);
    }
  };

  const saveProduct = async (product) => {
    try {
      const response = await api.post(`/api/savings-goal/${savingsGoalId}/save-product`, { 
        productData: product 
      });
      setSavingsGoal(response.data.goal);
      setShowProductSearch(false);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      setError('Failed to save product');
    }
  };

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

  const headerClasses = savingsGoal.product?.thumbnail ? 'col-sm-7 mt-3 offset-sm-1' : 'col-sm-7 mt-3 offset-sm-1';

  // 4) UI (replace title/description section)
  return (
    <>
      <Navbar user={user} />
      <div className='container mt-3'>
        <div className='row'>
          {/* Existing goal content */}
          <div className={headerClasses}>
            {/* Better inline editing approach */}
            <div className="d-flex align-items-start">
              {/* Show product thumbnail first, fallback to AI image, then placeholder */}
              {(savingsGoal.product?.thumbnail || aiImage) ? (
                <img 
                  src={savingsGoal.product?.thumbnail || aiImage} 
                  alt={savingsGoal.product?.thumbnail ? "Product Image" : "AI Generated Goal Icon"} 
                  className="rounded-circle mb-3" 
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    objectFit: 'cover',
                    objectPosition: 'center',
                    flexShrink: 0,
                    minWidth: '120px',
                    minHeight: '120px'
                  }}
                />
              ) : (
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" 
                     style={{ 
                       width: '120px', 
                       height: '120px',
                       flexShrink: 0,
                       minWidth: '120px',
                       minHeight: '120px'
                     }}>
                  <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                </div>
              )}
              
              <div className="ms-3 flex-grow-1">
                {/* Goal Name - inline edit */}
                <div className="mb-2 d-flex justify-content-between align-items-start">
                  {editing ? (
                    <input
                      type="text"
                      className="form-control border-0 p-0"
                      value={editGoalName}
                      onChange={(e) => setEditGoalName(e.target.value)}
                      style={{ 
                        backgroundColor: 'transparent',
                        boxShadow: 'none'
                      }}
                    />
                  ) : (
                    <h3 className="mb-2">{savingsGoal.goalName || savingsGoal.product?.title}</h3>
                  )}
                  
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={openEditModal}
                    title="Edit goal details"
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </div>
                {savingsGoal.product && (<>
                  <div className="mb-2 d-flex align-items-center gap-2">
                    {
                      savingsGoal.product.source && (
                        <>
                          <i className="bi bi-shop text-muted"></i>
                          <span className="text-muted small">{savingsGoal.product.source}</span>
                        </>
                      )
                    }
                    {/* Reviews if available */}
                    {savingsGoal.product.rating && (
                      <span className="text-muted small">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        {savingsGoal.product.rating} ({savingsGoal.product.reviews} reviews)
                      </span>
                    )}
                    
                    {/* Product link icon */}
                    {savingsGoal.product?.productLink && (
                      <a 
                        href={savingsGoal.product.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                        title="Open product page"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    )}
                  </div>
                  <div className="mb-3">
                    {editing ? (
                      <textarea
                        className="form-control border-0 p-0"
                        rows="2"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={{ 
                          backgroundColor: 'transparent',
                          boxShadow: 'none',
                          resize: 'none'
                        }}
                      />
                    ) : (
                      <p className="text-muted mb-2">{savingsGoal.description || 'No description provided.'}</p>
                    )}
                  </div></>
                )}

                {/* Description - only show if no product info */}
                {!savingsGoal.product && (
                  <div className="mb-3">
                    {editing ? (
                      <textarea
                        className="form-control border-0 p-0"
                        rows="2"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={{ 
                          backgroundColor: 'transparent',
                          boxShadow: 'none',
                          resize: 'none'
                        }}
                      />
                    ) : (
                      <p className="text-muted mb-2">{savingsGoal.description || 'No description provided.'}</p>
                    )}
                  </div>
                )}

                {/* Progress Bar - current amount / target amount */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Progress</small>
                    <small className="text-muted">
                      ${savingsGoal.currentAmount || 0} / ${savingsGoal.targetAmount || 0}
                    </small>
              </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${Math.min((savingsGoal.currentAmount || 0) / (savingsGoal.targetAmount || 1) * 100, 100)}%` 
                      }}
                    ></div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
        {
          savingsGoal.bank && (
            <div className='row mt-4'>
              <div className='col-sm-4 offset-sm-1'>
                  <h4 className='text-muted'>
                    {savingsGoal.bank.bankName} - ${savingsGoal.savingsAmount}
                    &nbsp;{savingsGoal.schedule.interval}&nbsp; 
                    <i onClick={() => navigate(`/setup-savings/${savingsGoalId}`)} className="bi bi-pencil-square"></i>
                  </h4>
              </div> 
            </div>
          )
        }
        {
          !savingsGoal.bank && (
            <div className='row my-3'>
              <div className='col-sm-4 offset-sm-1'>
                <button className='btn btn-primary' onClick={() => navigate(`/setup-savings/${savingsGoalId}`)}>
                  Setup Transfers
                </button>
              </div> 
            </div>
          )
        }
        <div className='row mt-3'>
          <div className='col-sm-10 offset-sm-1'>
            {/* <h1>Your Savings Plan</h1> */}
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0 p-2">Transfers</h4>
            </div>
            {/* Reorder columns to put Transaction ID first */}
            {savingsGoal.transfers && savingsGoal.transfers.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="d-none d-md-block">
              <table className='table table-stripped'>
                <thead>
                  <tr>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Transaction ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                      {savingsGoal.transfers.map((transfer, index) => (
                        <tr 
                          key={index}
                          className={transfer.type === 'credit' ? 'table-danger' : ''}
                        >
                          <td style={{ border: '1px solid #ccc', padding: '8px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {transfer.transactionId || transfer.transferId || 'N/A'}
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                            {new Date(transfer.date).toLocaleDateString()}
                          </td>
                          <td 
                            style={{ 
                              border: '1px solid #ccc', 
                              padding: '8px',
                              color: transfer.type === 'credit' ? '#dc3545' : 'inherit',
                              fontWeight: transfer.type === 'credit' ? 'bold' : 'normal'
                            }}
                          >
                            {transfer.type === 'credit' ? 
                              `($${Math.abs(transfer.amount)})` : 
                              `$${transfer.amount}`
                            }
                          </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                            <span className={`badge ${
                              transfer.status === 'completed' ? 'bg-success' : 
                              transfer.status === 'pending' ? 'bg-warning' : 
                              'bg-danger'
                            }`}>
                              {transfer.status}
                            </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>

                {/* Mobile Cards */}
                <div className="d-md-none">
                  {savingsGoal.transfers.map((transfer, index) => (
                    <div 
                      key={index} 
                      className={`mb-2 ${transfer.type === 'credit' ? 'border-danger' : 'border-success'}`}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">
                              {new Date(transfer.date).toLocaleDateString()}
                            </div>
                            <div 
                              className={`h5 mb-0 ${transfer.type === 'credit' ? 'text-danger' : 'text-success'}`}
                            >
                              {transfer.type === 'credit' ? 
                                `($${Math.abs(transfer.amount)})` : 
                                `$${transfer.amount}`
                              }
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              setSelectedTransfer(transfer);
                              setShowTransferModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i> Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transfer Details Modal */}
                {showTransferModal && selectedTransfer && 
                  <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Transfer Details</h5>
                          <button 
                            type="button" 
                            className="btn-close" 
                            onClick={closeTransferModal}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <div className="row mb-2">
                            <div className="col-4 fw-bold">Transaction ID:</div>
                            <div className="col-8">{selectedTransfer.transactionId || selectedTransfer.transferId || 'N/A'}</div>
                          </div>
                          <div className="row mb-2">
                            <div className="col-4 fw-bold">Date:</div>
                            <div className="col-8">{new Date(selectedTransfer.date).toLocaleDateString()}</div>
                          </div>
                          <div className="row mb-2">
                            <div className="col-4 fw-bold">Amount:</div>
                            <div className={`col-8 ${selectedTransfer.type === 'credit' ? 'text-danger' : 'text-success'}`}>
                              {selectedTransfer.type === 'credit' ? 
                                `($${Math.abs(selectedTransfer.amount)})` : 
                                `$${selectedTransfer.amount}`
                              }
                            </div>
                          </div>
                          <div className="row mb-2">
                            <div className="col-4 fw-bold">Status:</div>
                            <div className="col-8">
                              <span className={`badge ${
                                selectedTransfer.status === 'completed' ? 'bg-success' : 
                                selectedTransfer.status === 'pending' ? 'bg-warning' : 
                                'bg-danger'
                              }`}>
                                {selectedTransfer.status}
                              </span>
                            </div>
                          </div>
                          <div className="row mb-2">
                            <div className="col-4 fw-bold">Type:</div>
                            <div className="col-8">{selectedTransfer.type}</div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={closeTransferModal}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </>
            ) : (
              <p>No transfers found.</p>
            )}
          </div>
        </div>

        {/* Product Search Section - NEW, for product-type goals */}
        {savingsGoal.category === 'product' && (
          <div className="row my-4">
            <div className="col-sm-10 offset-sm-1">
              <div className="card">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <button 
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                    style={{
                      color: '#ffffff',
                      borderColor: '#ffffff',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#116530';
                      e.target.style.borderColor = '#116530';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#ffffff';
                      e.target.style.borderColor = '#ffffff';
                    }}
                  >
                    {showProductSearch ? 'Hide' : 'Show'} Product Search
                  </button>
                </div>
                
                {showProductSearch && (
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search for products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                        />
                      </div>
                      <div className="col-md-4">
                        <button 
                          className="btn btn-success w-100"
                          onClick={searchProducts}
                          disabled={isSearching || !searchQuery.trim()}
                        >
                          {isSearching ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-3">
                        <h6>Search Results:</h6>
                        <div className="d-flex overflow-auto" style={{ gap: '1rem', paddingBottom: '0.5rem' }}>
                          {searchResults.map((product, index) => (
                            <div key={index} className="card" style={{ width: '320px', flexShrink: 0 }}>
                              {product?.thumbnail && (
                                <img 
                                  src={product.thumbnail} 
                                  className="card-img-top" 
                                  alt={product.title}
                                  style={{ height: '150px', objectFit: 'cover' }}
                                />
                              )}
                              <div className="card-body">
                                {/* Clickable title that opens the product URL */}
                                <h6 className="card-title" style={{ fontSize: '0.9rem', height: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  <a 
                                    href={product.productLink} // Changed from productLink to link
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: 'inherit', textDecoration: 'none' }}
                                    title={product.title}
                                  >
                                    {product.title}
                                  </a>
                                </h6>
                                
                                {/* Store name */}
                                {product.source && (
                                  <p className="card-text mb-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                                    <i className="bi bi-shop me-1"></i>
                                    {product.source}
                                  </p>
                                )}
                                
                                {/* Price information */}
                                <p className="card-text mb-2" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  <span style={{ color: '#198754' }}>${product.price}</span>
                                  {product.old_price && (
                                    <span className="text-muted ms-2" style={{ textDecoration: 'line-through' }}>
                                      ${product.old_price}
                                    </span>
                                  )}
                                </p>
                                
                                {/* Rating and reviews */}
                                {product.rating && (
                                  <div className="mb-2" style={{ fontSize: '0.8rem' }}>
                                    <div className="d-flex align-items-center mb-1">
                                      <span className="text-warning me-1">
                                        {'★'.repeat(Math.floor(product.rating))}
                                        {product.rating % 1 !== 0 && '☆'}
                                      </span>
                                      <span className="text-muted ms-1">
                                        {product.rating.toFixed(1)}
                                      </span>
                                    </div>
                                    {product.reviews && (
                                      <small className="text-muted">
                                        ({product.reviews} reviews)
                                      </small>
                                    )}
                                  </div>
                                )}
                                
                                {/* Action buttons */}
                                <div className="d-flex gap-2">
                                  <button 
                                    className="btn btn-outline-success btn-sm flex-fill"
                                    onClick={() => saveProduct(product)}
                                    style={{ 
                                      color: '#198754', 
                                      borderColor: '#198754', 
                                      backgroundColor: 'transparent' 
                                    }}
                                  >
                                    Save as Savings Goal
                                  </button>
                                  <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => window.open(product.productLink, '_blank', 'noopener,noreferrer')} // Changed from productLink to link
                                    style={{ 
                                      color: '#0d6efd', 
                                      borderColor: '#0d6efd', 
                                      backgroundColor: 'transparent' 
                                    }}
                                    title="Open product page"
                                  >
                                    <i className="bi bi-box-arrow-up-right"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Savings Goal</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeEditModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* Image and Magic Wand Row */}
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    {(savingsGoal.product?.thumbnail || aiImage) ? (
                      <img 
                        src={savingsGoal.product?.thumbnail || aiImage} 
                        alt="Goal Image" 
                        className="rounded" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" 
                           style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-image text-muted" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={generateAiImage}
                    disabled={isGeneratingImage}
                    title="Generate AI Image"
                  >
                    <i className="bi bi-magic"></i> Generate AI Image
                  </button>
                </div>

                {/* Form Fields */}
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editGoalName}
                    onChange={(e) => setEditGoalName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter description..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Goal Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                  />
                </div>

                {/* Success feedback message */}
                {saveFeedback && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {saveFeedback}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewSavings;