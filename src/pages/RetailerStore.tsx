import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, MapPin, Store } from 'lucide-react';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Product } from '@/types';

export default function RetailerStore() {
  const { retailerId } = useParams();
  const navigate = useNavigate();
  const user = storage.getUser();
  const [products, setProducts] = useState<any[]>([]);
  const [retailerInfo, setRetailerInfo] = useState<any>(null);

  useEffect(() => {
    if (retailerId) {
      const retailerProducts = storage.getRetailerProducts(retailerId);
      setProducts(retailerProducts);
      
      // Mock retailer info (in real app, this would come from a database)
      setRetailerInfo({
        id: retailerId,
        name: 'Premium Store',
        location: 'Downtown',
        rating: 4.8,
      });
    }
  }, [retailerId]);

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
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {retailerInfo && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{retailerInfo.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{retailerInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{retailerInfo.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Browse products from this retailer
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">This retailer hasn't listed any products yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.stock > 0 ? (
                      <Badge variant="default">In Stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-sm mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.ratings || 0}</span>
                    <span className="text-muted-foreground">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
