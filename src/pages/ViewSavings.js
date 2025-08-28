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
      const payload = {
        goalName: editGoalName,
        description: editDescription,
        targetAmount: editTargetAmount === '' ? undefined : Number(editTargetAmount)
      };
      const res = await api.put(`/api/savings-goal/${savingsGoalId}`, payload);
      setSavingsGoal(res.data);
      setEditing(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update goal');
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

  // Only calculate progress after we know savingsGoal exists
  const progress = calculateProgress();

  const headerClasses = savingsGoal.product.thumbnail ? 'col-sm-7 mt-3 offset-sm-1' : 'col-sm-7 mt-3 offset-sm-1';

  // 4) UI (replace title/description section)
  return (
    <>
      <Navbar user={user} />
      <div className='container mt-3'>
        <div className='row'>
          {/* Existing goal content */}
          <div className={headerClasses}>
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
              {
                editing && (
                  <button 
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={generateAiImage}
                  disabled={isGeneratingImage}
                  title="Generate AI Image"
                >
                  <i className="bi bi-magic"></i> {/* Icon instead of text */}
                  {isGeneratingImage && <span className="ms-1">...</span>} {/* Show loading indicator */}
                </button>
                )
              }
              <div className='mx-3'>
              <h1 className='mt-3 mb-0' style={{ flex: 1 }}>
                {editing ? (
                  <input
                    className="form-control"
                    value={editGoalName}
                    onChange={(e) => setEditGoalName(e.target.value)}
                  />
                ) : (
                  (savingsGoal.goalName || savingsGoal.product.title)
                )}
              </h1>
              {editing ? (
              <textarea
                className="form-control mb-2"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
              />
            ) : (
              (savingsGoal.product?.description || savingsGoal.description) && (
                <p className="text-muted mb-2">
                  {savingsGoal.product?.description || savingsGoal.description}
                </p>
              )
            )}
              </div>
              {!editing && (
                <i
                  className="bi bi-pencil-square"
                  role="button"
                  aria-label="Edit goal"
                  title="Edit goal"
                  style={{ fontSize: '1.25rem', cursor: 'pointer', marginTop: '0.6rem' }}
                  onClick={() => setEditing(true)}
                />
              )}
            </div>
            <div className='d-flex justify-content-between'>
              <div className="w-75 pt-4">
                <ProgressBar>
                  {/* Completed payments in green */}
                  {progress.completedPercentage > 0 && (
                    <ProgressBar 
                      striped 
                      variant="success" 
                      now={progress.completedPercentage} 
                      key={1}
                      title={`$${progress.completedAmount} completed`}
                    />
                  )}
                  {/* Pending payments in yellow */}
                  {progress.pendingPercentage > 0 && (
                    <ProgressBar 
                      variant="warning" 
                      now={progress.pendingPercentage} 
                      key={2}
                      title={`$${progress.pendingAmount} pending`}
                    />
                  )}
                </ProgressBar>
              </div>
              <div>
                {/* 5) Savings amount field (near schedule/bank details is fine) */}
                <div className='row'>
                  <div className='col-sm-10 offset-sm-1'>
                    {editing ? (
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="number"
                          className="form-control"
                          value={editTargetAmount}
                          onChange={(e) => setEditTargetAmount(e.target.value)}
                          placeholder="Target amount"
                          min="0"
                          step="1"
                        />
                      </div>
                    ) : (
                      <h5 className="card-text">
                        <b>${savingsGoal.currentAmount} / ${savingsGoal.targetAmount}</b>
                      </h5>
                    )}
                  </div>
                </div>
              </div>
            </div>            
            <div className="mt-2">
              <small className="text-muted">
                <span className="text-success">●</span> ${savingsGoal.currentAmount} completed
                {progress.pendingAmount > 0 && (
                  <>
                    <span className="text-warning ms-3">●</span> ${progress.pendingAmount} pending
                  </>
                )}
              </small>
            </div>

            <div className='d-flex justify-content-between'>
              <div className="card-text" style={{ color: "#d4d8de" }}>
                <b>
                  {savingsGoal.product?.source && (
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <p className="card-text mb-0" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        <i className="bi bi-shop me-1"></i>
                        {savingsGoal.product.source}
                      </p>
                      {savingsGoal.product?.productLink && (
                        <a 
                          href={savingsGoal.product.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm"
                          style={{ 
                            color: '#0d6efd', 
                            borderColor: '#0d6efd', 
                            backgroundColor: 'transparent',
                            fontSize: '0.7rem',
                            padding: '0.25rem 0.5rem'
                          }}
                          title="Open product page"
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i>
                          View Product
                        </a>
                      )}
                    </div>
                  )}
                </b>
              </div>
            </div>
            {savingsGoal.product.rating && (
              <p>
                {savingsGoal.product.rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({savingsGoal.product.reviews} reviews)
              </p>
            )}
            <div className=''>
              {editing && (
                <>
                  <button className="btn btn-primary btn-sm me-2" onClick={handleSave}>Save</button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                </>
              )}
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
            {savingsGoal.transfers && savingsGoal.transfers.length > 0 ? (
              <table className='table table-stripped'>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Transaction ID</th> {/* Changed from Payment ID */}
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsGoal.transfers.map((transfer, index) => (
                    <tr 
                      key={index}
                      className={transfer.type === 'credit' ? 'table-danger' : ''}
                    >
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
                        ${transfer.amount}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {transfer.transactionId || transfer.transferId || 'N/A'}
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
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <span 
                          style={{ 
                            color: transfer.type === 'credit' ? '#dc3545' : 'inherit',
                            fontWeight: transfer.type === 'credit' ? 'bold' : 'normal'
                          }}
                        >
                          {transfer.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                              {product.thumbnail && (
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
    </>
  );
};

export default ViewSavings;