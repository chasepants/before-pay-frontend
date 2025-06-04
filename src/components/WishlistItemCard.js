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
  subscriptionId,
  onDelete
}) => {
  console.log(subscriptionId);
  const navigate = useNavigate();
  const button = subscriptionId ? 
    <button 
      className="btn btn-secondary card-btn w-100"
      onClick={() => navigate(`/view-savings/${wishlistItemId}` )}>
        View Savings
    </button> :
    <button 
      className="btn btn-primary card-btn w-100"
      onClick={() => navigate(`/setup-savings/${wishlistItemId}`)}  
    >
      Setup Savings
    </button>

  return (
    <div className="card" style={{width: "22rem" }}>
      <div>
        <button className='btn btn-light' onClick={onDelete}>X</button>
      </div>
      <img src={imageUrl || 'https://via.placeholder.com/200'} alt={name} className="card-img-top" />
      <div className="card-body">
        <h4 className="card-title">{name}</h4>
        <p className="card-text">
          <b>
            <span style={{color: "#7ed957"}}>{price}</span>&nbsp;
            {oldPrice && <s style={{color:"#d4d8de"}}>{oldPrice}</s>}
          </b>
        </p>
        {
          subscriptionId && (
            <>
              <p className="card-text text-muted">
                Wells Fargo - Checking #4587 
              </p>
              <p className="card-text text-muted">
                $25 every 2 weeks 
              </p>
              <div className="progress" role="progressbar" aria-label="Savings Progress" aria-valuenow={{savingsProgress}} aria-valuemin="0" aria-valuemax={{savingsGoal}}>
                <div className="progress-bar" style={{width: "50%"}}></div>
              </div>
            </>
          )
        }
        {
          !subscriptionId && (
            <>
              <p className="card-text" style={{color:"#d4d8de"}}>
                <b>
                  <div className="product-source"><img className="product-source-icon" src={sourceIcon}/>&nbsp;{source}</div>
                </b>
              </p>
              {rating && (
                <p>
                  {rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({reviews} reviews)
                </p>
              )}
            </>
          )
        }
        <br/>
        <br/>
        <div className='text-center mt-3'>
          {button}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemCard;