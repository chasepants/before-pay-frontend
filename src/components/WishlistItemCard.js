import React from 'react';
import { Link } from 'react-router-dom';
import './WishlistItemCard.css';

const WishlistItemCard = ({
  wishlistItemId,
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
  subscriptionId,
  onDelete
}) => {
  return (
    <div className="wishlist-item-card">
      <img src={imageUrl} alt={name} className="wishlist-item-image" />
      <div className="wishlist-item-details">
        <h3 className="wishlist-item-title">{name}</h3>
        <p className="wishlist-item-price">{price}</p>
        {oldPrice && <p className="wishlist-item-old-price">{oldPrice}</p>}
        <p className="wishlist-item-source">
          <img src={sourceIcon} alt={source} className="source-icon" /> {source}
        </p>
        {rating && (
          <p className="wishlist-item-rating">
            {rating} ({reviews} reviews)
          </p>
        )}
        {badge && <span className="wishlist-item-badge">{badge}</span>}
        {tag && <span className="wishlist-item-tag">{tag}</span>}
        {delivery && <p className="wishlist-item-delivery">{delivery}</p>}
        <p className="wishlist-item-savings">
          Savings Goal: ${savingsGoal} | Progress: ${savingsProgress}
        </p>
        <div className="wishlist-item-actions">
          <button
            onClick={onDelete}
            className="wishlist-item-button delete-button"
          >
            Remove
          </button>
          {subscriptionId ? (
            <Link to={`/view-savings/${wishlistItemId}`}>
              <button
                className="wishlist-item-button view-savings-button"
                style={{ backgroundColor: '#34a853', color: 'white', marginLeft: '8px' }}
              >
                View Savings
              </button>
            </Link>
          ) : (
            <Link to={`/setup-savings/${wishlistItemId}`}>
              <button
                className="wishlist-item-button setup-savings-button"
                style={{ backgroundColor: '#4285f4', color: 'white', marginLeft: '8px' }}
              >
                Setup Savings
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard;