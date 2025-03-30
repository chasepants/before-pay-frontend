import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import mockSerpResults from '../mock_serp.js'; // Import mock data

const Home = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/wishlist', { withCredentials: true })
      .then(res => setWishlist(res.data))
      .catch(err => console.error('Wishlist fetch failed:', err));
  }, []);

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
    try {
      const res = await axios.post('http://localhost:3001/api/wishlist', { ...product, price: product.extracted_price, savingsGoal: product.extracted_price }, { withCredentials: true });
      setWishlist([...wishlist, res.data]);
    } catch (err) {
      console.error('Add to wishlist failed:', err);
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
        {products.map((p, i) => (
          <ProductCard
            key={i}
            name={p.name}
            price={p.price}
            oldPrice={p.oldPrice}
            url={p.url}
            imageUrl={p.imageUrl}
            source={p.source}
            sourceIcon={p.source_icon}
            rating={p.rating}
            reviews={p.reviews}
            badge={p.badge}
            tag={p.tag}
            delivery={p.delivery}
            buttonText="Add to Wishlist"
            onButtonClick={() => addToWishlist(p)}
          />
        ))}
      </div>
      <h2 style={{ marginTop: '32px', fontSize: '20px', fontWeight: 'bold' }}>My Wishlist</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {wishlist.map(item => <ProductCard key={item._id} {...item} />)}
      </div>
    </div>
  );
};

export default Home;