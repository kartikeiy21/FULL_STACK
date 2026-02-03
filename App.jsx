import React from "react";
import productImg1 from "./assets/shoes1.jpg";
import productImg2 from "./assets/smart watch.jpg";
import productImg3 from "./assets/laptop.jpg";
import productImg4 from "./assets/headphone1.jpg";

function ProductCard({ name, price, image, inStock }) {
  return (
    <div className="card">
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p className="price">₹{price}</p>

      <span className={`stock ${inStock ? "in" : "out"}`}>
        {inStock ? "In Stock" : "Out of Stock"}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        body {
          font-family: Arial, sans-serif;
          background: #5692ce;
          margin: 0;
          padding: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .card {
          width: 220px;
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 6px 15px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.3s;
          color: #333;
        }

        .card h3 {
          margin: 10px 0;
          font-size: 18px;
        }

        .card p {
          margin: 5px 0;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .card img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
        }

        .price {
          color: #2563eb;
          font-weight: bold;
        }

        .stock {
          display: inline-block;
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
        }

        .in {
          background: #dcfce7;
          color: #166534;
        }

        .out {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>

      <div className="container">
        <ProductCard
          name="Running Shoes"
          price="1999"
          image={productImg1}
          inStock={true}
        />

        <ProductCard
          name="Smart Watch"
          price="3499"
          image={productImg2}
          inStock={false}
        />

        <ProductCard
          name="Laptop"
          price="49999"
          image={productImg3}
          inStock={true}
        />

        <ProductCard
          name="Headphones"
          price="2999"
          image={productImg4}
          inStock={true}
        />
      </div>
    </>
  );
}
