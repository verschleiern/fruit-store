// frontend/src/components/Cart.js
import React from 'react';
import axios from 'axios';

const Cart = ({ cartItems, removeFromCart, clearCart, onOrderPlaced }) => {
  const handlePlaceOrder = async () => {
    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          fruitId: item._id,
          quantity: item.quantity
        })),
      };

      // Send the order data to the server
      const response = await axios.post('http://localhost:5000/orders', orderData);

      if (response.status === 200) {
        // Clear the cart after placing the order
        clearCart();
        onOrderPlaced(response.data);

        // Notify parent component (if needed)
        if (onOrderPlaced) {
          onOrderPlaced(response.data);
        }

        // Optionally handle success, e.g., show a success message
        alert('Order placed successfully!');
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>
      <ul>
        {cartItems.map((item) => (
          <li key={item._id}>
            {item.name} - ${item.price} x {item.quantity}
            <button onClick={() => removeFromCart(item)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={handlePlaceOrder} disabled={cartItems.length === 0}>
        Place Order
      </button>
    </div>
  );
};

export default Cart;
