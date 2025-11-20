import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, Mail, User } from 'lucide-react';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;
  const orderTotal = location.state?.total || 0;
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('user@example.com');

  if (!orderId) {
    navigate('/');
    return null;
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Mock payment processing
    setTimeout(() => {
      storage.updateOrder(orderId, { status: 'confirmed' });
      toast.success('Payment successful!');
      toast.success('Order confirmation email sent!');
      navigate('/orders');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Complete your payment</h1>
            <p className="text-muted-foreground">Enter your payment details below</p>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Payment details</CardTitle>
                <div className="flex gap-2">
                  <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
                  <div className="w-10 h-6 bg-gradient-to-r from-orange-600 to-orange-400 rounded"></div>
                  <div className="w-10 h-6 bg-gradient-to-r from-red-600 to-red-400 rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      required
                      disabled={processing}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-base">Card information</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cardNumber"
                      placeholder="1234 1234 1234 1234"
                      className="pl-10 h-12 rounded-b-none border-b-0"
                      required
                      disabled={processing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-0">
                    <Input
                      placeholder="MM / YY"
                      className="rounded-none rounded-bl-md border-r-0 h-12"
                      required
                      disabled={processing}
                    />
                    <Input
                      placeholder="CVC"
                      className="rounded-none rounded-br-md h-12"
                      maxLength={3}
                      required
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-base">Cardholder name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      className="pl-10 h-12"
                      required
                      disabled={processing}
                    />
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total due today</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Your payment is secure</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      This is a demo payment gateway. Your information is not stored or processed.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay $${orderTotal.toFixed(2)}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By confirming your payment, you allow BITSKart to charge your card for this payment and future payments in accordance with their terms.
                </p>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
            <span>Powered by BITSKart</span>
            <span>•</span>
            <a href="#" className="hover:text-foreground">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
