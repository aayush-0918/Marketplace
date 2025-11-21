import { Link } from "react-router-dom";
export default function HomePage() {
  return (
    <section className="py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8">
        Welcome to Market Place Bits!
      </h1>
      <p className="text-xl text-gray-100 mb-6 max-w-2xl">
        Discover, buy, and sell amazing things. Enjoy a seamless, beautiful, and modern experience designed just for you.
      </p>
      <Link to="/marketplace">
        <button className="px-8 py-3 text-lg font-bold bg-purple-600 hover:bg-pink-500 transition rounded-xl shadow-lg text-white">
          Explore Marketplace
        </button>
      </Link>
    </section>
  );
}