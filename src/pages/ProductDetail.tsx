import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Star, ShoppingCart, Package, Truck, ArrowLeft } from 'lucide-react';
import { mockProducts } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Feedback } from '@/types';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = storage.getUser();
  const product = mockProducts.find(p => p.id === id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    if (product) {
      const allFeedback = storage.getFeedback();
      setFeedback(allFeedback.filter(f => f.productId === product.id));
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const addToCart = () => {
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

  const submitFeedback = () => {
    if (!user) {
      toast.error('Please sign in to leave feedback');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    const newFeedback: Feedback = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    storage.addFeedback(newFeedback);
    setFeedback([newFeedback, ...feedback]);
    setComment('');
    setRating(5);
    toast.success('Feedback submitted!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.ratings)
                          ? 'fill-warning text-warning'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.ratings}</span>
                <span className="text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>
              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            <Separator />

            <div>
              <div className="text-4xl font-bold text-primary mb-4">
                ${product.price}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className={product.stock > 0 ? 'text-success' : 'text-destructive'}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Free shipping on orders over $50</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={addToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Customer Feedback</h2>

          {user && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Leave Your Feedback</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating
                                ? 'fill-warning text-warning'
                                : 'text-muted'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Comment</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={submitFeedback}>Submit Feedback</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {feedback.map(fb => (
              <Card key={fb.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{fb.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < fb.rating
                              ? 'fill-warning text-warning'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{fb.comment}</p>
                </CardContent>
              </Card>
            ))}

            {feedback.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No feedback yet. Be the first to review!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
