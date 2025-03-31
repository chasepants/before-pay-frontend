import React from 'react';
import './ProductCard.css';

const ProductCard = ({
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
  onButtonClick,
  isInWishlist
}) => {
  const buttonContent = isInWishlist ? (
    <span style={{ color: 'green' }}>Added ✓</span>
  ) : (
    <button className="add-to-wishlist" onClick={onButtonClick}>Add to Wishlist</button>
  );
  return (
    <div className="product-card">
      <a href={url} target="_blank" rel="noopener noreferrer" className="product-link">
        <img src={imageUrl || 'https://via.placeholder.com/200'} alt={name} className="product-image" />
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          <div className="product-prices">
            {oldPrice && <span className="product-price-old">{oldPrice}</span>}
            <span className="product-price">{price}</span>
          </div>
          <div className="product-source"><img className="product-source-icon" src={sourceIcon}/>{source}</div>
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
      {buttonContent}
    </div>
  );
}

export default ProductCard;