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
  isInSavings
}) => {
  const buttonContent = isInSavings ? (
    <span className="text-success">Added ✓</span>
  ) : (
    <a href="#" className="btn btn-primary w-100" onClick={(e) => { e.preventDefault(); onButtonClick(); }}>ADD TO SAVINGS</a>
  );
  return (
    <div className="card h-100">
      <img src={imageUrl || 'https://via.placeholder.com/200'} alt={name} className="card-img-top" />
      <div className="card-body d-flex flex-column">
        <h4 className="card-title">{name}</h4>
        <p className="card-text">
          <span className="text-success fw-bold">{price}</span>
          {oldPrice && <s className="text-muted ms-1">{oldPrice}</s>}
        </p>
        <p className="card-text text-muted">
          <img src={sourceIcon} alt={`${source} icon`} className="product-source-icon me-1" /> {source}
        </p>
        {rating && (
          <p className="card-text">
            {rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({reviews} reviews)
          </p>
        )}
        <div className="mt-auto text-center">
          {buttonContent}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;