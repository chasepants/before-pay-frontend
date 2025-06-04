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
      <div className='mt-5' style={{ padding: '16px' }}>
        <div className='container'>
          <div className='row'>
            <h1 className='text-center' style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'montserrat' }}>
              SEARCH FOR PRODUCTS TO ADD TO YOUR SAVINGS LIST
            </h1>
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
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          padding: '16px'
        }}>
          {products.map((p, i) => {
            const isInWishlist = wishlist.some(item => item.product_id === p.product_id);
            return (
              <ProductCard
                key={i}
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
            );
          })}
        </div>
        {user && (
          <>
            <h1 style={{ marginTop: '32px', fontSize: '20px', fontWeight: 'bold' }}>SAVINGS LIST</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {wishlist.map(item => (
                <WishlistItemCard
                  key={item._id}
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
                  subscriptionId={item.subscriptionId}
                  onDelete={() => {
                    console.log("deleting");
                    handleDelete(item._id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Home;