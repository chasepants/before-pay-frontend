// before-pay-frontend/src/pages/TransferBack.js
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import api from '../api';
import Navbar from '../components/Navbar';

const TransferBack = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.user);
  const [goals, setGoals] = useState([]);
  const [allocs, setAllocs] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const load = async () => {
      try {
        const res = await api.get('/api/savings-goal');
        setGoals(res.data || []);
        const init = {};
        (res.data || []).forEach(g => { init[g._id] = 0; });
        setAllocs(init);
      } catch {
        setError('Failed to load goals');
      }
    };
    load();
  }, [user, navigate]);

  const sumAlloc = Object.values(allocs).reduce((s, v) => s + Number(v || 0), 0);

  const onAllocChange = (id, val, max) => {
    const v = Math.max(0, Math.min(Number(val || 0), max));
    const next = { ...allocs, [id]: v };
    const newSum = Object.values(next).reduce((s, x) => s + Number(x || 0), 0);
    if (Number(totalAmount || 0) >= newSum) {
      setAllocs(next);
    } else {
      const over = newSum - Number(totalAmount || 0);
      next[id] = Math.max(0, v - over);
      setAllocs(next);
    }
  };

  const submit = async () => {
    try {
      const allocations = Object.entries(allocs)
        .map(([savingsGoalId, amount]) => ({ savingsGoalId, amount: Number(amount) }))
        .filter(a => a.amount > 0);
      await api.post('/api/bank/transfer-back-batch', {
        totalAmount: Number(totalAmount),
        allocations
      });
      alert('Transfer back initiated');
      navigate('/home');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to transfer back');
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="container mt-4" data-testid="transfer-back-container">
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-dark text-white">
                <h4 className="mb-0" data-testid="transfer-back-title">Transfer Back</h4>
              </div>
              <div className="card-body">
                {error && <p className="text-danger" data-testid="error-message">{error}</p>}

                <div className="mb-3">
                  <label className="form-label" data-testid="total-amount-label">Total amount to transfer back</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="300"
                    data-testid="total-amount-input"
                  />
                  <small className="text-muted" data-testid="allocation-help-text">Allocate this amount across your savings goals below.</small>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped" data-testid="goals-table">
                    <thead className="bg-light">
                      <tr>
                        <th data-testid="goal-header">Goal</th>
                        <th data-testid="current-saved-header">Current Saved</th>
                        <th data-testid="allocate-header">Allocate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map(g => (
                        <tr key={g._id} data-testid={`goal-row-${g._id}`}>
                          <td className="align-middle" data-testid={`goal-name-${g._id}`}>{g.goalName || g.product?.title}</td>
                          <td className="align-middle" data-testid={`goal-amount-${g._id}`}>${g.currentAmount || 0}</td>
                          <td className="align-middle" style={{ minWidth: 260 }}>
                            <input
                              type="range"
                              min="0"
                              max={g.currentAmount || 0}
                              value={allocs[g._id] || 0}
                              onChange={(e) => onAllocChange(g._id, e.target.value, g.currentAmount || 0)}
                              data-testid={`goal-slider-${g._id}`}
                            />
                            <div className="d-flex align-items-center mt-1">
                              <input
                                type="number"
                                className="form-control form-control-sm me-2"
                                min="0"
                                max={g.currentAmount || 0}
                                value={allocs[g._id] || 0}
                                onChange={(e) => onAllocChange(g._id, e.target.value, g.currentAmount || 0)}
                                data-testid={`goal-input-${g._id}`}
                              />
                              <span className="text-muted" data-testid={`goal-max-${g._id}`}>/ ${g.currentAmount || 0}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {goals.length === 0 && (
                        <tr data-testid="no-goals-row"><td colSpan="3" className="text-center">No goals</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between mt-3">
                  <div data-testid="allocation-summary"><b>Allocated:</b> ${sumAlloc} / ${Number(totalAmount || 0)}</div>
                  <button
                    className="btn btn-primary"
                    onClick={submit}
                    disabled={sumAlloc !== Number(totalAmount || 0) || sumAlloc <= 0}
                    data-testid="transfer-button"
                  >
                    Transfer
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransferBack;
