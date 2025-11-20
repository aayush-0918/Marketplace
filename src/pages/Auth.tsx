import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { UserRole } from '@/types';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import { initiateGoogleLogin, getCurrentUser, completeProfile } from '@/lib/api';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [tempGoogleUser, setTempGoogleUser] = useState<any>(null);
  const [isLoadingGoogleAuth, setIsLoadingGoogleAuth] = useState(false);

  // Check for Google OAuth callback
  useEffect(() => {
    const googleAuthSuccess = searchParams.get('google_auth');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      return;
    }

    if (googleAuthSuccess === 'success') {
      // User has completed Google OAuth, now fetch their profile
      handleGoogleAuthCallback();
    }
  }, [searchParams]);

  const handleGoogleAuthCallback = async () => {
    setIsLoadingGoogleAuth(true);
    try {
      const { user } = await getCurrentUser();
      
      if (user) {
        // Check if user already has a role (returning user)
        if (user.role) {
          // Save to storage and navigate to home
          storage.setUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          });
          toast.success('Welcome back!');
          requestLocationAccess();
        } else {
          // New user - show role selection
          setTempGoogleUser(user);
          setShowRoleSelection(true);
        }
      } else {
        toast.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error handling Google auth callback:', error);
      toast.error('Failed to complete authentication');
    } finally {
      setIsLoadingGoogleAuth(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      // Mock OTP sending
      toast.success('OTP sent to your email!');
      setOtpSent(true);
      return;
    }

    // Mock OTP verification - any 4 digit code works
    if (otp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || email.split('@')[0],
      email,
      role,
    };

    storage.setUser(user);
    toast.success('Welcome to ShopHub!');
    requestLocationAccess();
  };

  const handleGoogleLogin = () => {
    // Initiate real Google OAuth flow
    initiateGoogleLogin();
  };

  const handleFacebookLogin = () => {
    // Mock Facebook OAuth - show role selection
    setTempGoogleUser({
      id: Math.random().toString(36).substr(2, 9),
      name: 'Facebook User',
      email: 'user@facebook.com',
    });
    setShowRoleSelection(true);
  };

  const handleRoleSelect = async () => {
    try {
      // Send role to backend
      const { user } = await completeProfile(role);
      
      // Save to storage
      storage.setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      
      toast.success('Profile completed!');
      requestLocationAccess();
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to save role. Please try again.');
    }
  };

  const requestLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          localStorage.setItem('userLocation', JSON.stringify(location));
          toast.success('Location access granted!');
          navigate('/');
        },
        () => {
          toast.info('Location access denied. Using default location.');
          navigate('/');
        }
      );
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to ShopHub</CardTitle>
          <CardDescription>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingGoogleAuth ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Completing authentication...</p>
            </div>
          ) : showRoleSelection ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Select Your Account Type</h3>
                <p className="text-sm text-muted-foreground">Choose how you'll use ShopHub</p>
              </div>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="customer" id="customer-social" />
                  <Label htmlFor="customer-social" className="font-normal cursor-pointer flex-1">
                    <div className="font-medium">Customer</div>
                    <div className="text-xs text-muted-foreground">Browse and buy products</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="retailer" id="retailer-social" />
                  <Label htmlFor="retailer-social" className="font-normal cursor-pointer flex-1">
                    <div className="font-medium">Retailer</div>
                    <div className="text-xs text-muted-foreground">Sell products to customers</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="wholesaler" id="wholesaler-social" />
                  <Label htmlFor="wholesaler-social" className="font-normal cursor-pointer flex-1">
                    <div className="font-medium">Wholesaler</div>
                    <div className="text-xs text-muted-foreground">Supply products in bulk</div>
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={handleRoleSelect} className="w-full">
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !otpSent && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            {!otpSent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            {isSignUp && !otpSent && (
              <div className="space-y-3">
                <Label>Account Type</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Customer</div>
                      <div className="text-xs text-muted-foreground">Browse and buy products</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="retailer" id="retailer" />
                    <Label htmlFor="retailer" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Retailer</div>
                      <div className="text-xs text-muted-foreground">Sell products to customers</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="wholesaler" id="wholesaler" />
                    <Label htmlFor="wholesaler" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Wholesaler</div>
                      <div className="text-xs text-muted-foreground">Supply products in bulk</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter any 4-digit code (demo mode)
                </p>
              </div>
            )}

            <Button type="submit" className="w-full">
              {otpSent ? 'Verify OTP' : isSignUp ? 'Send OTP' : 'Sign In'}
            </Button>
          </form>
          )}

          {!otpSent && !showRoleSelection && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  Or continue with
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleFacebookLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign in with Facebook
              </Button>

              <div className="text-center text-sm">
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => {
                        setIsSignUp(false);
                        setOtpSent(false);
                      }}
                    >
                      Sign in
                    </Button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => {
                        setIsSignUp(true);
                        setOtpSent(false);
                      }}
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
