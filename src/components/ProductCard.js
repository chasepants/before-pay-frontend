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
    <button href="#" className="btn btn-primary card-btn" style={{width: "100%"}} onClick={onButtonClick}>ADD TO SAVINGS</button>
  );
  return (
    <div class="card" style={{width: "22rem" }}>
      <img src={imageUrl || 'https://via.placeholder.com/200'} alt={name} class="card-img-top" />
      <div class="card-body">
        <h4 class="card-title">{name}</h4>
        <p class="card-text">
          <b>
            <span style={{color: "#7ed957"}}>{price}</span>&nbsp;
            {oldPrice && <s style={{color:"#d4d8de"}}>{oldPrice}</s>}
          </b>
        </p>
        <p class="card-text" style={{color:"#d4d8de"}}>
          <b>
            <div className="product-source"><img className="product-source-icon" src={sourceIcon}/>&nbsp;{source}</div>
          </b>
        </p>
        {rating && (
          <p>
            {rating} <i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-half"></i> ({reviews} reviews)
          </p>
        )}
        <br/>
        <div className='text-center'>
          {buttonContent}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;

// <div className="product-card">
//   <a href={url} target="_blank" rel="noopener noreferrer" className="product-link">
//     <div className="product-info">
//       {/* {badge && <div className="product-badge">{badge}</div>}
//       {tag && <div className="product-tag">{tag}</div>}
//       {delivery && <div className="product-delivery">{delivery}</div>} */}
//     </div>
//   </a>
//   {buttonContent}
// </div>