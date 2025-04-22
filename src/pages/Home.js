import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import WishlistItemCard from '../components/WishlistItemCard';
import mockSerpResults from '../mock_serp.js';

const Home = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/wishlist', { withCredentials: true });
      setWishlist(res.data);
    } catch (err) {
      console.error('Wishlist fetch failed:', err);
    }
  };

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
      const res = await axios.post('http://localhost:3001/api/wishlist', {...product, savings_goal: product.extracted_price}, { withCredentials: true });
      setWishlist([...wishlist, res.data]);
    } catch (err) {
      console.error('Add to wishlist failed:', err);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`http://localhost:3001/api/wishlist/${itemId}`, { withCredentials: true });
      setWishlist(wishlist => wishlist.filter(item => item._id !== itemId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleLogout = () => {
    axios.get('http://localhost:3001/api/auth/logout', { withCredentials: true })
      .then(() => window.location.href = '/');
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Beforepay Wishlist</h1>
        <button
          onClick={handleLogout}
          style={{ backgroundColor: '#db4437', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px 0 0 4px' }}
          placeholder="Search for products..."
        />
        <button
          onClick={handleSearch}
          style={{ backgroundColor: '#4285f4', color: 'white', padding: '8px 16px', borderRadius: '0 4px 4px 0', border: 'none', cursor: 'pointer' }}
        >
          Search
        </button>
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
              onButtonClick={() => addToWishlist(p)}
              isInWishlist={isInWishlist}
            />
          );
        })}
      </div>
      <h2 style={{ marginTop: '32px', fontSize: '20px', fontWeight: 'bold' }}>My Wishlist</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {wishlist.map(item => (
          <WishlistItemCard
            key={item._id}
            wishlistItemId={item._id} // Pass _id as wishlistItemId
            name={item.title}
            price={item.price}
            oldPrice={item.old_price}
            url={item.product_link}
            imageUrl={item.thumbnail}
            source={item.source}
            sourceIcon={item.source_icon}
            rating={item.rating}
            reviews={item.reviews}
            badge={item.badge}
            tag={item.tag}
            delivery={item.delivery}
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
    </div>
  );
};

export default Home;