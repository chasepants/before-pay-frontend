// frontend/src/components/SavingsGoalCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SavingsGoalCard = ({ goalId, name, price, oldPrice, url, imageUrl, source, sourceIcon, rating, reviews, targetAmount, currentAmount, fundingSourceId, bankName, bankAccount, onDelete, isApproved }) => {
  const navigate = useNavigate();
  const progressPercentage = Math.min((currentAmount / targetAmount) * 100, 100);

  return (
    <div className="card h-100">
      <img src={imageUrl || 'https://via.placeholder.com/200'} className="card-img-top" alt={name} />
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <p className="card-text">
          <span style={{ textDecoration: oldPrice ? 'line-through' : 'none' }}>{oldPrice || ''}</span>
          <span style={{ color: '#7ed957' }}> ${price}</span>
        </p>
        {rating && (
          <p className="card-text">
            {rating} <i className="bi bi-star-fill"></i> ({reviews} reviews)
          </p>
        )}
        <div className="progress" role="progressbar" aria-label="Savings Progress" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <p className="card-text">
          <b>${currentAmount} / ${targetAmount}</b>
        </p>
        <p className="card-text">
          <img src={sourceIcon} alt={`${source} icon`} style={{ width: '20px', marginRight: '5px' }} /> {source}
        </p>
        {fundingSourceId && bankName && bankAccount && (
          <p className="card-text">{bankName} - {bankAccount}</p>
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-2">
          View Product
        </a>
        {isApproved && (
          <button
            className="btn btn-danger mt-2"
            onClick={() => onDelete(goalId)}
          >
            Delete
          </button>
        )}
        {!isApproved && (
          <button className="btn btn-secondary mt-2" disabled>
            Pending Approval
          </button>
        )}
      </div>
    </div>
  );
};

export default SavingsGoalCard;