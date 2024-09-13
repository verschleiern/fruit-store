import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Make sure this file includes the necessary CSS for the video iframe

// Socket.IO connection
const socket = io('http://localhost:5000');

// Shop Component
const Shop = ({ fruits, addToCart, cart, removeFromCart, clearCart }) => {
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    try {
      // Calculate total cost
      const totalCost = cart.reduce((total, item) => total + item.price * item.quantity, 0);

      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          fruitId: item._id,
          quantity: item.quantity
        })),
        totalCost
      };

      // Clear the cart before placing the order
      clearCart();

      // Send the order data to the server
      await axios.post('http://localhost:5000/orders', orderData);

      // Redirect to success page with cart items in localStorage
      localStorage.setItem('orderItems', JSON.stringify(cart));
      navigate('/success');
    } catch (error) {
      console.error('Error placing order:', error);

      // Clear the cart before navigating to success page
      clearCart();

      // Redirect to success page with cart items in localStorage
      localStorage.setItem('orderItems', JSON.stringify(cart));
      navigate('/success');
    }
  };

  return (
    <div className="container">
      {/* Video iframe */}
      <div className="yt-embed-holder">
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube-nocookie.com/embed/XmhZj08ReqM?autoplay=1&mute=1&loop=1&controls=0&color=white&showinfo=0&rel=0&playsinline=1&enablejsapi=1"
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; modestbranding; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      
      <h2 className="my-4">Available Fruits</h2>
      <div className="list-group">
        {fruits.map(fruit => (
          <div key={fruit._id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              {fruit.name} - ${fruit.price} - {fruit.quantity} in stock
            </div>
            <button className="btn btn-primary" onClick={() => addToCart(fruit)}>Add to Cart</button>
          </div>
        ))}
      </div>
      <h2 className="my-4">Your Cart</h2>
      <div className="list-group">
        {cart.map(item => (
          <div key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              {item.name} - ${item.price} x {item.quantity}
            </div>
            <button className="btn btn-danger" onClick={() => removeFromCart(item)}>Remove</button>
          </div>
        ))}
      </div>
      <button className="btn btn-success my-4" onClick={handlePlaceOrder} disabled={cart.length === 0}>
        Place Order
      </button>
    </div>
  );
};

// Orders Component
const Orders = ({ orders }) => (
  <div className="container">
    <h2 className="my-4">Orders Made</h2>
    <div className="list-group">
      {orders.map(order => (
        <div key={order._id} className="list-group-item">
          <strong>Order ID:</strong> {order._id}
          <br />
          <strong>Total Cost:</strong> ${order.totalCost.toFixed(2)}
          <br />
          <strong>Items:</strong>
          <ul className="list-unstyled">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.fruitId ? item.fruitId.name : 'Unknown Fruit'} - ${item.fruitId ? item.fruitId.price.toFixed(2) : '0.00'} x {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

// Success Component
const Success = ({ clearCart }) => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    // Retrieve items from localStorage
    const items = JSON.parse(localStorage.getItem('orderItems')) || [];
    setOrderItems(items);

    // Clear items from localStorage
    localStorage.removeItem('orderItems');
  }, []);

  const handleBackToShop = () => {
    // Clear cart
    clearCart();

    // Navigate back to shop
    navigate('/shop');
  };

  return (
    <div className="container">
      <h2 className="my-4">Successful Purchase</h2>
      <h3>Items Purchased:</h3>
      <ul className="list-unstyled">
        {orderItems.map((item, index) => (
          <li key={index}>
            {item.name} - ${item.price.toFixed(2)} x {item.quantity}
          </li>
        ))}
      </ul>
      <button className="btn btn-primary" onClick={handleBackToShop}>Back to Shop</button>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();

  // Show navigation links except on specific paths
  const shouldHideNav = location.pathname === '/success';

  if (shouldHideNav) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Fresh Fruit Shop</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/shop">Shop</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/admin/orders">Orders</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

// App Component
function App() {
  const [fruits, setFruits] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchFruits = async () => {
      try {
        const response = await axios.get('http://localhost:5000/fruits');
        setFruits(response.data);
      } catch (error) {
        console.error('Error fetching fruits:', error);
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchFruits();
    fetchOrders();

    socket.on('fruits', (data) => {
      setFruits(data.filter(fruit => fruit.quantity > 0));
    });

    return () => {
      socket.off('fruits');
    };
  }, []);

  const addToCart = (fruit) => {
    socket.emit('addToCart', fruit._id);
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === fruit._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === fruit._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...fruit, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (fruit) => {
    socket.emit('removeFromCart', fruit._id);
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === fruit._id);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return prevCart.map(item =>
            item._id === fruit._id ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          return prevCart.filter(item => item._id !== fruit._id);
        }
      }
      return prevCart;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="container mt-4">
          <Routes>
            <Route
              path="/shop"
              element={
                <Shop
                  fruits={fruits}
                  addToCart={addToCart}
                  cart={cart}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                />
              }
            />
            <Route
              path="/admin/orders"
              element={<Orders orders={orders} />}
            />
            <Route
              path="/success"
              element={<Success clearCart={clearCart} />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
