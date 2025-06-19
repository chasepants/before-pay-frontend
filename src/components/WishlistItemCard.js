// frontend/src/components/WishlistItemCard.js
import { useNavigate } from 'react-router-dom';
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
  savingsGoal,
  savingsProgress,
  fundingSourceId,
  bankName,
  bankAccountName,
  onDelete
}) => {
  const navigate = useNavigate();
  const button = fundingSourceId ? (
    <a
      className="btn btn-secondary w-100"
      onClick={(e) => { e.preventDefault(); navigate(`/view-savings/${wishlistItemId}`); }}
    >
      View Savings
    </a>
  ) : (
    <a
      className="btn btn-primary w-100"
      onClick={(e) => { e.preventDefault(); navigate(`/setup-savings/${wishlistItemId}`); }}
    >
      Setup Savings
    </a>
  );

  return (
    <div className="card h-100">
      <div className="card-header bg-white d-flex justify-content-end">
        <button className="btn btn-danger" onClick={onDelete}>X</button>
      </div>
      <img src={imageUrl || 'https://via.placeholder.com/200'} alt={name} className="card-img-top" />
      <div className="card-body d-flex flex-column">
        <h4 className="card-title">{name}</h4>
        <p className="card-text">
          <span className="text-success fw-bold">{price}</span>
          {oldPrice && <s className="text-muted ms-1">{oldPrice}</s>}
        </p>
        {fundingSourceId && (
          <>
            <p className="card-text text-muted">
              {fundingSourceId ? `${bankName} - ${bankAccountName}` : ''}
            </p>
            <p className="card-text text-muted">
              ${savingsProgress} / ${savingsGoal} ({((savingsProgress / savingsGoal) * 100).toFixed(0)}%)
            </p>
          </>
        )}
        {!fundingSourceId && (
          <>
            <p className="card-text text-muted">
              <img src={sourceIcon} alt={`${source} icon`} className="product-source-icon me-1" /> {source}
            </p>
            {rating && (
              <p className="card-text">
                {rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({reviews} reviews)
              </p>
            )}
          </>
        )}
        <div className="mt-auto text-center">
          {button}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard;