import { Link } from "react-router-dom";
export default function Navbar() {
  return (
    <header className="w-full bg-white shadow-lg sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-extrabold text-purple-600">Market Place Bits</Link>
        <div className="space-x-6 font-medium">
          <Link to="/marketplace" className="hover:text-pink-500 transition">Marketplace</Link>
          <Link to="/profile" className="hover:text-pink-500 transition">Profile</Link>
        </div>
      </nav>
    </header>
  );
}