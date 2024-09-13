// frontend/src/components/FruitList.js
import React from 'react';

const FruitList = ({ fruits, addToCart }) => {
  return (
    <div>
      <h2>Available Fruits</h2>
      <ul>
        {fruits.map((fruit) => (
          <li key={fruit._id}>
            {fruit.name} - ${fruit.price} - {fruit.quantity} in stock
            <button onClick={() => addToCart(fruit)}>Add to Cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FruitList;
