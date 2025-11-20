import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Package, ShoppingCart, Users, TrendingUp, Calendar as CalendarIcon, Truck } from 'lucide-react';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = storage.getUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (user.role === 'retailer') {
      navigate('/retailer-dashboard');
    } else if (user.role === 'wholesaler') {
      navigate('/wholesaler-dashboard');
    }
  }, [user, navigate]);

  if (!user) return null;

  const orders = storage.getOrders().filter(o => o.userId === user.id);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const cartItems = storage.getCart().length;
  const upcomingDeliveries = orders.filter(o => 
    ['confirmed', 'shipped'].includes(o.status) && o.deliveryDate
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <Badge variant="outline" className="capitalize">
            {user.role} Account
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Items in cart
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Account Type</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user.role}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Member status
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Delivery Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  delivery: upcomingDeliveries
                    .filter(o => o.deliveryDate)
                    .map(o => new Date(o.deliveryDate!))
                }}
                modifiersStyles={{
                  delivery: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
                  }
                }}
              />
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span className="text-sm text-muted-foreground">Expected Delivery Date</span>
                </div>
                <p className="text-sm font-medium">Upcoming Deliveries:</p>
                {upcomingDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deliveries</p>
                ) : (
                  upcomingDeliveries.map(order => (
                    <div key={order.id} className="text-sm p-2 bg-muted rounded-md">
                      <div className="flex justify-between">
                        <span>Order #{order.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      {order.deliveryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected: {format(new Date(order.deliveryDate), 'PPP')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active deliveries to track</p>
                ) : (
                  upcomingDeliveries.map(order => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Order #{order.id}</p>
                          {order.trackingNumber && (
                            <p className="text-sm text-muted-foreground">
                              Tracking: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                        <Badge>{order.status}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            ['confirmed', 'shipped', 'delivered'].includes(order.status) 
                              ? 'bg-primary ring-4 ring-primary/20' 
                              : 'bg-muted'
                          }`}>
                            {['confirmed', 'shipped', 'delivered'].includes(order.status) && (
                              <div className="w-2 h-2 bg-background rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              ['confirmed', 'shipped', 'delivered'].includes(order.status) 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            }`}>
                              Order Confirmed
                            </span>
                            {order.status === 'confirmed' && (
                              <p className="text-xs text-muted-foreground">Package is being prepared</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 h-6 -top-6 ${
                              ['shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'
                            }`}></div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              ['shipped', 'delivered'].includes(order.status) 
                                ? 'bg-primary ring-4 ring-primary/20' 
                                : 'bg-muted'
                            }`}>
                              {['shipped', 'delivered'].includes(order.status) && (
                                <div className="w-2 h-2 bg-background rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              ['shipped', 'delivered'].includes(order.status) 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            }`}>
                              Dispatched & Shipped
                            </span>
                            {order.status === 'shipped' && (
                              <p className="text-xs text-muted-foreground">Package is on the way</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 h-6 -top-6 ${
                              order.status === 'delivered' ? 'bg-primary' : 'bg-muted'
                            }`}></div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              order.status === 'delivered' 
                                ? 'bg-primary ring-4 ring-primary/20' 
                                : 'bg-muted'
                            }`}>
                              {order.status === 'delivered' && (
                                <div className="w-2 h-2 bg-background rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              order.status === 'delivered' 
                                ? 'text-foreground' 
                                : 'text-muted-foreground'
                            }`}>
                              Out for Delivery
                            </span>
                            {order.status === 'delivered' && (
                              <p className="text-xs text-muted-foreground">Arriving today</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 h-6 -top-6 ${
                              order.status === 'delivered' ? 'bg-primary' : 'bg-muted'
                            }`}></div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              order.status === 'delivered' 
                                ? 'bg-green-500 ring-4 ring-green-500/20' 
                                : 'bg-muted'
                            }`}>
                              {order.status === 'delivered' && (
                                <div className="w-2 h-2 bg-background rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              order.status === 'delivered' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-muted-foreground'
                            }`}>
                              Delivered
                            </span>
                            {order.status === 'delivered' && order.deliveryDate && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(order.deliveryDate), 'PPP')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {user.role === 'retailer' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Retailer Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As a retailer, you can manage your inventory, view orders from customers, and track sales performance.
                You can also display products available via wholesalers as proxy items.
              </p>
            </CardContent>
          </Card>
        )}

        {user.role === 'wholesaler' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Wholesaler Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As a wholesaler, you can manage bulk inventory, set wholesale prices, and connect with retailers.
                Track your distribution network and bulk order fulfillment.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <Badge variant="outline" className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No orders yet. Start shopping!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
