import React from 'react';

const ProductCard = ({ name, price, url, imageUrl, savingsGoal, savingsProgress }) => (
  <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '16px', width: '250px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
    <img
      src={imageUrl || 'https://via.placeholder.com/200'}
      alt={name}
      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
    />
    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {name}
    </h3>
    <p style={{ color: '#666', margin: '4px 0' }}>${price.toFixed(2)}</p>
    <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '8px', marginTop: '8px' }}>
      <div
        style={{ backgroundColor: '#4285f4', height: '100%', borderRadius: '4px', width: `${(savingsProgress / savingsGoal) * 100}%` }}
      />
    </div>
    <p style={{ fontSize: '12px', marginTop: '4px' }}>${savingsProgress} / ${savingsGoal}</p>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-block', backgroundColor: '#4285f4', color: 'white', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', marginTop: '8px' }}
    >
      View on Site
    </a>
  </div>
);

export default ProductCard;