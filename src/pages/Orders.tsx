import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Package, Truck, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Order } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Orders() {
  const navigate = useNavigate();
  const user = storage.getUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const allOrders = storage.getOrders();
    setOrders(allOrders.filter(o => o.userId === user.id));
  }, [user, navigate]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleSubmitFeedback = (orderId: string, productId: string) => {
    if (!user || rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const feedback = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    storage.addFeedback(feedback);
    
    toast.success('Feedback submitted!');
    setFeedbackOrderId(null);
    setRating(0);
    setComment('');
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here!
            </p>
            <Button onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <Badge variant={getStatusColor(order.status) as any}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </span>
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Placed on {format(new Date(order.createdAt), 'PPP')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.product.id} className="flex gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payment Method: <span className="capitalize">{order.paymentMethod}</span>
                        </p>
                        {order.trackingNumber && (
                          <p className="text-sm text-muted-foreground">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                        {order.deliveryDate && (
                          <p className="text-sm text-muted-foreground">
                            Scheduled Delivery: {format(new Date(order.deliveryDate), 'PPP')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.status === 'delivered' && (
                    <div className="mt-4 pt-4 border-t">
                      {feedbackOrderId === order.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2">Rate your experience</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`comment-${order.id}`} className="text-sm font-medium">
                              Your feedback
                            </Label>
                            <Textarea
                              id={`comment-${order.id}`}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Tell us about your experience..."
                              className="mt-2"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubmitFeedback(order.id, order.items[0].product.id)}
                              size="sm"
                            >
                              Submit Feedback
                            </Button>
                            <Button
                              onClick={() => {
                                setFeedbackOrderId(null);
                                setRating(0);
                                setComment('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setFeedbackOrderId(order.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Leave Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
