import { Link } from "react-router-dom";

export default function Navbar({ cartCount }) {
  return (
    <nav className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl">Aurore-Shop</Link>
      <Link to="/checkout" className="relative">
        Cart
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-3 bg-red-500 rounded-full px-2 text-xs font-bold">
            {cartCount}
          </span>
        )}
      </Link>
    </nav>
  );
}