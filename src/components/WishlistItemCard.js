import React from 'react';
import './WishlistItemCard.css';

const WishlistItemCard = ({
  name,
  price,
  oldPrice,
  url,
  imageUrl,
  source,
  sourceIcon,
  rating,
  reviews,
  badge,
  tag,
  delivery,
  savingsGoal,
  savingsProgress,
  onDelete
}) => {
  const progressPercent = (savingsProgress / savingsGoal) * 100;
  return (
    <div className="wishlist-item-card">
      <a href={url} target="_blank" rel="noopener noreferrer" className="product-link">
        <img src={imageUrl || 'https://viaplaceholder.com/200'} alt={name} className="product-image" />
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          <div className="product-prices">
            {oldPrice && <span className="product-price-old">{oldPrice}</span>}
            <span className="product-price">{price}</span>
          </div>
          <div className="product-source">
            {sourceIcon && <img src={sourceIcon} alt={`${source} icon`} className="source-icon" />}
            <span>{source}</span>
          </div>
          {rating && (
            <div className="product-rating">
              <span className="rating-number">{rating}</span>
              <span className="reviews-count">({reviews} reviews)</span>
            </div>
          )}
          {/* {badge && <div className="product-badge">{badge}</div>}
          {tag && <div className="product-tag">{tag}</div>}
          {delivery && <div className="product-delivery">{delivery}</div>} */}
        </div>
      </a>
      <div className="savings-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <span className="savings-text">${savingsProgress ?? 0} / ${savingsGoal}</span>
      </div>
      <button className="delete-button" onClick={() => {
            console.log("button clicked!")
            onDelete()
        }}>
        Delete
      </button>
    </div>
  );
};

export default WishlistItemCard;