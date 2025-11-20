import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, Star, MapPin, ShoppingCart, Package } from 'lucide-react';
import { mockProducts, categories } from '@/lib/mockData';
import { Product } from '@/types';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const [allRetailerProducts, setAllRetailerProducts] = useState<Product[]>([]);
  const [retailerOnlyProducts, setRetailerOnlyProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [stockFilter, setStockFilter] = useState('all');
  const [quantityFilter, setQuantityFilter] = useState([1, 100]);
  const [distanceFilter, setDistanceFilter] = useState([0, 100]);
  const [userLocation, setUserLocation] = useState<string>('');
  const user = storage.getUser();

  // Redirect retailers/wholesalers to their dashboards
  useEffect(() => {
    if (user && (user.role === 'retailer' || user.role === 'wholesaler')) {
      navigate(user.role === 'retailer' ? '/retailer-dashboard' : '/wholesaler-dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const location = localStorage.getItem('userLocation');
    if (location) {
      const { lat, lng } = JSON.parse(location);
      setUserLocation(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    }

    // Load retailer and wholesaler products
    const retailerProducts = storage.getRetailerProducts();
    const wholesalerProducts = storage.getWholesalerProducts();
    
    const allAddedProducts = [...retailerProducts, ...wholesalerProducts];
    setRetailerOnlyProducts(allAddedProducts);
    
    // Combine mock products with retailer and wholesaler products
    setAllRetailerProducts([...mockProducts, ...allAddedProducts]);
    setProducts([...mockProducts, ...allAddedProducts]);
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let filtered = allRetailerProducts;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Quantity filter
    filtered = filtered.filter(p => p.stock >= quantityFilter[0] && p.stock <= quantityFilter[1]);

    if (stockFilter === 'instock') {
      filtered = filtered.filter(p => p.stock > 0);
    } else if (stockFilter === 'outofstock') {
      filtered = filtered.filter(p => p.stock === 0);
    }

    // Distance filter - always apply, max 100km from user location
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      const { lat: userLat, lng: userLng } = JSON.parse(storedLocation);
      
      // Calculate distances for all products
      const productsWithDistance = filtered.map(p => ({
        product: p,
        distance: p.location 
          ? calculateDistance(userLat, userLng, p.location.lat, p.location.lng)
          : 0
      }));
      
      // Filter products within selected distance (max 100km)
      const maxDistance = Math.min(distanceFilter[1], 100);
      filtered = productsWithDistance
        .filter(({ distance }) => distance <= maxDistance)
        .map(({ product }) => product);
    }

    setProducts(filtered);
  }, [searchQuery, selectedCategory, priceRange, stockFilter, quantityFilter, distanceFilter, allRetailerProducts]);

  const addToCart = (product: Product) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    const cart = storage.getCart();
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }

    storage.setCart(cart);
    window.dispatchEvent(new Event('cartUpdate'));
    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Discover Amazing Products
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Shop from thousands of products with the best prices and quality
            </p>
            {userLocation && (
              <div className="flex items-center gap-2 text-muted-foreground mb-8">
                <MapPin className="h-5 w-5" />
                <span>Showing shops near you: {userLocation}</span>
              </div>
            )}
            {!user && (
              <Button size="lg" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Retailer/Wholesaler Products Section */}
      {retailerOnlyProducts.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Products from Our Sellers</h2>
              <p className="text-muted-foreground">Discover unique products from local retailers and wholesalers</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {retailerOnlyProducts.slice(0, 8).map((product: any) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-primary/20"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-square overflow-hidden bg-secondary relative">
                    <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                      {product.retailerId ? 'Retailer' : product.wholesalerId ? 'Wholesaler' : 'Seller'}
                    </Badge>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      {product.stock === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium">{product.ratings || 0}</span>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.stock > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {product.stock} in stock
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {retailerOnlyProducts.length > 8 && (
              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                  Showing 8 of {retailerOnlyProducts.length} seller products. 
                  Scroll down to see all products with filters.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="instock">In Stock</SelectItem>
                <SelectItem value="outofstock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Price Range
                  </label>
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[0]} - ${priceRange[1]}
                  </span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Quantity Range
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {quantityFilter[0]} - {quantityFilter[1]}
                  </span>
                </div>
                <Slider
                  value={quantityFilter}
                  onValueChange={setQuantityFilter}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Distance
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {distanceFilter[0]}km - {distanceFilter[1]}km
                  </span>
                </div>
                <Slider
                  value={distanceFilter}
                  onValueChange={setDistanceFilter}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {products.length} Products Found
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.stock === 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{product.ratings}</span>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviewCount})
                    </span>
                  </div>
                  {product.location && (() => {
                    const storedLocation = localStorage.getItem('userLocation');
                    if (storedLocation) {
                      const { lat: userLat, lng: userLng } = JSON.parse(storedLocation);
                      const distance = calculateDistance(userLat, userLng, product.location.lat, product.location.lng);
                      return (
                        <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{distance.toFixed(1)} km away · {product.location.name}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{product.location.name}</span>
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    {product.stock > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>
                  {product.stock === 0 && product.availabilityDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Available: {new Date(product.availabilityDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
