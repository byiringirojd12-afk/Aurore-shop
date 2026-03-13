export default function ProductCard({ product, addToCart }) {
  return (
    <div className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover"/>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-indigo-600 font-bold mt-1">${product.price}</p>
        <button
          onClick={() => addToCart(product)}
          className="mt-3 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}