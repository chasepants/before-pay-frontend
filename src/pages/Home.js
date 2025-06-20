// frontend/src/pages/Home.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import WishlistItemCard from '../components/WishlistItemCard';
import mockSerpResults from '../mock_serp.js';
import Navbar from '../components/Navbar';
import { addWishlistItem, removeWishlistItem } from '../store/wishlistSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  
  const { user } = useSelector((state) => state.user);
  const { items: wishlist } = useSelector((state) => state.wishlist);

  const handleSearch = async () => {
    try {
      // const res = await axios.get(`http://localhost:3001/api/wishlist/search?q=${search}`, { withCredentials: true });
      // setProducts(res.data);
      setProducts(mockSerpResults);
    } catch (err) {
      console.error('Mock search failed:', err);
    }
  };

  const addToWishlist = async (product) => {
    if (wishlist.some(item => item.product_id === product.product_id)) {
      alert('Product already in wishlist');
      return;
    }
    try {
      const res = await axios.post('http://localhost:3001/api/wishlist', { ...product, savings_goal: product.extracted_price }, { withCredentials: true });
      dispatch(addWishlistItem(res.data));
    } catch (err) {
      console.error('Add to wishlist failed:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`http://localhost:3001/api/wishlist/${itemId}`, { withCredentials: true });
      dispatch(removeWishlistItem(itemId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-5'>
        <div className='row'>
          <h1 className='text-center fw-bold fs-4'>SEARCH FOR PRODUCTS TO ADD TO YOUR SAVINGS LIST</h1>
        </div>
        <div className='row mt-3'>
          <div className='col-sm-6 offset-sm-3'>
            <div className="input-group mb-3">
              <input
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                type="text"
                className="form-control"
                placeholder="Search for products..."
                aria-label="Search for Products"
                aria-describedby="button-addon2"
              />
              <button
                onClick={handleSearch}
                className="btn btn-primary"
                type="button"
                id="button-addon2"
              >
                Search
              </button>
            </div>
          </div>
        </div>
        <div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 m-4'>
          {products.map((p, i) => {
            const isInWishlist = wishlist.some(item => item.product_id === p.product_id);
            return (
              <div className='col' key={i}>
                <ProductCard
                  name={p.title}
                  price={p.price}
                  oldPrice={p.old_price}
                  url={p.product_link}
                  imageUrl={p.thumbnail}
                  source={p.source}
                  sourceIcon={p.source_icon}
                  rating={p.rating}
                  reviews={p.reviews}
                  badge={p.badge}
                  tag={p.tag}
                  delivery={p.delivery}
                  onButtonClick={() => user ? addToWishlist(p) : navigate('/signup')}
                  isInWishlist={isInWishlist}
                />
              </div>
            );
          })}
        </div>
        {user && (
          <>
            <h1 className='mt-5 fs-3 fw-bold'>SAVINGS LIST</h1>
            <div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 m-4'>
              {wishlist.map(item => (
                <div className='col' key={item._id}>
                  <WishlistItemCard
                    wishlistItemId={item._id}
                    name={item.title}
                    price={item.price}
                    oldPrice={item.old_price}
                    url={item.product_link}
                    imageUrl={item.thumbnail}
                    source={item.source}
                    sourceIcon={item.source_icon}
                    rating={item.rating}
                    reviews={item.reviews}
                    savingsGoal={item.savings_goal}
                    savingsProgress={item.savings_progress}
                    fundingSourceId={item.fundingSourceId}
                    bankName={item.bankName}
                    bankAccount={item.bankAccountName}
                    onDelete={() => handleDelete(item._id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Home;